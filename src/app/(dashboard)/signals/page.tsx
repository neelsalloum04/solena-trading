'use client'
import { cn } from '@/lib/utils'
import { RiskBanner } from '@/components/ui/risk-banner'
import type { LiveSignal, MarketType } from '@/lib/signal-engine'
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Clock, Minus, RefreshCw, Shield, Target, TrendingDown, TrendingUp, Zap,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const MARKETS: { label: string; value: MarketType | 'all' }[] = [
  { label: 'Tous',        value: 'all'         },
  { label: 'Crypto',      value: 'crypto'      },
  { label: 'Forex',       value: 'forex'       },
  { label: 'Commodités',  value: 'commodities' },
  { label: 'Indices',     value: 'indices'     },
]

const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 min

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)  return `il y a ${diff}s`
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
  return `il y a ${Math.floor(diff / 3600)}h`
}

function tendanceIcon(t: string) {
  const u = t.toUpperCase()
  if (u === 'HAUSSIÈRE' || u === 'BULLISH') return <TrendingUp className="w-3 h-3 text-solena-success" />
  if (u === 'BAISSIÈRE' || u === 'BEARISH') return <TrendingDown className="w-3 h-3 text-solena-danger" />
  return <Minus className="w-3 h-3 text-solena-text-muted" />
}

function confColor(c: number) {
  if (c >= 75) return 'text-solena-success border-solena-success/20 bg-solena-success/5'
  if (c >= 60) return 'text-solena-accent border-solena-accent/20 bg-solena-accent/5'
  return 'text-solena-text-muted border-solena-border bg-solena-card'
}

// ─── Signal card (BUY / SELL) ─────────────────────────────────────────────────

function ActiveSignalCard({ signal, isNew }: { signal: LiveSignal; isNew: boolean }) {
  const isBuy = signal.type === 'BUY'

  return (
    <div className={cn(
      'relative bg-solena-card rounded-2xl overflow-hidden shadow-card transition-all duration-500',
      isNew && 'ring-1 ring-solena-primary/30 animate-slide-up',
    )}>
      <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl', isBuy ? 'bg-solena-success' : 'bg-solena-danger')} />

      <div className="pl-4 md:pl-6 pr-4 md:pr-5 py-4 md:py-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 md:mb-5">
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className={cn('w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0', isBuy ? 'bg-solena-success/10' : 'bg-solena-danger/10')}>
              {isBuy ? <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6 text-solena-success" /> : <ArrowDownRight className="w-5 h-5 md:w-6 md:h-6 text-solena-danger" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-solena-text font-mono text-base md:text-lg tracking-tight">{signal.pair}</span>
                <span className={cn(
                  'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wide',
                  isBuy ? 'bg-solena-success/10 text-solena-success border-solena-success/20'
                        : 'bg-solena-danger/10 text-solena-danger border-solena-danger/20',
                )}>
                  {isBuy ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                  {isBuy ? 'ACHAT' : 'VENTE'}
                </span>
                {isNew && (
                  <span className="text-[10px] font-bold text-solena-primary bg-solena-primary/10 border border-solena-primary/20 px-1.5 py-0.5 rounded-md animate-pulse">
                    NOUVEAU
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-solena-text-muted">
                <Clock className="w-3 h-3" />
                <span>{timeAgo(signal.generatedAt)}</span>
                <span className="text-solena-border">·</span>
                {tendanceIcon(signal.tendance)}
                <span className="capitalize">{signal.tendance}</span>
                <span className="text-solena-border">·</span>
                <span className="uppercase text-[10px]">{signal.timeframe}</span>
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div className={cn('flex flex-col items-center px-3 py-2 md:px-4 md:py-2.5 rounded-xl border text-center flex-shrink-0', confColor(signal.confidence))}>
            <div className="flex items-center gap-1 mb-0.5">
              <Zap className="w-2.5 h-2.5 md:w-3 md:h-3" />
              <span className="text-base md:text-lg font-bold font-mono">{signal.confidence}%</span>
            </div>
            <span className="text-[9px] md:text-[10px] uppercase tracking-wide opacity-70">conf.</span>
          </div>
        </div>

        {/* Current price */}
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-solena-bg border border-solena-border">
          <span className="text-xs text-solena-text-muted">Prix actuel</span>
          <span className="font-mono font-bold text-solena-text ml-auto">{signal.priceFormatted}</span>
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', signal.riskLevel === 'FAIBLE' ? 'bg-solena-success/10 text-solena-success' : signal.riskLevel === 'ÉLEVÉ' ? 'bg-solena-danger/10 text-solena-danger' : 'bg-solena-accent/10 text-solena-accent')}>
            {signal.riskLevel}
          </span>
        </div>

        {/* Price levels */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-solena-bg rounded-xl p-3.5 text-center">
            <p className="text-[10px] font-semibold text-solena-text-muted uppercase tracking-wider mb-1.5">Entrée</p>
            <p className="font-mono font-bold text-solena-text text-sm">{signal.entry ?? '—'}</p>
          </div>
          <div className="bg-solena-danger/5 border border-solena-danger/15 rounded-xl p-3.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1.5">
              <Shield className="w-2.5 h-2.5 text-solena-danger" />
              <p className="text-[10px] font-semibold text-solena-text-muted uppercase tracking-wider">Stop</p>
            </div>
            <p className="font-mono font-bold text-solena-danger text-sm">{signal.stopLoss ?? '—'}</p>
          </div>
          <div className="bg-solena-success/5 border border-solena-success/15 rounded-xl p-3.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1.5">
              <Target className="w-2.5 h-2.5 text-solena-success" />
              <p className="text-[10px] font-semibold text-solena-text-muted uppercase tracking-wider">TP1</p>
            </div>
            <p className="font-mono font-bold text-solena-success text-sm">{signal.tp1 ?? '—'}</p>
          </div>
        </div>

        {/* TP2 + R/R */}
        {(signal.tp2 || signal.rr) && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {signal.tp2 && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl border bg-solena-success/5 border-solena-success/15">
                <span className="text-xs text-solena-text-muted">TP2</span>
                <span className="font-mono font-bold text-solena-success text-sm">{signal.tp2}</span>
              </div>
            )}
            {signal.rr && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl border bg-solena-card border-solena-border">
                <span className="text-xs text-solena-text-muted">R/R</span>
                <span className="font-mono font-bold text-solena-text text-sm">{signal.rr}</span>
              </div>
            )}
          </div>
        )}

        {/* Justification */}
        {signal.justification && (
          <p className="text-xs text-solena-text-muted leading-relaxed border-t border-solena-border pt-4">
            {signal.justification}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Wait row (compact) ───────────────────────────────────────────────────────

function WaitRow({ signal }: { signal: LiveSignal }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 bg-solena-card rounded-xl border border-solena-border">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-solena-border/30 flex-shrink-0">
        <Clock className="w-4 h-4 text-solena-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono font-bold text-solena-text text-sm">{signal.pair}</span>
          <span className="text-[10px] font-semibold uppercase text-solena-text-muted bg-solena-bg border border-solena-border px-1.5 py-0.5 rounded">ATTENTE</span>
        </div>
        <p className="text-xs text-solena-text-muted truncate">{signal.justification || 'Pas de setup valide sur ce marché.'}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <p className="font-mono font-bold text-solena-text text-sm">{signal.priceFormatted}</p>
          <p className="text-[10px] text-solena-text-muted capitalize">{signal.tendance}</p>
        </div>
        <div className={cn('text-xs font-bold px-2.5 py-1.5 rounded-lg border flex flex-col items-center', confColor(signal.confidence))}>
          <span className="font-mono">{signal.confidence}%</span>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-solena-card rounded-2xl p-5 h-52 animate-pulse border border-solena-border">
          <div className="flex gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-solena-border" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-solena-border rounded w-1/3" />
              <div className="h-3 bg-solena-border rounded w-1/4" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[0,1,2].map(j => <div key={j} className="h-16 bg-solena-border rounded-xl" />)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignalsPage() {
  const [signals, setSignals] = useState<LiveSignal[]>([])
  const [activeMarket, setActiveMarket] = useState<MarketType | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const [isCached, setIsCached] = useState(false)
  const [failedMarkets, setFailedMarkets] = useState<string[]>([])
  const [analyzedMarkets, setAnalyzedMarkets] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/signals')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur API')
      const incoming: LiveSignal[] = data.signals ?? []
      setSignals(prev => {
        const prevIds = new Set(prev.map(s => s.id))
        const freshIds = incoming.filter(s => !prevIds.has(s.id)).map(s => s.id)
        if (freshIds.length > 0) {
          setNewIds(new Set(freshIds))
          setTimeout(() => setNewIds(new Set()), 5000)
        }
        return incoming
      })
      setGeneratedAt(data.generatedAt ?? null)
      setIsCached(data.cached ?? false)
      setFailedMarkets(data.failedMarkets ?? [])
      setAnalyzedMarkets(data.analyzedMarkets ?? 0)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const iv = setInterval(load, REFRESH_INTERVAL)
    return () => clearInterval(iv)
  }, [load])

  const filtered = activeMarket === 'all'
    ? signals
    : signals.filter(s => s.market === activeMarket)

  const activeSignals = filtered.filter(s => s.type !== 'WAIT')
  const waitSignals   = filtered.filter(s => s.type === 'WAIT')

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 md:gap-3 mb-1">
            <h1 className="text-xl md:text-2xl font-bold text-solena-text">Signaux en direct</h1>
            <div className="flex items-center gap-1.5 bg-solena-success/5 border border-solena-success/20 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 bg-solena-success rounded-full animate-pulse" />
              <span className="text-xs font-bold text-solena-success">LIVE</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-solena-text-muted">
            {generatedAt
              ? <span>{isCached ? 'Cache · ' : 'Généré '}{timeAgo(generatedAt)} · actualisation toutes les 5min</span>
              : <span>Chargement des données de marché…</span>
            }
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-solena-border text-solena-text-muted hover:text-solena-text hover:border-solena-border-light bg-solena-card transition-all text-xs md:text-sm disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3 h-3 md:w-3.5 md:h-3.5', loading && 'animate-spin')} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>

      {/* Market filter */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {MARKETS.map(m => (
          <button
            key={m.value}
            onClick={() => setActiveMarket(m.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 border',
              activeMarket === m.value
                ? 'bg-solena-primary/10 text-solena-primary border-solena-primary/20'
                : 'text-solena-text-muted border-solena-border hover:text-solena-text hover:border-solena-border-light bg-solena-card',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Failed markets warning */}
      {!loading && failedMarkets.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-solena-accent/5 border border-solena-accent/20">
          <AlertTriangle className="w-4 h-4 text-solena-accent flex-shrink-0 mt-0.5" />
          <div className="text-xs text-solena-text-muted">
            <span className="font-semibold text-solena-accent">
              {failedMarkets.length} marché{failedMarkets.length > 1 ? 's' : ''} indisponible{failedMarkets.length > 1 ? 's' : ''}
            </span>
            {' '}— données insuffisantes ou erreur de connexion :{' '}
            <span className="font-mono text-solena-text">{failedMarkets.join(', ')}</span>.
            {analyzedMarkets > 0 && ` ${analyzedMarkets - failedMarkets.length}/${analyzedMarkets} marchés analysés avec succès.`}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <Skeleton />
      ) : error ? (
        <div className="text-center py-20 space-y-2">
          <p className="text-solena-danger font-medium">{error}</p>
          <button onClick={load} className="text-sm text-solena-primary underline">Réessayer</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-solena-text-muted">
          <p className="text-lg mb-1">Aucun signal pour ce marché.</p>
          <p className="text-sm">Les données sont mises à jour toutes les 5 minutes.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active signals */}
          {activeSignals.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-solena-text-muted px-1">
                Signaux actifs · {activeSignals.length}
              </h2>
              {activeSignals.map(s => (
                <ActiveSignalCard key={s.id} signal={s} isNew={newIds.has(s.id)} />
              ))}
            </div>
          )}

          {/* Wait signals */}
          {waitSignals.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-solena-text-muted px-1">
                En attente de confirmation · {waitSignals.length}
              </h2>
              {waitSignals.map(s => (
                <WaitRow key={s.id} signal={s} />
              ))}
            </div>
          )}

          <RiskBanner />
        </div>
      )}
    </div>
  )
}
