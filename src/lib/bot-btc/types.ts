import type { TimeframeIndicators } from './indicators'

export interface MarketData {
  price: number
  change24h: number
  volume24h: number
  high24h: number
  low24h: number
  fundingRate: number
  openInterest: number
  orderBook: {
    bids: [number, number][]
    asks: [number, number][]
    ratio: number
  }
  indicators: {
    '5m':  TimeframeIndicators
    '15m': TimeframeIndicators
    '1h':  TimeframeIndicators
  }
  updatedAt: string
}

export interface SignalScores {
  technical:   number
  fundamental: number
  liquidity:   number
  momentum:    number
  volatility:  number
  news:        number
}

export interface BtcSignal {
  signal:           'LONG' | 'SHORT' | 'WAIT'
  confidence:       number
  entryPrice:       number
  stopLoss:         number
  tp1:              number
  tp2:              number
  tp3:              number
  riskReward:       number
  probability:      number
  scores:           SignalScores
  reasoning:        string
  validConditions:  string
  invalidConditions: string
  timeframe:        string
  marketBias:       'bullish' | 'bearish' | 'neutral'
  generatedAt:      string
}

export interface NewsSentiment {
  score:     number
  direction: 'bullish' | 'bearish' | 'neutral'
  confidence: number
  summary:   string
  keyEvent:  string
}

export interface NewsArticle {
  title:       string
  url:         string
  source:      string
  publishedAt: string
}

export interface NewsData {
  articles:   NewsArticle[]
  sentiment:  NewsSentiment
  updatedAt:  string
}

export interface BtcPosition {
  id:          string
  side:        'LONG' | 'SHORT'
  entryPrice:  number
  quantity:    number
  usdtSize:    number
  stopLoss:    number
  tp1:         number
  tp2:         number
  tp3:         number
  openedAt:    string
  mode:        'paper' | 'live'
  fromSignal?: boolean
}

export interface BtcClosedTrade {
  id:          string
  side:        'LONG' | 'SHORT'
  entryPrice:  number
  closePrice:  number
  quantity:    number
  usdtSize:    number
  pnl:         number
  pnlPct:      number
  closedAt:    string
  closeReason: 'manual' | 'stop_loss' | 'tp1' | 'tp2' | 'tp3' | 'invalidated'
  mode:        'paper' | 'live'
}

export interface RiskSettings {
  maxRiskPct:       number
  dailyLossLimit:   number
  weeklyLossLimit:  number
  maxPositions:     number
  minConfidence:    number
  stopAfterLosses:  number
}

export const DEFAULT_RISK: RiskSettings = {
  maxRiskPct:      1,
  dailyLossLimit:  100,
  weeklyLossLimit: 300,
  maxPositions:    2,
  minConfidence:   75,
  stopAfterLosses: 3,
}
