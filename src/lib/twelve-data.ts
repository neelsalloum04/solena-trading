import type { Candle } from './indicators'

const BASE = 'https://api.twelvedata.com'

const INTERVAL_MAP: Record<string, string> = {
  '15m': '15min',
  '1h':  '1h',
  '4h':  '4h',
  '1d':  '1day',
}

/**
 * Fetch OHLCV candles from Twelve Data (forex, stocks, indices).
 * Returns candles sorted oldest-first (ready for indicator calculations).
 * Requires TWELVE_DATA_API_KEY env variable.
 */
export async function fetchTwelveDataOHLCV(
  symbol: string,
  timeframe: string,
  outputsize = 150,
): Promise<Candle[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY
  if (!apiKey) throw new Error('TWELVE_DATA_API_KEY not configured')

  const interval = INTERVAL_MAP[timeframe] ?? '1h'
  const url =
    `${BASE}/time_series` +
    `?symbol=${encodeURIComponent(symbol)}` +
    `&interval=${interval}` +
    `&outputsize=${outputsize}` +
    `&apikey=${apiKey}`

  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`Twelve Data HTTP ${res.status} for ${symbol}`)

  const data = await res.json()
  if (data.status === 'error') {
    throw new Error(`Twelve Data error for ${symbol}: ${data.message}`)
  }
  if (!Array.isArray(data.values) || data.values.length === 0) {
    throw new Error(`Twelve Data: no data returned for ${symbol}`)
  }

  // API returns newest-first → reverse to oldest-first for indicator math
  return (data.values as any[]).reverse().map((v) => ({
    time:   Math.floor(new Date(v.datetime).getTime() / 1000),
    open:   parseFloat(v.open),
    high:   parseFloat(v.high),
    low:    parseFloat(v.low),
    close:  parseFloat(v.close),
    volume: parseFloat(v.volume ?? '0'),
  }))
}
