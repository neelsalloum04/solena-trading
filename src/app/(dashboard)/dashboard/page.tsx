'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, BarChart2, CheckCircle, Clock, Minus, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Asset      = 'BTC' | 'ETH' | 'GOLD' | 'EURUSD' | 'NASDAQ'
type Decision   = 'ACHETER' | 'VENDRE' | 'ATTENDRE'
type Confidence = 'FAIBLE' | 'MOYEN' | 'ÉLEVÉ'

interface Analysis {
  decision:   Decision
  confidence: Confidence
  points:     string[]
  conclusion: string
  risks:      string
  price:      number | null
  change24h:  number | null
}

interface CardState {
  loading:  boolean
  analysis: Analysis | null
  error:    string | null
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function BtcIcon() {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="btcG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFB347" />
          <stop offset="50%" stopColor="#F7931A" />
          <stop offset="100%" stopColor="#E07000" />
        </linearGradient>
        <filter id="btcGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle cx="32" cy="32" r="31" fill="url(#btcG)" />
      <circle cx="32" cy="32" r="31" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* Bitcoin B shape */}
      <g fill="white">
        <rect x="21" y="13" width="3.5" height="4" rx="1" />
        <rect x="21" y="47" width="3.5" height="4" rx="1" />
        <rect x="21" y="15" width="3.5" height="34" rx="1" />
        <path d="M24.5 16h8.5c3.5 0 6 2 6 5.5S36.5 27 33 27h-8.5V16z" />
        <path d="M24.5 27H34c4 0 7 2.2 7 6.5S38 40 34 40H24.5V27z" />
      </g>
    </svg>
  )
}

function EthIcon() {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="ethG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B9FE8" />
          <stop offset="50%" stopColor="#627EEA" />
          <stop offset="100%" stopColor="#3A5BC7" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill="url(#ethG)" />
      <circle cx="32" cy="32" r="31" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* Ethereum diamond */}
      <g fill="white">
        <polygon points="32,8 44,32 32,39 20,32" opacity="0.9" />
        <polygon points="32,42 44,34 32,56 20,34" opacity="0.7" />
        <polygon points="32,8 20,32 32,39" opacity="0.6" />
      </g>
    </svg>
  )
}

function GoldIcon() {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="goldG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE566" />
          <stop offset="40%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#A8860A" />
        </linearGradient>
        <linearGradient id="goldTop" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFE97A" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
        <linearGradient id="goldSide" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#A8860A" />
          <stop offset="100%" stopColor="#C9A020" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill="url(#goldG)" />
      <circle cx="32" cy="32" r="31" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* Gold bar 3D */}
      <rect x="12" y="28" width="40" height="16" rx="2" fill="url(#goldTop)" />
      <path d="M12 30 L16 22 L48 22 L52 30 Z" fill="#FFE97A" />
      <path d="M52 30 L52 44 L48 44 L48 22 Z" fill="url(#goldSide)" opacity="0.8" />
      {/* XAU text */}
      <text x="32" y="40" textAnchor="middle" fontSize="9" fontWeight="800" fill="rgba(168,134,10,0.8)" fontFamily="Arial, sans-serif" letterSpacing="1">XAU</text>
      {/* Shine */}
      <ellipse cx="24" cy="25" rx="5" ry="2" fill="rgba(255,255,255,0.35)" transform="rotate(-20 24 25)" />
    </svg>
  )
}

function EurUsdIcon() {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="eurG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="usdG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill="url(#eurG)" />
      <circle cx="32" cy="32" r="31" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* EUR circle */}
      <circle cx="24" cy="32" r="14" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      {/* USD circle */}
      <circle cx="40" cy="32" r="14" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      {/* € symbol */}
      <text x="21" y="37" textAnchor="middle" fontSize="15" fontWeight="900" fill="white" fontFamily="Arial, sans-serif">€</text>
      {/* $ symbol */}
      <text x="43" y="37" textAnchor="middle" fontSize="15" fontWeight="900" fill="white" fontFamily="Arial, sans-serif">$</text>
    </svg>
  )
}

function NasdaqIcon() {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="nqG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0C4A6E" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill="url(#nqG)" />
      <circle cx="32" cy="32" r="31" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* Rising chart bars */}
      <g fill="rgba(255,255,255,0.25)" rx="1">
        <rect x="12" y="42" width="6" height="10" rx="1.5" />
        <rect x="21" y="36" width="6" height="16" rx="1.5" />
        <rect x="30" y="28" width="6" height="24" rx="1.5" />
        <rect x="39" y="20" width="6" height="32" rx="1.5" />
      </g>
      {/* Trend line */}
      <polyline
        points="15,41 24,34 33,26 42,18"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrow head */}
      <polygon points="42,18 50,16 44,24" fill="white" />
      {/* NDX label */}
      <text x="32" y="58" textAnchor="middle" fontSize="7" fontWeight="800" fill="rgba(255,255,255,0.6)" fontFamily="Arial, sans-serif" letterSpacing="2">NDX</text>
    </svg>
  )
}

// ─── Assets config ────────────────────────────────────────────────────────────

const ASSETS: {
  id:          Asset
  name:        string
  subtitle:    string
  description: string
  color:       string
  glowColor:   string
  gradient:    string
  icon:        React.ReactNode
}[] = [
  {
    id:          'BTC',
    name:        'Bitcoin',
    subtitle:    'BTC / USD',
    description: 'La cryptomonnaie de référence mondiale. Marché ouvert 24h/24, 7j/7.',
    color:       '#F7931A',
    glowColor:   'rgba(247,147,26,0.35)',
    gradient:    'from-[#F7931A]/8 via-transparent',
    icon:        <BtcIcon />,
  },
  {
    id:          'ETH',
    name:        'Ethereum',
    subtitle:    'ETH / USD',
    description: 'La blockchain leader des contrats intelligents et de la DeFi.',
    color:       '#627EEA',
    glowColor:   'rgba(98,126,234,0.35)',
    gradient:    'from-[#627EEA]/8 via-transparent',
    icon:        <EthIcon />,
  },
  {
    id:          'GOLD',
    name:        'Or',
    subtitle:    'XAU / USD',
    description: 'La valeur refuge par excellence. Actif anti-inflation et anti-crise.',
    color:       '#D4AF37',
    glowColor:   'rgba(212,175,55,0.35)',
    gradient:    'from-[#D4AF37]/8 via-transparent',
    icon:        <GoldIcon />,
  },
  {
    id:          'EURUSD',
    name:        'EUR / USD',
    subtitle:    'Forex',
    description: 'La paire de devises la plus tradée au monde. Forex ouvert 5j/7.',
    color:       '#2563EB',
    glowColor:   'rgba(37,99,235,0.35)',
    gradient:    'from-[#2563EB]/8 via-transparent',
    icon:        <EurUsdIcon />,
  },
  {
    id:          'NASDAQ',
    name:        'NASDAQ 100',
    subtitle:    'Indice US · NDX',
    description: 'Les 100 plus grandes valeurs technologiques américaines.',
    color:       '#0284C7',
    glowColor:   'rgba(2,132,199,0.35)',
    gradient:    'from-[#0284C7]/8 via-transparent',
    icon:        <NasdaqIcon />,
  },
]

// ─── Decision styles ──────────────────────────────────────────────────────────

const DECISION_CONFIG: Record<Decision, {
  label:  string
  color:  string
  bg:     string
  border: string
  icon:   React.ReactNode
}> = {
  ACHETER: {
    label:  'ACHETER',
    color:  'text-[#22c55e]',
    bg:     'bg-[#22c55e]/10',
    border: 'border-[#22c55e]/25',
    icon:   <TrendingUp className="w-5 h-5" />,
  },
  VENDRE: {
    label:  'VENDRE',
    color:  'text-[#ef4444]',
    bg:     'bg-[#ef4444]/10',
    border: 'border-[#ef4444]/25',
    icon:   <TrendingDown className="w-5 h-5" />,
  },
  ATTENDRE: {
    label:  'ATTENDRE',
    color:  'text-[#eab308]',
    bg:     'bg-[#eab308]/10',
    border: 'border-[#eab308]/25',
    icon:   <Minus className="w-5 h-5" />,
  },
}

const CONFIDENCE_CONFIG: Record<Confidence, { label: string; color: string; icon: React.ReactNode }> = {
  'ÉLEVÉ':  { label: 'Confiance élevée',  color: 'text-[#22c55e]', icon: <CheckCircle  className="w-3.5 h-3.5" /> },
  'MOYEN':  { label: 'Confiance moyenne', color: 'text-[#eab308]', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  'FAIBLE': { label: 'Confiance faible',  color: 'text-[#ef4444]', icon: <Clock         className="w-3.5 h-3.5" /> },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(price: number, asset: Asset): string {
  if (asset === 'EURUSD') return price.toFixed(4)
  if (asset === 'NASDAQ') return price.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
  return price.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}

// ─── Asset Card ───────────────────────────────────────────────────────────────

function AssetCard({ asset }: { asset: typeof ASSETS[0] }) {
  const [state, setState] = useState<CardState>({ loading: false, analysis: null, error: null })

  async function analyse() {
    setState({ loading: true, analysis: null, error: null })
    try {
      const r = await fetch('/api/analyse-asset', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ asset: asset.id }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Erreur IA')
      setState({ loading: false, analysis: d, error: null })
    } catch (e) {
      setState({ loading: false, analysis: null, error: String(e) })
    }
  }

  const { loading, analysis, error } = state
  const dec  = analysis ? DECISION_CONFIG[analysis.decision]   : null
  const conf = analysis ? CONFIDENCE_CONFIG[analysis.confidence] : null

  return (
    <div
      className={cn(
        'relative bg-[#0d0d0d] border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col',
        'hover:border-[#2a2a2a]',
      )}
      style={{
        borderColor: analysis ? `${asset.color}22` : '#1a1a1a',
        boxShadow: analysis ? `0 0 40px ${asset.glowColor}` : 'none',
      }}
    >
      {/* Gradient top overlay */}
      <div className={cn('absolute inset-0 bg-gradient-to-b pointer-events-none', asset.gradient)} />

      {/* Icon hero area */}
      <div className="relative flex flex-col items-center pt-7 pb-4 px-5">
        {/* Icon with glow */}
        <div
          className="relative w-[72px] h-[72px] mb-4"
          style={{ filter: `drop-shadow(0 4px 20px ${asset.glowColor})` }}
        >
          {asset.icon}
        </div>

        {/* Name + subtitle */}
        <div className="text-center">
          <h2 className="text-lg font-black text-[#F2EDD7] tracking-tight">{asset.name}</h2>
          <p className="text-xs font-semibold mt-0.5" style={{ color: asset.color }}>{asset.subtitle}</p>
        </div>

        {/* Price chip (when analysis loaded) */}
        {analysis?.price && (
          <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full border"
            style={{ borderColor: `${asset.color}30`, background: `${asset.color}08` }}>
            <span className="text-sm font-black text-[#F2EDD7]">
              {fmtPrice(analysis.price, asset.id)}
              <span className="text-[10px] font-normal text-[#555] ml-1">{asset.id === 'EURUSD' ? '' : '$'}</span>
            </span>
            {analysis.change24h !== null && (
              <span className={cn('text-[11px] font-bold', analysis.change24h >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                {analysis.change24h >= 0 ? '▲' : '▼'} {Math.abs(analysis.change24h).toFixed(2)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="mx-5 border-t border-[#1a1a1a]" />

      {/* Body */}
      <div className="flex-1 px-5 py-4 space-y-3">
        {/* Description (hidden when analysis shown) */}
        {!analysis && !loading && (
          <p className="text-[12px] text-[#555] leading-relaxed text-center">{asset.description}</p>
        )}

        {/* Analysis result */}
        {analysis && dec && conf && (
          <div className="space-y-3">
            {/* Decision block */}
            <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border', dec.bg, dec.border)}>
              <span className={dec.color}>{dec.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-[#555] uppercase tracking-wider font-semibold">Décision IA</p>
                <p className={cn('text-xl font-black leading-none mt-0.5', dec.color)}>{dec.label}</p>
              </div>
              <div className={cn('flex items-center gap-1 text-[10px] font-bold shrink-0', conf.color)}>
                {conf.icon}
                <span className="hidden sm:inline ml-0.5">{analysis.confidence}</span>
              </div>
            </div>

            {/* Analysis points */}
            <div className="space-y-2">
              {analysis.points.map((point, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: asset.color }}
                  />
                  <span className="text-[12px] text-[#888] leading-relaxed">{point}</span>
                </div>
              ))}
            </div>

            {/* Conclusion */}
            {analysis.conclusion && (
              <div
                className="rounded-xl px-4 py-3 border"
                style={{ background: `${asset.color}06`, borderColor: `${asset.color}18` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: `${asset.color}99` }}>
                  Conclusion
                </p>
                <p className="text-[12px] text-[#999] leading-relaxed">{analysis.conclusion}</p>
              </div>
            )}

            {/* Risks */}
            {analysis.risks && (
              <div className="flex items-start gap-2 bg-[#ef4444]/5 border border-[#ef4444]/12 rounded-xl px-3 py-2.5">
                <AlertTriangle className="w-3 h-3 text-[#ef4444]/50 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-[#666] leading-relaxed">{analysis.risks}</p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-[11px] text-[#ef4444] bg-[#ef4444]/8 border border-[#ef4444]/20 rounded-xl px-3 py-2.5">{error}</p>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 pt-1">
        <button
          onClick={analyse}
          disabled={loading}
          className={cn(
            'w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2',
            loading
              ? 'bg-[#141414] text-[#333] cursor-not-allowed'
              : analysis
              ? 'bg-[#141414] text-[#666] border border-[#222] hover:border-[#333] hover:text-[#888]'
              : 'text-white hover:opacity-90 active:scale-[0.98]'
          )}
          style={!loading && !analysis
            ? { background: `linear-gradient(135deg, ${asset.color}, ${asset.color}cc)`, boxShadow: `0 4px 20px ${asset.glowColor}` }
            : {}
          }
        >
          {loading ? (
            <><RefreshCw className="w-4 h-4 animate-spin" />Analyse en cours…</>
          ) : analysis ? (
            <><RefreshCw className="w-4 h-4" />Nouvelle analyse</>
          ) : (
            <><BarChart2 className="w-4 h-4" />Analyser maintenant</>
          )}
        </button>
        {!loading && (
          <p className="text-center text-[10px] text-[#222] mt-2">Contenu éducatif · Pas un conseil en investissement</p>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="min-h-full bg-[#080808]">
      {/* Header */}
      <div className="px-5 md:px-8 pt-7 pb-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest">IA Active · Données temps réel</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#F2EDD7] tracking-tight">
            Analyse de marché <span className="text-[#D4AF37]">IA</span>
          </h1>
          <p className="text-sm text-[#555] mt-1.5">
            Sélectionnez un actif — l&apos;IA analyse le marché en temps réel et vous donne sa recommandation instantanément.
          </p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="px-5 md:px-8 pb-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ASSETS.map(asset => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>

        <div className="max-w-5xl mx-auto mt-6 text-center">
          <p className="text-[11px] text-[#252525]">
            ⚠ Contenu éducatif uniquement — Pas un conseil en investissement — Le trading comporte un risque de perte en capital
          </p>
        </div>
      </div>
    </div>
  )
}
