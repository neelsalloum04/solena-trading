import { computeTimeframe } from '@/lib/bot-btc/indicators'
import type { Candle } from '@/lib/bot-btc/indicators'
import type { MarketData } from '@/lib/bot-btc/types'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

let cache: { data: MarketData; ts: number } | null = null
const CACHE_TTL = 30_000

// Kraken public REST — no IP restrictions on cloud providers
const KRAKEN = 'https://api.kraken.com/0/public'

function krakenFetch(path: string, timeoutMs = 7000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  return fetch(`${KRAKEN}${path}`, { signal: ctrl.signal, cache: 'no-store' })
    .finally(() => clearTimeout(timer))
}

// Kraken intervals: 1 5 15 30 60 240 1440 (minutes)
// Returns oldest-first (already chronological — no reverse needed)
async function fetchKlines(interval: number, limit = 150): Promise<Candle[]> {
  const res = await krakenFetch(`/OHLC?pair=XBTUSD&interval=${interval}`)
  if (!res.ok) throw new Error(`klines ${interval}m HTTP ${res.status}`)
  const json = await res.json()
  if (json.error?.length) throw new Error(`klines ${interval}m: ${json.error[0]}`)
  const pairKey = Object.keys(json.result).find(k => k !== 'last')!
  const rows: (string | number)[][] = json.result[pairKey]
  return rows.slice(-limit).map(k => ({
    time:   Number(k[0]) * 1000,
    open:   parseFloat(String(k[1])),
    high:   parseFloat(String(k[2])),
    low:    parseFloat(String(k[3])),
    close:  parseFloat(String(k[4])),
    volume: parseFloat(String(k[6])),
  }))
}

async function fetchTicker() {
  const res = await krakenFetch('/Ticker?pair=XBTUSD')
  if (!res.ok) throw new Error(`ticker HTTP ${res.status}`)
  const json = await res.json()
  if (json.error?.length) throw new Error(`ticker: ${json.error[0]}`)
  const pairKey = Object.keys(json.result)[0]
  return json.result[pairKey]
}

async function fetchOrderbook() {
  const res = await krakenFetch('/Depth?pair=XBTUSD&count=20')
  if (!res.ok) throw new Error(`orderbook HTTP ${res.status}`)
  const json = await res.json()
  if (json.error?.length) throw new Error(`orderbook: ${json.error[0]}`)
  const pairKey = Object.keys(json.result)[0]
  return json.result[pairKey]
}

// Optional: Bybit for funding rate only (falls back to 0 if blocked)
async function fetchFunding(): Promise<number> {
  try {
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 4000)
    const res = await fetch(
      'https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT',
      { signal: ctrl.signal, cache: 'no-store' }
    )
    if (!res.ok) return 0
    const json = await res.json()
    return parseFloat(json?.result?.list?.[0]?.fundingRate ?? '0')
  } catch { return 0 }
}

export async function GET() {
  try {
    const now = Date.now()
    if (cache && now - cache.ts < CACHE_TTL) {
      return NextResponse.json({ ...cache.data, cached: true })
    }

    const [klines5m, klines15m, klines1h, ticker, orderbook, fundingRate] = await Promise.all([
      fetchKlines(5,  150),
      fetchKlines(15, 150),
      fetchKlines(60, 150),
      fetchTicker(),
      fetchOrderbook(),
      fetchFunding(),
    ])

    // Kraken ticker fields:
    // c[0] = last price, o = open 24h ago, h[1] = high 24h, l[1] = low 24h
    // v[1] = volume 24h (BTC), p[1] = VWAP 24h (USD)
    const lastPrice = parseFloat(ticker.c[0])
    const open24h   = parseFloat(ticker.o)
    const high24h   = parseFloat(ticker.h[1])
    const low24h    = parseFloat(ticker.l[1])
    const vol24hBtc = parseFloat(ticker.v[1])
    const vwap24h   = parseFloat(ticker.p[1])
    const change24h = ((lastPrice - open24h) / open24h) * 100
    const vol24hUsd = vol24hBtc * vwap24h

    // Kraken orderbook: bids/asks = [[price, volume, ts], ...]
    const bids: [number, number][] = orderbook.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])])
    const asks: [number, number][] = orderbook.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])])
    const bidVol = bids.reduce((s, b) => s + b[1], 0)
    const askVol = asks.reduce((s, a) => s + a[1], 0)

    const data: MarketData = {
      price:        lastPrice,
      change24h,
      volume24h:    vol24hUsd,
      high24h,
      low24h,
      fundingRate,
      openInterest: 0,
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
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
