/**
 * Shared technical indicator library.
 * All calculations are performed on real OHLCV data — never estimated by AI.
 * Used by both signal-engine.ts and the chart analysis route.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface IndicatorSet {
  ema20: number
  ema50: number
  rsi: number
  atr: number
  swingHigh: number
  swingLow: number
  trend: string
  close: number
}

// ─── Calculations ─────────────────────────────────────────────────────────────

export function calcEMA(values: number[], period: number): number {
  if (values.length < period) return values.at(-1) ?? 0
  const k = 2 / (period + 1)
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < values.length; i++) ema = values[i] * k + ema * (1 - k)
  return ema
}

export function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50
  let avgGain = 0, avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1]
    if (d >= 0) avgGain += d; else avgLoss -= d
  }
  avgGain /= period; avgLoss /= period
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period
  }
  if (avgLoss === 0) return 100
  return 100 - 100 / (1 + avgGain / avgLoss)
}

export function calcATR(candles: Candle[], period = 14): number {
  if (candles.length < 2) return 0
  const trs = candles.slice(1).map((c, i) =>
    Math.max(c.high - c.low, Math.abs(c.high - candles[i].close), Math.abs(c.low - candles[i].close))
  )
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / Math.min(period, trs.length)
  for (let i = period; i < trs.length; i++) atr = (atr * (period - 1) + trs[i]) / period
  return atr
}

export function calcSwings(candles: Candle[], lookback = 30) {
  const s = candles.slice(-lookback)
  return { high: Math.max(...s.map(c => c.high)), low: Math.min(...s.map(c => c.low)) }
}

export function calcTrend(close: number, ema20: number, ema50: number): string {
  if (close > ema20 && ema20 > ema50) return 'BULLISH'
  if (close < ema20 && ema20 < ema50) return 'BEARISH'
  if (close > ema20 && ema20 < ema50) return 'RECOVERING'
  if (close < ema20 && ema20 > ema50) return 'DECLINING'
  return 'SIDEWAYS'
}

export function aggregate4h(h1: Candle[]): Candle[] {
  const blocks = new Map<number, Candle[]>()
  for (const c of h1) {
    const block = Math.floor(c.time / (4 * 3600)) * (4 * 3600)
    if (!blocks.has(block)) blocks.set(block, [])
    blocks.get(block)!.push(c)
  }
  return Array.from(blocks.entries())
    .sort(([a], [b]) => a - b)
    .map(([time, cs]) => ({
      time, open: cs[0].open,
      high: Math.max(...cs.map(c => c.high)),
      low: Math.min(...cs.map(c => c.low)),
      close: cs.at(-1)!.close,
      volume: cs.reduce((s, c) => s + c.volume, 0),
    }))
    .filter(c => c.close > 0)
}

export function computeIndicators(candles: Candle[], h4: Candle[]): { h1: IndicatorSet; h4: IndicatorSet } {
  const closes1 = candles.map(c => c.close)
  const ema20h1 = calcEMA(closes1, 20)
  const ema50h1 = calcEMA(closes1, 50)
  const close1  = candles.at(-1)!.close
  const sw1     = calcSwings(candles, 30)

  const closes4 = h4.map(c => c.close)
  const ema20h4 = calcEMA(closes4, 20)
  const ema50h4 = calcEMA(closes4, 50)
  const close4  = h4.at(-1)!.close
  const sw4     = calcSwings(h4, 20)

  return {
    h1: { ema20: ema20h1, ema50: ema50h1, rsi: calcRSI(closes1), atr: calcATR(candles), swingHigh: sw1.high, swingLow: sw1.low, trend: calcTrend(close1, ema20h1, ema50h1), close: close1 },
    h4: { ema20: ema20h4, ema50: ema50h4, rsi: calcRSI(closes4), atr: calcATR(h4), swingHigh: sw4.high, swingLow: sw4.low, trend: calcTrend(close4, ema20h4, ema50h4), close: close4 },
  }
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

export async function timedFetch(url: string, ms = 8000): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, {
      signal: ctrl.signal, cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    })
  } finally { clearTimeout(t) }
}

export async function fetchBinanceKlines(symbol: string, interval: '1h' | '4h', limit = 200): Promise<Candle[]> {
  try {
    const res = await timedFetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    )
    if (!res.ok) return []
    const data: any[][] = await res.json()
    return data.map(d => ({
      time: d[0] / 1000, open: parseFloat(d[1]), high: parseFloat(d[2]),
      low: parseFloat(d[3]), close: parseFloat(d[4]), volume: parseFloat(d[5]),
    })).filter(c => c.close > 0)
  } catch { return [] }
}

export async function fetchYahooKlines(symbol: string): Promise<Candle[]> {
  try {
    const res = await timedFetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=60m&range=60d`
    )
    if (!res.ok) return []
    const data = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return []
    const ts: number[] = result.timestamp ?? []
    const q = result.indicators?.quote?.[0] ?? {}
    return ts.map((t, i) => ({
      time: t, open: q.open?.[i] ?? 0, high: q.high?.[i] ?? 0,
      low: q.low?.[i] ?? 0, close: q.close?.[i] ?? 0, volume: q.volume?.[i] ?? 0,
    })).filter(c => c.close > 0)
  } catch { return [] }
}

// ─── Market → OHLCV source resolver ──────────────────────────────────────────

interface OHLCVSource {
  binanceSymbol: string | null
  yahooSymbol: string
  displayPair: string
}

const CRYPTO_PREFIXES = ['BTC','ETH','SOL','BNB','XRP','ADA','DOGE','LINK','AVAX','MATIC','DOT','UNI','LTC','TRX','NEAR','ARB','OP','INJ','SUI']

const INDEX_YAHOO: Record<string, string> = {
  'NASDAQ': '^IXIC', 'NAS100': '^NDX', 'NDX': '^NDX', 'US100': '^NDX',
  'SPX': '^GSPC', 'SP500': '^GSPC', 'SPX500': '^GSPC', 'US500': '^GSPC',
  'DOW': '^DJI', 'DJI': '^DJI', 'US30': '^DJI', 'DJIA': '^DJI',
  'DAX': '^GDAXI', 'DAX40': '^GDAXI', 'GER40': '^GDAXI',
  'CAC': '^FCHI', 'CAC40': '^FCHI', 'FRA40': '^FCHI',
  'FTSE': '^FTSE', 'UK100': '^FTSE', 'FTSE100': '^FTSE',
  'NIKKEI': '^N225', 'JPN225': '^N225',
}

const VALID_FX = new Set(['EUR','USD','GBP','JPY','CHF','CAD','AUD','NZD','SEK','NOK','DKK','SGD','HKD','MXN','ZAR','TRY'])

export function resolveOHLCVSource(market: string): OHLCVSource | null {
  if (!market || market === 'Inconnu') return null
  const m = market.toUpperCase().trim().replace(/[\s\/\-]/g, '')

  // Crypto
  for (const prefix of CRYPTO_PREFIXES) {
    if (m === prefix || m === prefix + 'USD' || m === prefix + 'USDT' || m === prefix + 'BUSD') {
      return { binanceSymbol: `${prefix}USDT`, yahooSymbol: `${prefix}-USD`, displayPair: `${prefix}/USD` }
    }
  }

  // Gold / Silver / Oil / Brent
  if (m.startsWith('XAU') || m === 'GOLD' || m === 'GC')
    return { binanceSymbol: null, yahooSymbol: 'GC=F', displayPair: 'XAU/USD' }
  if (m.startsWith('XAG') || m === 'SILVER')
    return { binanceSymbol: null, yahooSymbol: 'SI=F', displayPair: 'XAG/USD' }
  if (['WTI','USOIL','OIL','CL','CRUDEOIL'].includes(m))
    return { binanceSymbol: null, yahooSymbol: 'CL=F', displayPair: 'WTI/USD' }
  if (['BRENT','UKOIL'].includes(m))
    return { binanceSymbol: null, yahooSymbol: 'BZ=F', displayPair: 'BRENT/USD' }

  // Indices
  for (const [key, yahoo] of Object.entries(INDEX_YAHOO)) {
    if (m === key) return { binanceSymbol: null, yahooSymbol: yahoo, displayPair: key }
  }

  // Forex (6 chars)
  if (m.length === 6) {
    const base = m.slice(0, 3), quote = m.slice(3, 6)
    if (VALID_FX.has(base) && VALID_FX.has(quote)) {
      return { binanceSymbol: null, yahooSymbol: `${base}${quote}=X`, displayPair: `${base}/${quote}` }
    }
  }

  return null
}

// ─── Price decimal helper ─────────────────────────────────────────────────────

export function pxDecimals(price: number): number {
  if (price > 10000) return 2
  if (price > 100)   return 2
  if (price > 1)     return 4
  return 6
}

export function formatPx(price: number, decimals?: number): string {
  const d = decimals ?? pxDecimals(price)
  return price.toFixed(d)
}

// ─── Main: build indicator block for Claude prompt injection ──────────────────

export async function buildIndicatorBlock(market: string): Promise<string | null> {
  const src = resolveOHLCVSource(market)
  if (!src) return null

  let h1: Candle[], h4: Candle[]

  if (src.binanceSymbol) {
    ;[h1, h4] = await Promise.all([
      fetchBinanceKlines(src.binanceSymbol, '1h', 200),
      fetchBinanceKlines(src.binanceSymbol, '4h', 100),
    ])
  } else {
    h1 = await fetchYahooKlines(src.yahooSymbol)
    h4 = aggregate4h(h1)
  }

  if (h1.length < 50) return null

  const { h1: i1, h4: i4 } = computeIndicators(h1, h4.length >= 20 ? h4 : aggregate4h(h1))

  const dec = pxDecimals(i1.close)
  const px  = (v: number) => formatPx(v, dec)

  const globalTrend =
    i4.trend === i1.trend ? i4.trend
    : (i4.trend === 'BULLISH' && i1.trend === 'RECOVERING') ? 'BULLISH'
    : (i4.trend === 'BEARISH' && i1.trend === 'DECLINING')  ? 'BEARISH'
    : 'MIXTE'

  const change24h = h1.length >= 24
    ? ((i1.close - h1[h1.length - 24].close) / h1[h1.length - 24].close) * 100
    : 0

  return [
    `━━━ INDICATEURS TECHNIQUES CALCULÉS (données OHLCV réelles — utilise ces valeurs exactes) ━━━`,
    `Marché : ${src.displayPair} | Prix actuel : ${px(i1.close)} | Δ24h : ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`,
    `H1 (${h1.length} bougies) → EMA20 : ${px(i1.ema20)} | EMA50 : ${px(i1.ema50)} | RSI : ${i1.rsi.toFixed(1)} | ATR : ${px(i1.atr)}`,
    `H4 (${h4.length} bougies) → EMA20 : ${px(i4.ema20)} | EMA50 : ${px(i4.ema50)} | RSI : ${i4.rsi.toFixed(1)}`,
    `Résistance H1 (30 dernières bougies) : ${px(i1.swingHigh)} | Support H1 : ${px(i1.swingLow)}`,
    `Résistance H4 (20 dernières bougies) : ${px(i4.swingHigh)} | Support H4 : ${px(i4.swingLow)}`,
    `Tendance H1 : ${i1.trend} | Tendance H4 : ${i4.trend} | Biais global : ${globalTrend}`,
    `⚠ Ces chiffres sont calculés depuis des données réelles. Ne les ré-estime pas depuis l'image — interprète-les.`,
  ].join('\n')
}

// ─── Compact summary for signal-engine ───────────────────────────────────────

export function buildSignalSummary(
  pair: string,
  market: string,
  h1: Candle[],
  h4: Candle[],
  currentPrice: number,
  change24h: number,
): string {
  if (h1.length < 60) return ''
  const { h1: i1, h4: i4 } = computeIndicators(h1, h4)
  const globalTrend =
    i4.trend === i1.trend ? i4.trend
    : (i4.trend === 'BULLISH' && i1.trend === 'RECOVERING') ? 'BULLISH'
    : (i4.trend === 'BEARISH' && i1.trend === 'DECLINING')  ? 'BEARISH'
    : 'MIXED'
  const dec = pxDecimals(currentPrice)
  const px  = (v: number) => v.toFixed(dec)
  return `=== ${pair} | ${market.toUpperCase()} ===
Prix actuel: ${px(currentPrice)} | Δ24h: ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%
Tendance H4: ${i4.trend} | Tendance H1: ${i1.trend} | BIAIS GLOBAL: ${globalTrend}
H1 → EMA20:${px(i1.ema20)} EMA50:${px(i1.ema50)} RSI:${i1.rsi.toFixed(1)} ATR:${px(i1.atr)}
H4 → EMA20:${px(i4.ema20)} EMA50:${px(i4.ema50)} RSI:${i4.rsi.toFixed(1)}
H1 Résistance:${px(i1.swingHigh)} | H1 Support:${px(i1.swingLow)}
H4 Résistance:${px(i4.swingHigh)} | H4 Support:${px(i4.swingLow)}`
}
