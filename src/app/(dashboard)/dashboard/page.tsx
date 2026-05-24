'use client'

import { cn } from '@/lib/utils'
import { BarChart2, RefreshCw, TrendingDown, TrendingUp, Minus, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Asset    = 'BTC' | 'ETH' | 'GOLD' | 'EURUSD' | 'NASDAQ'
type Decision = 'ACHETER' | 'VENDRE' | 'ATTENDRE'
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

// ─── Assets config ────────────────────────────────────────────────────────────

const ASSETS: {
  id:          Asset
  name:        string
  subtitle:    string
  description: string
  icon:        string
  color:       string
  bgColor:     string
}[] = [
  {
    id:          'BTC',
    name:        'Bitcoin',
    subtitle:    'BTC / USD',
    description: 'La cryptomonnaie de référence mondiale. Marché ouvert 24h/24, 7j/7.',
    icon:        '₿',
    color:       '#F7931A',
    bgColor:     'bg-[#F7931A]/10 border-[#F7931A]/20',
  },
  {
    id:          'ETH',
    name:        'Ethereum',
    subtitle:    'ETH / USD',
    description: 'La blockchain leader des contrats intelligents et de la DeFi.',
    icon:        'Ξ',
    color:       '#627EEA',
    bgColor:     'bg-[#627EEA]/10 border-[#627EEA]/20',
  },
  {
    id:          'GOLD',
    name:        'Or',
    subtitle:    'XAU / USD',
    description: 'La valeur refuge par excellence. Actif anti-inflation et anti-crise.',
    icon:        '◈',
    color:       '#D4AF37',
    bgColor:     'bg-[#D4AF37]/10 border-[#D4AF37]/20',
  },
  {
    id:          'EURUSD',
    name:        'EUR / USD',
    subtitle:    'Forex',
    description: 'La paire de devises la plus tradée au monde. Forex ouvert 5j/7.',
    icon:        '€',
    color:       '#38bdf8',
    bgColor:     'bg-[#38bdf8]/10 border-[#38bdf8]/20',
  },
  {
    id:          'NASDAQ',
    name:        'NASDAQ 100',
    subtitle:    'Indice US',
    description: 'Les 100 plus grandes valeurs technologiques américaines.',
    icon:        '📈',
    color:       '#a78bfa',
    bgColor:     'bg-[#a78bfa]/10 border-[#a78bfa]/20',
  },
]

// ─── Decision styles ──────────────────────────────────────────────────────────

const DECISION_CONFIG: Record<Decision, {
  label:   string
  color:   string
  bg:      string
  border:  string
  icon:    React.ReactNode
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
  'ÉLEVÉ': { label: 'Confiance élevée',  color: 'text-[#22c55e]', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  'MOYEN': { label: 'Confiance moyenne', color: 'text-[#eab308]', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  'FAIBLE': { label: 'Confiance faible', color: 'text-[#ef4444]', icon: <Clock className="w-3.5 h-3.5" /> },
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
  const dec = analysis ? DECISION_CONFIG[analysis.decision] : null
  const conf = analysis ? CONFIDENCE_CONFIG[analysis.confidence] : null

  return (
    <div className={cn(
      'bg-[#0d0d0d] border rounded-2xl overflow-hidden transition-all duration-300',
      analysis ? 'border-[#1e1e1e]' : 'border-[#1a1a1a] hover:border-[#2a2a2a]'
    )}>
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('w-11 h-11 rounded-xl border flex items-center justify-center text-xl font-bold flex-shrink-0', asset.bgColor)}
            style={{ color: asset.color }}>
            {asset.icon}
          </div>
          {analysis?.price && (
            <div className="text-right">
              <p className="text-sm font-black text-[#F2EDD7]">
                {fmtPrice(analysis.price, asset.id)}
                <span className="text-xs font-normal text-[#555] ml-1">{asset.id === 'EURUSD' ? '' : '$'}</span>
              </p>
              {analysis.change24h !== null && (
                <p className={cn('text-[11px] font-bold', analysis.change24h >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                  {analysis.change24h >= 0 ? '+' : ''}{analysis.change24h.toFixed(2)}%
                </p>
              )}
            </div>
          )}
        </div>
        <h2 className="text-base font-black text-[#F2EDD7]">{asset.name}</h2>
        <p className="text-xs text-[#555] mt-0.5">{asset.subtitle}</p>
        {!analysis && !loading && (
          <p className="text-[11px] text-[#444] mt-2 leading-relaxed">{asset.description}</p>
        )}
      </div>

      {/* Analysis result */}
      {analysis && dec && conf && (
        <div className="px-5 pb-2 space-y-3">
          {/* Decision */}
          <div className={cn('flex items-center gap-2.5 px-4 py-3 rounded-xl border', dec.bg, dec.border)}>
            <span className={dec.color}>{dec.icon}</span>
            <div className="flex-1">
              <p className="text-[10px] text-[#555] uppercase tracking-wider">Décision IA</p>
              <p className={cn('text-lg font-black leading-none mt-0.5', dec.color)}>{dec.label}</p>
            </div>
            <div className={cn('flex items-center gap-1 text-[10px] font-bold', conf.color)}>
              {conf.icon}
              <span className="hidden sm:inline">{conf.label}</span>
            </div>
          </div>

          {/* Points */}
          <div className="space-y-1.5">
            {analysis.points.map((point, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px] text-[#888]">
                <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: asset.color }} />
                <span className="leading-relaxed">{point}</span>
              </div>
            ))}
          </div>

          {/* Conclusion */}
          {analysis.conclusion && (
            <div className="bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3">
              <p className="text-[11px] font-bold text-[#666] uppercase tracking-wider mb-1">Conclusion</p>
              <p className="text-[12px] text-[#aaa] leading-relaxed">{analysis.conclusion}</p>
            </div>
          )}

          {/* Risks */}
          {analysis.risks && (
            <div className="flex items-start gap-2 bg-[#ef4444]/5 border border-[#ef4444]/10 rounded-xl px-3 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]/60 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-[#666] leading-relaxed">{analysis.risks}</p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-5 pb-4">
          <p className="text-xs text-[#ef4444] bg-[#ef4444]/8 border border-[#ef4444]/20 rounded-xl px-3 py-2">{error}</p>
        </div>
      )}

      {/* Action button */}
      <div className="p-5 pt-3">
        <button
          onClick={analyse}
          disabled={loading}
          className={cn(
            'w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2',
            loading
              ? 'bg-[#141414] text-[#333] cursor-not-allowed'
              : analysis
              ? 'bg-[#141414] text-[#666] border border-[#222] hover:border-[#333] hover:text-[#888]'
              : 'text-[#080808] hover:opacity-90 active:scale-[0.98]'
          )}
          style={!loading && !analysis ? { background: asset.color } : {}}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyse en cours…
            </>
          ) : analysis ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Nouvelle analyse
            </>
          ) : (
            <>
              <BarChart2 className="w-4 h-4" />
              Analyser maintenant
            </>
          )}
        </button>
        {!loading && (
          <p className="text-center text-[10px] text-[#2a2a2a] mt-2">
            Analyse IA · Contenu éducatif uniquement
          </p>
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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest">IA Active</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#F2EDD7] tracking-tight">
            Analyse de marché <span className="text-[#D4AF37]">IA</span>
          </h1>
          <p className="text-sm text-[#555] mt-1.5">
            Sélectionnez un actif — l&apos;IA analyse le marché en temps réel et vous donne sa recommandation.
          </p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="px-5 md:px-8 pb-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ASSETS.map(asset => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>

        {/* Disclaimer */}
        <div className="max-w-4xl mx-auto mt-6 text-center">
          <p className="text-[11px] text-[#2a2a2a]">
            ⚠ Contenu éducatif uniquement — Pas un conseil en investissement — Le trading comporte un risque de perte en capital
          </p>
        </div>
      </div>
    </div>
  )
}
