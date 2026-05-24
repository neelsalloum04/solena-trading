'use client'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

const TICKERS = [
  { symbol: 'BTC/USD', price: 67_432, change: 2.34 },
  { symbol: 'ETH/USD', price: 3_241, change: 1.87 },
  { symbol: 'EUR/USD', price: 1.0842, change: -0.12 },
  { symbol: 'GBP/USD', price: 1.2634, change: 0.21 },
  { symbol: 'XAU/USD', price: 2_654, change: 0.43 },
  { symbol: 'SPX', price: 5_876, change: 0.67 },
  { symbol: 'NAS100', price: 20_847, change: 0.91 },
  { symbol: 'WTI', price: 74.23, change: -0.54 },
  { symbol: 'USD/JPY', price: 155.42, change: -0.08 },
  { symbol: 'SOL/USD', price: 187.43, change: 3.21 },
  { symbol: 'GER40', price: 19_234, change: 0.38 },
  { symbol: 'SILVER', price: 30.67, change: 0.76 },
]

export function TickerBar() {
  const [tickers, setTickers] = useState(TICKERS)

  useEffect(() => {
    const interval = setInterval(() => {
      setTickers(prev =>
        prev.map(t => ({
          ...t,
          price: t.price * (1 + (Math.random() - 0.5) * 0.001),
          // Borner change entre -10% et +10% pour éviter le drift infini
          change: Math.max(-10, Math.min(10, t.change + (Math.random() - 0.5) * 0.05)),
        }))
      )
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const items = [...tickers, ...tickers]

  return (
    <div className="bg-solena-bg-secondary border-b border-solena-border overflow-hidden h-9 flex items-center">
      <div className="flex-shrink-0 px-3 flex items-center gap-1.5 border-r border-solena-border h-full">
        <span className="w-1.5 h-1.5 bg-solena-success rounded-full animate-pulse" />
        <span className="text-[10px] font-bold text-solena-success uppercase tracking-widest">Live</span>
      </div>
      <div className="overflow-hidden flex-1">
        <div className="flex animate-ticker whitespace-nowrap">
          {items.map((t, i) => (
            <div key={i} className="inline-flex items-center gap-1.5 px-5 border-r border-solena-border/40">
              <span className="text-[11px] font-mono font-semibold text-solena-text-secondary">{t.symbol}</span>
              <span className="text-[11px] font-mono text-solena-text">
                {t.price > 1000 ? t.price.toLocaleString('en-US', { maximumFractionDigits: 0 }) : t.price.toFixed(4)}
              </span>
              <span className={cn('text-[10px] font-bold', t.change >= 0 ? 'text-solena-success' : 'text-solena-danger')}>
                {t.change >= 0 ? '+' : ''}{t.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
