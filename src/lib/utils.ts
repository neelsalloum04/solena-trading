import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'text-solena-success'
  if (confidence >= 60) return 'text-solena-accent'
  return 'text-solena-danger'
}

export function getConfidenceBg(confidence: number): string {
  if (confidence >= 80) return 'bg-solena-success/10 text-solena-success border-solena-success/20'
  if (confidence >= 60) return 'bg-solena-accent/10 text-solena-accent border-solena-accent/20'
  return 'bg-solena-danger/10 text-solena-danger border-solena-danger/20'
}

export function getPnlColor(value: number): string {
  return value >= 0 ? 'text-solena-success' : 'text-solena-danger'
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function generateMockSignals() {
  const assets = [
    { pair: 'EUR/USD', market: 'forex' as const, price: 1.0842 },
    { pair: 'BTC/USDT', market: 'crypto' as const, price: 67450 },
    { pair: 'XAU/USD', market: 'commodities' as const, price: 2654 },
    { pair: 'SPX500', market: 'indices' as const, price: 5876 },
    { pair: 'ETH/USDT', market: 'crypto' as const, price: 3245 },
    { pair: 'GBP/JPY', market: 'forex' as const, price: 198.45 },
    { pair: 'NAS100', market: 'indices' as const, price: 20847 },
    { pair: 'WTI/USD', market: 'commodities' as const, price: 74.23 },
  ]

  return assets.map((asset, i) => {
    const isBuy = Math.random() > 0.4
    const variance = asset.price * 0.005
    const entry = asset.price + (Math.random() - 0.5) * variance
    const sl = isBuy ? entry * 0.985 : entry * 1.015
    const tp1 = isBuy ? entry * 1.01 : entry * 0.99
    const tp2 = isBuy ? entry * 1.02 : entry * 0.98
    const tp3 = isBuy ? entry * 1.035 : entry * 0.965

    return {
      id: `sig_${i}_${Date.now()}`,
      asset: asset.pair.split('/')[0],
      pair: asset.pair,
      type: isBuy ? 'BUY' as const : 'SELL' as const,
      market: asset.market,
      entry_price: Number(entry.toFixed(asset.price > 1000 ? 0 : 4)),
      stop_loss: Number(sl.toFixed(asset.price > 1000 ? 0 : 4)),
      take_profit_1: Number(tp1.toFixed(asset.price > 1000 ? 0 : 4)),
      take_profit_2: Number(tp2.toFixed(asset.price > 1000 ? 0 : 4)),
      take_profit_3: Number(tp3.toFixed(asset.price > 1000 ? 0 : 4)),
      risk_reward: '1:2.5',
      confidence: Math.floor(65 + Math.random() * 30),
      potential_gain: `+${(Math.random() * 3 + 1).toFixed(1)}%`,
      potential_loss: `-${(Math.random() * 1.5 + 0.5).toFixed(1)}%`,
      estimated_duration: ['2-4h', '4-8h', '1-2 days', '2-5 days'][Math.floor(Math.random() * 4)],
      justification: `Strong ${isBuy ? 'bullish' : 'bearish'} momentum detected with confluence across multiple timeframes. Key level breakout confirmed with volume.`,
      status: 'active' as const,
      created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    }
  })
}
