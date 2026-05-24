// ─── BTC Scalping Bot — Indicator Engine ──────────────────────────────────────

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MACDResult {
  macd: number
  signal: number
  histogram: number
  bullish: boolean
}

export interface TimeframeIndicators {
  rsi: number
  macd: MACDResult
  ema20: number
  ema50: number
  ema200: number
  vwap: number
  atr: number
  support: number[]
  resistance: number[]
  trend: 'bullish' | 'bearish' | 'neutral'
  momentum: number        // RSI momentum score 0-100
  volumeRatio: number     // buy vol / sell vol last 20 candles
  priceVsVwap: number     // % above/below VWAP
  macdCrossing: boolean   // MACD about to cross signal
}

// ─── Core EMA ─────────────────────────────────────────────────────────────────

function ema(values: number[], period: number): number[] {
  if (values.length < period) return values.map(() => values[values.length - 1])
  const k = 2 / (period + 1)
  const result: number[] = [values[0]]
  for (let i = 1; i < values.length; i++) {
    result.push(values[i] * k + result[i - 1] * (1 - k))
  }
  return result
}

export function calcEMALast(closes: number[], period: number): number {
  const e = ema(closes, period)
  return e[e.length - 1]
}

// ─── RSI ──────────────────────────────────────────────────────────────────────

export function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50
  const gains: number[] = []
  const losses: number[] = []
  for (let i = 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    gains.push(d > 0 ? d : 0)
    losses.push(d < 0 ? -d : 0)
  }
  const g = gains.slice(-period).reduce((s, v) => s + v, 0) / period
  const l = losses.slice(-period).reduce((s, v) => s + v, 0) / period
  if (l === 0) return 100
  return 100 - 100 / (1 + g / l)
}

// ─── MACD ─────────────────────────────────────────────────────────────────────

export function calcMACD(closes: number[]): MACDResult {
  if (closes.length < 35) return { macd: 0, signal: 0, histogram: 0, bullish: false }
  const e12 = ema(closes, 12)
  const e26 = ema(closes, 26)
  const macdLine = e12.map((v, i) => v - e26[i]).slice(25)
  const signalLine = ema(macdLine, 9)
  const last = macdLine[macdLine.length - 1]
  const prev = macdLine[macdLine.length - 2] ?? last
  const sig  = signalLine[signalLine.length - 1]
  const sigPrev = signalLine[signalLine.length - 2] ?? sig
  return {
    macd: last,
    signal: sig,
    histogram: last - sig,
    bullish: last > sig,
    // @ts-ignore — extra field for crossing detection
    crossing: (prev < sigPrev && last > sig) || (prev > sigPrev && last < sig),
  }
}

// ─── ATR ──────────────────────────────────────────────────────────────────────

export function calcATR(candles: Candle[], period = 14): number {
  if (candles.length < 2) return 0
  const trs: number[] = []
  for (let i = 1; i < candles.length; i++) {
    const { high, low } = candles[i]
    const pc = candles[i - 1].close
    trs.push(Math.max(high - low, Math.abs(high - pc), Math.abs(low - pc)))
  }
  const recent = trs.slice(-period)
  return recent.reduce((s, v) => s + v, 0) / recent.length
}

// ─── VWAP ─────────────────────────────────────────────────────────────────────

export function calcVWAP(candles: Candle[]): number {
  let tpv = 0; let vol = 0
  for (const c of candles) {
    const tp = (c.high + c.low + c.close) / 3
    tpv += tp * c.volume
    vol += c.volume
  }
  return vol > 0 ? tpv / vol : candles[candles.length - 1]?.close ?? 0
}

// ─── Support & Resistance ──────────────────────────────────────────────────────

export function findSR(candles: Candle[], currentPrice: number): { support: number[]; resistance: number[] } {
  const w = 3
  const res: number[] = []
  const sup: number[] = []

  for (let i = w; i < candles.length - w; i++) {
    const highs = Array.from({ length: w }, (_, k) => k + 1)
    const lows  = Array.from({ length: w }, (_, k) => k + 1)
    if (highs.every(k => candles[i].high >= candles[i - k].high && candles[i].high >= candles[i + k].high)) {
      res.push(Math.round(candles[i].high))
    }
    if (lows.every(k => candles[i].low <= candles[i - k].low && candles[i].low <= candles[i + k].low)) {
      sup.push(Math.round(candles[i].low))
    }
  }

  const resistance = [...new Set(res)].filter(v => v > currentPrice).sort((a, b) => a - b).slice(0, 4)
  const support    = [...new Set(sup)].filter(v => v < currentPrice).sort((a, b) => b - a).slice(0, 4)
  return { support, resistance }
}

// ─── Full Computation ─────────────────────────────────────────────────────────

export function computeTimeframe(candles: Candle[]): TimeframeIndicators {
  const closes = candles.map(c => c.close)
  const price  = closes[closes.length - 1]

  const rsi   = calcRSI(closes)
  const macd  = calcMACD(closes)
  const ema20 = calcEMALast(closes, 20)
  const ema50 = calcEMALast(closes, 50)
  const ema200 = calcEMALast(closes, 200)
  const vwap  = calcVWAP(candles)
  const atr   = calcATR(candles)
  const { support, resistance } = findSR(candles, price)

  const trend = price > ema20 && ema20 > ema50 && ema50 > ema200
    ? 'bullish'
    : price < ema20 && ema20 < ema50 && ema50 < ema200
    ? 'bearish'
    : 'neutral'

  const recent = candles.slice(-20)
  const buyVol  = recent.filter(c => c.close >= c.open).reduce((s, c) => s + c.volume, 0)
  const sellVol = recent.filter(c => c.close < c.open).reduce((s, c) => s + c.volume, 0)

  // RSI momentum: distance from 50 toward 70 (bull) or 30 (bear)
  const momentum = rsi > 50
    ? Math.min(100, ((rsi - 50) / 30) * 100)
    : Math.min(100, ((50 - rsi) / 30) * 100)

  return {
    rsi, macd, ema20, ema50, ema200, vwap, atr,
    support, resistance, trend,
    momentum,
    volumeRatio: sellVol > 0 ? buyVol / sellVol : 1,
    priceVsVwap: vwap > 0 ? ((price - vwap) / vwap) * 100 : 0,
    macdCrossing: (macd as any).crossing ?? false,
  }
}
