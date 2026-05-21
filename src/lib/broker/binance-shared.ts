// Client-safe — no Node.js imports

export type PriceSource = 'binance' | 'yahoo'

export interface PairConfig {
  displayPair: string
  source: PriceSource
  binanceSymbol: string | null  // for Binance klines / ticker
  yahooSymbol: string | null    // for Yahoo Finance chart API
  category: 'crypto' | 'forex' | 'commodity'
}

export const PAIR_CONFIG: Record<string, PairConfig> = {
  // ── Crypto (Binance)
  'BTC/USDT': { displayPair: 'BTC/USDT', source: 'binance', binanceSymbol: 'BTCUSDT', yahooSymbol: 'BTC-USD',  category: 'crypto'    },
  'ETH/USDT': { displayPair: 'ETH/USDT', source: 'binance', binanceSymbol: 'ETHUSDT', yahooSymbol: 'ETH-USD',  category: 'crypto'    },
  'SOL/USDT': { displayPair: 'SOL/USDT', source: 'binance', binanceSymbol: 'SOLUSDT', yahooSymbol: 'SOL-USD',  category: 'crypto'    },
  'BNB/USDT': { displayPair: 'BNB/USDT', source: 'binance', binanceSymbol: 'BNBUSDT', yahooSymbol: 'BNB-USD',  category: 'crypto'    },
  'XRP/USDT': { displayPair: 'XRP/USDT', source: 'binance', binanceSymbol: 'XRPUSDT', yahooSymbol: 'XRP-USD',  category: 'crypto'    },
  // ── Forex (Yahoo)
  'EUR/USD':  { displayPair: 'EUR/USD',  source: 'yahoo',   binanceSymbol: null,       yahooSymbol: 'EURUSD=X', category: 'forex'     },
  'GBP/USD':  { displayPair: 'GBP/USD',  source: 'yahoo',   binanceSymbol: null,       yahooSymbol: 'GBPUSD=X', category: 'forex'     },
  'USD/JPY':  { displayPair: 'USD/JPY',  source: 'yahoo',   binanceSymbol: null,       yahooSymbol: 'USDJPY=X', category: 'forex'     },
  // ── Commodities (Yahoo)
  'XAU/USD':  { displayPair: 'XAU/USD',  source: 'yahoo',   binanceSymbol: null,       yahooSymbol: 'GC=F',     category: 'commodity' },
}

// All tradeable pairs (for the dropdown)
export const TRADEABLE_PAIRS = Object.keys(PAIR_CONFIG)

// Also accept BTC/USD, ETH/USD etc. from signal engine
const ALIAS: Record<string, string> = {
  'BTC/USD': 'BTC/USDT', 'ETH/USD': 'ETH/USDT', 'SOL/USD': 'SOL/USDT',
  'BNB/USD': 'BNB/USDT', 'XRP/USD': 'XRP/USDT',
}

export function resolvePairConfig(pair: string): PairConfig | null {
  const key = pair.toUpperCase().trim()
  return PAIR_CONFIG[key] ?? PAIR_CONFIG[ALIAS[key] ?? ''] ?? null
}

// Legacy compat — returns Binance symbol or null
export function resolveBinanceSymbol(pair: string): string | null {
  return resolvePairConfig(pair)?.binanceSymbol ?? null
}
