import { computeTimeframe } from '@/lib/bot-btc/indicators'
import type { Candle } from '@/lib/bot-btc/indicators'
import type { MarketData } from '@/lib/bot-btc/types'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

// ─── Module-level cache (30s TTL) ─────────────────────────────────────────────

let cache: { data: MarketData; ts: number } | null = null
const CACHE_TTL = 30_000

// ─── Binance helpers ──────────────────────────────────────────────────────────

const BINANCE = 'https://api.binance.com'

async function fetchKlines(interval: string, limit = 200): Promise<Candle[]> {
  const url = `${BINANCE}/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Binance klines ${interval}: ${res.status}`)
  const raw: [number, string, string, string, string, string][] = await res.json()
  return raw.map(k => ({
    time:   k[0],
    open:   parseFloat(k[1]),
    high:   parseFloat(k[2]),
    low:    parseFloat(k[3]),
    close:  parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }))
}

async function fetchTicker() {
  const res = await fetch(`${BINANCE}/api/v3/ticker/24hr?symbol=BTCUSDT`, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Binance ticker: ${res.status}`)
  return res.json()
}

async function fetchDepth(limit = 20) {
  const res = await fetch(`${BINANCE}/api/v3/depth?symbol=BTCUSDT&limit=${limit}`, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Binance depth: ${res.status}`)
  return res.json()
}

// ─── Bybit helpers ────────────────────────────────────────────────────────────

async function fetchBybit() {
  try {
    const res = await fetch(
      'https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT',
      { next: { revalidate: 0 } }
    )
    if (!res.ok) return { fundingRate: 0, openInterest: 0 }
    const json = await res.json()
    const t = json?.result?.list?.[0]
    return {
      fundingRate:  parseFloat(t?.fundingRate ?? '0'),
      openInterest: parseFloat(t?.openInterestValue ?? '0'),
    }
  } catch {
    return { fundingRate: 0, openInterest: 0 }
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const now = Date.now()
    if (cache && now - cache.ts < CACHE_TTL) {
      return NextResponse.json({ ...cache.data, cached: true })
    }

    // Fetch in parallel
    const [klines1m, klines3m, klines5m, klines15m, klines1h, ticker, depth, bybit] = await Promise.all([
      fetchKlines('1m',  200),
      fetchKlines('3m',  200),
      fetchKlines('5m',  200),
      fetchKlines('15m', 200),
      fetchKlines('1h',  200),
      fetchTicker(),
      fetchDepth(20),
      fetchBybit(),
    ])

    // Order book
    const bids: [number, number][] = depth.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])])
    const asks: [number, number][] = depth.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])])
    const bidVol = bids.reduce((s, b) => s + b[1], 0)
    const askVol = asks.reduce((s, a) => s + a[1], 0)

    const data: MarketData = {
      price:       parseFloat(ticker.lastPrice),
      change24h:   parseFloat(ticker.priceChangePercent),
      volume24h:   parseFloat(ticker.quoteVolume),
      high24h:     parseFloat(ticker.highPrice),
      low24h:      parseFloat(ticker.lowPrice),
      fundingRate:  bybit.fundingRate,
      openInterest: bybit.openInterest,
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
    return NextResponse.json({ error: 'Erreur récupération marché' }, { status: 500 })
  }
}
