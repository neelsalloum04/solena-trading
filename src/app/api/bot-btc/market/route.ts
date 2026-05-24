import { computeTimeframe } from '@/lib/bot-btc/indicators'
import type { Candle } from '@/lib/bot-btc/indicators'
import type { MarketData } from '@/lib/bot-btc/types'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

let cache: { data: MarketData; ts: number } | null = null
const CACHE_TTL = 30_000
const BYBIT = 'https://api.bybit.com'

// Fetch with hard timeout so Vercel never hangs past limit
function bybitFetch(path: string, timeoutMs = 7000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  return fetch(`${BYBIT}${path}`, { signal: ctrl.signal, cache: 'no-store' })
    .finally(() => clearTimeout(timer))
}

async function fetchKlines(interval: string, limit = 150): Promise<Candle[]> {
  const res = await bybitFetch(
    `/v5/market/kline?category=linear&symbol=BTCUSDT&interval=${interval}&limit=${limit}`
  )
  if (!res.ok) throw new Error(`klines ${interval} HTTP ${res.status}`)
  const json = await res.json()
  if (json.retCode !== 0) throw new Error(`klines ${interval} retCode=${json.retCode}: ${json.retMsg}`)
  const list: string[][] = [...json.result.list].reverse()   // DESC→ASC
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
  const res = await bybitFetch('/v5/market/tickers?category=linear&symbol=BTCUSDT')
  if (!res.ok) throw new Error(`ticker HTTP ${res.status}`)
  const json = await res.json()
  if (json.retCode !== 0) throw new Error(`ticker retCode=${json.retCode}: ${json.retMsg}`)
  return json.result.list[0]
}

async function fetchOrderbook() {
  const res = await bybitFetch('/v5/market/orderbook?category=linear&symbol=BTCUSDT&limit=20')
  if (!res.ok) throw new Error(`orderbook HTTP ${res.status}`)
  const json = await res.json()
  if (json.retCode !== 0) throw new Error(`orderbook retCode=${json.retCode}: ${json.retMsg}`)
  return json.result
}

export async function GET() {
  try {
    const now = Date.now()
    if (cache && now - cache.ts < CACHE_TTL) {
      return NextResponse.json({ ...cache.data, cached: true })
    }

    // 5 parallel requests — 3 timeframes only (was 7, timeout fix)
    const [klines5m, klines15m, klines1h, ticker, orderbook] = await Promise.all([
      fetchKlines('5',  150),
      fetchKlines('15', 150),
      fetchKlines('60', 150),
      fetchTicker(),
      fetchOrderbook(),
    ])

    const bids: [number, number][] = orderbook.b.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])])
    const asks: [number, number][] = orderbook.a.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])])
    const bidVol = bids.reduce((s, b) => s + b[1], 0)
    const askVol = asks.reduce((s, a) => s + a[1], 0)

    const data: MarketData = {
      price:        parseFloat(ticker.lastPrice),
      change24h:    parseFloat(ticker.price24hPcnt) * 100,
      volume24h:    parseFloat(ticker.turnover24h),
      high24h:      parseFloat(ticker.highPrice24h),
      low24h:       parseFloat(ticker.lowPrice24h),
      fundingRate:  parseFloat(ticker.fundingRate  ?? '0'),
      openInterest: parseFloat(ticker.openInterestValue ?? '0'),
      orderBook: { bids, asks, ratio: askVol > 0 ? bidVol / askVol : 1 },
      indicators: {
        '5m':  computeTimeframe(klines5m),
        '15m': computeTimeframe(klines15m),
        '1h':  computeTimeframe(klines1h),
      },
      updatedAt: new Date().toISOString(),
    }

    cache = { data, ts: now }
    return NextResponse.json(data)

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[bot-btc/market]', msg)
    // Renvoie le message d'erreur exact pour pouvoir diagnostiquer depuis le client
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
