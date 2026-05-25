'use client'

import { cn } from '@/lib/utils'
import { RiskBanner } from '@/components/ui/risk-banner'
import { AlertCircle, Check, Loader2, RefreshCw, TrendingDown, TrendingUp, X, Zap } from 'lucide-react'
import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CryptoSignal {
  id: string; name: string; symbol: string
  decision: 'ACHETER' | 'VENDRE'
  confidence: number
  price: number; entry: number
  tp1: number; tp1Pct: number
  tp2: number; tp2Pct: number
  tp3: number; tp3Pct: number
  sl: number; slPct: number
}

const ASSETS = [
  { id: 'BTC',   name: 'Bitcoin'        },
  { id: 'ETH',   name: 'Ethereum'       },
  { id: 'SOL',   name: 'Solana'         },
  { id: 'BNB',   name: 'BNB'            },
  { id: 'XRP',   name: 'XRP'            },
  { id: 'ADA',   name: 'Cardano'        },
  { id: 'DOGE',  name: 'Dogecoin'       },
  { id: 'AVAX',  name: 'Avalanche'      },
  { id: 'LINK',  name: 'Chainlink'      },
  { id: 'MATIC', name: 'Polygon'        },
  { id: 'DOT',   name: 'Polkadot'       },
  { id: 'TRX',   name: 'TRON'           },
  { id: 'LTC',   name: 'Litecoin'       },
  { id: 'BCH',   name: 'Bitcoin Cash'   },
  { id: 'NEAR',  name: 'NEAR Protocol'  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(price: number): string {
  if (price > 10000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' $'
  if (price > 100)   return price.toFixed(2) + ' $'
  if (price > 1)     return price.toFixed(3) + ' $'
  return price.toFixed(5) + ' $'
}

function sign(pct: number): string {
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%'
}

// ─── Signal card ──────────────────────────────────────────────────────────────

function SignalCard({ sig, index }: { sig: CryptoSignal; index: number }) {
  const bull   = sig.decision === 'ACHETER'
  const color  = bull ? '#22c55e' : '#ef4444'
  const bgCard = bull ? 'rgba(34,197,94,0.05)'  : 'rgba(239,68,68,0.05)'
  const border = bull ? 'rgba(34,197,94,0.2)'   : 'rgba(239,68,68,0.2)'

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: bgCard, borderColor: border,
        animation: 'fadeSlideIn 0.4s ease both',
        animationDelay: `${index * 40}ms`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: border }}>
        <div>
          <p className="text-lg font-black text-[#F2EDD7] font-mono tracking-tight">{sig.symbol}</p>
          <p className="text-xs text-[#555] mt-0.5">{sig.name}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-sm tracking-widest"
            style={{ color, background: color + '18', borderColor: color + '40' }}
          >
            {bull ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {sig.decision}
          </div>
          <span className="text-[11px] font-black font-mono" style={{ color }}>
            {sig.confidence}% de confiance
          </span>
        </div>
      </div>

      {/* Levels grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#1a1a1a]">
        <div className="bg-[#0c0c0c] px-4 py-3">
          <p className="text-[10px] text-[#444] uppercase tracking-widest mb-1">Entrée</p>
          <p className="text-sm font-bold text-[#F2EDD7] font-mono">{fmt(sig.entry)}</p>
        </div>
        <div className="bg-[#0c0c0c] px-4 py-3">
          <p className="text-[10px] text-[#444] uppercase tracking-widest mb-1">TP1</p>
          <p className="text-sm font-bold font-mono" style={{ color }}>{fmt(sig.tp1)}</p>
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: color + 'aa' }}>{sign(sig.tp1Pct)}</p>
        </div>
        <div className="bg-[#0c0c0c] px-4 py-3">
          <p className="text-[10px] text-[#444] uppercase tracking-widest mb-1">TP2</p>
          <p className="text-sm font-bold font-mono" style={{ color }}>{fmt(sig.tp2)}</p>
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: color + 'aa' }}>{sign(sig.tp2Pct)}</p>
        </div>
        <div className="bg-[#0c0c0c] px-4 py-3">
          <p className="text-[10px] text-[#444] uppercase tracking-widest mb-1">TP3</p>
          <p className="text-sm font-bold font-mono" style={{ color }}>{fmt(sig.tp3)}</p>
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: color + 'aa' }}>{sign(sig.tp3Pct)}</p>
        </div>
      </div>

      {/* Footer: SL */}
      <div className="flex items-center justify-between px-5 py-3.5 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#444] uppercase tracking-wider">Stop Loss</span>
          <span className="text-sm font-bold text-[#ef4444] font-mono">{fmt(sig.sl)}</span>
          <span className="text-[11px] text-[#ef4444]/60 font-mono">{sign(sig.slPct)}</span>
        </div>
        {/* Confidence bar */}
        <div className="flex items-center gap-2 flex-1 min-w-[100px] max-w-[200px]">
          <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${sig.confidence}%`, backgroundColor: color }} />
          </div>
          <span className="text-[10px] font-black font-mono flex-shrink-0" style={{ color }}>{sig.confidence}%</span>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'analyzing' | 'done'

export default function SignalsPage() {
  const [phase,     setPhase]     = useState<Phase>('idle')
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [doneIds,   setDoneIds]   = useState<Set<string>>(new Set())
  const [errorIds,  setErrorIds]  = useState<Set<string>>(new Set())
  const [results,   setResults]   = useState<CryptoSignal[]>([])
  const [error,     setError]     = useState<string | null>(null)

  const launch = async () => {
    setPhase('analyzing')
    setCurrentId(null)
    setDoneIds(new Set())
    setErrorIds(new Set())
    setResults([])
    setError(null)

    try {
      const res = await fetch('/api/signals/crypto')
      if (!res.ok) {
        setError(`Erreur serveur : ${res.status} ${res.statusText}`)
        setPhase('idle')
        return
      }
      if (!res.body) {
        setError('Pas de flux reçu du serveur.')
        setPhase('idle')
        return
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buf     = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(line.slice(6))
            if (ev.type === 'progress') {
              setCurrentId(ev.id)
            } else if (ev.type === 'result') {
              setResults(prev => [...prev, ev.signal as CryptoSignal])
              setDoneIds(prev => { const s = new Set(prev); s.add(ev.signal.id); return s })
            } else if (ev.type === 'error') {
              setDoneIds(prev => { const s = new Set(prev); s.add(ev.id); return s })
              setErrorIds(prev => { const s = new Set(prev); s.add(ev.id); return s })
            } else if (ev.type === 'done') {
              setCurrentId(null)
              setPhase('done')
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setError(err?.message ?? 'Erreur inconnue')
      setPhase('idle')
    }
  }

  const reset = () => {
    setPhase('idle')
    setCurrentId(null)
    setDoneIds(new Set())
    setErrorIds(new Set())
    setResults([])
    setError(null)
  }

  const buyCount  = results.filter(r => r.decision === 'ACHETER').length
  const sellCount = results.filter(r => r.decision === 'VENDRE').length

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-full bg-[#080808]">

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-8">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mx-auto mb-2">
                <Zap className="w-7 h-7 text-[#D4AF37]" />
              </div>
              <h1 className="text-2xl font-black text-[#F2EDD7]">Signaux Crypto</h1>
              <p className="text-sm text-[#555] max-w-[360px] leading-relaxed">
                L'IA analyse les 15 principales cryptomonnaies et te dit pour chacune :
                acheter ou vendre, avec le prix d'entrée, les objectifs et le stop loss.
              </p>
            </div>

            <button
              onClick={launch}
              className="flex items-center gap-3 bg-[#D4AF37] text-[#080808] font-black text-base px-10 py-4 rounded-2xl hover:bg-[#E8C240] active:scale-[0.98] transition-all shadow-lg shadow-[#D4AF37]/20"
            >
              <Zap className="w-5 h-5" />
              Lancer l'analyse
            </button>

            {error && (
              <p className="text-xs text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl px-4 py-3 max-w-[400px] text-center">
                {error}
              </p>
            )}
          </div>
        )}

        {/* ── ANALYZING: live console ── */}
        {phase === 'analyzing' && (
          <div className="flex flex-col items-center justify-center min-h-screen px-6">
            <div className="w-full max-w-[380px]">

              {/* Header */}
              <div className="flex items-center gap-2 mb-6">
                <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin flex-shrink-0" />
                <span className="text-sm font-semibold text-[#D4AF37]">Analyse en cours…</span>
              </div>

              {/* Asset list */}
              <div className="space-y-2.5">
                {ASSETS.map(asset => {
                  const isAnalyzing = asset.id === currentId
                  const isDone      = doneIds.has(asset.id)
                  const isError     = errorIds.has(asset.id)

                  return (
                    <div key={asset.id} className="flex items-center gap-3">
                      {/* Icon */}
                      <div className="w-5 flex-shrink-0 flex items-center justify-center">
                        {isError ? (
                          <X className="w-4 h-4 text-[#ef4444]" />
                        ) : isDone ? (
                          <Check className="w-4 h-4 text-[#22c55e]" />
                        ) : isAnalyzing ? (
                          <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2a2a2a] block" />
                        )}
                      </div>
                      {/* Label */}
                      <span className={cn(
                        'text-sm font-mono transition-colors duration-150',
                        isError     ? 'text-[#ef4444]/60' :
                        isDone      ? 'text-[#22c55e]'    :
                        isAnalyzing ? 'text-[#D4AF37]'    :
                                      'text-[#2a2a2a]',
                      )}>
                        {isAnalyzing
                          ? `Analyse de ${asset.id}/USD en cours…`
                          : `${asset.id}/USD`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── DONE: all results ── */}
        {phase === 'done' && (
          <div className="p-5 md:p-8 max-w-[860px] mx-auto space-y-5">

            {/* Summary bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#22c55e]" />
                  <span className="text-sm font-black text-[#22c55e]">{buyCount} ACHETER</span>
                </div>
                <span className="text-[#2a2a2a] font-bold">·</span>
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-[#ef4444]" />
                  <span className="text-sm font-black text-[#ef4444]">{sellCount} VENDRE</span>
                </div>
              </div>
              <button
                onClick={reset}
                className={cn(
                  'flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border transition-all',
                  'border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10',
                )}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Relancer
              </button>
            </div>

            {/* Signal cards or error state */}
            {results.length > 0 ? (
              <div className="space-y-3">
                {results.map((sig, i) => (
                  <SignalCard key={sig.id} sig={sig} index={i} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <AlertCircle className="w-8 h-8 text-[#ef4444]/60" />
                <p className="text-sm font-semibold text-[#ef4444]/80">
                  Impossible de récupérer les données de marché
                </p>
                <p className="text-xs text-[#444] max-w-[320px] leading-relaxed">
                  L'API Binance est momentanément inaccessible depuis les serveurs.
                  Réessaie dans quelques instants.
                </p>
              </div>
            )}

            <RiskBanner />
          </div>
        )}

      </div>
    </>
  )
}
