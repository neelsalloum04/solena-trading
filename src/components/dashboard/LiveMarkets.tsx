'use client'

import { cn } from '@/lib/utils'
import { ArrowDownRight, ArrowUpRight, BarChart2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface MarketAsset {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  category: 'indices' | 'forex' | 'crypto' | 'commodities'
}

type Tab = 'indices' | 'forex' | 'crypto' | 'commodities'

const TAB_CONFIG: Record<Tab, { label: string; icon: string }> = {
  indices: { label: 'Indices', icon: '📈' },
  forex: { label: 'Forex', icon: '💱' },
  crypto: { label: 'Crypto', icon: '₿' },
  commodities: { label: 'Matières', icon: '🥇' },
}

function formatPrice(price: number, category: Tab): string {
  if (category === 'forex') return price.toFixed(4)
  if (category === 'crypto' && price < 1) return '$' + price.toFixed(4)
  if (category === 'crypto') return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (price >= 10000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (price >= 100) return price.toFixed(2)
  return price.toFixed(2)
}

function AssetCard({ asset }: { asset: MarketAsset }) {
  const positive = asset.changePercent >= 0
  const category = asset.category as Tab

  return (
    <div className={cn(
      'relative p-4 rounded-xl border transition-all duration-300 hover:border-[#2a2a2a]',
      'bg-[#0a0a0a] border-[#1a1a1a] overflow-hidden'
    )}>
      {/* Fond coloré subtil */}
      <div className={cn(
        'absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300',
        positive ? 'bg-[#22c55e]/3' : 'bg-[#ef4444]/3'
      )} />

      <div className="relative">
        {/* Symbole + nom */}
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white font-mono truncate">{asset.symbol}</p>
            <p className="text-[10px] text-[#444] truncate mt-0.5">{asset.name}</p>
          </div>
          {/* Badge variation */}
          <span className={cn(
            'flex items-center gap-0.5 text-[11px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ml-2',
            positive
              ? 'text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20'
              : 'text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20'
          )}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {positive ? '+' : ''}{asset.changePercent.toFixed(2)}%
          </span>
        </div>

        {/* Prix principal */}
        <p className="text-lg font-black text-white font-mono mb-2">
          {formatPrice(asset.price, category)}
        </p>

        {/* High / Low */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[#444]">
            H: <span className="text-[#22c55e] font-mono">{formatPrice(asset.high, category)}</span>
          </span>
          <span className="text-[#444]">
            B: <span className="text-[#ef4444] font-mono">{formatPrice(asset.low, category)}</span>
          </span>
        </div>

        {/* Barre H/L */}
        {asset.high !== asset.low && (
          <div className="mt-2 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', positive ? 'bg-[#22c55e]' : 'bg-[#ef4444]')}
              style={{
                width: `${Math.min(100, Math.max(0, ((asset.price - asset.low) / (asset.high - asset.low)) * 100))}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function AssetSkeleton() {
  return (
    <div className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="h-3 bg-[#1a1a1a] rounded w-16 mb-1" />
          <div className="h-2 bg-[#1a1a1a] rounded w-24" />
        </div>
        <div className="h-6 bg-[#1a1a1a] rounded w-14" />
      </div>
      <div className="h-6 bg-[#1a1a1a] rounded w-28 mb-2" />
      <div className="flex justify-between">
        <div className="h-2 bg-[#1a1a1a] rounded w-16" />
        <div className="h-2 bg-[#1a1a1a] rounded w-16" />
      </div>
    </div>
  )
}

export function LiveMarkets() {
  const [assets, setAssets] = useState<MarketAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('indices')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(60)

  const fetchMarkets = useCallback(async () => {
    try {
      const res = await fetch('/api/live-markets')
      const data = await res.json()
      setAssets(Array.isArray(data) ? data : [])
      setLastUpdated(new Date())
      setCountdown(60)
    } catch {
      // Silence
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMarkets()
    const iv = setInterval(fetchMarkets, 60_000)
    return () => clearInterval(iv)
  }, [fetchMarkets])

  // Compte à rebours
  useEffect(() => {
    const iv = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 60 : prev - 1))
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  const displayed = assets.filter(a => a.category === tab)

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
      {/* En-tête */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#111]">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Marchés en Direct</span>
          <div className="flex items-center gap-1 bg-[#22c55e]/5 border border-[#22c55e]/20 px-2 py-0.5 rounded-lg">
            <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-[#22c55e]">LIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-[#444] hidden sm:block font-mono">
              Réf. dans {countdown}s
            </span>
          )}
          <button
            onClick={fetchMarkets}
            className="p-1.5 text-[#444] hover:text-[#D4AF37] transition-colors rounded-lg hover:bg-[#141414]"
            title="Actualiser"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-b border-[#0f0f0f] overflow-x-auto no-scrollbar">
        {(Object.keys(TAB_CONFIG) as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-lg transition-colors',
              tab === t
                ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25'
                : 'text-[#555] hover:text-[#F2EDD7] hover:bg-[#141414]'
            )}
          >
            <span>{TAB_CONFIG[t].icon}</span>
            {TAB_CONFIG[t].label}
          </button>
        ))}
      </div>

      {/* Grille d'assets */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <AssetSkeleton key={i} />)
        ) : displayed.length === 0 ? (
          <div className="col-span-full py-8 text-center text-[#444] text-sm">
            Données indisponibles
          </div>
        ) : (
          displayed.map(asset => (
            <AssetCard key={asset.symbol} asset={asset} />
          ))
        )}
      </div>

      {/* Légende */}
      <div className="px-4 pb-3 flex items-center gap-4 text-[10px] text-[#444]">
        <span>H = Plus haut du jour</span>
        <span>B = Plus bas du jour</span>
        <span className="ml-auto">Barre = Position du prix dans la range</span>
      </div>
    </div>
  )
}
