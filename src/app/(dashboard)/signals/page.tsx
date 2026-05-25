'use client'
import { RiskBanner } from '@/components/ui/risk-banner'
import { cn } from '@/lib/utils'
import { Loader2, RefreshCw, TrendingDown, TrendingUp, Zap } from 'lucide-react'
import { useState } from 'react'
import type { CryptoSignal } from '@/app/api/signals/crypto/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(price: number, id: string): string {
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
  const bgCard = bull ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)'
  const border = bull ? 'rgba(34,197,94,0.2)'  : 'rgba(239,68,68,0.2)'

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: bgCard, borderColor: border,
        animation: `fadeSlideIn 0.4s ease both`,
        animationDelay: `${index * 60}ms` }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: border }}>
        <div>
          <p className="text-lg font-black text-[#F2EDD7] font-mono tracking-tight">{sig.symbol}</p>
          <p className="text-xs text-[#555] mt-0.5">{sig.name}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-sm tracking-widest"
          style={{ color, background: color + '18', borderColor: color + '40' }}>
          {bull
            ? <TrendingUp  className="w-4 h-4" />
            : <TrendingDown className="w-4 h-4" />}
          {sig.decision}
        </div>
      </div>

      {/* Levels grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#1a1a1a]">
        {/* Entry */}
        <div className="bg-[#0c0c0c] px-4 py-3">
          <p className="text-[10px] text-[#444] uppercase tracking-widest mb-1">Prix d'entrée</p>
          <p className="text-sm font-bold text-[#F2EDD7] font-mono">{fmt(sig.entry, sig.id)}</p>
        </div>
        {/* TP1 */}
        <div className="bg-[#0c0c0c] px-4 py-3">
          <p className="text-[10px] text-[#444] uppercase tracking-widest mb-1">TP1</p>
          <p className="text-sm font-bold font-mono" style={{ color }}>{fmt(sig.tp1, sig.id)}</p>
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: color + 'aa' }}>{sign(sig.tp1Pct)}</p>
        </div>
        {/* TP2 */}
        <div className="bg-[#0c0c0c] px-4 py-3">
          <p className="text-[10px] text-[#444] uppercase tracking-widest mb-1">TP2</p>
          <p className="text-sm font-bold font-mono" style={{ color }}>{fmt(sig.tp2, sig.id)}</p>
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: color + 'aa' }}>{sign(sig.tp2Pct)}</p>
        </div>
        {/* TP3 */}
        <div className="bg-[#0c0c0c] px-4 py-3">
          <p className="text-[10px] text-[#444] uppercase tracking-widest mb-1">TP3</p>
          <p className="text-sm font-bold font-mono" style={{ color }}>{fmt(sig.tp3, sig.id)}</p>
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: color + 'aa' }}>{sign(sig.tp3Pct)}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3.5 gap-4 flex-wrap">
        {/* Stop loss */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#444] uppercase tracking-wider">Stop Loss</span>
          <span className="text-sm font-bold text-[#ef4444] font-mono">{fmt(sig.sl, sig.id)}</span>
          <span className="text-[11px] text-[#ef4444]/60 font-mono">{sign(sig.slPct)}</span>
        </div>
        {/* Chances bar */}
        <div className="flex items-center gap-3 flex-1 min-w-[160px] max-w-[280px]">
          <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${sig.chances}%`, backgroundColor: color }} />
          </div>
          <span className="text-xs font-black font-mono flex-shrink-0 w-20 text-right" style={{ color }}>
            {sig.chances}% de chances
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type State = 'idle' | 'loading' | 'done'

const TOTAL = 15

export default function SignalsPage() {
  const [state,    setState]    = useState<State>('idle')
  const [results,  setResults]  = useState<CryptoSignal[]>([])
  const [progress, setProgress] = useState(0)
  const [current,  setCurrent]  = useState('')

  const ASSET_NAMES: Record<string, string> = {
    BTC:'Bitcoin', ETH:'Ethereum', SOL:'Solana', BNB:'BNB', XRP:'XRP',
    ADA:'Cardano', DOGE:'Dogecoin', AVAX:'Avalanche', LINK:'Chainlink',
    MATIC:'Polygon', DOT:'Polkadot', TRX:'TRON', LTC:'Litecoin',
    NEAR:'NEAR Protocol', TON:'Toncoin',
  }

  const launch = async () => {
    setState('loading')
    setResults([])
    setProgress(0)
    setCurrent('')

    try {
      const res = await fetch('/api/signals/crypto')
      if (!res.ok || !res.body) { setState('idle'); return }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buf     = ''
      let   count   = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.done) { setState('done'); return }
            count++
            setProgress(count)
            setCurrent(ASSET_NAMES[data.id] ?? data.id)
            if (!data.error) setResults(prev => [...prev, data as CryptoSignal])
          } catch {}
        }
      }
    } catch {
      setState('idle')
    } finally {
      setState('done')
    }
  }

  const reset = () => { setState('idle'); setResults([]); setProgress(0); setCurrent('') }

  const buyCount  = results.filter(r => r.decision === 'ACHETER').length
  const sellCount = results.filter(r => r.decision === 'VENDRE').length

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-full bg-[#080808]">

        {/* ── IDLE: landing screen ── */}
        {state === 'idle' && (
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
          </div>
        )}

        {/* ── LOADING ── */}
        {state === 'loading' && (
          <div className="p-5 md:p-8 max-w-[860px] mx-auto space-y-6">
            {/* Progress header */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-semibold">
                    {current ? `Analyse de ${current}…` : 'Démarrage…'}
                  </span>
                </div>
                <span className="font-mono font-bold text-[#555]">{progress} / {TOTAL}</span>
              </div>
              <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div className="h-full bg-[#D4AF37] rounded-full transition-all duration-500"
                  style={{ width: `${(progress / TOTAL) * 100}%` }} />
              </div>
            </div>

            {/* Results so far */}
            {results.length > 0 && (
              <div className="space-y-3">
                {results.map((sig, i) => <SignalCard key={sig.id} sig={sig} index={i} />)}
              </div>
            )}
          </div>
        )}

        {/* ── DONE ── */}
        {state === 'done' && (
          <div className="p-5 md:p-8 max-w-[860px] mx-auto space-y-5">
            {/* Summary bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp  className="w-4 h-4 text-[#22c55e]" />
                  <span className="text-sm font-black text-[#22c55e]">{buyCount} ACHETER</span>
                </div>
                <div className="flex items-center gap-2">
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

            {/* All cards */}
            <div className="space-y-3">
              {results.map((sig, i) => <SignalCard key={sig.id} sig={sig} index={i} />)}
            </div>

            <RiskBanner />
          </div>
        )}
      </div>
    </>
  )
}
