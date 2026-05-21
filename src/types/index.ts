export type UserPlan = 'starter' | 'pro' | 'elite'

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: UserPlan
  plan_expires_at: string | null
  created_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  image_url?: string
  analysis?: TradeAnalysis
  created_at: string
}

export interface TradeAnalysis {
  action: 'BUY' | 'SELL' | 'HOLD' | 'WAIT'
  asset: string
  entry_zone: string
  stop_loss: string
  take_profit_1: string
  take_profit_2?: string
  take_profit_3?: string
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'SIDEWAYS'
  timeframe: string
  confidence: number
  risk_reward: string
  support_levels: string[]
  resistance_levels: string[]
  market_context: string
  risk_management: string
}

export interface TradingSignal {
  id: string
  asset: string
  pair: string
  type: 'BUY' | 'SELL'
  market: 'forex' | 'crypto' | 'indices' | 'stocks' | 'commodities' | 'futures' | 'options'
  entry_price: number
  stop_loss: number
  take_profit_1: number
  take_profit_2: number
  take_profit_3: number
  risk_reward: string
  confidence: number
  potential_gain: string
  potential_loss: string
  estimated_duration: string
  justification: string
  status: 'active' | 'closed_profit' | 'closed_loss' | 'pending'
  created_at: string
  closed_at?: string
  pnl?: number
}

export interface BotConfig {
  id: string
  user_id: string
  broker: 'binance' | 'alpaca' | 'bybit' | 'kraken' | 'mt4' | 'mt5' | 'ib'
  api_key: string
  api_secret: string
  is_active: boolean
  risk_per_trade: number
  max_drawdown: number
  max_positions: number
  markets: string[]
  strategy: 'ai_hybrid' | 'trend_following' | 'mean_reversion' | 'scalping'
  created_at: string
}

export interface BotPerformance {
  id: string
  bot_config_id: string
  date: string
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  pnl: number
  pnl_percent: number
  drawdown: number
  roi: number
}

export interface Trade {
  id: string
  bot_config_id: string
  asset: string
  type: 'BUY' | 'SELL'
  entry_price: number
  exit_price?: number
  quantity: number
  pnl?: number
  pnl_percent?: number
  status: 'open' | 'closed'
  opened_at: string
  closed_at?: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  plan: UserPlan
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_end: string
  created_at: string
}

export interface PricingPlan {
  id: string
  name: string
  price: number
  yearlyPrice: number
  plan: UserPlan
  stripePriceId: string
  stripeYearlyPriceId: string
  features: string[]
  highlighted: boolean
  badge?: string
}

export interface MarketTicker {
  symbol: string
  price: number
  change: number
  changePercent: number
}
