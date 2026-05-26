'use client'

import { cn } from '@/lib/utils'
import {
  ArrowRight,
  BarChart2,
  Check,
  ImageIcon,
  MessageSquare,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const SIGNALS = [
  { id: 'BTC', decision: 'ACHETER', conf: 87, done: true   },
  { id: 'ETH', decision: 'ACHETER', conf: 79, done: true   },
  { id: 'SOL', decision: 'VENDRE',  conf: 71, done: true   },
  { id: 'BNB', decision: null,      conf: 0,  active: true },
  { id: 'XRP', decision: null,      conf: 0                },
]

const CANDLES = [
  { h: 48, bull: true  }, { h: 38, bull: false }, { h: 55, bull: true  },
  { h: 42, bull: false }, { h: 62, bull: true  }, { h: 53, bull: true  },
  { h: 70, bull: true  }, { h: 59, bull: false }, { h: 76, bull: true  },
  { h: 83, bull: true  }, { h: 67, bull: false }, { h: 90, bull: true  },
]

const MODULES = [
  { id: 'signals', label: 'Signaux Crypto',    Icon: Zap,           color: '#D4AF37' },
  { id: 'chat',    label: 'Assistant IA',       Icon: MessageSquare, color: '#818cf8' },
  { id: 'analyse', label: 'Analyse Graphique',  Icon: ImageIcon,     color: '#22c55e' },
]

export default function LandingPage() {
  const [active, setActive] = useState(0)
  const [tick,   setTick]   = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setActive(prev => (prev + 1) % 3)
      setTick(t => t + 1)
    }, 7000)
    return () => clearInterval(id)
  }, [])

  const switchTo = (i: number) => { setActive(i); setTick(t => t + 1) }
  const mod = MODULES[active]

  return (
    <div className="min-h-screen bg-[#080808] text-[#F2EDD7] overflow-x-hidden">

      <style>{`
        @keyframes tab-fill   { from { width: 0 }                               to   { width: 100% } }
        @keyframes fade-up    { from { opacity: 0; transform: translateY(6px) } to   { opacity: 1; transform: translateY(0) } }
        @keyframes scan       { 0%   { top: -2px }                              100% { top: calc(100% + 2px) } }
        @keyframes bar-grow   { from { transform: scaleY(0) }                   to   { transform: scaleY(1) } }
        @keyframes dot-bounce { 0%, 60%, 100% { transform: translateY(0) } 30% { transform: translateY(-3px) } }
        @keyframes typing-hide {
          0%   { opacity: 0; transform: translateY(4px) }
          12%  { opacity: 1; transform: translateY(0) }
          72%  { opacity: 1 }
          100% { opacity: 0 }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-[#080808]/95 backdrop-blur-md border-b border-[#1a1a1a] px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/primex-logo-dark.webp" alt="PrimeX" width={30} height={30} className="rounded-lg" />
          <span className="font-black text-lg text-[#D4AF37] tracking-tight">PrimeX</span>
          <span className="hidden sm:inline text-[9px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-1.5 py-0.5 rounded tracking-widest">IA</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login"    className="btn-outline text-sm px-4 py-2 rounded-xl">Connexion</Link>
          <Link href="/register" className="btn-gold    text-sm px-4 py-2 rounded-xl">Commencer</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-24 px-5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">

          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/8 border border-[#D4AF37]/20 text-[#D4AF37] text-[11px] font-bold px-4 py-1.5 rounded-full mb-8 tracking-wide">
              <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse" />
              Propulsé par Claude AI
            </div>

            <h1 className="text-5xl md:text-[3.4rem] font-black mb-5 leading-[1.05] tracking-tight">
              L'IA qui analyse<br />
              les marchés<br />
              <span className="text-[#D4AF37]">à ta place.</span>
            </h1>

            <p className="text-[#666] text-lg max-w-[460px] mb-9 leading-relaxed">
              Signaux crypto en temps réel, analyse de graphiques par IA et assistant trading disponible 24h/24. Prends des décisions éclairées en quelques secondes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link href="/register" className="btn-gold inline-flex items-center justify-center gap-2 text-base px-8 py-3.5 rounded-xl font-bold">
                Créer mon compte <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="btn-outline inline-flex items-center justify-center gap-2 text-base px-8 py-3.5 rounded-xl">
                Se connecter
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#444]">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#22c55e]" />Sans carte bancaire</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#22c55e]" />5 000 tokens offerts</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#22c55e]" />Annulation libre</span>
            </div>
          </div>

          {/* Right — rotating module showcase */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-3xl blur-3xl scale-95 transition-all duration-700"
              style={{ background: `${mod.color}09` }}
            />
            <div className="relative bg-[#0b0b0b] border border-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl">

              {/* Module tabs */}
              <div className="flex bg-[#080808]">
                {MODULES.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => switchTo(i)}
                    className={cn(
                      'flex-1 py-3.5 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all relative overflow-hidden',
                      active === i ? 'text-[#F2EDD7]' : 'text-[#2a2a2a] hover:text-[#444]',
                    )}
                  >
                    <m.Icon className="w-3 h-3 flex-shrink-0 transition-colors duration-500"
                      style={{ color: active === i ? m.color : 'currentColor' }} />
                    <span className="hidden sm:inline">{m.label}</span>
                    {active === i
                      ? <div key={tick} className="absolute bottom-0 left-0 h-[2px] rounded-t-full"
                          style={{ backgroundColor: m.color, animation: 'tab-fill 7s linear forwards' }} />
                      : <div className="absolute bottom-0 left-0 right-0 h-px bg-[#181818]" />
                    }
                  </button>
                ))}
              </div>

              {/* ── Stacked panels (CSS grid trick) ── */}
              <div style={{ display: 'grid' }}>

                {/* Panel 0 — Signaux Crypto */}
                <div style={{ gridArea: '1/1', opacity: active === 0 ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: active === 0 ? 'auto' : 'none' }}>
                  <div className="p-4 space-y-1.5">

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
                        <span className="text-[10px] text-[#22c55e] font-medium">Analyse en cours · 4 / 15</span>
                      </div>
                      <span className="text-[10px] text-[#333] font-mono bg-[#111] px-2 py-1 rounded-md">Claude · Live</span>
                    </div>

                    {SIGNALS.map((sig) => {
                      const bull     = sig.decision === 'ACHETER'
                      const color    = bull ? '#22c55e' : '#ef4444'
                      const isActive = !!(sig as { active?: boolean }).active
                      return (
                        <div key={sig.id} className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                          sig.done ? 'bg-[#111]' : isActive ? 'bg-[#D4AF37]/5 border border-[#D4AF37]/10' : 'opacity-20',
                        )}>
                          <div className="w-4 flex-shrink-0 flex items-center justify-center">
                            {sig.done
                              ? <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                              : isActive
                                ? <span className="w-3 h-3 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin block" />
                                : <span className="w-1.5 h-1.5 rounded-full bg-[#2a2a2a] block" />}
                          </div>
                          <span className="font-mono text-[11px] font-bold text-[#F2EDD7] w-14 flex-shrink-0">{sig.id}/USD</span>
                          {sig.done && sig.decision && (
                            <>
                              <span className="flex items-center gap-1 text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md flex-shrink-0"
                                style={{ background: color + '18', color }}>
                                {bull ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                {sig.decision}
                              </span>
                              <div className="flex-1 flex items-center gap-2 justify-end">
                                <div className="w-14 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${sig.conf}%`, backgroundColor: color }} />
                                </div>
                                <span className="text-[10px] font-mono font-bold w-8 text-right" style={{ color }}>{sig.conf}%</span>
                              </div>
                            </>
                          )}
                          {isActive && (
                            <span className="text-[11px] text-[#D4AF37] ml-1 animate-pulse">Analyse de {sig.id}/USD…</span>
                          )}
                        </div>
                      )
                    })}

                    <div className="pt-2 pb-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] text-[#333] font-mono">3 / 15 analysés</p>
                        <p className="text-[10px] text-[#333]">ETH · SOL · BNB · XRP · ADA en attente</p>
                      </div>
                      <div className="h-0.5 bg-[#181818] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#D4AF37]/60 to-[#D4AF37]/20 rounded-full" style={{ width: '26%' }} />
                      </div>
                    </div>

                    {/* Extra stats */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#141414]">
                      {[
                        { label: 'Haussiers', val: '2', color: '#22c55e' },
                        { label: 'Baissiers', val: '1', color: '#ef4444' },
                        { label: 'Win Rate',  val: '73%', color: '#D4AF37' },
                      ].map(s => (
                        <div key={s.label} className="text-center">
                          <p className="text-sm font-black" style={{ color: s.color }}>{s.val}</p>
                          <p className="text-[9px] text-[#444]">{s.label}</p>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Panel 1 — Assistant IA */}
                <div style={{ gridArea: '1/1', opacity: active === 1 ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: active === 1 ? 'auto' : 'none' }}>
                  <div key={`chat-${tick}`} className="p-4 flex flex-col gap-2.5">

                    {/* Status */}
                    <div className="flex items-center gap-2" style={{ animation: 'fade-up 0.3s ease 0.1s both' }}>
                      <span className="w-1.5 h-1.5 bg-[#818cf8] rounded-full animate-pulse" />
                      <span className="text-[10px] text-[#818cf8]">Assistant IA connecté · Claude · Temps réel</span>
                    </div>

                    {/* User message */}
                    <div className="flex justify-end" style={{ animation: 'fade-up 0.35s ease 0.3s both' }}>
                      <div className="bg-[#1a1a1a] rounded-2xl rounded-br-sm px-3.5 py-2.5 max-w-[82%]">
                        <p className="text-[11px] text-[#F2EDD7] leading-relaxed">
                          Quels seraient les meilleurs placements aujourd'hui sur le Bitcoin ?
                        </p>
                      </div>
                    </div>

                    {/* Typing indicator */}
                    <div className="flex items-center gap-1.5 pl-1"
                      style={{ animation: 'typing-hide 1.2s ease 0.6s forwards' }}>
                      {[0, 0.14, 0.28].map((d, i) => (
                        <span key={i} className="w-1.5 h-1.5 bg-[#818cf8]/50 rounded-full block"
                          style={{ animation: `dot-bounce 0.5s ease ${d}s infinite` }} />
                      ))}
                    </div>

                    {/* AI response card */}
                    <div className="bg-[#818cf8]/8 border border-[#818cf8]/15 rounded-2xl rounded-bl-sm px-3.5 py-3 space-y-2">

                      <div className="flex items-center justify-between" style={{ animation: 'fade-up 0.3s ease 1.7s both' }}>
                        <p className="text-[10px] text-[#818cf8] font-bold uppercase tracking-wider">Analyse BTC/USD · Claude</p>
                        <span className="text-[9px] font-mono text-[#333]">H4 · Live data</span>
                      </div>

                      <div className="flex items-center gap-3" style={{ animation: 'fade-up 0.3s ease 2.0s both' }}>
                        <span className="text-xs font-bold text-[#F2EDD7]">BTC : 67 432 $</span>
                        <span className="text-[10px] text-[#22c55e] font-semibold">+2.3% / 24h</span>
                        <span className="text-[9px] text-[#444]">RSI 61 · MACD haussier</span>
                      </div>

                      <div className="h-px bg-[#818cf8]/10" style={{ animation: 'fade-up 0.2s ease 2.3s both' }} />

                      <div style={{ animation: 'fade-up 0.3s ease 2.5s both' }}>
                        <p className="text-[9px] text-[#555] uppercase tracking-widest mb-1.5">Position recommandée</p>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#22c55e]/15 text-[#22c55e]">LONG PROGRESSIF</span>
                          <span className="text-[10px] text-[#666]">Entrée : 66 800 – 67 200 $</span>
                        </div>
                        <p className="text-[9px] text-[#444] leading-relaxed">Rebond sur EMA50 + zone de demande H4 confirmée</p>
                      </div>

                      <div className="space-y-1" style={{ animation: 'fade-up 0.3s ease 3.0s both' }}>
                        <p className="text-[9px] text-[#555] uppercase tracking-widest">Objectifs de profit</p>
                        {[
                          { label: 'TP1', val: '68 800 $', pct: '+2.4%', delay: '3.2s' },
                          { label: 'TP2', val: '70 100 $', pct: '+4.2%', delay: '3.55s' },
                          { label: 'TP3', val: '72 500 $', pct: '+7.7%', delay: '3.9s' },
                        ].map(({ label, val, pct, delay }) => (
                          <div key={label} className="flex items-center gap-2"
                            style={{ animation: `fade-up 0.3s ease ${delay} both` }}>
                            <span className="text-[9px] text-[#444] w-6 font-mono">{label}</span>
                            <span className="text-[10px] font-mono font-bold text-[#22c55e]">{val}</span>
                            <span className="text-[9px] text-[#22c55e]/60">{pct}</span>
                          </div>
                        ))}
                      </div>

                      <div className="h-px bg-[#818cf8]/10" style={{ animation: 'fade-up 0.2s ease 4.2s both' }} />

                      <div className="flex items-start gap-5" style={{ animation: 'fade-up 0.3s ease 4.4s both' }}>
                        <div>
                          <p className="text-[9px] text-[#555] mb-0.5">Stop Loss</p>
                          <p className="text-[10px] font-mono font-bold text-[#ef4444]">
                            65 500 $ <span className="font-normal text-[#ef4444]/60 text-[9px]">-2.5%</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-[#555] mb-0.5">Risque / Rendement</p>
                          <p className="text-[10px] font-bold text-[#F2EDD7]">R/R 1:3 minimum</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-[#555] mb-0.5">Taille position</p>
                          <p className="text-[10px] font-bold text-[#F2EDD7]">2% du capital max</p>
                        </div>
                      </div>

                      <div style={{ animation: 'fade-up 0.35s ease 5.2s both' }}>
                        <div className="h-px bg-[#818cf8]/10 mb-2" />
                        <p className="text-[9px] text-[#555] uppercase tracking-widest mb-1">Scénario</p>
                        <p className="text-[10px] text-[#666] leading-relaxed">
                          Structure haussière intacte depuis le support 63 200$. Volume croissant sur les bougies vertes. Attendre confirmation d'une cassure propre de la résistance H4 avant d'entrer.
                        </p>
                      </div>

                    </div>

                    <p className="text-[9px] text-[#2a2a2a] text-right"
                      style={{ animation: 'fade-up 0.3s ease 6.4s both' }}>
                      1 847 tokens utilisés
                    </p>

                  </div>
                </div>

                {/* Panel 2 — Analyse Graphique */}
                <div style={{ gridArea: '1/1', opacity: active === 2 ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: active === 2 ? 'auto' : 'none' }}>
                  <div key={`analyse-${tick}`} className="p-4">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-3"
                      style={{ animation: 'fade-up 0.3s ease 0.15s both' }}>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
                        <span className="text-[10px] text-[#22c55e]">BTC/USD · H4 · Analyse graphique terminée</span>
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-lg bg-[#22c55e]/15 text-[#22c55e]">HAUSSIER</span>
                    </div>

                    {/* Chart + trend */}
                    <div className="flex gap-3 mb-3">

                      {/* Mini chart */}
                      <div className="relative flex-shrink-0 rounded-xl overflow-hidden bg-[#080808] border border-[#1a1a1a] w-[108px] h-[100px]">
                        {/* Grid lines */}
                        {[25, 50, 75].map(p => (
                          <div key={p} className="absolute left-0 right-0 h-px bg-[#141414]" style={{ top: `${p}%` }} />
                        ))}
                        {/* Support dashed line */}
                        <div className="absolute left-0 right-0 h-px border-t border-dashed border-[#22c55e]/50"
                          style={{ bottom: '24%' }} />
                        {/* Resistance dashed line */}
                        <div className="absolute left-0 right-0 h-px border-t border-dashed border-[#ef4444]/40"
                          style={{ top: '12%' }} />
                        {/* Label R */}
                        <span className="absolute right-1 top-[4px] text-[7px] text-[#ef4444]/60 font-mono">R1</span>
                        {/* Label S */}
                        <span className="absolute right-1 text-[7px] text-[#22c55e]/60 font-mono" style={{ bottom: 'calc(24% + 2px)' }}>S1</span>
                        {/* Candles */}
                        <div className="absolute bottom-0 left-0 right-0 flex items-end gap-[2px] px-1.5 pb-1.5">
                          {CANDLES.map((c, i) => (
                            <div key={i} className="flex-1 rounded-sm origin-bottom"
                              style={{
                                height: `${c.h}%`,
                                backgroundColor: c.bull ? '#22c55e' : '#ef4444',
                                opacity: 0.45 + (i / CANDLES.length) * 0.55,
                                animation: `bar-grow 0.2s ease ${(i * 0.045).toFixed(3)}s both`,
                              }}
                            />
                          ))}
                        </div>
                        {/* Flag zone overlay */}
                        <div className="absolute rounded-sm"
                          style={{ left: '50%', right: '8%', top: '16%', bottom: '32%', background: '#D4AF3710', border: '1px solid #D4AF3728' }} />
                        {/* Breakout arrow indicator */}
                        <div className="absolute right-2 text-[8px] text-[#D4AF37]"
                          style={{ top: '8%', animation: 'fade-up 0.4s ease 1.5s both' }}>↗</div>
                        {/* Scan line */}
                        <div className="absolute left-0 right-0 h-px"
                          style={{ background: 'linear-gradient(90deg, transparent, #22c55e45, transparent)', animation: 'scan 2.2s ease-in-out 0.6s', top: 0 }} />
                      </div>

                      {/* Trend + structure + figure */}
                      <div className="flex-1 space-y-2.5">
                        <div style={{ animation: 'fade-up 0.3s ease 1.3s both' }}>
                          <p className="text-[8px] text-[#444] uppercase tracking-widest mb-0.5">Tendance générale</p>
                          <p className="text-[11px] font-black text-[#22c55e]">HAUSSIERE</p>
                        </div>
                        <div style={{ animation: 'fade-up 0.3s ease 1.7s both' }}>
                          <p className="text-[8px] text-[#444] uppercase tracking-widest mb-0.5">Structure de prix</p>
                          <p className="text-[10px] font-bold text-[#F2EDD7]">Higher Highs · Higher Lows</p>
                        </div>
                        <div style={{ animation: 'fade-up 0.3s ease 2.1s both' }}>
                          <p className="text-[8px] text-[#444] uppercase tracking-widest mb-0.5">Figure chartiste</p>
                          <p className="text-[10px] font-bold text-[#D4AF37]">Flag haussier (H4)</p>
                        </div>
                      </div>
                    </div>

                    {/* Supports / Resistances grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 pb-3 border-b border-[#141414]">
                      {[
                        { label: 'Support S1',    val: '66 200 $', color: '#22c55e', note: 'testé 3x · niveau majeur',         delay: '2.5s' },
                        { label: 'Résistance R1', val: '68 900 $', color: '#ef4444', note: 'résistance H4 clé',                delay: '2.8s' },
                        { label: 'Support S2',    val: '64 800 $', color: '#22c55e', note: 'zone institutionnelle',            delay: '3.1s' },
                        { label: 'Résistance R2', val: '70 100 $', color: '#ef4444', note: 'ATH local + accumulation liq.',    delay: '3.4s' },
                      ].map(({ label, val, color, note, delay }) => (
                        <div key={label} style={{ animation: `fade-up 0.3s ease ${delay} both` }}>
                          <p className="text-[8px] text-[#444] mb-0.5">{label}</p>
                          <p className="text-[10px] font-mono font-bold" style={{ color }}>{val}</p>
                          <p className="text-[8px] text-[#2e2e2e] leading-tight">{note}</p>
                        </div>
                      ))}
                    </div>

                    {/* Liquidity + signal */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between"
                        style={{ animation: 'fade-up 0.3s ease 3.9s both' }}>
                        <span className="text-[9px] text-[#555]">Zone de liquidité</span>
                        <span className="text-[10px] font-mono font-bold text-[#D4AF37]">67 800 – 68 100 $</span>
                      </div>
                      <div className="flex items-center justify-between"
                        style={{ animation: 'fade-up 0.3s ease 4.4s both' }}>
                        <span className="text-[9px] text-[#555]">Cassure potentielle</span>
                        <span className="text-[10px] font-bold text-[#D4AF37]">
                          Au-dessus de 68 100 $
                        </span>
                      </div>
                      <div className="flex items-center justify-between"
                        style={{ animation: 'fade-up 0.3s ease 4.9s both' }}>
                        <span className="text-[9px] text-[#555]">Signal</span>
                        <span className="text-[10px] font-bold text-[#22c55e] animate-pulse">Cassure imminente</span>
                      </div>
                    </div>

                    {/* Confidence */}
                    <div style={{ animation: 'fade-up 0.4s ease 5.5s both' }}>
                      <div className="flex items-center justify-between text-[9px] mb-1.5">
                        <span className="text-[#444]">Confiance de l'analyse</span>
                        <span className="text-[#22c55e] font-bold">78%</span>
                      </div>
                      <div className="h-1 bg-[#181818] rounded-full overflow-hidden">
                        <div className="h-full bg-[#22c55e] rounded-full"
                          style={{ width: '78%', animation: 'tab-fill 0.9s ease 5.9s both' }} />
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Dots navigation */}
              <div className="flex gap-2 justify-center py-3 border-t border-[#111]">
                {MODULES.map((m, i) => (
                  <button key={m.id} onClick={() => switchTo(i)}
                    className="h-[3px] rounded-full transition-all duration-500"
                    style={{ width: active === i ? 20 : 6, backgroundColor: active === i ? m.color : '#1e1e1e' }} />
                ))}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── Stats ── */}
      <div className="border-y border-[#151515] bg-[#060606] py-8">
        <div className="max-w-4xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { n: '15',    label: 'Cryptos analysées' },
            { n: '3',     label: 'Modules IA'         },
            { n: '24/7',  label: 'Disponible'         },
            { n: 'Claude',label: 'Modèle IA'          },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-black text-[#D4AF37]">{s.n}</p>
              <p className="text-xs font-medium text-[#555] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modules ── */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-14">
            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[4px] mb-4">Modules</p>
            <h2 className="text-4xl font-black text-[#F2EDD7]">Trois outils. Zéro compromis.</h2>
            <p className="text-[#555] text-sm mt-4 max-w-sm mx-auto">Chaque module fait une chose, et la fait parfaitement.</p>
          </div>

          {/* Signaux Crypto */}
          <div className="mb-4 bg-[#0b0b0b] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-8 md:p-10">
                <div className="inline-flex items-center gap-2 bg-[#D4AF37]/8 border border-[#D4AF37]/15 px-3 py-1 rounded-full mb-6">
                  <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">Live</span>
                </div>
                <h3 className="text-2xl font-black text-[#F2EDD7] mb-3">Signaux Crypto</h3>
                <p className="text-[#555] text-sm leading-relaxed mb-6">
                  En un clic, l'IA analyse les 15 principales cryptomonnaies et te donne une direction claire : <strong className="text-[#F2EDD7]">ACHETER ou VENDRE</strong>. Prix d'entrée, trois objectifs de profit et stop loss calculés automatiquement.
                </p>
                <ul className="space-y-2.5">
                  {['15 cryptos en simultané', 'RSI, MACD, EMA50/200, ATR, Volume', 'Confiance de 51 à 95% par signal', 'TP1, TP2, TP3 et Stop Loss automatiques'].map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-[#777]">
                      <Check className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-[#1a1a1a] bg-[#080808] p-6 flex items-center justify-center min-h-[220px]">
                <div className="space-y-2 w-full max-w-[260px]">
                  {[
                    { sym: 'BTC', dir: 'ACHETER', conf: 87, bull: true  },
                    { sym: 'ETH', dir: 'ACHETER', conf: 79, bull: true  },
                    { sym: 'SOL', dir: 'VENDRE',  conf: 71, bull: false },
                  ].map(r => (
                    <div key={r.sym} className="flex items-center gap-3 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-3 py-2.5">
                      <span className="font-mono text-[11px] font-bold text-[#F2EDD7] w-10">{r.sym}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md"
                        style={{ color: r.bull ? '#22c55e' : '#ef4444', background: (r.bull ? '#22c55e' : '#ef4444') + '18' }}>
                        {r.dir}
                      </span>
                      <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${r.conf}%`, backgroundColor: r.bull ? '#22c55e' : '#ef4444' }} />
                      </div>
                      <span className="text-[10px] font-mono font-bold" style={{ color: r.bull ? '#22c55e' : '#ef4444' }}>{r.conf}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Assistant + Analyse */}
          <div className="grid md:grid-cols-2 gap-4">

            <div className="bg-[#0b0b0b] border border-[#1a1a1a] rounded-2xl p-8">
              <div className="w-10 h-10 rounded-xl bg-[#818cf8]/10 border border-[#818cf8]/20 flex items-center justify-center mb-5">
                <MessageSquare className="w-5 h-5 text-[#818cf8]" />
              </div>
              <h3 className="text-xl font-black text-[#F2EDD7] mb-2">Assistant IA</h3>
              <p className="text-[#555] text-sm leading-relaxed mb-6">
                Pose n'importe quelle question sur les marchés. L'IA répond avec les données en temps réel, propose des idées de trade avec entrée, stop et objectifs.
              </p>
              <div className="space-y-2">
                <div className="bg-[#111] rounded-xl px-4 py-2.5 text-xs text-[#555]">À combien est le Bitcoin aujourd'hui ?</div>
                <div className="bg-[#818cf8]/8 border border-[#818cf8]/15 rounded-xl px-4 py-2.5 text-xs text-[#ccc] leading-relaxed">
                  Le Bitcoin est à <strong className="text-[#F2EDD7]">67 432 $</strong>, en hausse de 2.3%. Signal haussier sur le RSI...
                </div>
              </div>
            </div>

            <div className="bg-[#0b0b0b] border border-[#1a1a1a] rounded-2xl p-8">
              <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center mb-5">
                <ImageIcon className="w-5 h-5 text-[#22c55e]" />
              </div>
              <h3 className="text-xl font-black text-[#F2EDD7] mb-2">Analyse Graphique</h3>
              <p className="text-[#555] text-sm leading-relaxed mb-6">
                Envoie une capture d'écran de n'importe quel graphique. L'IA identifie les tendances, supports, résistances et figures chartistes, puis te donne une stratégie complète.
              </p>
              <div className="border-2 border-dashed border-[#1a1a1a] rounded-xl p-5 text-center bg-[#080808]">
                <ImageIcon className="w-6 h-6 text-[#333] mx-auto mb-2" />
                <p className="text-xs text-[#333]">TradingView, MT4, MT5, Binance…</p>
                <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                  {['TradingView', 'Binance', 'MT4', 'Bybit'].map(p => (
                    <span key={p} className="text-[10px] bg-[#111] border border-[#1a1a1a] text-[#444] px-2 py-0.5 rounded-md">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Comment ca marche ── */}
      <section className="py-20 px-5 border-t border-[#151515]">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[4px] mb-4">Démarrage</p>
          <h2 className="text-4xl font-black text-[#F2EDD7]">Prêt en 60 secondes.</h2>
        </div>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { n: '1', title: 'Créez votre compte',   desc: 'Inscription gratuite en 30 secondes. Aucune carte bancaire requise.' },
            { n: '2', title: 'Choisissez un module', desc: 'Signaux Crypto, Assistant IA ou Analyse Graphique. Tout est disponible depuis le tableau de bord.' },
            { n: '3', title: 'Prenez vos décisions', desc: "L'IA analyse et vous fournit des signaux clairs. A vous d'agir." },
          ].map((step) => (
            <div key={step.n} className="relative text-center p-6">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center mx-auto mb-4">
                <span className="text-sm font-black text-[#D4AF37]">{step.n}</span>
              </div>
              <h3 className="font-bold text-[#F2EDD7] mb-2 text-base">{step.title}</h3>
              <p className="text-sm text-[#555] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust bar ── */}
      <div className="border-t border-[#151515] py-8 px-5">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { icon: <ShieldCheck className="w-4 h-4" />, label: 'Paiements sécurisés', sub: 'Stripe'                   },
            { icon: <BarChart2   className="w-4 h-4" />, label: 'Données temps réel',  sub: 'Binance, Kraken'          },
            { icon: <Check       className="w-4 h-4" />, label: 'Sans engagement',      sub: 'Résiliable à tout moment' },
            { icon: <Zap         className="w-4 h-4" />, label: 'IA de pointe',         sub: 'Claude par Anthropic'     },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-2.5 text-left">
              <div className="text-[#D4AF37]/60">{t.icon}</div>
              <div>
                <p className="text-xs font-semibold text-[#F2EDD7]">{t.label}</p>
                <p className="text-[10px] text-[#444]">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA final ── */}
      <section className="py-24 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative inline-block mb-10">
            <div className="absolute inset-0 bg-[#D4AF37]/8 rounded-3xl blur-3xl scale-110" />
            <div className="relative bg-[#0b0b0b] border border-[#202020] rounded-2xl px-10 py-10">
              <h2 className="text-4xl font-black text-[#F2EDD7] mb-3 leading-tight">
                Prêt à trader<br /><span className="text-[#D4AF37]">plus intelligemment ?</span>
              </h2>
              <p className="text-[#555] text-sm mb-8">5 000 tokens offerts. Aucune carte bancaire.</p>
              <Link href="/register" className="btn-gold inline-flex items-center justify-center gap-2 text-base px-10 py-4 rounded-xl font-black">
                Démarrer gratuitement <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[10px] text-[#333] mt-4">Contenu éducatif uniquement. Le trading comporte un risque de perte en capital.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#151515] py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/primex-logo-dark.webp" alt="PrimeX" width={22} height={22} className="rounded-md opacity-60" />
            <span className="text-xs text-[#333] font-semibold">PrimeX IA</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-[#333]">
            <Link href="/legal/cgu"     className="hover:text-[#555] transition-colors">CGU</Link>
            <Link href="/legal/privacy" className="hover:text-[#555] transition-colors">Confidentialité</Link>
            <Link href="/legal/cgv"     className="hover:text-[#555] transition-colors">CGV</Link>
            <Link href="/support"       className="hover:text-[#555] transition-colors">Support</Link>
          </div>
          <p className="text-[10px] text-[#2a2a2a]">© 2025 PrimeX. Contenu éducatif uniquement.</p>
        </div>
      </footer>

    </div>
  )
}
