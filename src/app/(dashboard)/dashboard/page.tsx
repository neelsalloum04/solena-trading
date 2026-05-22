'use client'
import { cn } from '@/lib/utils'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  MessageSquare,
  Radio,
  ScanSearch,
  TrendingUp,
  TrendingDown,
  Flame,
  Globe,
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

      {/* ── Crypto table ── */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#111]">
          <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Cryptomonnaies</span>
          <span className="text-[10px] text-[#444] ml-auto">Mise à jour · 1 min</span>
        </div>

        {/* Column labels */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-[#0f0f0f]">
          <span className="text-[10px] text-[#333] w-5">#</span>
          <span className="text-[10px] text-[#333] w-7" />
          <span className="text-[10px] text-[#333] flex-1">Actif</span>
          <span className="text-[10px] text-[#333] w-24 text-right hidden sm:block">24h</span>
          <span className="text-[10px] text-[#333] w-20 text-right hidden md:block">7j</span>
          <span className="text-[10px] text-[#333] w-20 hidden lg:block" />
          <span className="text-[10px] text-[#333] w-28 text-right">Prix</span>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="divide-y divide-[#0f0f0f]">
            {Array.from({ length: 8 }).map((_, i) => <CoinSkeleton key={i} />)}
          </div>
        ) : tableCoins.length === 0 ? (
          <div className="text-center py-12 text-[#444] text-sm">
            Données indisponibles — réessayez dans un instant
          </div>
        ) : (
          <div className="divide-y divide-[#080808]">
            {tableCoins.map((coin, i) => (
              <CoinRow key={coin.id} coin={coin} rank={i + 1} />
            ))}
          </div>
        )}
      </div>

      {/* ── Feature cards ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Outils PrimeX</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <FeatureCard
            href="/chat"
            icon={<MessageSquare className="w-5 h-5" />}
            title="Chat IA"
            desc="Analyse graphique et conseils trading en temps réel via Claude AI."
            badge="IA"
            accentColor="text-[#D4AF37]"
            accentBg="bg-[#D4AF37]/10"
          />
          <FeatureCard
            href="/signals"
            icon={<Radio className="w-5 h-5" />}
            title="Signaux Live"
            desc="Opportunités BUY/SELL sur crypto, forex et indices en direct."
            badge="LIVE"
            accentColor="text-[#22c55e]"
            accentBg="bg-[#22c55e]/10"
          />
          <FeatureCard
            href="/analyse"
            icon={<ScanSearch className="w-5 h-5" />}
            title="Analyse IA"
            desc="Envoie un graphique — l'IA détecte patterns, support et résistance."
            badge="NEW"
            accentColor="text-[#818cf8]"
            accentBg="bg-[#818cf8]/10"
          />
          <FeatureCard
            href="/bot"
            icon={<Bot className="w-5 h-5" />}
            title="Trading Bot"
            desc="Automatise ton trading 24h/24 sur Binance, Alpaca ou Bybit."
            accentColor="text-[#f97316]"
            accentBg="bg-[#f97316]/10"
          />
        </div>
      </div>

      {/* ── Market sentiment bar ── */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Sentiment du marché</span>
          </div>
          {!loading && coins.length > 0 && (
            <span className="text-[10px] text-[#444]">
              {coins.filter(c => (c.price_change_percentage_24h_in_currency ?? 0) >= 0).length}/{coins.length} en hausse
            </span>
          )}
        </div>
        {!loading && coins.length > 0 && (() => {
          const positiveCount = coins.filter(c => (c.price_change_percentage_24h_in_currency ?? 0) >= 0).length
          const pct = Math.round((positiveCount / coins.length) * 100)
          const label = pct >= 70 ? 'Très haussier' : pct >= 55 ? 'Haussier' : pct >= 45 ? 'Neutre' : pct >= 30 ? 'Baissier' : 'Très baissier'
          const labelColor = pct >= 55 ? 'text-[#22c55e]' : pct >= 45 ? 'text-[#D4AF37]' : 'text-[#ef4444]'
          return (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#ef4444] font-semibold flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> Baissier
                </span>
                <span className={cn('text-xs font-bold', labelColor)}>{label} · {pct}%</span>
                <span className="text-xs text-[#22c55e] font-semibold flex items-center gap-1">
                  Haussier <TrendingUp className="w-3 h-3" />
                </span>
              </div>
              <div className="h-2 bg-[#111] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(to right, #ef4444, #D4AF37 40%, #22c55e)`,
                  }}
                />
              </div>
            </div>
          )
        })()}
      </div>

      {/* ── Marchés en Direct ── */}
      <LiveMarkets />

      {/* ── Actualités + Calendrier économique ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MarketNews />
        <EconomicCalendar />
      </div>

    </div>
  )
}
