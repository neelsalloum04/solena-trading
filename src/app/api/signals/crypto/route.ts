import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export const runtime     = 'nodejs'
export const maxDuration = 60

// ─── Assets ───────────────────────────────────────────────────────────────────

export const CRYPTO_ASSETS = [
  { id: 'BTC',   name: 'Bitcoin',        pair: 'BTCUSDT'  },
  { id: 'ETH',   name: 'Ethereum',       pair: 'ETHUSDT'  },
  { id: 'SOL',   name: 'Solana',         pair: 'SOLUSDT'  },
  { id: 'BNB',   name: 'BNB',            pair: 'BNBUSDT'  },
  { id: 'XRP',   name: 'XRP',            pair: 'XRPUSDT'  },
  { id: 'ADA',   name: 'Cardano',        pair: 'ADAUSDT'  },
  { id: 'DOGE',  name: 'Dogecoin',       pair: 'DOGEUSDT' },
  { id: 'AVAX',  name: 'Avalanche',      pair: 'AVAXUSDT' },
  { id: 'LINK',  name: 'Chainlink',      pair: 'LINKUSDT' },
  { id: 'MATIC', name: 'Polygon',        pair: 'MATICUSDT'},
  { id: 'DOT',   name: 'Polkadot',       pair: 'DOTUSDT'  },
  { id: 'TRX',   name: 'TRON',           pair: 'TRXUSDT'  },
  { id: 'LTC',   name: 'Litecoin',       pair: 'LTCUSDT'  },
  { id: 'BCH',   name: 'Bitcoin Cash',   pair: 'BCHUSDT'  },
  { id: 'NEAR',  name: 'NEAR Protocol',  pair: 'NEARUSDT' },
] as const

// ─── Binance OHLCV ────────────────────────────────────────────────────────────

interface Candle {
  open: number; high: number; low: number; close: number; volume: number
}

async function fetchCandles(pair: string, interval = '4h', limit = 220): Promise<Candle[]> {
  const res = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`,
    { signal: AbortSignal.timeout(10_000) },
  )
  if (!res.ok) throw new Error(`Binance HTTP ${res.status}`)
  const raw = await res.json() as any[][]
  return raw.map(k => ({
    open:   parseFloat(k[1]),
    high:   parseFloat(k[2]),
    low:    parseFloat(k[3]),
    close:  parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }))
}

// ─── Indicators ───────────────────────────────────────────────────────────────

function calcEMA(values: number[], period: number): number[] {
  const out: number[] = new Array(values.length).fill(NaN)
  if (values.length < period) return out
  const k = 2 / (period + 1)
  let val = values.slice(0, period).reduce((a, b) => a + b) / period
  out[period - 1] = val
  for (let i = period; i < values.length; i++) {
    val = values[i] * k + val * (1 - k)
    out[i] = val
  }
  return out
}

function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50
  let gain = 0, loss = 0
  for (let i = closes.length - period; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    if (d > 0) gain += d; else loss -= d
  }
  const ag = gain / period, al = loss / period
  if (al === 0) return 100
  return 100 - 100 / (1 + ag / al)
}

function calcATR(candles: Candle[], period = 14): number {
  const trs: number[] = []
  for (let i = 1; i < candles.length; i++) {
    trs.push(Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low  - candles[i - 1].close),
    ))
  }
  const slice = trs.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

function calcMACDHist(closes: number[]): number {
  const fast      = calcEMA(closes, 12)
  const slow      = calcEMA(closes, 26)
  const macdLine  = closes.map((_, i) =>
    isNaN(fast[i]) || isNaN(slow[i]) ? NaN : fast[i] - slow[i])
  const start     = macdLine.findIndex(v => !isNaN(v))
  if (start === -1) return 0
  const sigLine   = calcEMA(macdLine.slice(start), 9)
  const last      = closes.length - 1 - start
  const sig       = sigLine[last]
  const mac       = macdLine[closes.length - 1]
  return isNaN(sig) || isNaN(mac) ? 0 : mac - sig
}

function calcVolumeRatio(candles: Candle[], period = 20): number {
  if (candles.length < period + 1) return 1
  const avg = candles.slice(-period - 1, -1).reduce((s, c) => s + c.volume, 0) / period
  return avg > 0 ? candles[candles.length - 1].volume / avg : 1
}

// ─── Analysis ─────────────────────────────────────────────────────────────────

export interface CryptoSignal {
  id:         string
  name:       string
  symbol:     string
  decision:   'ACHETER' | 'VENDRE'
  confidence: number          // 51–95
  price:      number
  entry:      number
  tp1: number; tp1Pct: number
  tp2: number; tp2Pct: number
  tp3: number; tp3Pct: number
  sl:  number; slPct:  number
  error?: string
}

// SSE event types
export type SSEEvent =
  | { type: 'progress'; id: string; name: string; index: number; total: number }
  | { type: 'result';   signal: CryptoSignal }
  | { type: 'error';    id: string; name: string; message: string }
  | { type: 'done' }

function analyze(candles: Candle[], id: string, name: string): CryptoSignal {
  const closes   = candles.map(c => c.close)
  const price    = closes[closes.length - 1]

  // Indicators
  const rsiVal   = calcRSI(closes)
  const ema50A   = calcEMA(closes, 50);  const ema50  = ema50A[ema50A.length - 1]
  const ema200A  = calcEMA(closes, 200); const ema200 = ema200A[ema200A.length - 1]
  const hist     = calcMACDHist(closes)
  const atrVal   = calcATR(candles)
  const volRatio = calcVolumeRatio(candles)

  // Individual signal contributions (signed, -1 to +1 each)
  const signals: number[] = []

  // RSI — oversold = bullish, overbought = bearish
  if      (rsiVal < 30) signals.push(+1.0)
  else if (rsiVal < 40) signals.push(+0.5)
  else if (rsiVal < 50) signals.push(+0.2)
  else if (rsiVal < 60) signals.push(-0.2)
  else if (rsiVal < 70) signals.push(-0.5)
  else                  signals.push(-1.0)

  // EMA50 vs EMA200 (trend)
  if (!isNaN(ema50) && !isNaN(ema200))
    signals.push(ema50 > ema200 ? +1.0 : -1.0)

  // Price vs EMA50 (momentum)
  if (!isNaN(ema50))
    signals.push(price > ema50 ? +0.8 : -0.8)

  // Price vs EMA200 (long-term trend)
  if (!isNaN(ema200))
    signals.push(price > ema200 ? +0.6 : -0.6)

  // MACD histogram (momentum shift)
  if (atrVal > 0) {
    const norm = hist / atrVal
    signals.push(Math.max(-1, Math.min(1, norm * 3)))
  }

  // Volume amplification (high volume = stronger conviction)
  const volBoost = volRatio > 1.5 ? 1.15 : volRatio > 1.2 ? 1.05 : 1.0

  // Weighted sum → direction + confidence
  const sum   = signals.reduce((a, b) => a + b, 0)
  const score = sum * volBoost

  const decision: 'ACHETER' | 'VENDRE' = score >= 0 ? 'ACHETER' : 'VENDRE'
  const bull = decision === 'ACHETER'

  // Confidence: how much signals agree (convergence)
  // Count signals pointing in the winning direction
  const winDir    = bull ? 1 : -1
  const agreeing  = signals.filter(s => s * winDir > 0).length
  const total     = signals.length
  const convergence = total > 0 ? agreeing / total : 0.5

  // Scale to 51–95%
  const confidence = Math.round(51 + convergence * 44)

  // Levels
  const atv   = atrVal > 0 ? atrVal : price * 0.02
  const entry = price
  const tp1   = bull ? entry + atv * 1.0 : entry - atv * 1.0
  const tp2   = bull ? entry + atv * 2.0 : entry - atv * 2.0
  const tp3   = bull ? entry + atv * 3.5 : entry - atv * 3.5
  const sl    = bull ? entry - atv * 1.5 : entry + atv * 1.5
  const pct   = (v: number) => +((v - entry) / entry * 100).toFixed(1)

  return {
    id, name, symbol: `${id}/USD`,
    decision, confidence,
    price, entry,
    tp1, tp1Pct: pct(tp1),
    tp2, tp2Pct: pct(tp2),
    tp3, tp3Pct: pct(tp3),
    sl,  slPct:  pct(sl),
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  if (req.headers.get('authorization') === `Bearer ${secret}`) return true
  try {
    const sb = await createClient()
    const { data: { user } } = await sb.auth.getUser()
    return !!user
  } catch { return false }
}

// ─── SSE route ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!await isAuthorized(req)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  const total   = CRYPTO_ASSETS.length

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))

      for (let i = 0; i < CRYPTO_ASSETS.length; i++) {
        const asset = CRYPTO_ASSETS[i]

        // Announce current analysis
        send({ type: 'progress', id: asset.id, name: asset.name, index: i + 1, total })

        try {
          const candles = await fetchCandles(asset.pair, '4h', 220)
          if (candles.length < 60) throw new Error('Données insuffisantes')
          const signal = analyze(candles, asset.id, asset.name)
          send({ type: 'result', signal })
        } catch (err: any) {
          send({ type: 'error', id: asset.id, name: asset.name, message: err?.message ?? 'Erreur' })
        }
      }

      send({ type: 'done' })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
