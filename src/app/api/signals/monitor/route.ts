import { SIGNAL_ASSETS } from '@/lib/signal-detector'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime   = 'nodejs'
export const maxDuration = 30

// Hours after which a signal is considered expired (3× cooldown)
const EXPIRY_HOURS: Record<string, number> = {
  '15m': 4, '1h': 12, '4h': 48, '1d': 168,
}

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  if (req.headers.get('authorization') === `Bearer ${secret}`) return true
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch {
    return false
  }
}

// ─── Price fetchers ───────────────────────────────────────────────────────────

async function fetchKrakenPrice(pair: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.kraken.com/0/public/Ticker?pair=${pair}`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data.error?.length) return null
    const key = Object.keys(data.result ?? {}).find(k => k !== 'last')
    if (!key) return null
    return parseFloat(data.result[key].c[0])
  } catch {
    return null
  }
}

async function fetchTwelveDataPrices(symbols: string[]): Promise<Record<string, number>> {
  if (symbols.length === 0) return {}
  const apiKey = process.env.TWELVE_DATA_API_KEY
  if (!apiKey) return {}
  try {
    const res = await fetch(
      `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbols.join(','))}&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) },
    )
    if (!res.ok) return {}
    const data = await res.json()
    const prices: Record<string, number> = {}
    if (symbols.length === 1) {
      if (data.price) prices[symbols[0]] = parseFloat(data.price)
    } else {
      for (const sym of symbols) {
        if (data[sym]?.price) prices[sym] = parseFloat(data[sym].price)
      }
    }
    return prices
  } catch {
    return {}
  }
}

// ─── Status logic ─────────────────────────────────────────────────────────────

type SigRow = {
  id: string
  asset: string
  direction: string
  stop_loss: number | null
  tp1: number | null
  tp2: number | null
  tp3: number | null
  sig_status: string
  timeframe: string
  created_at: string
}

function computeNewStatus(sig: SigRow, currentPrice: number): string | null {
  const bull = sig.direction === 'BULLISH'

  // Check from highest TP downward
  if (sig.tp3 != null && (bull ? currentPrice >= sig.tp3 : currentPrice <= sig.tp3)) {
    return sig.sig_status !== 'tp3_hit' ? 'tp3_hit' : null
  }
  if (sig.tp2 != null && (bull ? currentPrice >= sig.tp2 : currentPrice <= sig.tp2)) {
    return !['tp2_hit', 'tp3_hit'].includes(sig.sig_status) ? 'tp2_hit' : null
  }
  if (sig.tp1 != null && (bull ? currentPrice >= sig.tp1 : currentPrice <= sig.tp1)) {
    return !['tp1_hit', 'tp2_hit', 'tp3_hit'].includes(sig.sig_status) ? 'tp1_hit' : null
  }
  if (sig.stop_loss != null && (bull ? currentPrice <= sig.stop_loss : currentPrice >= sig.stop_loss)) {
    return sig.sig_status !== 'sl_hit' ? 'sl_hit' : null
  }
  return null
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!await isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  // Fetch signals that can still advance (active or partial TP hits)
  const { data: activeSigs, error } = await supabase
    .from('signals')
    .select('id, asset, direction, stop_loss, tp1, tp2, tp3, sig_status, timeframe, created_at')
    .in('sig_status', ['active', 'tp1_hit', 'tp2_hit'])
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!activeSigs || activeSigs.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, tp1_hit: 0, tp2_hit: 0, tp3_hit: 0, sl_hit: 0, expired: 0 })
  }

  // Collect unique assets grouped by source
  const krakenTasks: { asset: string; pair: string }[] = []
  const twelveSymbols: { asset: string; symbol: string }[] = []
  const seenAssets = new Set<string>()

  for (const sig of activeSigs as SigRow[]) {
    if (seenAssets.has(sig.asset)) continue
    seenAssets.add(sig.asset)
    const cfg = SIGNAL_ASSETS[sig.asset]
    if (!cfg) continue
    if (cfg.source === 'kraken' && cfg.krakenPair) {
      krakenTasks.push({ asset: sig.asset, pair: cfg.krakenPair })
    } else if (cfg.source === 'twelve' && cfg.tdSymbol) {
      twelveSymbols.push({ asset: sig.asset, symbol: cfg.tdSymbol })
    }
  }

  // Fetch prices in parallel: Kraken calls individually, Twelve Data batched
  const [krakenResults, twelvePrices] = await Promise.all([
    Promise.all(krakenTasks.map(async t => ({ asset: t.asset, price: await fetchKrakenPrice(t.pair) }))),
    fetchTwelveDataPrices(twelveSymbols.map(s => s.symbol)),
  ])

  const priceMap: Record<string, number> = {}
  for (const { asset, price } of krakenResults) {
    if (price != null) priceMap[asset] = price
  }
  for (const { asset, symbol } of twelveSymbols) {
    if (twelvePrices[symbol] != null) priceMap[asset] = twelvePrices[symbol]
  }

  // Evaluate each signal
  let checked = 0, tp1_count = 0, tp2_count = 0, tp3_count = 0, sl_count = 0, expired_count = 0
  const now = Date.now()

  for (const sig of activeSigs as SigRow[]) {
    checked++
    const sigAgeMs  = now - new Date(sig.created_at).getTime()
    const expiryMs  = (EXPIRY_HOURS[sig.timeframe] ?? 24) * 3600 * 1000

    if (sigAgeMs > expiryMs) {
      await supabase.from('signals').update({
        sig_status: 'expired',
        status_updated_at: new Date().toISOString(),
      }).eq('id', sig.id)
      expired_count++
      continue
    }

    const currentPrice = priceMap[sig.asset]
    if (currentPrice == null) continue

    const newStatus = computeNewStatus(sig, currentPrice)
    if (!newStatus) continue

    await supabase.from('signals').update({
      sig_status: newStatus,
      status_updated_at: new Date().toISOString(),
    }).eq('id', sig.id)

    if (newStatus === 'tp1_hit') tp1_count++
    else if (newStatus === 'tp2_hit') tp2_count++
    else if (newStatus === 'tp3_hit') tp3_count++
    else if (newStatus === 'sl_hit')  sl_count++
  }

  console.log(`[signals/monitor] checked=${checked} tp1=${tp1_count} tp2=${tp2_count} tp3=${tp3_count} sl=${sl_count} expired=${expired_count}`)

  return NextResponse.json({
    ok: true,
    checked,
    tp1_hit: tp1_count,
    tp2_hit: tp2_count,
    tp3_hit: tp3_count,
    sl_hit:  sl_count,
    expired: expired_count,
  })
}
