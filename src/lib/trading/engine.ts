// ─── Robot Engine — orchestrateur principal ───────────────────────────────────
// Appelé par /api/trading/tick (cron ou trigger client)
// Gère paper trading + live trading, risk management, position lifecycle

import { createClient } from '@supabase/supabase-js'
import { analyzeMarket } from './analysis'
import { decrypt } from '@/lib/bybit/encryption'
import {
  getWalletBalance, getPositions, setLeverage,
  placeMarketOrder, setTradingStop, closePosition,
} from '@/lib/bybit/client'

// Supabase admin (service role — accès total, serveur uniquement)
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// ─── Types internes ───────────────────────────────────────────────────────────

interface Session {
  id: string; user_id: string; mode: 'paper' | 'live'
  consecutive_losses: number; suspended_until: string | null
  daily_pnl: number; weekly_pnl: number
}

interface RiskSetting {
  max_risk_pct: number; max_daily_loss_pct: number; max_weekly_loss_pct: number
  max_consecutive_losses: number; suspension_hours: number
  max_positions: number; min_confidence: number; leverage: number
  paper_balance: number
}

interface Position {
  id: string; user_id: string; mode: string; side: 'LONG' | 'SHORT'
  entry_price: number; quantity: number; usdt_size: number
  stop_loss: number; tp1: number; tp2: number; tp3: number
  tp1_hit: boolean; tp2_hit: boolean
  sl_at_breakeven: boolean; trailing_active: boolean; trailing_price: number | null
  bybit_order_id: string | null
}

// ─── Fetch market data depuis notre propre API ────────────────────────────────

async function fetchMarketData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
  const r = await fetch(`${baseUrl}/api/bot-btc/market`, { cache: 'no-store' })
  if (!r.ok) throw new Error('Market data unavailable')
  return r.json()
}

// ─── Logging ──────────────────────────────────────────────────────────────────

async function log(
  db: ReturnType<typeof adminClient>,
  userId: string,
  level: 'info' | 'warn' | 'error' | 'signal' | 'trade',
  message: string,
  data: Record<string, unknown> = {}
) {
  await db.from('bot_logs').insert({ user_id: userId, level, message, data })
}

// ─── Risk checks ──────────────────────────────────────────────────────────────

function isSuspended(session: Session): boolean {
  if (!session.suspended_until) return false
  return new Date(session.suspended_until) > new Date()
}

function dailyLimitHit(session: Session, risk: RiskSetting, balance: number): boolean {
  const maxLoss = balance * (risk.max_daily_loss_pct / 100)
  return session.daily_pnl < -maxLoss
}

function weeklyLimitHit(session: Session, risk: RiskSetting, balance: number): boolean {
  const maxLoss = balance * (risk.max_weekly_loss_pct / 100)
  return session.weekly_pnl < -maxLoss
}

// ─── Position size (risk-based) ───────────────────────────────────────────────

function calcPositionSize(
  balance: number, riskPct: number,
  entryPrice: number, stopLoss: number
): number {
  const riskUsdt = balance * (riskPct / 100)
  const slPct    = Math.abs(entryPrice - stopLoss) / entryPrice
  if (slPct <= 0) return 0
  return riskUsdt / slPct
}

// ─── Paper Trading ────────────────────────────────────────────────────────────

async function paperOpenPosition(
  db: ReturnType<typeof adminClient>,
  session: Session, risk: RiskSetting, analysis: ReturnType<typeof analyzeMarket>
) {
  const { data: pa } = await db.from('paper_accounts').select('balance').eq('user_id', session.user_id).single()
  const balance = pa?.balance ?? risk.paper_balance

  const usdtSize = calcPositionSize(balance, risk.max_risk_pct, analysis.entryPrice, analysis.stopLoss)
  if (usdtSize < 10) return // pas assez de capital

  const quantity = usdtSize / analysis.entryPrice

  await db.from('positions').insert({
    user_id:    session.user_id,
    mode:       'paper',
    side:       analysis.direction as 'LONG' | 'SHORT',
    entry_price: analysis.entryPrice,
    quantity,
    usdt_size:  usdtSize,
    stop_loss:  analysis.stopLoss,
    tp1:        analysis.tp1,
    tp2:        analysis.tp2,
    tp3:        analysis.tp3,
    score:      analysis.score,
  })

  // Déduire du solde virtuel
  await db.from('paper_accounts')
    .update({ balance: balance - usdtSize })
    .eq('user_id', session.user_id)

  await log(db, session.user_id, 'trade',
    `📈 PAPER ${analysis.direction} ouvert @${analysis.entryPrice.toFixed(0)}$`,
    { score: analysis.score, size: usdtSize.toFixed(2) }
  )
}

async function paperClosePosition(
  db: ReturnType<typeof adminClient>,
  position: Position, closePrice: number, reason: string
) {
  const pnl = position.side === 'LONG'
    ? (closePrice - position.entry_price) * position.quantity
    : (position.entry_price - closePrice) * position.quantity
  const pnlPct = (pnl / position.usdt_size) * 100

  // Clore la position
  await db.from('positions').delete().eq('id', position.id)

  // Enregistrer le trade
  const durationMinutes = Math.round((Date.now() - new Date(position.id).getTime()) / 60000)
  await db.from('trades').insert({
    user_id:     position.user_id,
    position_id: position.id,
    mode:        'paper',
    side:        position.side,
    entry_price: position.entry_price,
    close_price: closePrice,
    quantity:    position.quantity,
    usdt_size:   position.usdt_size,
    pnl, pnl_pct: pnlPct,
    close_reason: reason,
    score: position.side,
  })

  // Restituer capital + PnL
  const { data: pa } = await db.from('paper_accounts').select('balance').eq('user_id', position.user_id).single()
  const balance = pa?.balance ?? 0
  await db.from('paper_accounts').update({ balance: balance + position.usdt_size + pnl }).eq('user_id', position.user_id)

  // Mettre à jour PnL session
  await db.from('bot_sessions').update({
    daily_pnl:   (db as any)._pnlUpdate?.daily  ?? 0,
    total_pnl:   (db as any)._pnlUpdate?.total  ?? 0,
  }).eq('user_id', position.user_id)

  const emoji = pnl >= 0 ? '✅' : '❌'
  await log(db, position.user_id, 'trade',
    `${emoji} PAPER ${position.side} clôturé @${closePrice.toFixed(0)}$ | PnL: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}$`,
    { reason, pnl, pnlPct }
  )

  // Mettre à jour consecutive_losses
  if (pnl < 0) {
    await db.from('bot_sessions').update({ consecutive_losses: (db as any)._losses + 1 }).eq('user_id', position.user_id)
  } else {
    await db.from('bot_sessions').update({ consecutive_losses: 0 }).eq('user_id', position.user_id)
  }

  return pnl
}

// ─── Live Trading ─────────────────────────────────────────────────────────────

async function liveOpenPosition(
  db: ReturnType<typeof adminClient>,
  session: Session, risk: RiskSetting, analysis: ReturnType<typeof analyzeMarket>,
  apiKey: string, apiSecret: string
) {
  const wallet = await getWalletBalance(apiKey, apiSecret)
  if (!wallet) throw new Error('Impossible de récupérer le solde')
  const balance = parseFloat(wallet.totalAvailableBalance)

  const usdtSize = calcPositionSize(balance, risk.max_risk_pct, analysis.entryPrice, analysis.stopLoss)
  if (usdtSize < 10) return

  const quantity = (usdtSize / analysis.entryPrice).toFixed(3)

  await setLeverage(apiKey, apiSecret, risk.leverage)

  const bybitSide = analysis.direction === 'LONG' ? 'Buy' : 'Sell'
  const order = await placeMarketOrder(
    apiKey, apiSecret, bybitSide, quantity,
    analysis.stopLoss.toFixed(2),
    analysis.tp3.toFixed(2),
  )
  if (!order) throw new Error('Ordre Bybit refusé')

  await db.from('positions').insert({
    user_id:       session.user_id,
    bybit_order_id: order.orderId,
    mode:          'live',
    side:          analysis.direction as 'LONG' | 'SHORT',
    entry_price:   analysis.entryPrice,
    quantity:      parseFloat(quantity),
    usdt_size:     usdtSize,
    stop_loss:     analysis.stopLoss,
    tp1:           analysis.tp1,
    tp2:           analysis.tp2,
    tp3:           analysis.tp3,
    score:         analysis.score,
  })

  await log(db, session.user_id, 'trade',
    `📈 LIVE ${analysis.direction} ouvert @${analysis.entryPrice.toFixed(0)}$ | ${quantity} BTC`,
    { score: analysis.score, orderId: order.orderId }
  )
}

// ─── Gestion des positions ouvertes ──────────────────────────────────────────

async function managePosition(
  db: ReturnType<typeof adminClient>,
  pos: Position, currentPrice: number,
  session: Session, apiKey?: string, apiSecret?: string
) {
  const isLong  = pos.side === 'LONG'
  const hitTP1  = isLong ? currentPrice >= pos.tp1 : currentPrice <= pos.tp1
  const hitTP2  = isLong ? currentPrice >= pos.tp2 : currentPrice <= pos.tp2
  const hitTP3  = isLong ? currentPrice >= pos.tp3 : currentPrice <= pos.tp3
  const hitSL   = isLong ? currentPrice <= pos.stop_loss : currentPrice >= pos.stop_loss

  // Stop Loss atteint
  if (hitSL) {
    if (pos.mode === 'paper') {
      await paperClosePosition(db, pos, currentPrice, 'stop_loss')
    } else if (apiKey && apiSecret) {
      await closePosition(apiKey, apiSecret, pos.side, pos.quantity.toFixed(3))
      await db.from('positions').delete().eq('id', pos.id)
      await db.from('trades').insert({
        user_id: pos.user_id, position_id: pos.id, mode: 'live', side: pos.side,
        entry_price: pos.entry_price, close_price: currentPrice,
        quantity: pos.quantity, usdt_size: pos.usdt_size,
        pnl: (isLong ? 1 : -1) * (currentPrice - pos.entry_price) * pos.quantity,
        pnl_pct: (isLong ? 1 : -1) * ((currentPrice - pos.entry_price) / pos.entry_price) * 100,
        close_reason: 'stop_loss',
      })
    }
    return
  }

  // TP3 — clôture totale
  if (hitTP3) {
    if (pos.mode === 'paper') {
      await paperClosePosition(db, pos, currentPrice, 'tp3')
    } else if (apiKey && apiSecret) {
      await closePosition(apiKey, apiSecret, pos.side, pos.quantity.toFixed(3))
      await db.from('positions').delete().eq('id', pos.id)
      await db.from('trades').insert({
        user_id: pos.user_id, position_id: pos.id, mode: 'live', side: pos.side,
        entry_price: pos.entry_price, close_price: currentPrice,
        quantity: pos.quantity, usdt_size: pos.usdt_size,
        pnl: Math.abs(currentPrice - pos.entry_price) * pos.quantity,
        pnl_pct: Math.abs((currentPrice - pos.entry_price) / pos.entry_price) * 100,
        close_reason: 'tp3',
      })
    }
    return
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  // TP1 atteint — move SL to break-even
  if (hitTP1 && !pos.tp1_hit) {
    updates.tp1_hit = true
    updates.sl_at_breakeven = true
    updates.stop_loss = pos.entry_price
    if (pos.mode === 'live' && apiKey && apiSecret) {
      await setTradingStop(apiKey, apiSecret, pos.entry_price.toFixed(2))
    }
    await log(db, pos.user_id, 'trade',
      `🎯 TP1 atteint @${currentPrice.toFixed(0)}$ — SL déplacé au break-even`,
      { position: pos.id }
    )
  }

  // TP2 atteint — active trailing stop
  if (hitTP2 && !pos.tp2_hit) {
    updates.tp2_hit = true
    updates.trailing_active = true
    updates.trailing_price = currentPrice
    await log(db, pos.user_id, 'trade',
      `🎯 TP2 atteint @${currentPrice.toFixed(0)}$ — Trailing stop activé`,
      { position: pos.id }
    )
  }

  // Trailing stop update
  if (pos.trailing_active && pos.trailing_price) {
    const atr = 200 // approximation
    const isLongMove = isLong && currentPrice > pos.trailing_price
    const isShortMove = !isLong && currentPrice < pos.trailing_price
    if (isLongMove || isShortMove) {
      const newTrail = isLong ? currentPrice - atr : currentPrice + atr
      updates.trailing_price = currentPrice
      updates.stop_loss = newTrail
      if (pos.mode === 'live' && apiKey && apiSecret) {
        await setTradingStop(apiKey, apiSecret, newTrail.toFixed(2))
      }
    }

    // Trailing stop déclenché
    const trailHit = isLong
      ? currentPrice <= (pos.trailing_price - atr * 0.5)
      : currentPrice >= (pos.trailing_price + atr * 0.5)
    if (trailHit) {
      if (pos.mode === 'paper') {
        await paperClosePosition(db, pos, currentPrice, 'trailing_stop')
      } else if (apiKey && apiSecret) {
        await closePosition(apiKey, apiSecret, pos.side, pos.quantity.toFixed(3))
        await db.from('positions').delete().eq('id', pos.id)
      }
      return
    }
  }

  if (Object.keys(updates).length > 1) {
    await db.from('positions').update(updates).eq('id', pos.id)
  }
}

// ─── Tick principal ───────────────────────────────────────────────────────────

export async function runTick(userId: string): Promise<{
  action: string; score?: number; direction?: string; error?: string
}> {
  const db = adminClient()

  try {
    // 1. Charger session + risk settings
    const { data: session } = await db.from('bot_sessions').select('*').eq('user_id', userId).single()
    if (!session?.is_active) return { action: 'inactive' }

    const { data: risk } = await db.from('risk_settings').select('*').eq('user_id', userId).single()
    const rs: RiskSetting = risk ?? {
      max_risk_pct: 1, max_daily_loss_pct: 5, max_weekly_loss_pct: 10,
      max_consecutive_losses: 3, suspension_hours: 2,
      max_positions: 1, min_confidence: 75, leverage: 5, paper_balance: 10000,
    }

    // 2. Vérifier suspension
    if (isSuspended(session)) {
      await log(db, userId, 'warn', '⏸ Robot suspendu temporairement — attente fin de suspension')
      return { action: 'suspended' }
    }

    // 3. Suspension si trop de pertes consécutives
    if (session.consecutive_losses >= rs.max_consecutive_losses) {
      const until = new Date(Date.now() + rs.suspension_hours * 3600_000).toISOString()
      await db.from('bot_sessions').update({ suspended_until: until, consecutive_losses: 0, is_active: false }).eq('user_id', userId)
      await log(db, userId, 'warn', `⚠️ ${rs.max_consecutive_losses} pertes consécutives — robot suspendu ${rs.suspension_hours}h`)
      return { action: 'suspended_losses' }
    }

    // 4. Récupérer market data
    const market = await fetchMarketData()
    const currentPrice = market.price

    // 5. Gérer positions ouvertes
    const { data: openPositions } = await db.from('positions').select('*').eq('user_id', userId)

    let apiKey: string | undefined, apiSecret: string | undefined
    if (session.mode === 'live') {
      const { data: creds } = await db.from('bybit_credentials').select('*').eq('user_id', userId).single()
      if (!creds?.is_valid) return { action: 'no_valid_credentials' }
      apiKey    = decrypt(creds.api_key_enc)
      apiSecret = decrypt(creds.api_secret_enc)

      // Check daily/weekly drawdown avec solde réel
      const wallet = await getWalletBalance(apiKey, apiSecret)
      const balance = parseFloat(wallet?.totalEquity ?? '10000')
      if (dailyLimitHit(session, rs, balance)) {
        await db.from('bot_sessions').update({ is_active: false }).eq('user_id', userId)
        await log(db, userId, 'error', '🔴 Drawdown journalier max atteint — robot stoppé')
        return { action: 'daily_limit' }
      }
    }

    for (const pos of openPositions ?? []) {
      await managePosition(db, pos, currentPrice, session, apiKey, apiSecret)
    }

    // 6. Analyser marché si pas de position ouverte
    const remainingPositions = (openPositions ?? []).length
    if (remainingPositions >= rs.max_positions) {
      await db.from('bot_sessions').update({ last_tick_at: new Date().toISOString() }).eq('user_id', userId)
      return { action: 'max_positions_reached' }
    }

    const analysis = analyzeMarket(market, rs.min_confidence)
    await db.from('bot_sessions').update({ last_tick_at: new Date().toISOString() }).eq('user_id', userId)

    if (analysis.direction === 'WAIT') {
      await log(db, userId, 'signal',
        `🔍 Analyse: WAIT — Score LONG ${analysis.breakdown.rsi}/SHORT insuffisant`,
        { score: analysis.score }
      )
      return { action: 'wait', score: analysis.score, direction: 'WAIT' }
    }

    // 7. Ouvrir position
    await log(db, userId, 'signal',
      `📊 Signal ${analysis.direction} détecté — Score ${analysis.score}/100`,
      { breakdown: analysis.breakdown, reasoning: analysis.reasoning }
    )

    if (session.mode === 'paper') {
      await paperOpenPosition(db, session, rs, analysis)
    } else if (apiKey && apiSecret) {
      await liveOpenPosition(db, session, rs, analysis, apiKey, apiSecret)
    }

    return { action: 'position_opened', score: analysis.score, direction: analysis.direction }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await log(db, userId, 'error', `❌ Erreur tick: ${msg}`)
    return { action: 'error', error: msg }
  }
}

// ─── Tick global (tous les robots actifs) ────────────────────────────────────

export async function runAllTicks(): Promise<{ userId: string; result: Awaited<ReturnType<typeof runTick>> }[]> {
  const db = adminClient()
  const { data: sessions } = await db.from('bot_sessions').select('user_id').eq('is_active', true)
  if (!sessions?.length) return []

  const results = await Promise.allSettled(
    sessions.map(s => runTick(s.user_id).then(result => ({ userId: s.user_id, result })))
  )

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<{ userId: string; result: Awaited<ReturnType<typeof runTick>> }>).value)
}
