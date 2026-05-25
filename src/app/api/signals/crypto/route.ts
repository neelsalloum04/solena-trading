import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export const runtime    = 'nodejs'
export const maxDuration = 60

// ─── Assets ───────────────────────────────────────────────────────────────────

const ASSETS = [
  { id: 'BTC',   name: 'Bitcoin',        pair: 'BTCUSDT',  dec: 0 },
  { id: 'ETH',   name: 'Ethereum',       pair: 'ETHUSDT',  dec: 2 },
  { id: 'SOL',   name: 'Solana',         pair: 'SOLUSDT',  dec: 2 },
  { id: 'BNB',   name: 'BNB',            pair: 'BNBUSDT',  dec: 2 },
  { id: 'XRP',   name: 'XRP',            pair: 'XRPUSDT',  dec: 4 },
  { id: 'ADA',   name: 'Cardano',        pair: 'ADAUSDT',  dec: 4 },
  { id: 'DOGE',  name: 'Dogecoin',       pair: 'DOGEUSDT', dec: 5 },
  { id: 'AVAX',  name: 'Avalanche',      pair: 'AVAXUSDT', dec: 2 },
  { id: 'LINK',  name: 'Chainlink',      pair: 'LINKUSDT', dec: 3 },
  { id: 'MATIC', name: 'Polygon',        pair: 'MATICUSDT',dec: 4 },
  { id: 'DOT',   name: 'Polkadot',       pair: 'DOTUSDT',  dec: 3 },
  { id: 'TRX',   name: 'TRON',           pair: 'TRXUSDT',  dec: 5 },
  { id: 'LTC',   name: 'Litecoin',       pair: 'LTCUSDT',  dec: 2 },
  { id: 'NEAR',  name: 'NEAR Protocol',  pair: 'NEARUSDT', dec: 3 },
  { id: 'TON',   name: 'Toncoin',        pair: 'TONUSDT',  dec: 3 },
] as const

// ─── Binance OHLCV ────────────────────────────────────────────────────────────

interface Candle { open: number; high: number; low: number; close: number; volume: number }

async function fetchBinance(pair: string, interval = '4h', limit = 200): Promise<Candle[]> {
  const res = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`,
    { signal: AbortSignal.timeout(10_000) },
  )
  if (!res.ok) throw new Error(`Binance ${res.status} for ${pair}`)
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

function ema(values: number[], period: number): number[] {
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

function rsi(closes: number[], period = 14): number {
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

function atr(candles: Candle[], period = 14): number {
  const trs: number[] = []
  for (let i = 1; i < candles.length; i++) {
    trs.push(Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low  - candles[i - 1].close),
    ))
  }
  const recent = trs.slice(-period)
  return recent.reduce((a, b) => a + b, 0) / recent.length
}

function macdHist(closes: number[]): number {
  const fast = ema(closes, 12)
  const slow = ema(closes, 26)
  const macdLine = closes.map((_, i) =>
    isNaN(fast[i]) || isNaN(slow[i]) ? NaN : fast[i] - slow[i],
  )
  const validStart = macdLine.findIndex(v => !isNaN(v))
  if (validStart === -1) return 0
  const sigLine = ema(macdLine.slice(validStart), 9)
  const last = macdLine.length - 1 - validStart
  const sig  = sigLine[last]
  const mac  = macdLine[macdLine.length - 1]
  return isNaN(sig) || isNaN(mac) ? 0 : mac - sig
}

// ─── Analysis ─────────────────────────────────────────────────────────────────

export interface CryptoSignal {
  id:        string
  name:      string
  symbol:    string
  decision:  'ACHETER' | 'VENDRE'
  price:     number
  entry:     number
  tp1:       number; tp1Pct: number
  tp2:       number; tp2Pct: number
  tp3:       number; tp3Pct: number
  sl:        number; slPct:  number
  chances:   number
  error?:    string
}

function analyze(candles: Candle[], id: string, name: string): CryptoSignal {
  const closes = candles.map(c => c.close)
  const price  = closes[closes.length - 1]

  const rsiVal  = rsi(closes)
  const ema50A  = ema(closes, 50);  const ema50  = ema50A[ema50A.length - 1]
  const ema200A = ema(closes, 200); const ema200 = ema200A[ema200A.length - 1]
  const hist    = macdHist(closes)
  const atrVal  = atr(candles)

  // Composite score (same weighting as signal-detector.ts)
  let score = 0
  if (rsiVal < 30)       score += 18
  else if (rsiVal < 40)  score += 7
  else if (rsiVal > 70)  score -= 18
  else if (rsiVal > 60)  score -= 7

  if (!isNaN(ema50) && !isNaN(ema200)) score += ema50  > ema200 ? 10 : -10
  if (!isNaN(ema50))                   score += price   > ema50  ?  8 : -8
  if (!isNaN(ema200))                  score += price   > ema200 ?  7 : -7

  if (atrVal > 0) score += Math.max(-12, Math.min(12, Math.round(hist / atrVal * 60)))

  // Force ACHETER or VENDRE — never neutral
  const decision: 'ACHETER' | 'VENDRE' = score >= 0 ? 'ACHETER' : 'VENDRE'
  const bull = decision === 'ACHETER'

  const atv  = atrVal > 0 ? atrVal : price * 0.02
  const entry = price

  const tp1 = bull ? entry + atv * 1.0 : entry - atv * 1.0
  const tp2 = bull ? entry + atv * 2.0 : entry - atv * 2.0
  const tp3 = bull ? entry + atv * 3.0 : entry - atv * 3.0
  const sl  = bull ? entry - atv * 1.5 : entry + atv * 1.5

  const pct = (v: number) => +((v - entry) / entry * 100).toFixed(2)

  const chances = Math.min(92, Math.round(52 + Math.abs(score) * 0.5))

  return {
    id, name,
    symbol:   `${id}/USD`,
    decision,
    price,    entry,
    tp1, tp1Pct: pct(tp1),
    tp2, tp2Pct: pct(tp2),
    tp3, tp3Pct: pct(tp3),
    sl,  slPct:  pct(sl),
    chances,
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

// ─── SSE Route ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!await isAuthorized(req)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      for (const asset of ASSETS) {
        try {
          const candles = await fetchBinance(asset.pair, '4h', 200)
          if (candles.length < 60) {
            send({ id: asset.id, name: asset.name, symbol: `${asset.id}/USD`, error: 'Données insuffisantes' })
            continue
          }
          const result = analyze(candles, asset.id, asset.name)
          send(result)
        } catch {
          send({ id: asset.id, name: asset.name, symbol: `${asset.id}/USD`, error: 'Données indisponibles' })
        }
      }

      send({ done: true })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':     'text/event-stream',
      'Cache-Control':    'no-cache',
      'Connection':       'keep-alive',
      'X-Accel-Buffering':'no',
    },
  })
}
