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
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  ImagePlus,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Analysis {
  marche: string
  timeframe: string
  decision: string
  confiance: number
  tendance: string
  structure: string
  zones: string
  entree: string | null
  stop_loss: string | null
  take_profit: string | null
  tp2: string | null
  tp3: string | null
  invalidation: string | null
  ratio_rr: string | null
  analyse: string
  manque: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function decisionCfg(decision: string) {
  const d = decision?.toUpperCase() ?? ''
  if (d.includes('BUY'))  return { label: 'BUY NOW',  color: '#22c55e', bg: 'rgba(34,197,94,0.07)',  border: 'rgba(34,197,94,0.2)',  Icon: ArrowUpRight,   Trend: TrendingUp   }
  if (d.includes('SELL')) return { label: 'SELL NOW', color: '#ef4444', bg: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.2)',  Icon: ArrowDownRight, Trend: TrendingDown }
  if (d.includes('WAIT')) return { label: 'WAIT',     color: '#D4AF37', bg: 'rgba(212,175,55,0.07)', border: 'rgba(212,175,55,0.2)', Icon: Clock,          Trend: Clock        }
  return                         { label: 'NO TRADE', color: '#666',    bg: 'rgba(80,80,80,0.05)',   border: 'rgba(80,80,80,0.2)',   Icon: Ban,            Trend: Ban          }
}

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
  // AV format: "20260515T143022"
  if (!published || published.length < 13) return ''
  try {
    const y = published.slice(0, 4), mo = published.slice(4, 6), d = published.slice(6, 8)
    const h = published.slice(9, 11), mi = published.slice(11, 13)
    const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:00Z`)
    const diff = Date.now() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'Il y a < 1h'
    if (hours < 24) return `Il y a ${hours}h`
    const days = Math.floor(hours / 24)
    return `Il y a ${days}j`
  } catch { return '' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DataRow({ label, value, color = '#F2EDD7', tag }: { label: string; value: string; color?: string; tag?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#1c1c1c] last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#555] uppercase tracking-wider">{label}</span>
        {tag && <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ color, background: color + '18' }}>{tag}</span>}
      </div>
      <span className="text-sm font-semibold font-mono" style={{ color }}>{value}</span>
    </div>
  )
}

function ConfBar({ value }: { value: number }) {
  const color = confColor(value)
  const safe = Math.min(100, Math.max(0, value))
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1 bg-[#1c1c1c] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${safe}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono font-bold tabular-nums w-8 text-right" style={{ color }}>{safe}%</span>
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
            <div key={i} className={cn('pb-3 border-b border-[#1a1a1a] last:border-0 last:pb-0')}>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

function AnalyseContent() {
  const [imgSrc, setImgSrc]             = useState<string | null>(null)
  const [fileName, setFileName]         = useState<string>('')
  const [fileSize, setFileSize]         = useState<number>(0)
  const [mediaType, setMediaType]       = useState<string>('image/png')
  const [dragging, setDragging]         = useState(false)
  const [loading, setLoading]           = useState(false)
  const [analysis, setAnalysis]         = useState<Analysis | null>(null)
  const [liveData, setLiveData]         = useState<LivePrice | null>(null)
  const [economicCtx, setEconomicCtx]   = useState<EconomicContext | null>(null)
  const [hasIndicators, setHasIndicators] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [freeQuota, setFreeQuota]       = useState<FreeQuota | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/quota?type=analyse')
      .then(r => r.json())
      .then((q: FreeQuota) => { if (!q.isPaidPlan) setFreeQuota(q) })
      .catch(() => {})
  }, [])

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { setError('Format non supporté.'); return }
    if (file.size > 12 * 1024 * 1024)   { setError('Image trop lourde (max 12 Mo).'); return }
    setError(null); setAnalysis(null); setLiveData(null); setEconomicCtx(null)
    setFileName(file.name); setFileSize(file.size); setMediaType(file.type)
    const reader = new FileReader()
    reader.onload = (e) => { if (typeof e.target?.result === 'string') setImgSrc(e.target.result) }
    reader.readAsDataURL(file)
  }, [])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files?.[0]; if (file) loadFile(file)
  }, [loadFile])

  const reset = () => {
    setImgSrc(null); setFileName(''); setFileSize(0)
    setAnalysis(null); setLiveData(null); setEconomicCtx(null)
    setHasIndicators(false); setError(null); setLoading(false)
  }

  const runAnalysis = async () => {
    if (!imgSrc || loading) return
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/analyse-graphique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: imgSrc, mediaType }),
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

  const dec     = analysis ? decisionCfg(analysis.decision) : null
  const tndColor = analysis ? tendanceColor(analysis.tendance) : '#888'
  const conf    = typeof analysis?.confiance === 'number' ? analysis.confiance : null

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

        {/* Free trial banner */}
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
                  : <span>Analyse institutionnelle</span>
                }
              </p>
            </div>
          </div>
          {imgSrc && (
            <button onClick={reset} className="flex items-center gap-1.5 text-xs text-[#555] hover:text-[#ef4444] border border-[#222] hover:border-[#ef4444]/30 px-3 py-1.5 rounded-lg transition-colors">
              <RefreshCw className="w-3 h-3" /> Nouveau
            </button>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-5">

          {/* LEFT */}
          <div className="flex flex-col gap-4">

            {!imgSrc ? (
              <div className="space-y-4">
                {/* Zone d'upload */}
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
                      <p className="text-sm font-semibold text-[#F2EDD7] mb-1">{dragging ? 'Relâche pour analyser' : 'Téléchargez une capture d\'écran de votre graphique'}</p>
                      <p className="text-xs text-[#555] mb-2">Glissez votre image ici ou cliquez pour sélectionner un fichier</p>
                      <p className="text-[11px] text-[#333]">PNG · JPG · WEBP · max 12 Mo</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-[10px] text-[#444] uppercase tracking-widest">Plateformes compatibles</p>
                      <div className="flex items-center gap-2 flex-wrap justify-center">
                        {['TradingView', 'MT4', 'MT5', 'Binance', 'Bybit', 'cTrader'].map(s => (
                          <span key={s} className="text-[10px] text-[#555] border border-[#1c1c1c] bg-[#0a0a0a] px-2.5 py-1 rounded-lg">{s}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-[#333] mt-1">L'image doit afficher clairement le prix, les bougies et les niveaux importants</p>
                    </div>
                  </div>
                  <input ref={inputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = '' }} />
                </div>

                {/* Ce que l'IA analyse */}
                <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-[#818cf8]/10 border border-[#818cf8]/20 flex items-center justify-center">
                      <BarChart2 className="w-3.5 h-3.5 text-[#818cf8]" />
                    </div>
                    <p className="text-sm font-bold text-[#F2EDD7]">Ce que l'IA va analyser</p>
                  </div>
                  <p className="text-xs text-[#555] mb-4 leading-relaxed">Notre intelligence artificielle examine automatiquement votre graphique pour vous fournir une analyse complète et précise :</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'La tendance actuelle du marché',
                      'Les zones de support et de résistance',
                      'Les cassures potentielles',
                      'La force du mouvement en cours',
                      'Les signaux d\'achat ou de vente',
                      'Les opportunités à court terme',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5 py-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#818cf8] flex-shrink-0" />
                        <span className="text-xs text-[#888]">{item}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#444] mt-4 leading-relaxed border-t border-[#1c1c1c] pt-4">
                    L'analyse est réalisée directement à partir du graphique envoyé afin de fournir une évaluation rapide et pertinente de la situation du marché.
                  </p>
                </div>

                {/* Résultat de l'analyse */}
                <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
                    </div>
                    <p className="text-sm font-bold text-[#F2EDD7]">Résultat de l'analyse</p>
                  </div>
                  <p className="text-xs text-[#555] mb-4 leading-relaxed">Une fois l'analyse terminée, l'IA vous fournit un plan de trading complet :</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 bg-[#111] rounded-lg p-3">
                      <div className="flex gap-1 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                        <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                        <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#F2EDD7] mb-1">Recommandation claire</p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2 py-0.5 rounded">Acheter (Buy)</span>
                          <span className="text-[10px] font-bold text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 px-2 py-0.5 rounded">Vendre (Sell)</span>
                          <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-2 py-0.5 rounded">Attendre (Wait)</span>
                        </div>
                      </div>
                    </div>
                    {[
                      { label: 'Niveau d\'entrée', desc: 'Le prix idéal pour ouvrir votre position', color: '#F2EDD7' },
                      { label: 'Stop Loss (SL)', desc: 'Le niveau où couper la perte si le marché va contre vous', color: '#ef4444' },
                      { label: 'Take Profit 1 · 2 · 3', desc: 'Trois objectifs de sortie progressifs pour maximiser vos gains', color: '#22c55e' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 bg-[#111] rounded-lg p-3">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: item.color }} />
                        <div>
                          <p className="text-xs font-semibold mb-0.5" style={{ color: item.color }}>{item.label}</p>
                          <p className="text-[11px] text-[#555]">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-[#222] bg-[#0a0a0a] group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc} alt="Graphique" className="w-full object-contain max-h-[480px] block" />
                <button onClick={reset} className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-[#080808]/90 border border-[#333] flex items-center justify-center text-[#777] hover:text-[#ef4444] transition-colors opacity-0 group-hover:opacity-100">
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#080808]/90 to-transparent px-4 py-3 pointer-events-none">
                  <p className="text-xs text-[#555] truncate">{fileName} · {(fileSize / 1024).toFixed(0)} Ko</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 bg-[#ef4444]/8 border border-[#ef4444]/25 rounded-xl p-4">
                <AlertTriangle className="w-4 h-4 text-[#ef4444] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#ef4444]">{error}</p>
              </div>
            )}

            {imgSrc && (
              <button onClick={runAnalysis} disabled={loading}
                className={cn('w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all',
                  loading ? 'bg-[#D4AF37]/15 text-[#D4AF37] cursor-wait border border-[#D4AF37]/20' : 'bg-[#D4AF37] text-[#080808] hover:bg-[#E8C240] active:scale-[0.99]'
                )}>
                <span className="flex items-center gap-2.5">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Analyse en cours…</span></>
                  ) : (
                    <><Zap className="w-4 h-4" /><span>{analysis ? 'Relancer l\'analyse' : 'Analyser ce graphique'}</span><ChevronRight className="w-4 h-4" /></>
                  )}
                </span>
              </button>
            )}

            {loading && (
              <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-5 space-y-3">
                {[
                  'Identification du marché et du timeframe…',
                  'Récupération du prix live · actualités · données OHLCV…',
                  'Calcul des indicateurs techniques (EMA, RSI, ATR, swings)…',
                  'Analyse structure BOS / CHoCH · interprétation des indicateurs…',
                  'Intégration du contexte macro et décision finale…',
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
                  <p className="text-xs text-[#2a2a2a]">Prix live · Actualités · Décision institutionnelle</p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 bg-[#111] rounded-lg" />)}
                </div>
              </div>
            )}

            {analysis && dec && conf !== null && (
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

                {/* ② Decision */}
                <div className="rounded-xl p-5 border" style={{ background: dec.bg, borderColor: dec.border }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: dec.color + '18', border: `1px solid ${dec.color}35` }}>
                      <dec.Icon className="w-5 h-5" style={{ color: dec.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-[#666] uppercase tracking-widest font-medium mb-0.5">Décision</p>
                      <p className="text-xl font-black" style={{ color: dec.color }}>{dec.label}</p>
                    </div>
                    <div className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg border"
                      style={{ color: tndColor, borderColor: tndColor + '30', background: tndColor + '10' }}>
                      {analysis.tendance}
                    </div>
                  </div>
                  <span className="text-[10px] text-[#555] uppercase tracking-widest block mb-1.5">Confiance</span>
                  <ConfBar value={conf} />
                </div>

                {/* ③ Structure & Zones */}
                <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-[10px] text-[#444] uppercase tracking-widest font-semibold mb-1.5">Structure de marché</p>
                    <p className="text-sm text-[#888] leading-relaxed">{analysis.structure}</p>
                  </div>
                  <div className="pt-3 border-t border-[#1c1c1c]">
                    <p className="text-[10px] text-[#444] uppercase tracking-widest font-semibold mb-1.5">Zones clés</p>
                    <p className="text-sm text-[#888] leading-relaxed">{analysis.zones}</p>
                  </div>
                </div>

                {/* ④ Risk management */}
                {(analysis.entree || analysis.stop_loss || analysis.take_profit) && (
                  <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-4">
                    <p className="text-[10px] text-[#444] uppercase tracking-widest font-semibold mb-1">Gestion du risque</p>
                    {analysis.entree       && <DataRow label="Zone d'entrée" value={analysis.entree}       color="#F2EDD7" />}
                    {analysis.stop_loss    && <DataRow label="Stop Loss"     value={analysis.stop_loss}    color="#ef4444" />}
                    {analysis.take_profit  && <DataRow label="Take Profit"   value={analysis.take_profit}  color="#22c55e" tag="TP1" />}
                    {analysis.tp2          && <DataRow label="Take Profit 2" value={analysis.tp2}          color="#22c55e" tag="TP2" />}
                    {analysis.tp3          && <DataRow label="Take Profit 3" value={analysis.tp3}          color="#22c55e" tag="TP3" />}
                    {analysis.invalidation && <DataRow label="Invalidation"  value={analysis.invalidation} color="#555"   />}
                    {analysis.ratio_rr && (
                      <div className="mt-3 pt-3 border-t border-[#1c1c1c] flex items-center justify-between">
                        <span className="text-[10px] text-[#444] uppercase tracking-widest font-semibold">Ratio R/R</span>
                        <span className="text-base font-black font-mono text-[#D4AF37]">{analysis.ratio_rr}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ⑤ Analysis */}
                <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-4">
                  <p className="text-[10px] text-[#444] uppercase tracking-widest font-semibold mb-2">Analyse</p>
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

                {/* ⑧ Risk warning */}
                <RiskBanner />

              </div>
            )}
          </div>
        </div>

        {/* How it works */}
        {!imgSrc && !loading && (
          <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-5">
            <p className="text-[10px] text-[#444] uppercase tracking-widest font-semibold mb-5">Méthode d'analyse</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { step: '01', Icon: ImagePlus,   title: 'Upload',               desc: 'TradingView, MT4/5, cTrader, Binance, Bybit — toute capture de graphique.' },
                { step: '02', Icon: BarChart2,   title: 'Indicateurs calculés', desc: 'EMA20/50, RSI14, ATR14, supports et résistances calculés sur données OHLCV réelles — pas estimés depuis l\'image.' },
                { step: '03', Icon: Zap,          title: 'Prix live + Macro',    desc: 'Prix temps réel (Binance / Twelve Data) et actualités avec sentiment (Alpha Vantage).' },
                { step: '04', Icon: CheckCircle2, title: 'Décision',             desc: 'BUY/SELL/WAIT + entrée, SL, TP1/2/3, ratio R/R. L\'IA interprète des chiffres vérifiables, pas des estimations.' },
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
