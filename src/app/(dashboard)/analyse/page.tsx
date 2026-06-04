'use client'
import { UpgradeOverlay } from '@/components/upgrade/UpgradeOverlay'
import { FinancialDisclaimer } from '@/components/FinancialDisclaimer'
import { cn } from '@/lib/utils'
import { RiskBanner } from '@/components/ui/risk-banner'
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  ChevronRight,
  ImagePlus,
  Layers,
  Loader2,
  RefreshCw,
  X,
  Zap,
} from 'lucide-react'
import { useTokens } from '@/contexts/TokenContext'
import { useCallback, useRef, useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TPLevel {
  niveau: string
  probabilite: number
}

interface Analysis {
  marche: string
  timeframe: string
  direction: 'BUY' | 'SELL' | 'NEUTRE'
  confiance: number
  entree: string
  sl: string
  tp1: TPLevel
  tp2: TPLevel
  tp3: TPLevel
}

interface ImageItem {
  src: string
  fileName: string
  fileSize: number
  mediaType: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function confColor(v: number) {
  return v >= 70 ? '#22c55e' : v >= 50 ? '#D4AF37' : '#ef4444'
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

// ─── Trading card ─────────────────────────────────────────────────────────────

function normalizeTP(raw: any): TPLevel | null {
  if (!raw) return null
  if (typeof raw === 'object' && raw.niveau) return { niveau: String(raw.niveau), probabilite: Number(raw.probabilite) || 0 }
  if (typeof raw === 'string' && raw.trim()) return { niveau: raw.trim(), probabilite: 0 }
  return null
}

function TradingCard({ analysis }: { analysis: Analysis }) {
  const dir = (analysis.direction ?? '').toUpperCase()
  const isBuy  = dir === 'BUY'
  const isSell = dir === 'SELL'
  const dirColor  = isBuy ? '#22c55e' : isSell ? '#ef4444' : '#888'
  const dirBg     = isBuy ? 'rgba(34,197,94,0.08)'  : isSell ? 'rgba(239,68,68,0.08)'  : 'rgba(100,100,100,0.08)'
  const dirBorder = isBuy ? 'rgba(34,197,94,0.25)'  : isSell ? 'rgba(239,68,68,0.25)'  : 'rgba(100,100,100,0.2)'
  const dirLabel  = isBuy ? '↑  BUY'                : isSell ? '↓  SELL'               : '—  NEUTRE'

  const tps = [
    { label: 'Take Profit 1', data: normalizeTP(analysis.tp1), color: '#22c55e' },
    { label: 'Take Profit 2', data: normalizeTP(analysis.tp2), color: '#86efac' },
    { label: 'Take Profit 3', data: normalizeTP(analysis.tp3), color: '#bbf7d0' },
  ].filter(t => t.data !== null) as { label: string; data: TPLevel; color: string }[]

  return (
    <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl overflow-hidden">

      {/* Market + TF + Confidence */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c1c1c]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#F2EDD7]">{analysis.marche}</span>
          {analysis.timeframe && analysis.timeframe !== 'Non visible' && (
            <span className="text-[10px] text-[#555] border border-[#222] px-1.5 py-0.5 rounded">{analysis.timeframe}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#444] uppercase tracking-wider">Confiance</span>
          <span className="text-sm font-black font-mono" style={{ color: confColor(analysis.confiance) }}>{analysis.confiance}%</span>
        </div>
      </div>

      {/* Direction */}
      <div className="px-4 py-5 flex items-center justify-center border-b border-[#1c1c1c]">
        <span
          className="text-xl font-black tracking-widest px-10 py-3 rounded-xl"
          style={{ color: dirColor, background: dirBg, border: `1px solid ${dirBorder}` }}
        >
          {dirLabel}
        </span>
      </div>

      {/* Entry + SL */}
      <div className="px-4 py-4 space-y-3 border-b border-[#1c1c1c]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#555] uppercase tracking-wider font-medium">Entrée</span>
          <span className="text-sm font-mono font-bold text-[#F2EDD7]">{analysis.entree}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#ef4444]/60 uppercase tracking-wider font-medium">Stop Loss</span>
          <span className="text-sm font-mono font-bold text-[#ef4444]">{analysis.sl}</span>
        </div>
      </div>

      {/* Take Profits */}
      <div className="px-4 py-4 space-y-4">
        {tps.map(({ label, data, color }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#555] uppercase tracking-wider font-medium">{label}</span>
                <span className="text-sm font-mono font-bold" style={{ color }}>{data.niveau}</span>
              </div>
              <span className="text-[11px] font-bold font-mono" style={{ color }}>{data.probabilite}%</span>
            </div>
            <ConfBar value={data.probabilite} color={color} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AnalyseContent() {
  const { syncBalance } = useTokens()
  const [images, setImages]           = useState<ImageItem[]>([])
  const [dragging, setDragging]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [analysis, setAnalysis]       = useState<Analysis | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
    setImages([]); setAnalysis(null); setError(null); setLoading(false)
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
      if (res.status === 402) { setShowUpgrade(true); return }
      if (!res.ok || data.error) { setError(data.error || 'Erreur serveur.'); return }
      if (!data.analysis)        { setError('Réponse vide. Réessaie.'); return }
      setAnalysis(data.analysis)
      if (typeof data.newBalance === 'number') syncBalance(data.newBalance)
    } catch {
      setError('Connexion impossible.')
    } finally {
      setLoading(false)
    }
  }

  if (showUpgrade) {
    return (
      <div className="min-h-full bg-[#080808] flex flex-col">
        <UpgradeOverlay
          title="Tokens insuffisants"
          subtitle="Chaque analyse graphique coûte 3 000 tokens. Passe à un forfait supérieur pour continuer."
        />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#080808] p-4 md:p-6">
      <div className="max-w-[1280px] mx-auto space-y-4 md:space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
              <BarChart2 className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-bold text-[#F2EDD7]">Analyse Graphique IA</h1>
              <p className="text-[11px] md:text-xs text-[#555]">Direction · Entrée · Stop Loss · Take Profits</p>
            </div>
          </div>
          {images.length > 0 && (
            <button onClick={reset} className="flex items-center gap-1.5 text-xs text-[#555] hover:text-[#ef4444] border border-[#222] hover:border-[#ef4444]/30 px-2.5 md:px-3 py-1.5 rounded-lg transition-colors">
              <RefreshCw className="w-3 h-3" /> <span className="hidden sm:inline">Nouveau</span>
            </button>
          )}
        </div>

        {/* Main grid — on mobile: result first, then upload */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 md:gap-5">

          {/* RIGHT — Result (shown first on mobile when there's an analysis) */}
          <div className={cn('space-y-3', analysis ? 'order-first lg:order-last' : 'order-last lg:order-last')}>
            {!analysis && !loading && (
              <div className="hidden lg:flex bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-8 flex-col items-center justify-center text-center min-h-[320px] gap-5">
                <div className="w-12 h-12 rounded-xl bg-[#141414] border border-[#1c1c1c] flex items-center justify-center">
                  <BarChart2 className="w-5 h-5 text-[#2a2a2a]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#3a3a3a] mb-1">En attente d'un graphique</p>
                  <p className="text-xs text-[#2a2a2a]">Direction · Entrée · Stop · Take Profits</p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 bg-[#111] rounded-lg" />)}
                </div>
              </div>
            )}

            {analysis && <TradingCard analysis={analysis} />}
            {analysis && <RiskBanner />}
          </div>

          {/* LEFT — Upload + actions */}
          <div className="flex flex-col gap-3 md:gap-4">

            {images.length === 0 ? (
              <div className="space-y-3 md:space-y-4">
                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all duration-150 min-h-[220px] md:min-h-[260px] select-none',
                    dragging ? 'border-[#D4AF37] bg-[#D4AF37]/5 scale-[1.01]' : 'border-[#222] bg-[#0e0e0e] hover:border-[#D4AF37]/40 hover:bg-[#141414]'
                  )}
                >
                  <div className="flex flex-col items-center gap-3 md:gap-4 pointer-events-none px-6 text-center">
                    <div className={cn('w-12 h-12 md:w-14 md:h-14 rounded-2xl border flex items-center justify-center', dragging ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40' : 'bg-[#141414] border-[#222]')}>
                      <ImagePlus className={cn('w-5 h-5 md:w-6 md:h-6', dragging ? 'text-[#D4AF37]' : 'text-[#444]')} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#F2EDD7] mb-1">{dragging ? 'Relâche pour analyser' : 'Télécharge tes graphiques'}</p>
                      <p className="text-xs text-[#555] mb-1.5">Glisse ici ou clique · jusqu'à 4 graphiques</p>
                      <p className="text-[11px] text-[#333]">PNG · JPG · WEBP · max 12 Mo</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {['TradingView', 'MT4', 'MT5', 'Binance', 'Bybit'].map(s => (
                        <span key={s} className="text-[10px] text-[#555] border border-[#1c1c1c] bg-[#0a0a0a] px-2 py-0.5 rounded-md">{s}</span>
                      ))}
                    </div>
                  </div>
                  <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => { Array.from(e.target.files || []).forEach(addFile); e.target.value = '' }} />
                </div>

                {/* What you get */}
                <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                      <Zap className="w-3 h-3 text-[#D4AF37]" />
                    </div>
                    <p className="text-xs font-bold text-[#F2EDD7]">Setup de trading direct</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {[
                      'Direction : BUY ou SELL',
                      "Zone d'entrée précise",
                      'Stop Loss structurel',
                      'TP 1 + probabilité',
                      'TP 2 + probabilité',
                      'TP 3 + probabilité',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-[#D4AF37] flex-shrink-0" />
                        <span className="text-[11px] text-[#888]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Images grid */
              <div className="space-y-3">
                <div className={cn('grid gap-2 md:gap-3', images.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                  {images.map((img, index) => (
                    <div key={index} className="relative rounded-xl overflow-hidden border border-[#222] bg-[#0a0a0a] group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.src} alt={`Graphique ${index + 1}`}
                        className={cn('w-full object-contain block blur-sm', images.length === 1 ? 'max-h-[360px] md:max-h-[480px]' : 'max-h-[180px] md:max-h-[220px]')} />
                      <button onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 md:w-7 md:h-7 rounded-lg bg-[#080808]/90 border border-[#333] flex items-center justify-center text-[#777] hover:text-[#ef4444] transition-colors opacity-0 group-hover:opacity-100 active:opacity-100">
                        <X className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#080808]/90 to-transparent px-2 py-1.5 pointer-events-none">
                        <p className="text-[10px] text-[#555] truncate">
                          {images.length > 1 ? `TF ${index + 1} · ` : ''}{img.fileName}
                        </p>
                      </div>
                    </div>
                  ))}
                  {images.length < 4 && (
                    <button onClick={() => inputRef.current?.click()}
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#222] bg-[#0e0e0e] hover:border-[#D4AF37]/40 hover:bg-[#141414] transition-all min-h-[100px] md:min-h-[120px] gap-2 text-[#444] hover:text-[#D4AF37]">
                      <ImagePlus className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="text-[10px] font-semibold uppercase tracking-wide">+{images.length}/4</span>
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
              <div className="flex items-start gap-3 bg-[#ef4444]/8 border border-[#ef4444]/25 rounded-xl p-3 md:p-4">
                <AlertTriangle className="w-4 h-4 text-[#ef4444] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#ef4444]">{error}</p>
              </div>
            )}

            {images.length > 0 && (
              <button onClick={runAnalysis} disabled={loading}
                className={cn('w-full flex items-center justify-center gap-2 md:gap-2.5 py-3 md:py-3.5 rounded-xl font-bold text-sm transition-all',
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
              <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-4 space-y-3">
                {[
                  'Identification du marché et du timeframe…',
                  'Récupération des données OHLCV et indicateurs…',
                  'Calcul des niveaux structurels (EMA, ATR, swings)…',
                  'Détermination de la direction et des cibles…',
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
        </div>

        {/* How it works */}
        {images.length === 0 && !loading && (
          <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-4 md:p-5">
            <p className="text-[10px] text-[#444] uppercase tracking-widest font-semibold mb-4">Comment ça marche</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {[
                { step: '01', Icon: ImagePlus,    title: 'Upload',        desc: '1 à 4 graphiques — TradingView, MT4/5, Binance, Bybit.' },
                { step: '02', Icon: BarChart2,    title: 'Indicateurs',   desc: 'EMA, RSI, ATR calculés sur données OHLCV réelles (M5 → D1).' },
                { step: '03', Icon: Zap,          title: 'Direction',     desc: 'BUY ou SELL selon la structure et le biais multi-timeframes.' },
                { step: '04', Icon: CheckCircle2, title: 'Setup complet', desc: "Entrée, Stop Loss et 3 TP avec leur probabilité d'être atteints." },
              ].map(({ step, Icon, title, desc }) => (
                <div key={step} className="flex gap-2.5">
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-[#D4AF37]/8 border border-[#D4AF37]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#D4AF37]" />
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
