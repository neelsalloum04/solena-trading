import { computeTimeframe } from '@/lib/bot-btc/indicators'
import type { Candle } from '@/lib/bot-btc/indicators'
import type { MarketData } from '@/lib/bot-btc/types'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

// ─── Module-level cache (30s TTL) ─────────────────────────────────────────────

let cache: { data: MarketData; ts: number } | null = null
const CACHE_TTL = 30_000

// ─── Bybit helpers ────────────────────────────────────────────────────────────
// Binance bloque les IPs Vercel — on utilise Bybit exclusivement.

const BYBIT = 'https://api.bybit.com'

// Bybit kline intervals: 1, 3, 5, 15, 60 (minutes)
async function fetchKlines(interval: string, limit = 200): Promise<Candle[]> {
  const url = `${BYBIT}/v5/market/kline?category=linear&symbol=BTCUSDT&interval=${interval}&limit=${limit}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Bybit klines ${interval}: ${res.status}`)
  const json = await res.json()
  if (json.retCode !== 0) throw new Error(`Bybit klines ${interval}: retCode ${json.retCode}`)
  // Bybit returns newest-first — reverse to get chronological order
  const list: string[][] = json.result.list.reverse()
  return list.map(k => ({
    time:   parseInt(k[0]),
    open:   parseFloat(k[1]),
    high:   parseFloat(k[2]),
    low:    parseFloat(k[3]),
    close:  parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }))
}

async function fetchTicker() {
  const res = await fetch(
    `${BYBIT}/v5/market/tickers?category=linear&symbol=BTCUSDT`,
    { next: { revalidate: 0 } }
  )
  if (!res.ok) throw new Error(`Bybit ticker: ${res.status}`)
  const json = await res.json()
  if (json.retCode !== 0) throw new Error(`Bybit ticker: retCode ${json.retCode}`)
  return json.result.list[0]
}

async function fetchOrderbook(limit = 25) {
  const res = await fetch(
    `${BYBIT}/v5/market/orderbook?category=linear&symbol=BTCUSDT&limit=${limit}`,
    { next: { revalidate: 0 } }
  )
  if (!res.ok) throw new Error(`Bybit orderbook: ${res.status}`)
  const json = await res.json()
  if (json.retCode !== 0) throw new Error(`Bybit orderbook: retCode ${json.retCode}`)
  return json.result
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const now = Date.now()
    if (cache && now - cache.ts < CACHE_TTL) {
      return NextResponse.json({ ...cache.data, cached: true })
    }

    const [klines1m, klines3m, klines5m, klines15m, klines1h, ticker, orderbook] = await Promise.all([
      fetchKlines('1',  200),
      fetchKlines('3',  200),
      fetchKlines('5',  200),
      fetchKlines('15', 200),
      fetchKlines('60', 200),
      fetchTicker(),
      fetchOrderbook(25),
    ])

    // Order book — Bybit: b = bids, a = asks, each [price, size]
    const bids: [number, number][] = orderbook.b.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])])
    const asks: [number, number][] = orderbook.a.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])])
    const bidVol = bids.reduce((s, b) => s + b[1], 0)
    const askVol = asks.reduce((s, a) => s + a[1], 0)

    const data: MarketData = {
      price:        parseFloat(ticker.lastPrice),
      change24h:    parseFloat(ticker.price24hPcnt) * 100,   // Bybit returns decimal (0.023 = 2.3%)
      volume24h:    parseFloat(ticker.turnover24h),           // USDT turnover
      high24h:      parseFloat(ticker.highPrice24h),
      low24h:       parseFloat(ticker.lowPrice24h),
      fundingRate:  parseFloat(ticker.fundingRate ?? '0'),
      openInterest: parseFloat(ticker.openInterestValue ?? '0'),
      orderBook: {
        bids,
        asks,
        ratio: askVol > 0 ? bidVol / askVol : 1,
      },
      indicators: {
        '1m':  computeTimeframe(klines1m),
        '3m':  computeTimeframe(klines3m),
        '5m':  computeTimeframe(klines5m),
        '15m': computeTimeframe(klines15m),
        '1h':  computeTimeframe(klines1h),
      },
      updatedAt: new Date().toISOString(),
    }

    cache = { data, ts: now }
    return NextResponse.json(data)
  } catch (err) {
    console.error('[bot-btc/market]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
