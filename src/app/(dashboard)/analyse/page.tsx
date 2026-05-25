'use client'
import { FreeTrialBanner, FreeTrialUpgradeWall, type FreeQuota } from '@/components/FreeTrialBanner'
import { FinancialDisclaimer } from '@/components/FinancialDisclaimer'
import { cn } from '@/lib/utils'
import { RiskBanner } from '@/components/ui/risk-banner'
import type { LivePrice } from '@/lib/market-data'
import type { EconomicContext, MarketNewsItem } from '@/lib/economic-data'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  ImagePlus,
  Layers,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Scenario {
  probabilite: number
  arguments: string[]
  entree?: string | null
  sl?: string | null
  tp1?: string | null
  tp2?: string | null
  tp3?: string | null
  ratio_rr?: string | null
  declencheur?: string | null
}

interface Analysis {
  marche: string
  timeframe: string
  tendance: string
  confiance: number
  structure: string
  zones: string
  scenario_haussier: Scenario
  scenario_baissier: Scenario
  scenario_neutre: Scenario
  analyse: string
  manque: string | null
}

interface ImageItem {
  src: string
  fileName: string
  fileSize: number
  mediaType: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tendanceColor(tendance: string) {
  const t = tendance?.toUpperCase() ?? ''
  if (t.includes('HAUSS'))  return '#22c55e'
  if (t.includes('BAISS'))  return '#ef4444'
  if (t.includes('RETOUR')) return '#f97316'
  return '#888'
}

function confColor(v: number) {
  return v >= 70 ? '#22c55e' : v >= 50 ? '#D4AF37' : '#ef4444'
}

function sentimentCfg(sentiment: string | null) {
  if (!sentiment) return { color: '#666', dot: '#444' }
  const s = sentiment.toUpperCase()
  if (s.includes('BEARISH') && !s.includes('SOMEWHAT')) return { color: '#ef4444', dot: '#ef4444' }
  if (s.includes('BULLISH') && !s.includes('SOMEWHAT')) return { color: '#22c55e', dot: '#22c55e' }
  if (s.includes('SOMEWHAT') && s.includes('BULL'))     return { color: '#86efac', dot: '#86efac' }
  if (s.includes('SOMEWHAT') && s.includes('BEAR'))     return { color: '#fca5a5', dot: '#fca5a5' }
  return { color: '#888', dot: '#555' }
}

function formatNewsTime(published: string): string {
  if (!published || published.length < 13) return ''
  try {
    const y = published.slice(0, 4), mo = published.slice(4, 6), d = published.slice(6, 8)
    const h = published.slice(9, 11), mi = published.slice(11, 13)
    const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:00Z`)
    const diff = Date.now() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'Il y a < 1h'
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${Math.floor(hours / 24)}j`
  } catch { return '' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DataRow({ label, value, color = '#F2EDD7', tag }: { label: string; value: string; color?: string; tag?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1c1c1c] last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#555] uppercase tracking-wider">{label}</span>
        {tag && <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ color, background: color + '18' }}>{tag}</span>}
      </div>
      <span className="text-sm font-semibold font-mono" style={{ color }}>{value}</span>
    </div>
  )
}

function ConfBar({ value, color }: { value: number; color?: string }) {
  const c = color ?? confColor(value)
  const safe = Math.min(100, Math.max(0, value))
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${safe}%`, backgroundColor: c }} />
      </div>
      <span className="text-xs font-mono font-bold tabular-nums w-8 text-right" style={{ color: c }}>{safe}%</span>
    </div>
  )
}

function LivePriceCard({ data }: { data: LivePrice }) {
  const changeColor = data.isUp ? '#22c55e' : '#ef4444'
  const Icon = data.isUp ? ArrowUpRight : ArrowDownRight
  return (
    <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse inline-block" />
          <span className="text-xs font-bold text-[#F2EDD7] tracking-wide">{data.market}</span>
          <span className="text-[10px] text-[#444] border border-[#1c1c1c] px-1.5 py-0.5 rounded">{data.source}</span>
        </div>
        <span className="text-[10px] text-[#333] uppercase tracking-widest">Live</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xl font-black font-mono text-[#F2EDD7] tracking-tight">
            {data.currencySymbol}{data.priceFormatted}
          </span>
          <span className="text-xs text-[#555] ml-2">{data.currency}</span>
        </div>
        <div className="flex items-center gap-1" style={{ color: changeColor }}>
          <Icon className="w-3.5 h-3.5" />
          <span className="text-xs font-bold font-mono">
            {data.isUp ? '+' : ''}{data.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}

function NewsCard({ news }: { news: MarketNewsItem[] }) {
  if (!news.length) return null
  return (
    <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-[10px] text-[#444] uppercase tracking-widest font-semibold">Actualité marché</p>
        <span className="text-[9px] text-[#333] border border-[#1c1c1c] px-1.5 py-0.5 rounded uppercase tracking-wide">Alpha Vantage</span>
      </div>
      <div className="space-y-3">
        {news.map((item, i) => {
          const sent = sentimentCfg(item.sentiment)
          const timeAgo = formatNewsTime(item.publishedAt)
          return (
            <div key={i} className="pb-3 border-b border-[#1a1a1a] last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-[#555]">{item.source}</span>
                  {timeAgo && <span className="text-[10px] text-[#333]">· {timeAgo}</span>}
                  {item.sentiment && (
                    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                      style={{ color: sent.color, background: sent.color + '15' }}>
                      {item.sentiment.replace('Somewhat-', 'S-')}
                    </span>
                  )}
                </div>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[#333] hover:text-[#D4AF37] transition-colors flex-shrink-0">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-xs text-[#666] leading-relaxed line-clamp-2">{item.title}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ScenarioCardProps {
  type: 'haussier' | 'baissier' | 'neutre'
  scenario: Scenario
}

function ScenarioCard({ type, scenario }: ScenarioCardProps) {
  const cfg = {
    haussier: { label: 'Scénario Haussier', color: '#22c55e', Icon: TrendingUp,   bg: 'rgba(34,197,94,0.06)',  border: 'rgba(34,197,94,0.18)'  },
    baissier: { label: 'Scénario Baissier', color: '#ef4444', Icon: TrendingDown, bg: 'rgba(239,68,68,0.06)',  border: 'rgba(239,68,68,0.18)'  },
    neutre:   { label: 'Scénario Neutre',   color: '#888',    Icon: BarChart2,    bg: 'rgba(80,80,80,0.04)',   border: 'rgba(80,80,80,0.2)'    },
  }[type]

  const prob = Math.min(100, Math.max(0, scenario.probabilite ?? 0))
  const hasLevels = type !== 'neutre' && (scenario.entree || scenario.sl || scenario.tp1)

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: prob > 0 ? cfg.border : 'rgba(40,40,40,0.8)', background: prob > 0 ? cfg.bg : 'transparent' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <cfg.Icon className="w-4 h-4 flex-shrink-0" style={{ color: prob > 0 ? cfg.color : '#333' }} />
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: prob > 0 ? cfg.color : '#444' }}>{cfg.label}</span>
        </div>
        <span className="text-sm font-black font-mono" style={{ color: prob > 0 ? cfg.color : '#333' }}>{prob}%</span>
      </div>
      <div className="px-4 pb-1">
        <ConfBar value={prob} color={prob > 0 ? cfg.color : '#2a2a2a'} />
      </div>

      {prob === 0 ? (
        <p className="px-4 pb-4 pt-2 text-xs text-[#333]">Non pertinent dans le contexte actuel.</p>
      ) : (
        <div className="px-4 pb-4 pt-3 space-y-3">
          {/* Arguments */}
          {scenario.arguments && scenario.arguments.length > 0 && (
            <ul className="space-y-1.5">
              {scenario.arguments.map((arg, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: cfg.color }} />
                  <span className="text-xs text-[#888] leading-relaxed">{arg}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Trading levels */}
          {hasLevels && (
            <div className="border-t pt-3 space-y-1" style={{ borderColor: cfg.color + '20' }}>
              {scenario.entree    && <DataRow label="Zone d'entrée" value={scenario.entree}    color="#F2EDD7" />}
              {scenario.sl        && <DataRow label="Stop Loss"     value={scenario.sl}        color="#ef4444" />}
              {scenario.tp1       && <DataRow label="Objectif 1"    value={scenario.tp1}       color={cfg.color} tag="TP1" />}
              {scenario.tp2       && <DataRow label="Objectif 2"    value={scenario.tp2}       color={cfg.color} tag="TP2" />}
              {scenario.tp3       && <DataRow label="Objectif 3"    value={scenario.tp3}       color={cfg.color} tag="TP3" />}
              {scenario.ratio_rr  && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-[#444] uppercase tracking-wider">Ratio R/R</span>
                  <span className="text-sm font-black font-mono" style={{ color: cfg.color }}>{scenario.ratio_rr}</span>
                </div>
              )}
            </div>
          )}

          {/* Trigger */}
          {scenario.declencheur && (
            <div className="rounded-lg px-3 py-2.5 border" style={{ background: cfg.color + '08', borderColor: cfg.color + '25' }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: cfg.color + 'aa' }}>Déclencheur</p>
              <p className="text-xs leading-relaxed" style={{ color: cfg.color + 'cc' }}>{scenario.declencheur}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AnalyseContent() {
  const [images, setImages]               = useState<ImageItem[]>([])
  const [dragging, setDragging]           = useState(false)
  const [loading, setLoading]             = useState(false)
  const [analysis, setAnalysis]           = useState<Analysis | null>(null)
  const [liveData, setLiveData]           = useState<LivePrice | null>(null)
  const [economicCtx, setEconomicCtx]     = useState<EconomicContext | null>(null)
  const [hasIndicators, setHasIndicators] = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [freeQuota, setFreeQuota]         = useState<FreeQuota | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/quota?type=analyse')
      .then(r => r.json())
      .then((q: FreeQuota) => { if (!q.isPaidPlan) setFreeQuota(q) })
      .catch(() => {})
  }, [])

  const addFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { setError('Format non supporté.'); return }
    if (file.size > 12 * 1024 * 1024)   { setError('Image trop lourde (max 12 Mo).'); return }
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setImages(prev => {
          if (prev.length >= 4) return prev
          return [...prev, { src: e.target!.result as string, fileName: file.name, fileSize: file.size, mediaType: file.type }]
        })
        setAnalysis(null)
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    files.forEach(addFile)
  }, [addFile])

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setAnalysis(null)
  }

  const reset = () => {
    setImages([]); setAnalysis(null); setLiveData(null); setEconomicCtx(null)
    setHasIndicators(false); setError(null); setLoading(false)
  }

  const runAnalysis = async () => {
    if (!images.length || loading) return
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/analyse-graphique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: images.map(img => ({ imageBase64: img.src, mediaType: img.mediaType })) }),
      })
      const data = await res.json()
      if (res.status === 403 && data.error === 'free_quota_exceeded') {
        setFreeQuota({ ...data.quota, remaining: 0, allowed: false })
        return
      }
      if (!res.ok || data.error) { setError(data.error || 'Erreur serveur.'); return }
      if (!data.analysis)        { setError('Réponse vide. Réessaie.'); return }
      setAnalysis(data.analysis)
      setLiveData(data.liveData ?? null)
      setEconomicCtx(data.economicContext ?? null)
      setHasIndicators(data.hasIndicators ?? false)
      if (data.quota && !data.quota.isPaidPlan) setFreeQuota(data.quota)
    } catch {
      setError('Connexion impossible.')
    } finally {
      setLoading(false)
    }
  }

  const tndColor = analysis ? tendanceColor(analysis.tendance) : '#888'
  const conf     = typeof analysis?.confiance === 'number' ? analysis.confiance : null

  if (freeQuota && !freeQuota.allowed) {
    return (
      <div className="min-h-full bg-[#080808] flex flex-col">
        <FreeTrialUpgradeWall type="analyse" />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#080808] p-5 md:p-6">
      <div className="max-w-[1280px] mx-auto space-y-5">

        {freeQuota && <FreeTrialBanner quota={freeQuota} type="analyse" />}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
              <BarChart2 className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#F2EDD7]">Analyse Graphique IA</h1>
                <span className="text-[9px] font-black bg-[#D4AF37] text-[#080808] px-1.5 py-0.5 rounded tracking-widest">
                  {freeQuota ? 'ESSAI GRATUIT' : 'PRO'}
                </span>
              </div>
              <p className="text-xs text-[#555]">
                Prix live · Actualités ·{' '}
                {hasIndicators
                  ? <span className="text-[#22c55e] font-semibold">Indicateurs calculés ✓</span>
                  : <span>Analyse multi-scénarios</span>
                }
              </p>
            </div>
          </div>
          {images.length > 0 && (
            <button onClick={reset} className="flex items-center gap-1.5 text-xs text-[#555] hover:text-[#ef4444] border border-[#222] hover:border-[#ef4444]/30 px-3 py-1.5 rounded-lg transition-colors">
              <RefreshCw className="w-3 h-3" /> Nouveau
            </button>
          )}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-5">

          {/* LEFT */}
          <div className="flex flex-col gap-4">

            {images.length === 0 ? (
              /* ── Drop zone (empty state) ── */
              <div className="space-y-4">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all duration-150 min-h-[260px] select-none',
                    dragging ? 'border-[#D4AF37] bg-[#D4AF37]/5 scale-[1.01]' : 'border-[#222] bg-[#0e0e0e] hover:border-[#D4AF37]/40 hover:bg-[#141414]'
                  )}
                >
                  <div className="flex flex-col items-center gap-4 pointer-events-none px-6 text-center">
                    <div className={cn('w-14 h-14 rounded-2xl border flex items-center justify-center', dragging ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40' : 'bg-[#141414] border-[#222]')}>
                      <ImagePlus className={cn('w-6 h-6', dragging ? 'text-[#D4AF37]' : 'text-[#444]')} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#F2EDD7] mb-1">{dragging ? 'Relâche pour analyser' : "Télécharge tes graphiques"}</p>
                      <p className="text-xs text-[#555] mb-2">Glisse ici ou clique pour sélectionner · jusqu'à 4 graphiques</p>
                      <p className="text-[11px] text-[#333]">PNG · JPG · WEBP · max 12 Mo par image</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-[10px] text-[#444] uppercase tracking-widest">Multi-timeframes supporté</p>
                      <div className="flex items-center gap-2 flex-wrap justify-center">
                        {['TradingView', 'MT4', 'MT5', 'Binance', 'Bybit', 'cTrader'].map(s => (
                          <span key={s} className="text-[10px] text-[#555] border border-[#1c1c1c] bg-[#0a0a0a] px-2.5 py-1 rounded-lg">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => { Array.from(e.target.files || []).forEach(addFile); e.target.value = '' }} />
                </div>

                {/* Ce que l'IA analyse */}
                <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-[#818cf8]/10 border border-[#818cf8]/20 flex items-center justify-center">
                      <Layers className="w-3.5 h-3.5 text-[#818cf8]" />
                    </div>
                    <p className="text-sm font-bold text-[#F2EDD7]">Analyse multi-scénarios</p>
                  </div>
                  <p className="text-xs text-[#555] mb-4 leading-relaxed">
                    {"L'IA identifie les niveaux structurants et présente objectivement tous les scénarios possibles — sans biais d'achat ou de vente."}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'Supports et résistances clés',
                      'Structure BOS / CHoCH / range',
                      'Scénario haussier + probabilité',
                      'Scénario baissier + probabilité',
                      'Conditions de déclenchement',
                      'Prix live · Indicateurs calculés',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5 py-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#818cf8] flex-shrink-0" />
                        <span className="text-xs text-[#888]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Images thumbnails grid ── */
              <div className="space-y-3">
                <div className={cn('grid gap-3', images.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                  {images.map((img, index) => (
                    <div key={index} className="relative rounded-xl overflow-hidden border border-[#222] bg-[#0a0a0a] group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.src} alt={`Graphique ${index + 1}`}
                        className={cn('w-full object-contain block', images.length === 1 ? 'max-h-[480px]' : 'max-h-[220px]')} />
                      <button onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-[#080808]/90 border border-[#333] flex items-center justify-center text-[#777] hover:text-[#ef4444] transition-colors opacity-0 group-hover:opacity-100">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#080808]/90 to-transparent px-3 py-2 pointer-events-none">
                        <p className="text-[10px] text-[#555] truncate">
                          {images.length > 1 ? `TF ${index + 1} · ` : ''}{img.fileName} · {(img.fileSize / 1024).toFixed(0)} Ko
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Add more button */}
                  {images.length < 4 && (
                    <button onClick={() => inputRef.current?.click()}
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#222] bg-[#0e0e0e] hover:border-[#D4AF37]/40 hover:bg-[#141414] transition-all min-h-[120px] gap-2 text-[#444] hover:text-[#D4AF37]">
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-[10px] font-semibold uppercase tracking-wide">Ajouter ({images.length}/4)</span>
                    </button>
                  )}
                </div>
                <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => { Array.from(e.target.files || []).forEach(addFile); e.target.value = '' }} />

                {images.length > 1 && (
                  <div className="flex items-center gap-2 bg-[#818cf8]/8 border border-[#818cf8]/20 rounded-lg px-3 py-2">
                    <Layers className="w-3.5 h-3.5 text-[#818cf8] flex-shrink-0" />
                    <p className="text-xs text-[#818cf8]/80">{images.length} graphiques · analyse multi-timeframes croisée</p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 bg-[#ef4444]/8 border border-[#ef4444]/25 rounded-xl p-4">
                <AlertTriangle className="w-4 h-4 text-[#ef4444] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#ef4444]">{error}</p>
              </div>
            )}

            {images.length > 0 && (
              <button onClick={runAnalysis} disabled={loading}
                className={cn('w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all',
                  loading ? 'bg-[#D4AF37]/15 text-[#D4AF37] cursor-wait border border-[#D4AF37]/20' : 'bg-[#D4AF37] text-[#080808] hover:bg-[#E8C240] active:scale-[0.99]'
                )}>
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Analyse en cours…</span></>
                ) : (
                  <><Zap className="w-4 h-4" /><span>{analysis ? "Relancer l'analyse" : `Analyser ${images.length > 1 ? `ces ${images.length} graphiques` : 'ce graphique'}`}</span><ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            )}

            {loading && (
              <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-5 space-y-3">
                {[
                  'Identification du marché et du/des timeframe(s)…',
                  'Récupération du prix live · actualités · données OHLCV…',
                  'Calcul des indicateurs techniques (EMA, RSI, ATR, swings)…',
                  'Analyse multi-scénarios : haussier · baissier · neutre…',
                  'Attribution des probabilités et conditions de déclenchement…',
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-3 h-3 text-[#D4AF37] animate-spin" />
                    </div>
                    <span className="text-xs text-[#555]">{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — Results */}
          <div className="space-y-3">

            {!analysis && !loading && (
              <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[320px] gap-5">
                <div className="w-12 h-12 rounded-xl bg-[#141414] border border-[#1c1c1c] flex items-center justify-center">
                  <BarChart2 className="w-5 h-5 text-[#2a2a2a]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#3a3a3a] mb-1">En attente d'un graphique</p>
                  <p className="text-xs text-[#2a2a2a]">Prix live · Indicateurs · Scénarios multi-TF</p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 bg-[#111] rounded-lg" />)}
                </div>
              </div>
            )}

            {analysis && conf !== null && (
              <div className="space-y-3">

                {/* ① Live price */}
                {liveData ? (
                  <LivePriceCard data={liveData} />
                ) : analysis.marche && analysis.marche !== 'Inconnu' && (
                  <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl px-4 py-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#333] inline-block" />
                    <span className="text-xs font-bold text-[#F2EDD7]">{analysis.marche}</span>
                    {analysis.timeframe && analysis.timeframe !== 'Non visible' && (
                      <span className="text-[10px] text-[#444] border border-[#1c1c1c] px-1.5 py-0.5 rounded ml-1">{analysis.timeframe}</span>
                    )}
                    <span className="text-[10px] text-[#333] ml-auto">Prix indisponible</span>
                  </div>
                )}

                {/* ② Tendance & confiance */}
                <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#444] uppercase tracking-widest font-medium mb-1">Tendance globale</p>
                      <p className="text-base font-black" style={{ color: tndColor }}>{analysis.tendance}</p>
                    </div>
                    {analysis.timeframe && analysis.timeframe !== 'Non visible' && (
                      <span className="text-[10px] font-bold text-[#555] border border-[#1c1c1c] px-2 py-1 rounded-lg">{analysis.timeframe}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-[#444] uppercase tracking-widest block mb-1.5">Confiance de l'analyse</span>
                    <ConfBar value={conf} />
                  </div>
                </div>

                {/* ③ Structure & Zones */}
                <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-[10px] text-[#444] uppercase tracking-widest font-semibold mb-1.5">Structure de marché</p>
                    <p className="text-sm text-[#888] leading-relaxed">{analysis.structure}</p>
                  </div>
                  <div className="pt-3 border-t border-[#1c1c1c]">
                    <p className="text-[10px] text-[#444] uppercase tracking-widest font-semibold mb-1.5">Niveaux clés</p>
                    <p className="text-sm text-[#888] leading-relaxed">{analysis.zones}</p>
                  </div>
                </div>

                {/* ④ Scenarios */}
                {analysis.scenario_haussier && (
                  <ScenarioCard type="haussier" scenario={analysis.scenario_haussier} />
                )}
                {analysis.scenario_baissier && (
                  <ScenarioCard type="baissier" scenario={analysis.scenario_baissier} />
                )}
                {analysis.scenario_neutre && (
                  <ScenarioCard type="neutre" scenario={analysis.scenario_neutre} />
                )}

                {/* ⑤ Analyse synthèse */}
                <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-4">
                  <p className="text-[10px] text-[#444] uppercase tracking-widest font-semibold mb-2">Synthèse</p>
                  <p className="text-sm text-[#888] leading-relaxed">{analysis.analyse}</p>
                </div>

                {/* ⑥ News */}
                {economicCtx && economicCtx.news.length > 0 && (
                  <NewsCard news={economicCtx.news} />
                )}

                {/* ⑦ Missing info */}
                {analysis.manque && (
                  <div className="flex items-start gap-3 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-4">
                    <AlertTriangle className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-[#D4AF37]/70 uppercase tracking-widest font-semibold mb-1">Données manquantes</p>
                      <p className="text-sm text-[#D4AF37]/80">{analysis.manque}</p>
                    </div>
                  </div>
                )}

                <RiskBanner />
              </div>
            )}
          </div>
        </div>

        {/* How it works */}
        {images.length === 0 && !loading && (
          <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-5">
            <p className="text-[10px] text-[#444] uppercase tracking-widest font-semibold mb-5">Méthode d'analyse</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { step: '01', Icon: ImagePlus,    title: 'Upload',               desc: "1 à 4 graphiques — multi-timeframes ou multi-actifs. TradingView, MT4/5, cTrader, Binance, Bybit." },
                { step: '02', Icon: BarChart2,    title: 'Indicateurs calculés', desc: "EMA20/50, RSI14, ATR14, supports et résistances calculés sur données OHLCV réelles — pas estimés depuis l'image." },
                { step: '03', Icon: Zap,          title: 'Prix live + Macro',    desc: 'Prix temps réel et actualités avec sentiment (Alpha Vantage).' },
                { step: '04', Icon: CheckCircle2, title: 'Multi-scénarios',      desc: "Scénarios haussier/baissier/neutre avec probabilités, arguments factuels et conditions de déclenchement précises." },
              ].map(({ step, Icon, title, desc }) => (
                <div key={step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/8 border border-[#D4AF37]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-[#D4AF37]/50 mb-0.5">{step}</p>
                    <p className="text-xs font-semibold text-[#F2EDD7] mb-0.5">{title}</p>
                    <p className="text-[11px] text-[#555] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <FinancialDisclaimer compact />
      </div>
    </div>
  )
}

export default function AnalysePage() {
  return <AnalyseContent />
}
