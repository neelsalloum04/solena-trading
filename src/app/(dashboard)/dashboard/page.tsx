'use client'
import { cn } from '@/lib/utils'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,

  Bot,
  Flame,
  Globe,
  MessageSquare,
  Newspaper,
  Radio,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import { EconomicCalendar } from '@/components/dashboard/EconomicCalendar'
import { LiveMarkets } from '@/components/dashboard/LiveMarkets'
import { MarketNews } from '@/components/dashboard/MarketNews'
import { MarketNotifications } from '@/components/dashboard/MarketNotifications'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Coin {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  price_change_percentage_1h_in_currency: number
  price_change_percentage_24h_in_currency: number
  price_change_percentage_7d_in_currency: number
  total_volume: number
  sparkline_in_7d: { price: number[] }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(n: number) {
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (n >= 1) return '$' + n.toFixed(2)
  return '$' + n.toFixed(4)
}

function fmtCap(n: number) {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'
  return '$' + n.toLocaleString()
}

function fmtPct(n: number | null | undefined) {
  if (n == null) return '—'
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
}

function pctColor(n: number | null | undefined) {
  if (n == null) return 'text-[#666]'
  return n >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const sampled = data.filter((_, i) => i % 3 === 0).map((price, i) => ({ i, price }))
  const color = positive ? '#22c55e' : '#ef4444'
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={sampled} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={`sg-${positive}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#sg-${positive})`}
          dot={false}
          isAnimationActive={false}
        />
        <Tooltip
          content={() => null}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Hero coin card (BTC / ETH) ───────────────────────────────────────────────

function HeroCoinCard({ coin }: { coin: Coin }) {
  const pct24 = coin.price_change_percentage_24h_in_currency
  const positive = pct24 >= 0
  return (
    <div className={cn(
      'relative rounded-2xl p-5 border overflow-hidden',
      positive ? 'bg-[#0d1f14] border-[#22c55e]/20' : 'bg-[#1f0d0d] border-[#ef4444]/20'
    )}>
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `radial-gradient(circle at 80% 50%, ${positive ? '#22c55e' : '#ef4444'} 0%, transparent 70%)` }} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <img src={coin.image} alt={coin.name} className="w-9 h-9 rounded-full" />
            <div>
              <p className="font-bold text-white text-sm">{coin.name}</p>
              <p className="text-[11px] text-[#555] uppercase">{coin.symbol}</p>
            </div>
          </div>
          <span className={cn(
            'flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl border',
            positive ? 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20' : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20'
          )}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {fmtPct(pct24)}
          </span>
        </div>
        <p className="text-2xl font-black text-white font-mono mb-1">{fmtPrice(coin.current_price)}</p>
        <p className="text-[11px] text-[#555] mb-3">Cap. marché · {fmtCap(coin.market_cap)}</p>
        <Sparkline data={coin.sparkline_in_7d?.price ?? []} positive={positive} />
        <p className="text-[10px] text-[#444] mt-1 text-right">7 jours</p>
      </div>
    </div>
  )
}

// ─── Coin row (table) ─────────────────────────────────────────────────────────

function CoinRow({ coin, rank }: { coin: Coin; rank: number }) {
  const pct24 = coin.price_change_percentage_24h_in_currency
  const positive = pct24 >= 0

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#0f0f0f] transition-colors group">
      <span className="text-[11px] text-[#444] w-5 text-right flex-shrink-0">{rank}</span>
      <img src={coin.image} alt={coin.name} className="w-7 h-7 rounded-full flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">{coin.name}</p>
        <p className="text-[10px] text-[#444] uppercase">{coin.symbol}</p>
      </div>
      <div className="text-right flex-shrink-0 w-24 hidden sm:block">
        <p className="text-[10px] text-[#444]">24h</p>
        <p className={cn('text-xs font-bold', pctColor(pct24))}>{fmtPct(pct24)}</p>
      </div>
      <div className="text-right flex-shrink-0 w-20 hidden md:block">
        <p className="text-[10px] text-[#444]">7j</p>
        <p className={cn('text-xs font-bold', pctColor(coin.price_change_percentage_7d_in_currency))}>
          {fmtPct(coin.price_change_percentage_7d_in_currency)}
        </p>
      </div>
      <div className="w-20 flex-shrink-0 hidden lg:block">
        <Sparkline data={coin.sparkline_in_7d?.price ?? []} positive={positive} />
      </div>
      <div className="text-right flex-shrink-0 w-28">
        <p className="text-sm font-mono font-bold text-white">{fmtPrice(coin.current_price)}</p>
        <p className={cn('text-[10px] font-bold sm:hidden', pctColor(pct24))}>{fmtPct(pct24)}</p>
      </div>
    </div>
  )
}

// ─── Feature card ─────────────────────────────────────────────────────────────

interface FeatureCardProps {
  href: string
  icon: React.ReactNode
  title: string
  desc: string
  badge?: string
  accentColor: string
  accentBg: string
}

function FeatureCard({ href, icon, title, desc, badge, accentColor, accentBg }: FeatureCardProps) {
  return (
    <Link href={href}>
      <div className="group relative bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 hover:border-[#2a2a2a] transition-all duration-300 cursor-pointer overflow-hidden">
        <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300', accentBg)} />
        <div className="relative">
          <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center mb-4 border', accentBg, accentColor, 'border-current/20')}>
            {icon}
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-bold text-white text-sm">{title}</h3>
            {badge && (
              <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide', accentBg, accentColor)}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-[#555] leading-relaxed mb-4">{desc}</p>
          <div className={cn('flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all', accentColor)}>
            Accéder <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CoinSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl animate-pulse">
      <div className="w-5 h-3 bg-[#1a1a1a] rounded flex-shrink-0" />
      <div className="w-7 h-7 rounded-full bg-[#1a1a1a] flex-shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="h-3 bg-[#1a1a1a] rounded w-24" />
        <div className="h-2 bg-[#1a1a1a] rounded w-10" />
      </div>
      <div className="w-20 h-4 bg-[#1a1a1a] rounded" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/crypto-prices')
        const data = await res.json()
        setCoins(data.coins ?? [])
      } catch {}
      setLoading(false)
    }
    load()
    const iv = setInterval(load, 60_000)
    return () => clearInterval(iv)
  }, [])

  const btc = coins.find(c => c.id === 'bitcoin')
  const eth = coins.find(c => c.id === 'ethereum')
  const topGainers = [...coins].sort((a, b) => (b.price_change_percentage_24h_in_currency ?? 0) - (a.price_change_percentage_24h_in_currency ?? 0)).slice(0, 3)
  const tableCoins = coins.slice(0, 12)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* ── Outils PrimeX ── */}
      <div>
        <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-3">Outils PrimeX</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/info-trading', icon: <Newspaper className="w-5 h-5" />, label: 'Info Trading', desc: 'Actualités marchés', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10', border: 'border-[#D4AF37]/20' },
            { href: '/signals',     icon: <Radio className="w-5 h-5" />,     label: 'Signaux',      desc: 'Alertes en direct',   color: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10', border: 'border-[#22c55e]/20' },
            { href: '/chat',        icon: <MessageSquare className="w-5 h-5" />, label: 'Assistant IA', desc: 'Chat trading',    color: 'text-[#818cf8]', bg: 'bg-[#818cf8]/10', border: 'border-[#818cf8]/20' },
            { href: '/bot',         icon: <Bot className="w-5 h-5" />,       label: 'Bot Auto',     desc: 'Trading automatisé', color: 'text-[#f97316]', bg: 'bg-[#f97316]/10', border: 'border-[#f97316]/20' },
          ].map((tool) => (
            <Link key={tool.href} href={tool.href}>
              <div className={`group flex flex-col items-center gap-2 p-4 rounded-2xl border ${tool.border} ${tool.bg} hover:brightness-125 transition-all duration-200 cursor-pointer`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tool.bg} ${tool.color}`}>
                  {tool.icon}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-bold ${tool.color}`}>{tool.label}</p>
                  <p className="text-[10px] text-[#555] mt-0.5">{tool.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white">Marchés</h1>
          <p className="text-xs text-[#444] mt-0.5 font-mono">
            {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' · '}
            <span className="text-[#D4AF37]">{time.toLocaleTimeString('fr-FR', { hour12: false })}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#22c55e]/5 border border-[#22c55e]/20 px-2.5 py-1.5 rounded-xl">
            <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-[#22c55e]">LIVE</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-[#D4AF37]/5 border border-[#D4AF37]/20 px-2.5 py-1.5 rounded-xl">
            <Globe className="w-3 h-3 text-[#D4AF37]" />
            <span className="text-[10px] font-bold text-[#D4AF37]">20 marchés</span>
          </div>
          <MarketNotifications />
        </div>
      </div>

      {/* ── BTC + ETH hero cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading || !btc ? (
          <>
            <div className="h-44 bg-[#0d1a14] border border-[#22c55e]/10 rounded-2xl animate-pulse" />
            <div className="h-44 bg-[#0d1214] border border-[#ef4444]/10 rounded-2xl animate-pulse" />
          </>
        ) : (
          <>
            {btc && <HeroCoinCard coin={btc} />}
            {eth && <HeroCoinCard coin={eth} />}
          </>
        )}
      </div>

      {/* ── Top gainers strip ── */}
      {!loading && topGainers.length > 0 && (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-[#f97316]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Top performeurs 24h</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {topGainers.map((coin) => (
              <div key={coin.id} className="flex items-center gap-2.5 bg-[#0f0f0f] rounded-xl p-3 border border-[#1a1a1a]">
                <img src={coin.image} alt={coin.name} className="w-7 h-7 rounded-full flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white uppercase truncate">{coin.symbol}</p>
                  <p className="text-[10px] font-bold text-[#22c55e]">
                    +{(coin.price_change_percentage_24h_in_currency ?? 0).toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Actualités des marchés ── */}
      <MarketNews />

      {/* ── Calendrier économique ── */}
      <EconomicCalendar />

    </div>
  )
}
