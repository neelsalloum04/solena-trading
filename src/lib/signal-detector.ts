import type { Candle } from './indicators'
import { calcATR, calcSwings } from './indicators'
import { fetchTwelveDataOHLCV } from './twelve-data'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignalLabel    = 'ACHAT FORT' | 'ACHAT' | 'NEUTRE' | 'VENTE' | 'VENTE FORTE'
export type SignalDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL'
export type AssetCategory   = 'crypto' | 'forex' | 'stocks' | 'indices' | 'metals'

export interface CompositeSignal {
  signal_label:  SignalLabel
  direction:     SignalDirection
  score:         number          // -100 to +100
  strength:      number          // abs(score), 0–100
  price:         number
  // Indicators
  rsi:           number | null
  macd_hist:     number | null
  ema20:         number | null
  ema50:         number | null
  ema200:        number | null
  bb_upper:      number | null
  bb_lower:      number | null
  bb_mid:        number | null
  stoch_k:       number | null
  stoch_d:       number | null
  atr:           number | null
  vwap:          number | null
  volume_ratio:  number | null
  // Levels
  entry_low:     number | null
  entry_high:    number | null
  stop_loss:     number | null
  tp1:           number | null
  tp2:           number | null
  tp3:           number | null
  risk_reward:   number | null
  details:       Record<string, unknown>
}

export interface AssetConfig {
  name:        string
  category:    AssetCategory
  source:      'kraken' | 'twelve'
  krakenPair?: string
  tdSymbol?:   string
}

// ─── Asset registry ───────────────────────────────────────────────────────────

export const SIGNAL_ASSETS: Record<string, AssetConfig> = {
  // Crypto (Kraken — free, no geo-block)
  'BTC/USD':  { name: 'Bitcoin',         category: 'crypto',  source: 'kraken', krakenPair: 'XBTUSD'  },
  'ETH/USD':  { name: 'Ethereum',        category: 'crypto',  source: 'kraken', krakenPair: 'ETHUSD'  },
  'SOL/USD':  { name: 'Solana',          category: 'crypto',  source: 'kraken', krakenPair: 'SOLUSD'  },
  'XRP/USD':  { name: 'XRP',             category: 'crypto',  source: 'kraken', krakenPair: 'XRPUSD'  },
  'ADA/USD':  { name: 'Cardano',         category: 'crypto',  source: 'kraken', krakenPair: 'ADAUSD'  },
  'LINK/USD': { name: 'Chainlink',       category: 'crypto',  source: 'kraken', krakenPair: 'LINKUSD' },
  'DOT/USD':  { name: 'Polkadot',        category: 'crypto',  source: 'kraken', krakenPair: 'DOTUSD'  },
  'AVAX/USD': { name: 'Avalanche',       category: 'crypto',  source: 'kraken', krakenPair: 'AVAXUSD' },

  // Forex (Twelve Data)
  'EUR/USD':  { name: 'Euro / Dollar',   category: 'forex',   source: 'twelve', tdSymbol: 'EUR/USD' },
  'GBP/USD':  { name: 'Pound / Dollar',  category: 'forex',   source: 'twelve', tdSymbol: 'GBP/USD' },
  'USD/JPY':  { name: 'Dollar / Yen',    category: 'forex',   source: 'twelve', tdSymbol: 'USD/JPY' },
  'USD/CHF':  { name: 'Dollar / Franc',  category: 'forex',   source: 'twelve', tdSymbol: 'USD/CHF' },
  'AUD/USD':  { name: 'Aussie / Dollar', category: 'forex',   source: 'twelve', tdSymbol: 'AUD/USD' },
  'USD/CAD':  { name: 'Dollar / CAD',    category: 'forex',   source: 'twelve', tdSymbol: 'USD/CAD' },

  // Stocks (Twelve Data)
  'AAPL':  { name: 'Apple',     category: 'stocks', source: 'twelve', tdSymbol: 'AAPL'  },
  'TSLA':  { name: 'Tesla',     category: 'stocks', source: 'twelve', tdSymbol: 'TSLA'  },
  'NVDA':  { name: 'NVIDIA',    category: 'stocks', source: 'twelve', tdSymbol: 'NVDA'  },
  'META':  { name: 'Meta',      category: 'stocks', source: 'twelve', tdSymbol: 'META'  },
  'MSFT':  { name: 'Microsoft', category: 'stocks', source: 'twelve', tdSymbol: 'MSFT'  },
  'GOOGL': { name: 'Alphabet',  category: 'stocks', source: 'twelve', tdSymbol: 'GOOGL' },
  'AMZN':  { name: 'Amazon',    category: 'stocks', source: 'twelve', tdSymbol: 'AMZN'  },

  // Indices (Twelve Data)
  'SPX': { name: 'S&P 500',    category: 'indices', source: 'twelve', tdSymbol: 'SPX' },
  'NDX': { name: 'NASDAQ 100', category: 'indices', source: 'twelve', tdSymbol: 'NDX' },
  'DJI': { name: 'Dow Jones',  category: 'indices', source: 'twelve', tdSymbol: 'DJI' },
  'DAX': { name: 'DAX 40',     category: 'indices', source: 'twelve', tdSymbol: 'DAX' },

  // Metals (Twelve Data)
  'XAU/USD': { name: 'Or (Gold)',        category: 'metals', source: 'twelve', tdSymbol: 'XAU/USD' },
  'XAG/USD': { name: 'Argent (Silver)',  category: 'metals', source: 'twelve', tdSymbol: 'XAG/USD' },
}

export const ASSET_CATEGORIES: AssetCategory[] = ['crypto', 'forex', 'stocks', 'indices', 'metals']

export function assetsByCategory(cat: AssetCategory | 'all'): [string, AssetConfig][] {
  if (cat === 'all') return Object.entries(SIGNAL_ASSETS)
  return Object.entries(SIGNAL_ASSETS).filter(([, c]) => c.category === cat)
}

// ─── Cooldowns ────────────────────────────────────────────────────────────────

export const COOLDOWN_MINUTES: Record<string, number> = {
  '15m': 90,
  '1h':  240,
  '4h':  960,
  '1d':  4320,
}

// ─── Label config (for UI) ────────────────────────────────────────────────────

export const LABEL_CONFIG: Record<SignalLabel, { color: string; bg: string; border: string }> = {
  'ACHAT FORT':  { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)'   },
  'ACHAT':       { color: '#4ade80', bg: 'rgba(74,222,128,0.06)',  border: 'rgba(74,222,128,0.18)'  },
  'NEUTRE':      { color: '#888888', bg: 'rgba(136,136,136,0.04)', border: 'rgba(136,136,136,0.12)' },
  'VENTE':       { color: '#f87171', bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.18)' },
  'VENTE FORTE': { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)'   },
}

// ─── Indicator math ───────────────────────────────────────────────────────────

function calcEMAArray(values: number[], period: number): number[] {
  const out = new Array<number>(values.length).fill(NaN)
  if (values.length < period) return out
  const k = 2 / (period + 1)
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period
  out[period - 1] = ema
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k)
    out[i] = ema
  }
  return out
}

function calcRSIArray(closes: number[], period = 14): number[] {
  const out = new Array<number>(closes.length).fill(NaN)
  if (closes.length < period + 1) return out
  let avgGain = 0, avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1]
    d >= 0 ? (avgGain += d) : (avgLoss -= d)
  }
  avgGain /= period; avgLoss /= period
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return out
}

function calcMACDHistogram(closes: number[]): { hist: number; signal: number; macd: number } {
  const NaN3 = { hist: NaN, signal: NaN, macd: NaN }
  const fastEMA = calcEMAArray(closes, 12)
  const slowEMA = calcEMAArray(closes, 26)
  const macdLine = closes.map((_, i) =>
    isNaN(fastEMA[i]) || isNaN(slowEMA[i]) ? NaN : fastEMA[i] - slowEMA[i]
  )
  const validStart = macdLine.findIndex(v => !isNaN(v))
  if (validStart === -1) return NaN3
  const validMacd = macdLine.slice(validStart)
  const sigEMA = calcEMAArray(validMacd, 9)
  const last = closes.length - 1
  const m = macdLine[last]
  const idx = last - validStart
  const s = sigEMA[idx]
  if (isNaN(m) || isNaN(s)) return { ...NaN3, macd: m }
  return { macd: m, signal: s, hist: m - s }
}

function calcBollingerBands(closes: number[], period = 20, mult = 2.0): { upper: number; mid: number; lower: number } {
  const NaN3 = { upper: NaN, mid: NaN, lower: NaN }
  if (closes.length < period) return NaN3
  const recent = closes.slice(-period)
  const mid = recent.reduce((a, b) => a + b) / period
  const variance = recent.reduce((acc, v) => acc + (v - mid) ** 2, 0) / period
  const std = Math.sqrt(variance)
  return { upper: mid + mult * std, mid, lower: mid - mult * std }
}

function calcStochRSI(rsiArr: number[], period = 14, kSmooth = 3, dSmooth = 3): { k: number; d: number } {
  const NaN2 = { k: NaN, d: NaN }
  const stoch: number[] = []
  for (let i = period - 1; i < rsiArr.length; i++) {
    if (isNaN(rsiArr[i])) { stoch.push(NaN); continue }
    const win = rsiArr.slice(i - period + 1, i + 1).filter(v => !isNaN(v))
    if (win.length < period) { stoch.push(NaN); continue }
    const lo = Math.min(...win), hi = Math.max(...win)
    stoch.push(hi === lo ? 50 : (rsiArr[i] - lo) / (hi - lo) * 100)
  }
  const validStoch = stoch.filter(v => !isNaN(v))
  if (validStoch.length < kSmooth + dSmooth) return NaN2
  const kArr: number[] = []
  for (let i = kSmooth - 1; i < validStoch.length; i++) {
    kArr.push(validStoch.slice(i - kSmooth + 1, i + 1).reduce((a, b) => a + b) / kSmooth)
  }
  if (kArr.length < dSmooth) return NaN2
  return {
    k: kArr[kArr.length - 1],
    d: kArr.slice(-dSmooth).reduce((a, b) => a + b) / dSmooth,
  }
}

function calcVWAP(candles: Candle[], period = 20): number {
  const recent = candles.slice(-period)
  let sumPV = 0, sumV = 0
  for (const c of recent) {
    const tp = (c.high + c.low + c.close) / 3
    sumPV += tp * c.volume
    sumV  += c.volume
  }
  return sumV > 0 ? sumPV / sumV : NaN
}

function calcVolumeRatio(candles: Candle[], period = 20): number {
  if (candles.length < period + 1) return NaN
  const recent = candles.slice(-period - 1, -1)
  const avgVol = recent.reduce((s, c) => s + c.volume, 0) / period
  return avgVol > 0 ? candles[candles.length - 1].volume / avgVol : NaN
}

// ─── Composite scoring ────────────────────────────────────────────────────────

interface IndicatorInputs {
  price: number; rsi: number; macdHist: number; atr: number
  ema20: number; ema50: number; ema200: number
  bbUpper: number; bbLower: number
  stochK: number
  vwap: number; volumeRatio: number
  swingHigh: number; swingLow: number
}

function computeCompositeScore(ind: IndicatorInputs): number {
  const ok = (v: number) => !isNaN(v) && isFinite(v)
  let score = 0

  // RSI (±20)
  if (ok(ind.rsi)) {
    if      (ind.rsi < 20)  score += 20
    else if (ind.rsi < 30)  score += Math.round(10 + (30 - ind.rsi))
    else if (ind.rsi < 40)  score += 5
    else if (ind.rsi > 80)  score -= 20
    else if (ind.rsi > 70)  score -= Math.round(10 + (ind.rsi - 70))
    else if (ind.rsi > 60)  score -= 5
  }

  // MACD histogram normalised by ATR (±15)
  if (ok(ind.macdHist) && ok(ind.atr) && ind.atr > 0) {
    const norm = ind.macdHist / ind.atr
    score += Math.max(-15, Math.min(15, Math.round(norm * 60)))
  }

  // EMA trend (±20 = 8 + 6 + 6)
  if (ok(ind.ema20) && ok(ind.ema50))             score += ind.ema20 > ind.ema50   ? 8 : -8
  if (ok(ind.ema20) && ok(ind.price))             score += ind.price > ind.ema20   ? 6 : -6
  if (ok(ind.ema200) && ok(ind.price))            score += ind.price > ind.ema200  ? 6 : -6

  // Bollinger Bands position (±10)
  if (ok(ind.bbUpper) && ok(ind.bbLower) && ok(ind.price)) {
    const width = ind.bbUpper - ind.bbLower
    if (width > 0) {
      const pos = (ind.price - ind.bbLower) / width
      if      (ind.price < ind.bbLower)  score += 10
      else if (ind.price > ind.bbUpper)  score -= 10
      else if (pos < 0.25)               score += 5
      else if (pos > 0.75)               score -= 5
    }
  }

  // StochRSI (±10)
  if (ok(ind.stochK)) {
    if      (ind.stochK < 15)  score += 10
    else if (ind.stochK < 35)  score += 5
    else if (ind.stochK > 85)  score -= 10
    else if (ind.stochK > 65)  score -= 5
  }

  // VWAP — only when real volume data available (±10)
  if (ok(ind.vwap) && ind.vwap > 0 && ok(ind.price)) {
    const pct = (ind.price - ind.vwap) / ind.vwap * 100
    if      (pct >  0.5)  score += 10
    else if (pct >  0)    score += 5
    else if (pct < -0.5)  score -= 10
    else                  score -= 5
  }

  // Volume amplifier (±5) — amplifies dominant bias on high volume
  if (ok(ind.volumeRatio) && ind.volumeRatio > 1.5) {
    if      (score >  5)  score += 5
    else if (score < -5)  score -= 5
  }

  // Support / Resistance proximity (±10)
  if (ok(ind.atr) && ind.atr > 0 && ok(ind.swingHigh) && ok(ind.swingLow) && ok(ind.price)) {
    const suppDist = Math.abs(ind.price - ind.swingLow)  / ind.atr
    const resDist  = Math.abs(ind.price - ind.swingHigh) / ind.atr
    if (suppDist < 1.0)  score += Math.round((1.0 - suppDist) * 10)
    if (resDist  < 1.0)  score -= Math.round((1.0 - resDist)  * 10)
  }

  return Math.max(-100, Math.min(100, score))
}

function scoreToLabel(score: number): { label: SignalLabel; direction: SignalDirection } {
  if (score >= 60)  return { label: 'ACHAT FORT',  direction: 'BULLISH' }
  if (score >= 25)  return { label: 'ACHAT',       direction: 'BULLISH' }
  if (score <= -60) return { label: 'VENTE FORTE', direction: 'BEARISH' }
  if (score <= -25) return { label: 'VENTE',       direction: 'BEARISH' }
  return { label: 'NEUTRE', direction: 'NEUTRAL' }
}

// ─── Entry / SL / TP calculation ──────────────────────────────────────────────

type LevelFields = Pick<CompositeSignal, 'entry_low' | 'entry_high' | 'stop_loss' | 'tp1' | 'tp2' | 'tp3' | 'risk_reward'>

function calcLevels(price: number, atr: number, direction: SignalDirection): LevelFields {
  const nulls: LevelFields = { entry_low: null, entry_high: null, stop_loss: null, tp1: null, tp2: null, tp3: null, risk_reward: null }
  if (direction === 'NEUTRAL' || !(atr > 0)) return nulls

  const spread    = price * 0.0015
  const entryLow  = price - spread
  const entryHigh = price + spread

  if (direction === 'BULLISH') {
    const sl  = entryLow  - atr * 1.5
    const tp1 = entryHigh + atr * 2.0
    const tp2 = entryHigh + atr * 3.5
    const tp3 = entryHigh + atr * 6.0
    return { entry_low: entryLow, entry_high: entryHigh, stop_loss: sl, tp1, tp2, tp3,
      risk_reward: +((tp1 - price) / (price - sl)).toFixed(2) }
  } else {
    const sl  = entryHigh + atr * 1.5
    const tp1 = entryLow  - atr * 2.0
    const tp2 = entryLow  - atr * 3.5
    const tp3 = entryLow  - atr * 6.0
    return { entry_low: entryLow, entry_high: entryHigh, stop_loss: sl, tp1, tp2, tp3,
      risk_reward: +((price - tp1) / (sl - price)).toFixed(2) }
  }
}

// ─── Main analysis function ───────────────────────────────────────────────────

export function analyzeAsset(candles: Candle[]): CompositeSignal {
  const closes = candles.map(c => c.close)
  const last   = closes.length - 1
  const nn     = (v: number) => (!isNaN(v) && isFinite(v)) ? v : null

  const rsiArr  = calcRSIArray(closes)
  const ema20A  = calcEMAArray(closes, 20)
  const ema50A  = calcEMAArray(closes, 50)
  const ema200A = calcEMAArray(closes, 200)
  const macd    = calcMACDHistogram(closes)
  const bb      = calcBollingerBands(closes)
  const stoch   = calcStochRSI(rsiArr)
  const atr     = calcATR(candles)
  const swings  = calcSwings(candles, 30)
  const vwap    = calcVWAP(candles, 20)
  const volR    = calcVolumeRatio(candles, 20)

  const price  = closes[last]
  const rsi    = rsiArr[last]
  const ema20  = ema20A[last]
  const ema50  = ema50A[last]
  const ema200 = ema200A[last]

  const ind: IndicatorInputs = {
    price, rsi, macdHist: macd.hist, atr,
    ema20, ema50, ema200,
    bbUpper: bb.upper, bbLower: bb.lower,
    stochK: stoch.k,
    vwap, volumeRatio: volR,
    swingHigh: swings.high, swingLow: swings.low,
  }

  const score  = computeCompositeScore(ind)
  const { label, direction } = scoreToLabel(score)
  const levels = calcLevels(price, atr, direction)

  const details: Record<string, unknown> = {}
  if (!isNaN(swings.high)) details.swing_high  = swings.high
  if (!isNaN(swings.low))  details.swing_low   = swings.low
  if (!isNaN(macd.macd))   details.macd_line   = +macd.macd.toFixed(8)
  if (!isNaN(macd.signal)) details.macd_signal = +macd.signal.toFixed(8)

  return {
    signal_label:  label,
    direction,
    score,
    strength:      Math.abs(score),
    price,
    rsi:           nn(rsi),
    macd_hist:     nn(macd.hist),
    ema20:         nn(ema20),
    ema50:         nn(ema50),
    ema200:        nn(ema200),
    bb_upper:      nn(bb.upper),
    bb_lower:      nn(bb.lower),
    bb_mid:        nn(bb.mid),
    stoch_k:       nn(stoch.k),
    stoch_d:       nn(stoch.d),
    atr:           nn(atr),
    vwap:          nn(vwap),
    volume_ratio:  nn(volR) != null ? +volR.toFixed(3) : null,
    ...levels,
    details,
  }
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

const KRAKEN_INTERVALS: Record<string, number> = {
  '15m': 15, '1h': 60, '4h': 240, '1d': 1440,
}

export async function fetchKrakenOHLCV(pair: string, timeframe: string): Promise<Candle[]> {
  const interval = KRAKEN_INTERVALS[timeframe]
  if (!interval) throw new Error(`Unknown timeframe: ${timeframe}`)
  const res = await fetch(
    `https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${interval}`,
    { signal: AbortSignal.timeout(10_000) },
  )
  if (!res.ok) throw new Error(`Kraken HTTP ${res.status} for ${pair}`)
  const data = await res.json()
  if (data.error?.length) throw new Error(`Kraken error: ${data.error[0]}`)
  const key = Object.keys(data.result).find(k => k !== 'last')
  if (!key) throw new Error(`Kraken: no result key for ${pair}`)
  return (data.result[key] as any[]).map(c => ({
    time: Number(c[0]), open: parseFloat(c[1]), high: parseFloat(c[2]),
    low: parseFloat(c[3]), close: parseFloat(c[4]), volume: parseFloat(c[6]),
  }))
}

export async function fetchOHLCV(asset: string, cfg: AssetConfig, timeframe: string): Promise<Candle[]> {
  if (cfg.source === 'kraken' && cfg.krakenPair) {
    return fetchKrakenOHLCV(cfg.krakenPair, timeframe)
  }
  if (cfg.source === 'twelve' && cfg.tdSymbol) {
    return fetchTwelveDataOHLCV(cfg.tdSymbol, timeframe, 220)
  }
  throw new Error(`No data source configured for ${asset}`)
}
