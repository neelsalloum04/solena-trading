// ─── Analyse technique avancée + Scoring 0-100 ───────────────────────────────

import type { MarketData } from '@/lib/bot-btc/types'
import type { TimeframeIndicators } from '@/lib/bot-btc/indicators'

export type SignalDirection = 'LONG' | 'SHORT' | 'WAIT'

export interface ScoreBreakdown {
  rsi:         number   // max 10
  macd:        number   // max 10
  ema_trend:   number   // max 15
  volume:      number   // max 15
  momentum:    number   // max 15
  sr_conf:     number   // max 15
  orderflow:   number   // max 10
  mtf_align:   number   // max 10
  total:       number   // max 100
}

export interface AnalysisResult {
  direction:  SignalDirection
  score:      number
  breakdown:  ScoreBreakdown
  entryPrice: number
  stopLoss:   number
  tp1:        number
  tp2:        number
  tp3:        number
  riskReward: number
  reasoning:  string
}

// ─── Bollinger Bands (simple) ─────────────────────────────────────────────────

function bollingerBands(closes: number[], period = 20, mult = 2) {
  const slice = closes.slice(-period)
  const mean  = slice.reduce((s, v) => s + v, 0) / period
  const std   = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period)
  return { upper: mean + mult * std, lower: mean - mult * std, mid: mean }
}

// ─── Stochastic RSI ──────────────────────────────────────────────────────────

function stochRSI(rsi: number, rsiMin = 30, rsiMax = 70): 'oversold' | 'overbought' | 'neutral' {
  if (rsi < rsiMin) return 'oversold'
  if (rsi > rsiMax) return 'overbought'
  return 'neutral'
}

// ─── Multi-timeframe alignment ────────────────────────────────────────────────

function mtfAlignment(ind: MarketData['indicators'], dir: 'LONG' | 'SHORT'): number {
  const tfs = ['5m', '15m', '1h'] as const
  let aligned = 0
  for (const tf of tfs) {
    const i = ind[tf]
    const bull = i.trend === 'bullish' && i.macd.bullish && i.rsi > 50
    const bear = i.trend === 'bearish' && !i.macd.bullish && i.rsi < 50
    if (dir === 'LONG'  && bull) aligned++
    if (dir === 'SHORT' && bear) aligned++
  }
  return (aligned / tfs.length) * 10   // 0-10
}

// ─── RSI scoring ─────────────────────────────────────────────────────────────

function scoreRSI(rsi: number, dir: 'LONG' | 'SHORT'): number {
  if (dir === 'LONG') {
    if (rsi >= 40 && rsi <= 60) return 10
    if (rsi >= 30 && rsi < 40)  return 8
    if (rsi > 60 && rsi <= 70)  return 5
    return 0
  } else {
    if (rsi >= 40 && rsi <= 60) return 10
    if (rsi > 60 && rsi <= 70)  return 8
    if (rsi >= 30 && rsi < 40)  return 5
    return 0
  }
}

// ─── SR Confluence ────────────────────────────────────────────────────────────

function scoreSRConfluence(
  ind: TimeframeIndicators, price: number, dir: 'LONG' | 'SHORT'
): number {
  const atr = ind.atr || 100
  if (dir === 'LONG') {
    const nearSupport = ind.support.some(s => Math.abs(price - s) / atr < 1.5)
    return nearSupport ? 15 : 5
  } else {
    const nearResistance = ind.resistance.some(r => Math.abs(price - r) / atr < 1.5)
    return nearResistance ? 15 : 5
  }
}

// ─── Calcul SL/TP via ATR ─────────────────────────────────────────────────────

function calcLevels(price: number, atr: number, dir: 'LONG' | 'SHORT') {
  const slDist = atr * 1.5
  const tp1Dist = atr * 1.5
  const tp2Dist = atr * 3.0
  const tp3Dist = atr * 5.0
  if (dir === 'LONG') {
    return {
      stopLoss: price - slDist,
      tp1: price + tp1Dist,
      tp2: price + tp2Dist,
      tp3: price + tp3Dist,
    }
  } else {
    return {
      stopLoss: price + slDist,
      tp1: price - tp1Dist,
      tp2: price - tp2Dist,
      tp3: price - tp3Dist,
    }
  }
}

// ─── Scoring principal ────────────────────────────────────────────────────────

function scoreDirection(market: MarketData, dir: 'LONG' | 'SHORT'): ScoreBreakdown {
  const tf5  = market.indicators['5m']
  const tf15 = market.indicators['15m']
  const tf1h = market.indicators['1h']
  const price = market.price

  // RSI (10 pts) — utilise 15m comme timeframe de référence
  const rsiScore = scoreRSI(tf15.rsi, dir)

  // MACD (10 pts)
  const macdBull = tf15.macd.bullish && tf15.macd.histogram > 0
  const macdBear = !tf15.macd.bullish && tf15.macd.histogram < 0
  const macdScore = (dir === 'LONG' ? macdBull : macdBear) ? 10 : 0

  // EMA Trend (15 pts) — check sur 15m et 1h
  const emaBull15 = price > tf15.ema20 && tf15.ema20 > tf15.ema50
  const emaBull1h = price > tf1h.ema20 && tf1h.ema20 > tf1h.ema50
  const emaBear15 = price < tf15.ema20 && tf15.ema20 < tf15.ema50
  const emaBear1h = price < tf1h.ema20 && tf1h.ema20 < tf1h.ema50
  let emaScore = 0
  if (dir === 'LONG') {
    if (emaBull15 && emaBull1h) emaScore = 15
    else if (emaBull1h) emaScore = 8
    else if (emaBull15) emaScore = 5
  } else {
    if (emaBear15 && emaBear1h) emaScore = 15
    else if (emaBear1h) emaScore = 8
    else if (emaBear15) emaScore = 5
  }

  // Volume (15 pts)
  const vr = tf15.volumeRatio
  let volScore = 0
  if (dir === 'LONG'  && vr > 1.3) volScore = 15
  else if (dir === 'SHORT' && vr < 0.7) volScore = 15
  else if (vr > 1.1 || vr < 0.9) volScore = 8
  else volScore = 3

  // Momentum (15 pts) — RSI momentum score depuis indicators
  const mom = tf15.momentum
  const momScore = Math.round((mom / 100) * 15)

  // Support/Résistance confluence (15 pts)
  const srScore = scoreSRConfluence(tf15, price, dir)

  // Order Flow (10 pts) — funding rate + bid/ask ratio
  let ofScore = 5
  const fr = market.fundingRate
  const ratio = market.orderBook.ratio
  if (dir === 'LONG') {
    if (fr < 0) ofScore += 3        // funding négatif = bon pour LONG
    if (ratio > 1.1) ofScore += 2   // plus de bids que d'asks
  } else {
    if (fr > 0.0005) ofScore += 3   // funding positif = bon pour SHORT
    if (ratio < 0.9) ofScore += 2   // plus d'asks que de bids
  }

  // MTF Alignment (10 pts)
  const mtfScore = Math.round(mtfAlignment(market.indicators, dir))

  const total = rsiScore + macdScore + emaScore + volScore + momScore + srScore + ofScore + mtfScore

  return {
    rsi:       rsiScore,
    macd:      macdScore,
    ema_trend: emaScore,
    volume:    volScore,
    momentum:  momScore,
    sr_conf:   srScore,
    orderflow: ofScore,
    mtf_align: mtfScore,
    total,
  }
}

// ─── Export principal ─────────────────────────────────────────────────────────

export function analyzeMarket(market: MarketData, minScore = 75): AnalysisResult {
  const longScore  = scoreDirection(market, 'LONG')
  const shortScore = scoreDirection(market, 'SHORT')

  let direction: SignalDirection = 'WAIT'
  let breakdown = longScore
  if (longScore.total >= shortScore.total && longScore.total >= minScore) {
    direction = 'LONG'
    breakdown = longScore
  } else if (shortScore.total > longScore.total && shortScore.total >= minScore) {
    direction = 'SHORT'
    breakdown = shortScore
  }

  const price = market.price
  const atr   = market.indicators['15m'].atr || 100
  const levels = direction !== 'WAIT'
    ? calcLevels(price, atr, direction)
    : { stopLoss: price * 0.99, tp1: price * 1.01, tp2: price * 1.02, tp3: price * 1.03 }

  const risk   = Math.abs(price - levels.stopLoss)
  const reward = Math.abs(levels.tp2 - price)
  const rr     = risk > 0 ? reward / risk : 0

  const reasons: string[] = []
  if (direction !== 'WAIT') {
    const b = breakdown
    if (b.ema_trend >= 10) reasons.push('tendance EMA alignée')
    if (b.macd === 10)     reasons.push('MACD confirme')
    if (b.rsi >= 8)        reasons.push('RSI optimal')
    if (b.volume >= 10)    reasons.push('volume fort')
    if (b.sr_conf >= 12)   reasons.push('confluence S/R')
    if (b.mtf_align >= 7)  reasons.push('alignement multi-TF')
  }

  return {
    direction,
    score:      breakdown.total,
    breakdown,
    entryPrice: price,
    ...levels,
    riskReward: rr,
    reasoning:  direction === 'WAIT'
      ? `Score insuffisant (LONG ${longScore.total}/100, SHORT ${shortScore.total}/100). Attente d'un setup plus fort.`
      : `${direction} — Score ${breakdown.total}/100. ${reasons.join(', ')}.`,
  }
}
