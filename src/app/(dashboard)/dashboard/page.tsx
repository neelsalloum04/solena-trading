'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, BarChart2, CheckCircle, Clock, RefreshCw, Search, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Direction  = 'ACHAT' | 'VENTE'
type Category   = 'crypto' | 'forex' | 'metals' | 'indices' | 'commodities' | 'stocks'

interface Analysis {
  direction:  Direction
  confidence: number
  entry:      string
  sl:         string
  tp1:        string
  tp2:        string
  tp3:        string
  rr:         string
  duration:   string
  points:     string[]
  conclusion: string
  risks:      string
  price:      number | null
  change24h:  number | null
}

interface AssetDef {
  ticker:      string
  name:        string
  category:    Category
  color:       string
  bg:          string
  symbol:      string
}

// ─── Asset definitions (79 actifs) ───────────────────────────────────────────

const ASSETS: AssetDef[] = [
  // Crypto
  { ticker: 'BTC',    name: 'Bitcoin',           category: 'crypto',      color: '#F7931A', bg: '#F7931A18', symbol: '₿'  },
  { ticker: 'ETH',    name: 'Ethereum',           category: 'crypto',      color: '#627EEA', bg: '#627EEA18', symbol: 'Ξ'  },
  { ticker: 'SOL',    name: 'Solana',             category: 'crypto',      color: '#9945FF', bg: '#9945FF18', symbol: '◎'  },
  { ticker: 'XRP',    name: 'XRP',                category: 'crypto',      color: '#346AA9', bg: '#346AA918', symbol: 'X'  },
  { ticker: 'BNB',    name: 'BNB',                category: 'crypto',      color: '#F3BA2F', bg: '#F3BA2F18', symbol: 'B'  },
  { ticker: 'ADA',    name: 'Cardano',            category: 'crypto',      color: '#0033AD', bg: '#0033AD18', symbol: '₳'  },
  { ticker: 'DOGE',   name: 'Dogecoin',           category: 'crypto',      color: '#C2A633', bg: '#C2A63318', symbol: 'Ð'  },
  { ticker: 'AVAX',   name: 'Avalanche',          category: 'crypto',      color: '#E84142', bg: '#E8414218', symbol: 'A'  },
  { ticker: 'LINK',   name: 'Chainlink',          category: 'crypto',      color: '#2A5ADA', bg: '#2A5ADA18', symbol: '⬡'  },
  { ticker: 'SUI',    name: 'Sui',                category: 'crypto',      color: '#6FBCF0', bg: '#6FBCF018', symbol: 'S'  },
  { ticker: 'TON',    name: 'Toncoin',            category: 'crypto',      color: '#0098EA', bg: '#0098EA18', symbol: '💎' },
  { ticker: 'TRX',    name: 'TRON',               category: 'crypto',      color: '#FF0013', bg: '#FF001318', symbol: 'T'  },
  { ticker: 'DOT',    name: 'Polkadot',           category: 'crypto',      color: '#E6007A', bg: '#E6007A18', symbol: '●'  },
  { ticker: 'LTC',    name: 'Litecoin',           category: 'crypto',      color: '#BFBBBB', bg: '#BFBBBB18', symbol: 'Ł'  },
  { ticker: 'SHIB',   name: 'Shiba Inu',          category: 'crypto',      color: '#FFA409', bg: '#FFA40918', symbol: '🐕' },
  { ticker: 'APT',    name: 'Aptos',              category: 'crypto',      color: '#00C2CB', bg: '#00C2CB18', symbol: 'A'  },
  { ticker: 'NEAR',   name: 'Near Protocol',      category: 'crypto',      color: '#00C08B', bg: '#00C08B18', symbol: 'N'  },
  { ticker: 'ARB',    name: 'Arbitrum',           category: 'crypto',      color: '#28A0F0', bg: '#28A0F018', symbol: 'A'  },
  { ticker: 'OP',     name: 'Optimism',           category: 'crypto',      color: '#FF0420', bg: '#FF042018', symbol: 'OP' },
  { ticker: 'RNDR',   name: 'Render',             category: 'crypto',      color: '#FF4400', bg: '#FF440018', symbol: 'R'  },
  { ticker: 'INJ',    name: 'Injective',          category: 'crypto',      color: '#00F2FE', bg: '#00F2FE18', symbol: 'I'  },
  { ticker: 'PEPE',   name: 'Pepe',               category: 'crypto',      color: '#00A859', bg: '#00A85918', symbol: '🐸' },
  { ticker: 'BONK',   name: 'Bonk',               category: 'crypto',      color: '#FF6B00', bg: '#FF6B0018', symbol: 'B'  },
  { ticker: 'HBAR',   name: 'Hedera',             category: 'crypto',      color: '#29A098', bg: '#29A09818', symbol: 'H'  },
  { ticker: 'XLM',    name: 'Stellar',            category: 'crypto',      color: '#7B7B7B', bg: '#7B7B7B18', symbol: '*'  },
  { ticker: 'KAS',    name: 'Kaspa',              category: 'crypto',      color: '#70C7BA', bg: '#70C7BA18', symbol: 'K'  },
  { ticker: 'ICP',    name: 'Internet Computer',  category: 'crypto',      color: '#29ABE2', bg: '#29ABE218', symbol: 'I'  },
  { ticker: 'VET',    name: 'VeChain',            category: 'crypto',      color: '#15BDFF', bg: '#15BDFF18', symbol: 'V'  },
  { ticker: 'ALGO',   name: 'Algorand',           category: 'crypto',      color: '#888888', bg: '#88888818', symbol: 'A'  },
  { ticker: 'FIL',    name: 'Filecoin',           category: 'crypto',      color: '#0090FF', bg: '#0090FF18', symbol: 'F'  },
  { ticker: 'ATOM',   name: 'Cosmos',             category: 'crypto',      color: '#6F7390', bg: '#6F739018', symbol: '⚛'  },
  { ticker: 'UNI',    name: 'Uniswap',            category: 'crypto',      color: '#FF007A', bg: '#FF007A18', symbol: '🦄' },
  { ticker: 'AAVE',   name: 'Aave',               category: 'crypto',      color: '#B6509E', bg: '#B6509E18', symbol: 'A'  },
  { ticker: 'MKR',    name: 'Maker',              category: 'crypto',      color: '#1AAB9B', bg: '#1AAB9B18', symbol: 'M'  },
  { ticker: 'ETC',    name: 'Ethereum Classic',   category: 'crypto',      color: '#328332', bg: '#32833218', symbol: 'Ξ'  },
  { ticker: 'XMR',    name: 'Monero',             category: 'crypto',      color: '#FF6600', bg: '#FF660018', symbol: 'M'  },
  { ticker: 'SEI',    name: 'Sei',                category: 'crypto',      color: '#9B4DCA', bg: '#9B4DCA18', symbol: 'S'  },
  { ticker: 'TIA',    name: 'Celestia',           category: 'crypto',      color: '#7B2FBE', bg: '#7B2FBE18', symbol: '○'  },
  { ticker: 'WLD',    name: 'Worldcoin',          category: 'crypto',      color: '#4A4A4A', bg: '#4A4A4A18', symbol: 'W'  },
  { ticker: 'ONDO',   name: 'Ondo',               category: 'crypto',      color: '#2A6EBB', bg: '#2A6EBB18', symbol: 'O'  },
  { ticker: 'PENDLE', name: 'Pendle',             category: 'crypto',      color: '#0FC4EF', bg: '#0FC4EF18', symbol: 'P'  },
  // Forex
  { ticker: 'EURUSD', name: 'EUR / USD', category: 'forex', color: '#2563EB', bg: '#2563EB18', symbol: '€$' },
  { ticker: 'GBPUSD', name: 'GBP / USD', category: 'forex', color: '#1D4ED8', bg: '#1D4ED818', symbol: '£$' },
  { ticker: 'USDJPY', name: 'USD / JPY', category: 'forex', color: '#3B82F6', bg: '#3B82F618', symbol: '$¥' },
  { ticker: 'USDCHF', name: 'USD / CHF', category: 'forex', color: '#60A5FA', bg: '#60A5FA18', symbol: '$₣' },
  { ticker: 'AUDUSD', name: 'AUD / USD', category: 'forex', color: '#93C5FD', bg: '#93C5FD18', symbol: 'A$' },
  { ticker: 'NZDUSD', name: 'NZD / USD', category: 'forex', color: '#38BDF8', bg: '#38BDF818', symbol: 'N$' },
  { ticker: 'USDCAD', name: 'USD / CAD', category: 'forex', color: '#0EA5E9', bg: '#0EA5E918', symbol: '$C' },
  { ticker: 'EURGBP', name: 'EUR / GBP', category: 'forex', color: '#0284C7', bg: '#0284C718', symbol: '€£' },
  { ticker: 'EURJPY', name: 'EUR / JPY', category: 'forex', color: '#0369A1', bg: '#0369A118', symbol: '€¥' },
  { ticker: 'GBPJPY', name: 'GBP / JPY', category: 'forex', color: '#075985', bg: '#07598518', symbol: '£¥' },
  // Metals
  { ticker: 'GOLD',   name: 'Or (XAU/USD)',       category: 'metals', color: '#D4AF37', bg: '#D4AF3718', symbol: 'Au' },
  { ticker: 'SILVER', name: 'Argent (XAG/USD)',   category: 'metals', color: '#C0C0C0', bg: '#C0C0C018', symbol: 'Ag' },
  { ticker: 'PLAT',   name: 'Platine',            category: 'metals', color: '#9E9E9E', bg: '#9E9E9E18', symbol: 'Pt' },
  { ticker: 'PALL',   name: 'Palladium',          category: 'metals', color: '#8D8D8D', bg: '#8D8D8D18', symbol: 'Pd' },
  // Indices
  { ticker: 'NASDAQ', name: 'NASDAQ 100',  category: 'indices', color: '#0284C7', bg: '#0284C718', symbol: 'NDX' },
  { ticker: 'SPX',    name: 'S&P 500',     category: 'indices', color: '#10B981', bg: '#10B98118', symbol: 'SPX' },
  { ticker: 'DJI',    name: 'Dow Jones',   category: 'indices', color: '#3B82F6', bg: '#3B82F618', symbol: 'DJI' },
  { ticker: 'DAX',    name: 'DAX 40',      category: 'indices', color: '#FBBF24', bg: '#FBBF2418', symbol: 'DAX' },
  { ticker: 'CAC',    name: 'CAC 40',      category: 'indices', color: '#60A5FA', bg: '#60A5FA18', symbol: 'CAC' },
  { ticker: 'FTSE',   name: 'FTSE 100',    category: 'indices', color: '#A78BFA', bg: '#A78BFA18', symbol: 'UKX' },
  { ticker: 'NKY',    name: 'Nikkei 225',  category: 'indices', color: '#F87171', bg: '#F8717118', symbol: 'NKY' },
  { ticker: 'HSI',    name: 'Hang Seng',   category: 'indices', color: '#FB923C', bg: '#FB923C18', symbol: 'HSI' },
  // Commodities
  { ticker: 'BRENT',  name: 'Pétrole Brent',  category: 'commodities', color: '#1C1C1C', bg: '#3a3a3a18', symbol: '🛢'  },
  { ticker: 'WTI',    name: 'WTI Pétrole',     category: 'commodities', color: '#374151', bg: '#37415118', symbol: 'WTI' },
  { ticker: 'NATGAS', name: 'Gaz Naturel',     category: 'commodities', color: '#2563EB', bg: '#2563EB18', symbol: 'GAS' },
  { ticker: 'COPPER', name: 'Cuivre',          category: 'commodities', color: '#B45309', bg: '#B4530918', symbol: 'Cu'  },
  { ticker: 'WHEAT',  name: 'Blé',             category: 'commodities', color: '#D97706', bg: '#D9770618', symbol: '🌾'  },
  { ticker: 'CORN',   name: 'Maïs',            category: 'commodities', color: '#EAB308', bg: '#EAB30818', symbol: '🌽'  },
  { ticker: 'COFFEE', name: 'Café',            category: 'commodities', color: '#92400E', bg: '#92400E18', symbol: '☕'  },
  { ticker: 'COCOA',  name: 'Cacao',           category: 'commodities', color: '#78350F', bg: '#78350F18', symbol: '🍫'  },
  // Stocks
  { ticker: 'AAPL',   name: 'Apple',           category: 'stocks', color: '#E5E7EB', bg: '#E5E7EB18', symbol: '🍎' },
  { ticker: 'MSFT',   name: 'Microsoft',       category: 'stocks', color: '#00A4EF', bg: '#00A4EF18', symbol: '⊞'  },
  { ticker: 'NVDA',   name: 'NVIDIA',          category: 'stocks', color: '#76B900', bg: '#76B90018', symbol: 'N'  },
  { ticker: 'AMZN',   name: 'Amazon',          category: 'stocks', color: '#FF9900', bg: '#FF990018', symbol: '📦' },
  { ticker: 'META',   name: 'Meta Platforms',  category: 'stocks', color: '#0866FF', bg: '#0866FF18', symbol: '∞'  },
  { ticker: 'TSLA',   name: 'Tesla',           category: 'stocks', color: '#CC0000', bg: '#CC000018', symbol: 'T'  },
  { ticker: 'GOOGL',  name: 'Alphabet',        category: 'stocks', color: '#4285F4', bg: '#4285F418', symbol: 'G'  },
  { ticker: 'NFLX',   name: 'Netflix',         category: 'stocks', color: '#E50914', bg: '#E5091418', symbol: 'N'  },
]

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: 'crypto',      label: 'Crypto',     emoji: '₿'  },
  { id: 'forex',       label: 'Forex',      emoji: '💱' },
  { id: 'metals',      label: 'Métaux',     emoji: '◈'  },
  { id: 'indices',     label: 'Indices',    emoji: '📈' },
  { id: 'commodities', label: 'Matières',   emoji: '🛢'  },
  { id: 'stocks',      label: 'Actions',    emoji: '🏢' },
]

// ─── Analysis result display ─────────────────────────────────────────────────

function AnalysisCard({ asset, analysis, onRetry, loading }: {
  asset:    AssetDef
  analysis: Analysis
  onRetry:  () => void
  loading:  boolean
}) {
  const isAchat = analysis.direction === 'ACHAT'
  const dirColor = isAchat ? '#22c55e' : '#ef4444'
  const confColor = analysis.confidence >= 75 ? '#22c55e' : analysis.confidence >= 60 ? '#eab308' : '#ef4444'

  return (
    <div className="mt-3 rounded-2xl border overflow-hidden" style={{ borderColor: `${dirColor}22` }}>
      {/* Direction header */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ background: `${dirColor}0d` }}>
        <div className="flex items-center gap-2.5">
          {isAchat
            ? <TrendingUp className="w-5 h-5" style={{ color: dirColor }} />
            : <TrendingDown className="w-5 h-5" style={{ color: dirColor }} />}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black" style={{ color: dirColor }}>{analysis.direction}</span>
              <span className="text-[11px] text-[#555]">sur {asset.name}</span>
            </div>
            {analysis.duration && (
              <p className="text-[10px] text-[#444] flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> Durée estimée : {analysis.duration}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[#555] uppercase tracking-wider">Confiance</p>
          <p className="text-2xl font-black" style={{ color: confColor }}>{analysis.confidence}%</p>
        </div>
      </div>

      {/* Levels grid */}
      <div className="grid grid-cols-5 divide-x divide-[#1a1a1a] border-t border-[#1a1a1a] text-center">
        {[
          { label: 'Entrée', value: analysis.entry, color: '#F2EDD7' },
          { label: 'Stop',   value: analysis.sl,    color: '#ef4444'  },
          { label: 'TP1',    value: analysis.tp1,   color: '#22c55e'  },
          { label: 'TP2',    value: analysis.tp2,   color: '#22c55e'  },
          { label: 'TP3',    value: analysis.tp3,   color: '#22c55e'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="py-2.5 px-1">
            <p className="text-[9px] font-bold text-[#444] uppercase tracking-wide">{label}</p>
            <p className="text-[11px] font-black mt-0.5 tabular-nums" style={{ color }}>{value || '—'}</p>
          </div>
        ))}
      </div>

      {/* R/R badge */}
      {analysis.rr && (
        <div className="px-4 py-2 border-t border-[#1a1a1a] flex items-center gap-2">
          <span className="text-[10px] text-[#555]">Ratio R/R :</span>
          <span className="text-[11px] font-black text-[#D4AF37]">{analysis.rr}x</span>
          {analysis.price && analysis.change24h !== null && (
            <>
              <span className="ml-auto text-[10px] text-[#555]">Prix actuel :</span>
              <span className="text-[11px] font-bold text-[#888]">{analysis.price.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</span>
              <span className={cn('text-[10px] font-bold', analysis.change24h >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                {analysis.change24h >= 0 ? '▲' : '▼'} {Math.abs(analysis.change24h).toFixed(2)}%
              </span>
            </>
          )}
        </div>
      )}

      {/* Points */}
      <div className="px-4 py-3 border-t border-[#1a1a1a] space-y-2">
        {analysis.points.map((point, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: asset.color }} />
            <span className="text-[12px] text-[#888] leading-relaxed">{point}</span>
          </div>
        ))}
      </div>

      {/* Conclusion + Risks */}
      {analysis.conclusion && (
        <div className="px-4 py-3 border-t border-[#1a1a1a]" style={{ background: `${asset.color}05` }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: `${asset.color}99` }}>Conclusion</p>
          <p className="text-[12px] text-[#999] leading-relaxed">{analysis.conclusion}</p>
        </div>
      )}
      {analysis.risks && (
        <div className="px-4 py-3 border-t border-[#1a1a1a] flex items-start gap-2 bg-[#ef4444]/5">
          <AlertTriangle className="w-3 h-3 text-[#ef4444]/50 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-[#666] leading-relaxed">{analysis.risks}</p>
        </div>
      )}

      {/* Retry */}
      <div className="px-4 py-3 border-t border-[#1a1a1a]">
        <button onClick={onRetry} disabled={loading}
          className="flex items-center gap-1.5 text-[11px] text-[#555] hover:text-[#888] transition-colors">
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Nouvelle analyse
        </button>
      </div>
    </div>
  )
}

// ─── Compact asset card ───────────────────────────────────────────────────────

function AssetCard({ asset }: { asset: AssetDef }) {
  const [loading,  setLoading]  = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  async function analyse() {
    setLoading(true); setError(null)
    try {
      const r = await fetch('/api/analyse-asset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset: asset.ticker }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Erreur IA')
      setAnalysis(d)
    } catch (e) {
      setError(String(e))
    } finally { setLoading(false) }
  }

  return (
    <div
      className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#2a2a2a]"
      style={analysis ? { borderColor: `${asset.color}22`, boxShadow: `0 0 24px ${asset.color}12` } : {}}
    >
      {/* Card header */}
      <div className="p-4 flex items-center gap-3">
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 select-none"
          style={{
            background: `radial-gradient(circle, ${asset.color}30 0%, ${asset.color}10 100%)`,
            border: `1px solid ${asset.color}30`,
            color: asset.color,
            textShadow: `0 0 12px ${asset.color}80`,
          }}
        >
          {asset.symbol}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-[#F2EDD7] truncate">{asset.name}</p>
          <p className="text-[10px] font-semibold" style={{ color: asset.color }}>{asset.ticker}</p>
        </div>

        {/* Direction badge when analysed */}
        {analysis && (
          <div className={cn(
            'px-2 py-0.5 rounded-lg text-[10px] font-black border',
            analysis.direction === 'ACHAT'
              ? 'text-[#22c55e] border-[#22c55e]/25 bg-[#22c55e]/10'
              : 'text-[#ef4444] border-[#ef4444]/25 bg-[#ef4444]/10'
          )}>
            {analysis.direction}
          </div>
        )}
      </div>

      {/* Analysis detail (expanded) */}
      {analysis && (
        <div className="px-4 pb-4">
          <AnalysisCard asset={asset} analysis={analysis} onRetry={analyse} loading={loading} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 pb-4">
          <p className="text-[11px] text-[#ef4444] bg-[#ef4444]/8 border border-[#ef4444]/15 rounded-xl px-3 py-2">{error}</p>
        </div>
      )}

      {/* CTA */}
      {!analysis && (
        <div className="px-4 pb-4">
          <button
            onClick={analyse}
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2"
            style={!loading ? {
              background: `linear-gradient(135deg, ${asset.color}ee, ${asset.color}99)`,
              color: '#fff',
              boxShadow: `0 4px 16px ${asset.color}30`,
            } : { background: '#141414', color: '#444' }}
          >
            {loading
              ? <><RefreshCw className="w-4 h-4 animate-spin" />Analyse en cours…</>
              : <><BarChart2 className="w-4 h-4" />Analyser</>}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('crypto')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q) return ASSETS.filter(a => a.name.toLowerCase().includes(q) || a.ticker.toLowerCase().includes(q))
    return ASSETS.filter(a => a.category === activeCategory)
  }, [activeCategory, search])

  const totalByCategory = useMemo(() => {
    const counts: Partial<Record<Category, number>> = {}
    ASSETS.forEach(a => { counts[a.category] = (counts[a.category] ?? 0) + 1 })
    return counts
  }, [])

  return (
    <div className="min-h-full bg-[#080808]">
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 pb-4 border-b border-[#111]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-3 h-3 text-[#22c55e]" />
                <span className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest">IA Active · {ASSETS.length} actifs</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-[#F2EDD7] tracking-tight">
                Analyse de marché <span className="text-[#D4AF37]">IA</span>
              </h1>
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un actif…"
                className="w-full bg-[#111] border border-[#222] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#F2EDD7] placeholder-[#444] focus:outline-none focus:border-[#D4AF37]/30 transition-colors"
              />
            </div>
          </div>

          {/* Category tabs */}
          {!search && (
            <div className="flex gap-1 mt-4 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                    activeCategory === cat.id
                      ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25'
                      : 'text-[#555] hover:text-[#888] border border-transparent hover:border-[#222]'
                  )}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full',
                    activeCategory === cat.id ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-[#1a1a1a] text-[#444]')}>
                    {totalByCategory[cat.id] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 md:px-8 py-5">
        <div className="max-w-6xl mx-auto">
          {search && (
            <p className="text-xs text-[#555] mb-4">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''} pour « {search} »</p>
          )}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Search className="w-8 h-8 text-[#222]" />
              <p className="text-sm text-[#444]">Aucun actif trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map(asset => <AssetCard key={asset.ticker} asset={asset} />)}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 md:px-8 pb-8 text-center">
        <p className="text-[10px] text-[#222]">
          ⚠ Contenu éducatif uniquement — Pas un conseil en investissement — Le trading comporte un risque de perte en capital
        </p>
      </div>
    </div>
  )
}
