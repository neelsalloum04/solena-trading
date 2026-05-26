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
        @keyframes scale-in { from { opacity: 0; transform: scale(0.94) } to { opacity: 1; transform: scale(1) } }
        @keyframes scan-x   { 0% { left: -22% } 100% { left: 110% } }

        @keyframes cursor-drift {
          0%   { opacity: 0; transform: translate(-6px, -6px) }
          12%  { opacity: 1; transform: translate(-6px, -6px) }
          28%  { opacity: 1; transform: translate(2px, 2px) }
          34%  { opacity: 1; transform: translate(2px, 2px) scale(0.8) }
          40%  { opacity: 1; transform: translate(2px, 2px) scale(1) }
          85%  { opacity: 1 }
          92%  { opacity: 0 }
          100% { opacity: 0 }
        }
        @keyframes btn-scan-flash {
          0%, 32%  { box-shadow: none; transform: scale(1) }
          35%, 39% { box-shadow: 0 0 22px rgba(212,175,55,0.45); transform: scale(0.96) }
          42%      { box-shadow: none; transform: scale(1) }
          100%     { box-shadow: none; transform: scale(1) }
        }
        @keyframes sig-row-1 {
          0%, 36% { opacity: 0; transform: translateY(5px) }
          44%     { opacity: 1; transform: translateY(0) }
          85%     { opacity: 1 }
          92%     { opacity: 0 }
          100%    { opacity: 0 }
        }
        @keyframes sig-row-2 {
          0%, 42% { opacity: 0; transform: translateY(5px) }
          50%     { opacity: 1; transform: translateY(0) }
          85%     { opacity: 1 }
          92%     { opacity: 0 }
          100%    { opacity: 0 }
        }
        @keyframes sig-row-3 {
          0%, 48% { opacity: 0; transform: translateY(5px) }
          56%     { opacity: 1; transform: translateY(0) }
          85%     { opacity: 1 }
          92%     { opacity: 0 }
          100%    { opacity: 0 }
        }
        @keyframes sig-row-4 {
          0%, 54% { opacity: 0; transform: translateY(5px) }
          62%     { opacity: 1; transform: translateY(0) }
          85%     { opacity: 1 }
          92%     { opacity: 0 }
          100%    { opacity: 0 }
        }
        @keyframes chat-msg-1 {
          0%      { opacity: 0; transform: translateY(4px) }
          12%     { opacity: 1; transform: translateY(0) }
          87%     { opacity: 1 }
          94%     { opacity: 0 }
          100%    { opacity: 0 }
        }
        @keyframes chat-typing {
          0%, 10% { opacity: 0 }
          14%     { opacity: 1 }
          30%     { opacity: 1 }
          36%     { opacity: 0 }
          100%    { opacity: 0 }
        }
        @keyframes chat-reply {
          0%, 33% { opacity: 0; transform: translateY(4px) }
          42%     { opacity: 1; transform: translateY(0) }
          87%     { opacity: 1 }
          94%     { opacity: 0 }
          100%    { opacity: 0 }
        }
        @keyframes ag-upload {
          0%      { opacity: 0; transform: scale(0.94) }
          10%     { opacity: 1; transform: scale(1) }
          88%     { opacity: 1 }
          95%     { opacity: 0 }
          100%    { opacity: 0 }
        }
        @keyframes ag-thinking {
          0%, 20% { opacity: 0 }
          30%     { opacity: 1 }
          48%     { opacity: 1 }
          55%     { opacity: 0 }
          100%    { opacity: 0 }
        }
        @keyframes ag-results {
          0%, 48% { opacity: 0; transform: translateY(4px) }
          58%     { opacity: 1; transform: translateY(0) }
          88%     { opacity: 1 }
          95%     { opacity: 0 }
          100%    { opacity: 0 }
        }
        @keyframes ag-bar {
          0%, 58% { width: 0% }
          75%     { width: 81% }
          88%     { width: 81% }
          95%     { width: 0% }
          100%    { width: 0% }
        }
        @keyframes ag-scan {
          0%, 10% { left: -22%; opacity: 0 }
          12%     { left: -22%; opacity: 1 }
          46%     { left: 110%; opacity: 1 }
          50%     { left: 110%; opacity: 0 }
          100%    { left: 110%; opacity: 0 }
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
          <Link href="/signup" className="btn-gold    text-sm px-4 py-2 rounded-xl">Commencer</Link>
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
              <Link href="/signup" className="btn-gold inline-flex items-center justify-center gap-2 text-base px-8 py-3.5 rounded-xl font-bold">
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
                  <div key={`analyse-${tick}`} className="p-4 flex flex-col gap-2.5">

                    {/* Status */}
                    <div className="flex items-center gap-2" style={{ animation: 'fade-up 0.3s ease 0.1s both' }}>
                      <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
                      <span className="text-[10px] text-[#22c55e]">BTC/USD · H1 · Graphique reçu</span>
                    </div>

                    {/* ── Phase 1 : graphique ── */}
                    <div style={{ animation: 'scale-in 0.45s ease 0.25s both' }}>
                      <div className="rounded-xl overflow-hidden border border-[#ddd] shadow-sm" style={{ background: '#fff' }}>

                        {/* Header style TradingView */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#efefef]" style={{ background: '#f7f7f7' }}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[7.5px] font-bold text-[#222]">BTC/USD</span>
                            <span className="text-[7px] text-[#ccc]">·</span>
                            <span className="text-[7px] text-[#888]">1H</span>
                            <span className="text-[7px] text-[#ccc]">·</span>
                            <span className="text-[7px] text-[#bbb]">26 mai 2026</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[7px] text-[#999]">Clôture préc.</span>
                            <span className="text-[7.5px] bg-[#ef4444] text-white font-bold px-1.5 py-0.5 rounded font-mono">76 814</span>
                          </div>
                        </div>

                        {/* SVG — width 100% height auto = aucune déformation */}
                        <div className="relative">
                          <svg
                            viewBox="0 0 200 50"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                          >
                            <defs>
                              <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%"   stopColor="#ef4444" stopOpacity="0.18" />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.01" />
                              </linearGradient>
                            </defs>
                            {/* Grid */}
                            {[12, 25, 38].map(y => (
                              <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#f2f2f2" strokeWidth="0.5" />
                            ))}
                            {/* Support dashed vert */}
                            <line x1="0" y1="48" x2="200" y2="48" stroke="#22c55e" strokeWidth="0.7" strokeDasharray="3,2" />
                            {/* Résistance dashed rouge (portion gauche seulement) */}
                            <line x1="0" y1="3.5" x2="70" y2="3.5" stroke="#ef4444" strokeWidth="0.7" strokeDasharray="3,2" opacity="0.5" />
                            {/* Fill rose */}
                            <polygon
                              points="0,3.5 5,8 11,18 17,28 22,33 26,42 33,46 37,42 42,43 47,45 50,46 58,43 67,42 72,44 75,45 83,46 90,44 95,46 100,46 103,48 106,49 109,45 117,41 125,38 133,35 140,33 150,31 160,29 167,28 172,23 178,18 183,20 188,22 192,23 196,23 200,23 200,50 0,50"
                              fill="url(#fillGrad)"
                            />
                            {/* Ligne rouge */}
                            <polyline
                              points="0,3.5 5,8 11,18 17,28 22,33 26,42 33,46 37,42 42,43 47,45 50,46 58,43 67,42 72,44 75,45 83,46 90,44 95,46 100,46 103,48 106,49 109,45 117,41 125,38 133,35 140,33 150,31 160,29 167,28 172,23 178,18 183,20 188,22 192,23 196,23 200,23"
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="1.1"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                          </svg>

                          {/* Scan beam horizontal */}
                          <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div
                              className="absolute top-0 bottom-0"
                              style={{
                                width: '22%',
                                background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.2), transparent)',
                                animation: 'scan-x 2.2s ease-in-out 0.5s',
                                left: 0,
                              }}
                            />
                          </div>
                        </div>

                        {/* Labels d'heure en HTML — pas de déformation, rendu net */}
                        <div className="flex justify-between px-2 py-1 border-t border-[#f0f0f0]" style={{ background: '#fafafa' }}>
                          {['02:00', '04:00', '06:00', '08:00'].map(t => (
                            <span key={t} className="text-[7px] text-[#bbb] font-mono">{t}</span>
                          ))}
                        </div>

                      </div>
                    </div>

                    {/* ── Phase 2 : thinking ── */}
                    <div className="flex items-center gap-2"
                      style={{ animation: 'typing-hide 1.3s ease 1.1s forwards' }}>
                      {[0, 0.13, 0.26].map((d, i) => (
                        <span key={i} className="w-1.5 h-1.5 bg-[#22c55e]/60 rounded-full block"
                          style={{ animation: `dot-bounce 0.5s ease ${d}s infinite` }} />
                      ))}
                      <span className="text-[10px] text-[#555]">Identification des niveaux clés…</span>
                    </div>

                    {/* ── Phase 3 : résultats ── */}
                    <div className="flex items-center justify-between"
                      style={{ animation: 'fade-up 0.3s ease 2.6s both' }}>
                      <div>
                        <p className="text-[8px] text-[#555] uppercase tracking-widest">Tendance H1</p>
                        <p className="text-[11px] font-black text-[#ef4444]">BAISSIERE</p>
                        <p className="text-[9px] text-[#444]">Lower Highs · Lower Lows · Rebond technique</p>
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-[#ef4444]/15 text-[#ef4444]">VENDRE</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 pb-2.5 border-b border-[#141414]">
                      {[
                        { label: 'Support majeur',   val: '76 380 $', color: '#22c55e', note: 'creux 26 mai · V-bottom',   delay: '3.0s'  },
                        { label: 'Résistance clé',   val: '77 200 $', color: '#ef4444', note: 'rejet 02:00 · niveau fort', delay: '3.35s' },
                        { label: 'Zone de rebond',   val: '76 900 $', color: '#D4AF37', note: '76 700 – 76 900$ (actuel)', delay: '3.7s'  },
                        { label: 'Figure chartiste', val: 'Corr. V',  color: '#D4AF37', note: 'retrace haussier H1',       delay: '4.05s' },
                      ].map(({ label, val, color, note, delay }) => (
                        <div key={label} style={{ animation: `fade-up 0.3s ease ${delay} both` }}>
                          <p className="text-[8px] text-[#444]">{label}</p>
                          <p className="text-[10px] font-mono font-bold" style={{ color }}>{val}</p>
                          <p className="text-[8px] text-[#333] leading-tight">{note}</p>
                        </div>
                      ))}
                    </div>

                    <div style={{ animation: 'fade-up 0.35s ease 4.5s both' }}>
                      <p className="text-[8px] text-[#555] uppercase tracking-widest mb-1">Scénario</p>
                      <p className="text-[10px] text-[#666] leading-relaxed">
                        Rebond sur support 76 380$. Short au retest 76 900-77 000$ avec SL 77 300$. Cible principale : 76 200$.
                      </p>
                    </div>

                    <div style={{ animation: 'fade-up 0.4s ease 5.5s both' }}>
                      <div className="flex items-center justify-between text-[9px] mb-1.5">
                        <span className="text-[#444]">Confiance de l'analyse</span>
                        <span className="text-[#ef4444] font-bold">81%</span>
                      </div>
                      <div className="h-1 bg-[#181818] rounded-full overflow-hidden">
                        <div className="h-full bg-[#ef4444] rounded-full"
                          style={{ width: '81%', animation: 'tab-fill 0.9s ease 5.9s both' }} />
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

          <div className="text-center mb-16">
            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[4px] mb-4">Modules</p>
            <h2 className="text-4xl font-black text-[#F2EDD7]">Trois outils. Zéro compromis.</h2>
            <p className="text-[#555] text-sm mt-4 max-w-sm mx-auto">Chaque module fait une chose, et la fait parfaitement.</p>
          </div>

          {/* ── Signaux Crypto ── */}
          <div className="mb-6 bg-[#0b0b0b] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-[#D4AF37]/8 border border-[#D4AF37]/15 px-3 py-1 rounded-full mb-6 w-fit">
                  <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">Signaux Live</span>
                </div>
                <h3 className="text-2xl font-black text-[#F2EDD7] mb-3">Signaux Crypto</h3>
                <p className="text-[#555] text-sm leading-relaxed mb-6">
                  En un clic, l&apos;IA analyse 15 cryptomonnaies et te donne une direction claire : <strong className="text-[#F2EDD7]">ACHETER ou VENDRE</strong>. Prix d&apos;entrée, objectifs et stop loss calculés automatiquement.
                </p>
                <ul className="space-y-2.5">
                  {['15 cryptos en simultané', 'RSI, MACD, EMA50/200, ATR, Volume', 'Confiance de 51 à 95% par signal', 'TP1, TP2, TP3 et Stop Loss automatiques'].map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-[#777]">
                      <Check className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-[#1a1a1a] bg-[#080808] p-6 flex items-center justify-center min-h-[300px]">
                <div className="flex flex-col items-center gap-5 w-full max-w-[260px]">
                  <div className="relative inline-block">
                    <button
                      className="relative px-5 py-2.5 rounded-xl text-[12px] font-black text-[#080808] flex items-center gap-1.5 cursor-default"
                      style={{ background: '#D4AF37', animation: 'btn-scan-flash 8s ease-in-out infinite' }}
                    >
                      <Zap className="w-3 h-3" />
                      Analyser les marchés
                    </button>
                    <div className="absolute pointer-events-none" style={{ top: '-2px', left: '12px', animation: 'cursor-drift 8s ease-in-out infinite', opacity: 0 }}>
                      <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
                        <path d="M1 1L1 14L5 10.5L7.5 17L9.5 16L7 9.5L12 9.5Z" fill="white" stroke="#555" strokeWidth="1.2" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  <div className="w-full space-y-2">
                    {([
                      { sym: 'BTC', dir: 'ACHETER', conf: 87, bull: true,  kf: 'sig-row-1' },
                      { sym: 'ETH', dir: 'ACHETER', conf: 79, bull: true,  kf: 'sig-row-2' },
                      { sym: 'SOL', dir: 'VENDRE',  conf: 71, bull: false, kf: 'sig-row-3' },
                      { sym: 'BNB', dir: 'ACHETER', conf: 64, bull: true,  kf: 'sig-row-4' },
                    ] as { sym: string; dir: string; conf: number; bull: boolean; kf: string }[]).map(r => (
                      <div key={r.sym}
                        className="flex items-center gap-2.5 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-3 py-2"
                        style={{ opacity: 0, animation: `${r.kf} 8s ease-in-out infinite` }}>
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
          </div>

          {/* ── Assistant IA ── */}
          <div className="mb-6 bg-[#0b0b0b] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Animation — left */}
              <div className="order-2 md:order-1 border-t md:border-t-0 md:border-r border-[#1a1a1a] bg-[#080808] p-6 flex items-center justify-center min-h-[280px]">
                <div className="flex flex-col gap-3 w-full max-w-[260px]">
                  <div className="flex justify-end" style={{ opacity: 0, animation: 'chat-msg-1 8s ease-in-out infinite' }}>
                    <div className="bg-[#1a1a1a] rounded-2xl rounded-br-sm px-3.5 py-2.5 max-w-[82%]">
                      <p className="text-[11px] text-[#F2EDD7]">Analyse BTC maintenant</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pl-1" style={{ opacity: 0, animation: 'chat-typing 8s ease-in-out infinite' }}>
                    {[0, 0.14, 0.28].map((d, i) => (
                      <span key={i} className="w-1.5 h-1.5 bg-[#818cf8]/50 rounded-full block"
                        style={{ animation: `dot-bounce 0.5s ease ${d}s infinite` }} />
                    ))}
                  </div>
                  <div className="bg-[#818cf8]/8 border border-[#818cf8]/15 rounded-2xl rounded-bl-sm px-3.5 py-3 space-y-1.5"
                    style={{ opacity: 0, animation: 'chat-reply 8s ease-in-out infinite' }}>
                    <p className="text-[9px] text-[#818cf8] font-bold uppercase tracking-wider">BTC/USD · Claude</p>
                    <p className="text-[10px] font-bold text-[#F2EDD7]">67 432 $ <span className="text-[#22c55e] font-normal text-[9px]">+2.3%</span></p>
                    <div className="h-px bg-[#818cf8]/10" />
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#22c55e]/15 text-[#22c55e]">LONG</span>
                      <span className="text-[9px] text-[#666]">Entrée : 66 800 $</span>
                    </div>
                    <div className="space-y-0.5">
                      {([['TP1', '68 800 $', '#22c55e'], ['TP2', '70 100 $', '#22c55e'], ['SL', '65 500 $', '#ef4444']] as [string, string, string][]).map(([l, v, c]) => (
                        <div key={l} className="flex gap-2">
                          <span className="text-[9px] text-[#444] w-5 font-mono">{l}</span>
                          <span className="text-[9px] font-mono font-bold" style={{ color: c }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Text — right */}
              <div className="order-1 md:order-2 p-8 md:p-10 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-[#818cf8]/8 border border-[#818cf8]/15 px-3 py-1 rounded-full mb-6 w-fit">
                  <MessageSquare className="w-3.5 h-3.5 text-[#818cf8]" />
                  <span className="text-[10px] font-bold text-[#818cf8] uppercase tracking-widest">24h/24 · 7j/7</span>
                </div>
                <h3 className="text-2xl font-black text-[#F2EDD7] mb-3">Assistant IA</h3>
                <p className="text-[#555] text-sm leading-relaxed mb-6">
                  Pose n&apos;importe quelle question sur les marchés. L&apos;IA répond avec les données en temps réel et propose des idées de trade avec entrée, stop et objectifs.
                </p>
                <ul className="space-y-2.5">
                  {["Données de marché en temps réel", "Prix d'entrée, TP et Stop Loss", "Analyse technique complète", "Disponible 24h/24, 7j/7"].map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-[#777]">
                      <Check className="w-3.5 h-3.5 text-[#818cf8] flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ── Analyse Graphique ── */}
          <div className="bg-[#0b0b0b] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-[#22c55e]/8 border border-[#22c55e]/15 px-3 py-1 rounded-full mb-6 w-fit">
                  <ImageIcon className="w-3.5 h-3.5 text-[#22c55e]" />
                  <span className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest">Analyse IA</span>
                </div>
                <h3 className="text-2xl font-black text-[#F2EDD7] mb-3">Analyse Graphique</h3>
                <p className="text-[#555] text-sm leading-relaxed mb-6">
                  Envoie une capture d&apos;écran de n&apos;importe quel graphique. L&apos;IA identifie tendances, supports, résistances et figures chartistes, puis te donne une stratégie complète.
                </p>
                <ul className="space-y-2.5">
                  {['TradingView, Binance, MT4, MT5…', 'Supports, résistances, figures chartistes', 'Zones de liquidité et cassures', 'Stratégie complète avec SL et objectifs'].map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-[#777]">
                      <Check className="w-3.5 h-3.5 text-[#22c55e] flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-[#1a1a1a] bg-[#080808] p-6 flex items-center justify-center min-h-[300px]">
                <div className="flex flex-col gap-2.5 w-full max-w-[260px]">
                  <div style={{ opacity: 0, animation: 'ag-upload 10s ease-in-out infinite' }}>
                    <div className="rounded-xl overflow-hidden border border-[#ddd]" style={{ background: '#fff' }}>
                      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#efefef]" style={{ background: '#f7f7f7' }}>
                        <span className="text-[7.5px] font-bold text-[#222]">BTC/USD · 1H</span>
                        <span className="text-[7.5px] bg-[#ef4444] text-white font-bold px-1.5 py-0.5 rounded font-mono">76 814</span>
                      </div>
                      <div className="relative">
                        <svg viewBox="0 0 200 50" style={{ width: '100%', height: 'auto', display: 'block' }}>
                          <defs>
                            <linearGradient id="agFill2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.01" />
                            </linearGradient>
                          </defs>
                          {[12, 25, 38].map(y => <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#f2f2f2" strokeWidth="0.5" />)}
                          <line x1="0" y1="48" x2="200" y2="48" stroke="#22c55e" strokeWidth="0.7" strokeDasharray="3,2" />
                          <polygon points="0,3.5 5,8 11,18 17,28 22,33 26,42 33,46 37,42 42,43 47,45 50,46 58,43 67,42 72,44 75,45 83,46 90,44 95,46 100,46 103,48 106,49 109,45 117,41 125,38 133,35 140,33 150,31 160,29 167,28 172,23 178,18 183,20 188,22 192,23 196,23 200,23 200,50 0,50" fill="url(#agFill2)" />
                          <polyline points="0,3.5 5,8 11,18 17,28 22,33 26,42 33,46 37,42 42,43 47,45 50,46 58,43 67,42 72,44 75,45 83,46 90,44 95,46 100,46 103,48 106,49 109,45 117,41 125,38 133,35 140,33 150,31 160,29 167,28 172,23 178,18 183,20 188,22 192,23 196,23 200,23" fill="none" stroke="#ef4444" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="absolute top-0 bottom-0"
                            style={{ width: '22%', background: 'linear-gradient(90deg,transparent,rgba(34,197,94,0.2),transparent)', animation: 'ag-scan 10s ease-in-out infinite', left: '-22%' }} />
                        </div>
                      </div>
                      <div className="flex justify-between px-2 py-1 border-t border-[#f0f0f0]" style={{ background: '#fafafa' }}>
                        {['02:00', '04:00', '06:00', '08:00'].map(t => (
                          <span key={t} className="text-[7px] text-[#bbb] font-mono">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" style={{ opacity: 0, animation: 'ag-thinking 10s ease-in-out infinite' }}>
                    {[0, 0.13, 0.26].map((d, i) => (
                      <span key={i} className="w-1.5 h-1.5 bg-[#22c55e]/60 rounded-full block"
                        style={{ animation: `dot-bounce 0.5s ease ${d}s infinite` }} />
                    ))}
                    <span className="text-[10px] text-[#555]">Identification des niveaux…</span>
                  </div>
                  <div className="space-y-1.5" style={{ opacity: 0, animation: 'ag-results 10s ease-in-out infinite' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-[#ef4444]">BAISSIERE</p>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-[#ef4444]/15 text-[#ef4444]">VENDRE</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {([
                        { l: 'Support',    v: '76 380 $', c: '#22c55e' },
                        { l: 'Résistance', v: '77 200 $', c: '#ef4444' },
                        { l: 'Zone rebond',v: '76 900 $', c: '#D4AF37' },
                        { l: 'Figure',     v: 'Corr. V',  c: '#D4AF37' },
                      ] as { l: string; v: string; c: string }[]).map(({ l, v, c }) => (
                        <div key={l}>
                          <p className="text-[8px] text-[#444]">{l}</p>
                          <p className="text-[9px] font-mono font-bold" style={{ color: c }}>{v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[9px] mt-1">
                      <span className="text-[#444]">Confiance</span>
                      <span className="text-[#ef4444] font-bold">81%</span>
                    </div>
                    <div className="h-1 bg-[#181818] rounded-full overflow-hidden">
                      <div className="h-full bg-[#ef4444] rounded-full" style={{ width: '0%', animation: 'ag-bar 10s ease-in-out infinite' }} />
                    </div>
                  </div>
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
              <Link href="/signup" className="btn-gold inline-flex items-center justify-center gap-2 text-base px-10 py-4 rounded-xl font-black">
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
