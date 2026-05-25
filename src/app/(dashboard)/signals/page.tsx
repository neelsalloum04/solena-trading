'use client'
import { createClient } from '@/lib/supabase/client'
import { LABEL_CONFIG, type SignalLabel, type SignalDirection, type AssetCategory } from '@/lib/signal-detector'
import { RiskBanner } from '@/components/ui/risk-banner'
import { cn } from '@/lib/utils'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  Bell,
  Bot,
  ChevronDown,
  Loader2,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Signal {
  id:           string
  created_at:   string
  asset:        string
  asset_name:   string
  category:     AssetCategory
  timeframe:    string
  signal_label: SignalLabel
  direction:    SignalDirection
  score:        number
  strength:     number
  price:        number | null
  // Indicators
  rsi:          number | null
  macd_hist:    number | null
  ema20:        number | null
  ema50:        number | null
  ema200:       number | null
  bb_upper:     number | null
  bb_lower:     number | null
  bb_mid:       number | null
  stoch_k:      number | null
  stoch_d:      number | null
  atr:          number | null
  vwap:         number | null
  volume_ratio: number | null
  // Levels
  entry_low:    number | null
  entry_high:   number | null
  stop_loss:    number | null
  tp1:          number | null
  tp2:          number | null
  tp3:          number | null
  risk_reward:  number | null
  // AI
  ai_analysis:  string | null
  details:      Record<string, unknown>
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_LABELS: Record<string, string> = {
  crypto: 'Crypto', forex: 'Forex', stocks: 'Actions', indices: 'Indices', metals: 'Métaux',
}

const CATEGORY_FILTERS = [
  { value: 'all',     label: 'Tous'    },
  { value: 'crypto',  label: 'Crypto'  },
  { value: 'forex',   label: 'Forex'   },
  { value: 'stocks',  label: 'Actions' },
  { value: 'indices', label: 'Indices' },
  { value: 'metals',  label: 'Métaux'  },
] as const

const TF_FILTERS = [
  { value: 'all', label: 'Tous TF' },
  { value: '15m', label: '15 min'  },
  { value: '1h',  label: '1h'      },
  { value: '4h',  label: '4h'      },
  { value: '1d',  label: '1j'      },
] as const

const DIR_FILTERS = [
  { value: 'all',     label: 'Tous'     },
  { value: 'BULLISH', label: 'Achat'    },
  { value: 'NEUTRAL', label: 'Neutre'   },
  { value: 'BEARISH', label: 'Vente'    },
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)    return `${diff}s`
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}j`
}

function formatPrice(price: number | null | undefined, decimals?: number): string {
  if (price == null) return '—'
  if (decimals != null) return price.toFixed(decimals)
  if (price > 10000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (price > 100)   return price.toFixed(2)
  if (price > 1)     return price.toFixed(4)
  return price.toFixed(6)
}

function pxDec(price: number | null): number {
  if (!price) return 2
  if (price > 10000) return 0
  if (price > 100)   return 2
  if (price > 1)     return 4
  return 6
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const pct = Math.abs(score)
  const bull = score >= 0
  const color = score >= 60 ? '#22c55e' : score >= 25 ? '#4ade80' : score <= -60 ? '#ef4444' : score <= -25 ? '#f87171' : '#666'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full relative overflow-hidden">
        <div className="absolute inset-y-0 left-1/2 w-px bg-[#2a2a2a]" />
        {bull ? (
          <div className="absolute top-0 bottom-0 left-1/2 rounded-full transition-all"
            style={{ width: `${pct / 2}%`, backgroundColor: color }} />
        ) : (
          <div className="absolute top-0 bottom-0 right-1/2 rounded-full transition-all"
            style={{ width: `${pct / 2}%`, backgroundColor: color }} />
        )}
      </div>
      <span className="text-[10px] font-mono font-bold w-8 text-right" style={{ color }}>
        {score > 0 ? '+' : ''}{score}
      </span>
    </div>
  )
}

// ─── Indicator dot ────────────────────────────────────────────────────────────

function IndDot({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] text-[#3a3a3a] uppercase tracking-wider">{label}</span>
      <span className="text-[10px] font-mono font-semibold" style={{ color: color ?? '#666' }}>{value}</span>
    </div>
  )
}

// ─── Signal card ──────────────────────────────────────────────────────────────

function SignalCard({ signal, isNew }: { signal: Signal; isNew: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const cfg   = LABEL_CONFIG[signal.signal_label]
  const bull  = signal.direction === 'BULLISH'
  const bear  = signal.direction === 'BEARISH'
  const dec   = pxDec(signal.price)
  const px    = (v: number | null) => formatPrice(v, v != null ? dec : undefined)

  // RSI color
  const rsiColor = signal.rsi == null ? '#555'
    : signal.rsi < 30 ? '#22c55e'
    : signal.rsi > 70 ? '#ef4444'
    : '#888'

  // Stoch color
  const stochColor = signal.stoch_k == null ? '#555'
    : signal.stoch_k < 20 ? '#22c55e'
    : signal.stoch_k > 80 ? '#ef4444'
    : '#888'

  // MACD color
  const macdColor = signal.macd_hist == null ? '#555'
    : signal.macd_hist > 0 ? '#4ade80' : '#f87171'

  const hasLevels = signal.entry_low != null

  return (
    <div
      className={cn('relative rounded-xl border overflow-hidden transition-all duration-300', isNew && 'ring-1')}
      style={{
        background:   cfg.bg,
        borderColor:  isNew ? cfg.color + '60' : cfg.border,
        boxShadow:    isNew ? `0 0 0 1px ${cfg.color}25` : undefined,
      }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: cfg.color }} />

      <div className="pl-4 pr-4 pt-3.5 pb-3.5">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: cfg.color + '18', border: `1px solid ${cfg.color}35` }}>
              {bull ? <TrendingUp  className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                : bear ? <TrendingDown className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                : <Minus className="w-3.5 h-3.5 text-[#666]" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-[#F2EDD7] font-mono">{signal.asset}</span>
                {isNew && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded animate-pulse"
                    style={{ color: cfg.color, background: cfg.color + '22' }}>NOUVEAU</span>
                )}
              </div>
              <p className="text-[10px] text-[#444]">{signal.asset_name}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-[11px] font-black px-2.5 py-1 rounded-lg tracking-wider"
              style={{ color: cfg.color, background: cfg.color + '18', border: `1px solid ${cfg.color}35` }}>
              {signal.signal_label}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#444] border border-[#1e1e1e] px-1.5 py-0.5 rounded">{signal.timeframe}</span>
              <span className="text-[10px] text-[#333] border border-[#1a1a1a] px-1.5 py-0.5 rounded">{CAT_LABELS[signal.category] ?? signal.category}</span>
            </div>
          </div>
        </div>

        {/* ── Price + Score bar ───────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-3">
          {signal.price != null && (
            <span className="text-xs font-mono font-bold text-[#F2EDD7] flex-shrink-0">{px(signal.price)}</span>
          )}
          <div className="flex-1">
            <ScoreBar score={signal.score} />
          </div>
        </div>

        {/* ── Indicator dots ──────────────────────────────────────────── */}
        <div className="flex items-start gap-4 flex-wrap mb-3">
          {signal.rsi != null && (
            <IndDot label="RSI" value={signal.rsi.toFixed(1)} color={rsiColor} />
          )}
          {signal.macd_hist != null && (
            <IndDot label="MACD" value={(signal.macd_hist > 0 ? '+' : '') + signal.macd_hist.toFixed(6)} color={macdColor} />
          )}
          {signal.ema20 != null && signal.ema50 != null && (
            <IndDot
              label="EMA 20/50"
              value={signal.ema20 > signal.ema50 ? '↑ Haussier' : '↓ Baissier'}
              color={signal.ema20 > signal.ema50 ? '#4ade80' : '#f87171'}
            />
          )}
          {signal.stoch_k != null && (
            <IndDot label="StochRSI" value={signal.stoch_k.toFixed(1)} color={stochColor} />
          )}
          {signal.bb_lower != null && signal.price != null && (
            <IndDot
              label="BB"
              value={signal.price < signal.bb_lower! ? '< Inf' : signal.price > (signal.bb_upper ?? Infinity) ? '> Sup' : 'Milieu'}
              color={signal.price < signal.bb_lower! ? '#22c55e' : signal.price > (signal.bb_upper ?? Infinity) ? '#ef4444' : '#666'}
            />
          )}
          {signal.volume_ratio != null && (
            <IndDot
              label="Volume"
              value={`×${signal.volume_ratio.toFixed(1)}`}
              color={signal.volume_ratio > 1.5 ? '#D4AF37' : '#444'}
            />
          )}
        </div>

        {/* ── Entry / SL / TP (expandable) ───────────────────────────── */}
        {hasLevels && (
          <div>
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1.5 text-[10px] text-[#555] hover:text-[#888] transition-colors mb-2"
            >
              <ChevronDown className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')} />
              Niveaux de trading
            </button>

            {expanded && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] mb-3">
                <div>
                  <p className="text-[9px] text-[#3a3a3a] uppercase tracking-wider mb-0.5">Entrée</p>
                  <p className="text-[10px] font-mono text-[#888]">
                    {px(signal.entry_low)} – {px(signal.entry_high)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-[#3a3a3a] uppercase tracking-wider mb-0.5">Stop Loss</p>
                  <p className="text-[10px] font-mono text-[#ef4444]">{px(signal.stop_loss)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#3a3a3a] uppercase tracking-wider mb-0.5">TP1 / TP2</p>
                  <p className="text-[10px] font-mono text-[#4ade80]">{px(signal.tp1)} / {px(signal.tp2)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#3a3a3a] uppercase tracking-wider mb-0.5">R/R (TP1)</p>
                  <p className="text-[10px] font-mono text-[#D4AF37]">
                    {signal.risk_reward != null ? `1:${signal.risk_reward}` : '—'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AI analysis ─────────────────────────────────────────────── */}
        {signal.ai_analysis && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#0c0c0c] border border-[#1c1c1c]">
            <Bot className="w-3 h-3 text-[#D4AF37] flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#555] leading-relaxed">{signal.ai_analysis}</p>
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end mt-2.5">
          <span className="text-[10px] text-[#2a2a2a]">il y a {timeAgo(signal.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Filter pill ──────────────────────────────────────────────────────────────

function Pill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap',
        active
          ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]'
          : 'bg-transparent border-[#222] text-[#555] hover:border-[#333] hover:text-[#888]',
      )}
    >
      {label}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignalsPage() {
  const [signals,    setSignals]    = useState<Signal[]>([])
  const [loading,    setLoading]    = useState(true)
  const [newIds,     setNewIds]     = useState<Set<string>>(new Set())
  const [catFilter,  setCatFilter]  = useState<string>('all')
  const [tfFilter,   setTfFilter]   = useState<string>('all')
  const [dirFilter,  setDirFilter]  = useState<string>('all')
  const [unread,     setUnread]     = useState(0)
  const [generating, setGenerating] = useState(false)
  const [genStatus,  setGenStatus]  = useState<string | null>(null)
  const sbRef = useRef(createClient())

  const flashNew = useCallback((id: string) => {
    setNewIds(prev => new Set(prev).add(id))
    setTimeout(() => setNewIds(prev => { const s = new Set(prev); s.delete(id); return s }), 10000)
  }, [])

  const loadSignals = useCallback(() => {
    setLoading(true)
    fetch('/api/signals?limit=200')
      .then(r => r.json())
      .then(d => setSignals(d.signals ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const generateNow = useCallback(async (tf: string, cat: string) => {
    setGenerating(true); setGenStatus(null)
    try {
      const res = await fetch(`/api/signals/generate?tf=${tf}&cat=${cat}`)
      const d   = await res.json()
      if (d.errors?.length) {
        setGenStatus(`✓ ${d.generated ?? 0} généré(s), ${d.skipped ?? 0} ignoré(s) — ${d.errors.length} erreur(s)`)
      } else {
        setGenStatus(`✓ ${d.generated ?? 0} signal(s) généré(s) — ${d.skipped ?? 0} ignoré(s) (doublons)`)
      }
      setTimeout(() => loadSignals(), 600)
    } catch {
      setGenStatus('Erreur lors de la génération')
    } finally {
      setGenerating(false)
      setTimeout(() => setGenStatus(null), 6000)
    }
  }, [loadSignals])

  useEffect(() => { loadSignals() }, [loadSignals])
  useEffect(() => { setUnread(0) }, [])

  // Supabase Realtime — new signals inserted by cron
  useEffect(() => {
    const sb = sbRef.current
    const ch = sb
      .channel('signals-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'signals' }, (payload: any) => {
        const sig = payload.new as Signal
        setSignals(prev => [sig, ...prev].slice(0, 200))
        flashNew(sig.id)
        setUnread(n => n + 1)
      })
      .subscribe()
    return () => { sb.removeChannel(ch) }
  }, [flashNew])

  const filtered = useMemo(() => signals.filter(s => {
    if (catFilter !== 'all' && s.category  !== catFilter) return false
    if (tfFilter  !== 'all' && s.timeframe !== tfFilter)  return false
    if (dirFilter !== 'all' && s.direction !== dirFilter) return false
    return true
  }), [signals, catFilter, tfFilter, dirFilter])

  const buyCount  = filtered.filter(s => s.direction === 'BULLISH').length
  const sellCount = filtered.filter(s => s.direction === 'BEARISH').length

  return (
    <div className="min-h-full bg-[#080808] p-5 md:p-6">
      <div className="max-w-[900px] mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-[#F2EDD7]">Signaux Techniques</h1>
                <span className="flex items-center gap-1 text-[9px] font-black bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 px-1.5 py-0.5 rounded tracking-widest">
                  <span className="w-1 h-1 rounded-full bg-[#22c55e] animate-pulse" />
                  LIVE
                </span>
                {unread > 0 && (
                  <span className="flex items-center gap-1 text-[9px] font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 px-1.5 py-0.5 rounded">
                    <Bell className="w-2.5 h-2.5" />
                    {unread} nouveau{unread > 1 ? 'x' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#555]">Score composite — RSI · MACD · EMA · BB · StochRSI · VWAP</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-[#22c55e]" />
              <span className="text-xs font-bold text-[#22c55e]">{buyCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-[#ef4444]" />
              <span className="text-xs font-bold text-[#ef4444]">{sellCount}</span>
            </div>
          </div>
        </div>

        {/* Manual generation panel */}
        <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-[#F2EDD7] mb-0.5">Générer les signaux maintenant</p>
              <p className="text-[10px] text-[#444]">Score composite — chaque actif produit toujours un signal</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {([
                { tf: '1h',  cat: 'crypto',  label: 'Crypto 1h'  },
                { tf: '1h',  cat: 'forex',   label: 'Forex 1h'   },
                { tf: '1h',  cat: 'metals',  label: 'Métaux 1h'  },
                { tf: '4h',  cat: 'all',     label: 'Tous 4h'    },
                { tf: '1d',  cat: 'all',     label: 'Tous 1j'    },
              ] as const).map(({ tf, cat, label }) => (
                <button key={`${tf}-${cat}`}
                  onClick={() => generateNow(tf, cat)}
                  disabled={generating}
                  className="px-3 py-1.5 text-xs font-semibold border border-[#D4AF37]/30 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/10 disabled:opacity-40 transition-all">
                  {label}
                </button>
              ))}
            </div>
          </div>
          {generating && (
            <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-[#1c1c1c]">
              <Loader2 className="w-3 h-3 text-[#D4AF37] animate-spin" />
              <p className="text-xs text-[#555]">Récupération OHLCV + calcul 7 indicateurs + analyse IA…</p>
            </div>
          )}
          {genStatus && !generating && (
            <p className="text-xs text-[#22c55e] mt-2.5 pt-2.5 border-t border-[#1c1c1c]">{genStatus}</p>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORY_FILTERS.map(f => (
              <Pill key={f.value} label={f.label} active={catFilter === f.value} onClick={() => setCatFilter(f.value)} />
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {TF_FILTERS.map(f => (
              <Pill key={f.value} label={f.label} active={tfFilter === f.value} onClick={() => setTfFilter(f.value)} />
            ))}
            <div className="w-px h-4 bg-[#222] mx-1" />
            {DIR_FILTERS.map(f => (
              <Pill key={f.value} label={f.label} active={dirFilter === f.value} onClick={() => setDirFilter(f.value)} />
            ))}
          </div>
        </div>

        {/* Count + refresh */}
        <div className="flex items-center justify-between text-xs text-[#444]">
          <span>{filtered.length} signal{filtered.length !== 1 ? 's' : ''}</span>
          <button onClick={loadSignals}
            className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors">
            <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
            Actualiser
          </button>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[#1c1c1c] bg-[#0e0e0e] h-[140px] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-12 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#141414] border border-[#1c1c1c] flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-[#222]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#333] mb-1">Aucun signal pour ces filtres</p>
              <p className="text-xs text-[#2a2a2a] max-w-[320px]">
                Clique sur un bouton de génération ci-dessus pour calculer les signaux. Le score composite garantit qu'un signal est produit pour chaque actif.
              </p>
            </div>
            {/* Score legend */}
            <div className="grid grid-cols-5 gap-2 mt-2 w-full max-w-[480px]">
              {(Object.entries(LABEL_CONFIG) as [SignalLabel, typeof LABEL_CONFIG[SignalLabel]][]).map(([label, c]) => (
                <div key={label} className="rounded-lg border px-2 py-2 text-center"
                  style={{ background: c.bg, borderColor: c.border }}>
                  <p className="text-[8px] font-black" style={{ color: c.color }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(sig => (
              <SignalCard key={sig.id} signal={sig} isNew={newIds.has(sig.id)} />
            ))}
          </div>
        )}

        {/* Score legend footer */}
        {!loading && signals.length > 0 && (
          <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-4">
            <p className="text-[10px] text-[#444] uppercase tracking-widest font-semibold mb-3">Score composite (-100 → +100)</p>
            <div className="flex items-center gap-2 flex-wrap">
              {(Object.entries(LABEL_CONFIG) as [SignalLabel, typeof LABEL_CONFIG[SignalLabel]][]).map(([label, c]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-[10px]" style={{ color: c.color }}>{label}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#333] mt-3 pt-3 border-t border-[#1c1c1c]">
              Indicateurs : RSI · MACD · EMA20/50/200 · Bollinger · StochRSI · VWAP · Volume · Support/Résistance
              &nbsp;·&nbsp; Sources : Kraken (crypto) · Twelve Data (forex, actions, indices, métaux)
            </p>
          </div>
        )}

        <RiskBanner />
      </div>
    </div>
  )
}
