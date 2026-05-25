import { requireAnthropic } from '@/lib/anthropic/client'
import {
  COOLDOWN_MINUTES,
  assetsByCategory,
  analyzeAsset,
  fetchOHLCV,
  type AssetCategory,
  type CompositeSignal,
} from '@/lib/signal-detector'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime   = 'nodejs'
export const maxDuration = 60

const VALID_TIMEFRAMES = ['15m', '1h', '4h', '1d'] as const
const VALID_CATEGORIES = ['crypto', 'forex', 'stocks', 'indices', 'metals', 'all'] as const

// Autorisé si : cron secret valide OU utilisateur connecté
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

// ─── Deduplication: skip if same asset+timeframe+label within cooldown ────────

async function isDuplicate(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  asset: string,
  timeframe: string,
  signalLabel: string,
): Promise<boolean> {
  const minutes = COOLDOWN_MINUTES[timeframe] ?? 60
  const { data } = await supabase
    .from('signals')
    .select('id')
    .eq('asset', asset)
    .eq('timeframe', timeframe)
    .eq('signal_label', signalLabel)
    .gte('created_at', new Date(Date.now() - minutes * 60 * 1000).toISOString())
    .limit(1)
  return !!(data && data.length > 0)
}

// ─── AI analysis: 2-sentence explanation from Claude Haiku ───────────────────

async function generateAIAnalysis(
  ai: ReturnType<typeof requireAnthropic>,
  asset: string,
  sig: CompositeSignal,
  timeframe: string,
): Promise<string | null> {
  try {
    const parts: string[] = []
    if (sig.rsi    != null) parts.push(`RSI: ${sig.rsi.toFixed(1)}`)
    if (sig.macd_hist != null) parts.push(`MACD hist: ${sig.macd_hist > 0 ? '+' : ''}${sig.macd_hist.toFixed(6)}`)
    if (sig.ema20 != null && sig.ema50 != null)
      parts.push(`EMA20/50: ${sig.ema20 > sig.ema50 ? 'haussier' : 'baissier'}`)
    if (sig.bb_lower != null && sig.price < sig.bb_lower)
      parts.push('Prix sous BB inférieure')
    else if (sig.bb_upper != null && sig.price > sig.bb_upper)
      parts.push('Prix au-dessus BB supérieure')
    if (sig.stoch_k != null) parts.push(`StochRSI K: ${sig.stoch_k.toFixed(1)}`)
    if (sig.vwap != null) parts.push(`VWAP: ${sig.price > sig.vwap ? 'prix au-dessus' : 'prix en-dessous'}`)

    const prompt =
      `Actif: ${asset} — TF: ${timeframe} — Signal: ${sig.signal_label} (score: ${sig.score > 0 ? '+' : ''}${sig.score})\n` +
      `${parts.join(' | ')}\n` +
      `En 2 phrases max (français professionnel), explique pourquoi ce signal est déclenché et cite le risque principal qui pourrait l'invalider. Aucun conseil d'achat ou de vente.`

    const res = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 160,
      messages: [{ role: 'user', content: prompt }],
    })
    return res.content[0]?.type === 'text' ? res.content[0].text.trim() : null
  } catch {
    return null
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!await isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const tf  = searchParams.get('tf')  ?? '1h'
  const cat = searchParams.get('cat') ?? 'all'

  if (!VALID_TIMEFRAMES.includes(tf as any)) {
    return NextResponse.json({ error: `Invalid tf. Use: ${VALID_TIMEFRAMES.join(', ')}` }, { status: 400 })
  }
  if (!VALID_CATEGORIES.includes(cat as any)) {
    return NextResponse.json({ error: `Invalid cat. Use: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 })
  }

  let ai: ReturnType<typeof requireAnthropic> | null = null
  try { ai = requireAnthropic() } catch { /* AI analysis optional */ }

  const supabase = await createAdminClient()
  const assets   = assetsByCategory(cat as AssetCategory | 'all')

  let generated = 0, skipped = 0
  const errors: string[] = []

  for (const [asset, cfg] of assets) {
    try {
      const candles = await fetchOHLCV(asset, cfg, tf)
      if (candles.length < 60) {
        errors.push(`${asset}: only ${candles.length} candles (need 60+)`)
        continue
      }

      const sig = analyzeAsset(candles)

      // Dedup: skip if same label already exists within cooldown window
      const dup = await isDuplicate(supabase, asset, tf, sig.signal_label)
      if (dup) { skipped++; continue }

      // AI analysis for actionable signals only
      let aiAnalysis: string | null = null
      if (ai && sig.direction !== 'NEUTRAL') {
        aiAnalysis = await generateAIAnalysis(ai, asset, sig, tf)
      }

      const { error } = await supabase.from('signals').insert({
        asset,
        asset_name:   cfg.name,
        category:     cfg.category,
        timeframe:    tf,
        signal_label: sig.signal_label,
        direction:    sig.direction,
        score:        sig.score,
        strength:     sig.strength,
        price:        sig.price          ?? null,
        rsi:          sig.rsi            ?? null,
        macd_hist:    sig.macd_hist      ?? null,
        ema20:        sig.ema20          ?? null,
        ema50:        sig.ema50          ?? null,
        ema200:       sig.ema200         ?? null,
        bb_upper:     sig.bb_upper       ?? null,
        bb_lower:     sig.bb_lower       ?? null,
        bb_mid:       sig.bb_mid         ?? null,
        stoch_k:      sig.stoch_k        ?? null,
        stoch_d:      sig.stoch_d        ?? null,
        atr:          sig.atr            ?? null,
        vwap:         sig.vwap           ?? null,
        volume_ratio: sig.volume_ratio   ?? null,
        entry_low:    sig.entry_low      ?? null,
        entry_high:   sig.entry_high     ?? null,
        stop_loss:    sig.stop_loss      ?? null,
        tp1:          sig.tp1            ?? null,
        tp2:          sig.tp2            ?? null,
        tp3:          sig.tp3            ?? null,
        risk_reward:  sig.risk_reward    ?? null,
        ai_analysis:  aiAnalysis,
        details:      sig.details,
      })

      if (error) {
        errors.push(`${asset} insert: ${error.message}`)
      } else {
        generated++
      }
    } catch (err: any) {
      errors.push(`${asset}: ${err?.message ?? 'unknown error'}`)
    }
  }

  console.log(`[signals/generate] tf=${tf} cat=${cat} generated=${generated} skipped=${skipped} errors=${errors.length}`)

  return NextResponse.json({
    ok: true, tf, cat,
    assets: assets.length,
    generated,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  })
}
