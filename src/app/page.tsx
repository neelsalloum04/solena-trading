'use client'

import { cn } from '@/lib/utils'
import {
  ArrowRight,
  Check,
  ImageIcon,
  Loader2,
  MessageSquare,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// ─── Ticker data ──────────────────────────────────────────────────────────────

const TICKER = [
  { s: 'BTC/USD',  p: '67 432',  c: '+2.34%', up: true  },
  { s: 'ETH/USD',  p: '3 241',   c: '+1.87%', up: true  },
  { s: 'SOL/USD',  p: '178.40',  c: '+3.21%', up: true  },
  { s: 'EUR/USD',  p: '1.0842',  c: '-0.12%', up: false },
  { s: 'XAU/USD',  p: '2 654',   c: '+0.43%', up: true  },
  { s: 'SPX500',   p: '5 876',   c: '+0.67%', up: true  },
  { s: 'NAS100',   p: '20 847',  c: '+0.91%', up: true  },
  { s: 'BNB/USD',  p: '598.20',  c: '+1.04%', up: true  },
  { s: 'GBP/USD',  p: '1.2634',  c: '-0.08%', up: false },
  { s: 'XRP/USD',  p: '0.6182',  c: '+4.12%', up: true  },
]

// ─── Hero terminal: preview des Signaux Crypto ────────────────────────────────

const PREVIEW_SIGNALS = [
  { id: 'BTC', decision: 'ACHETER', conf: 87, done: true  },
  { id: 'ETH', decision: 'ACHETER', conf: 79, done: true  },
  { id: 'SOL', decision: 'VENDRE',  conf: 71, done: true  },
  { id: 'BNB', decision: null,      conf: 0,  active: true },
  { id: 'XRP', decision: null,      conf: 0   },
  { id: 'ADA', decision: null,      conf: 0   },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-[#F2EDD7] overflow-x-hidden">

      {/* ── Ticker ── */}
      <div className="border-b border-[#1a1a1a] bg-[#060606] h-9 flex items-center overflow-hidden">
        <div className="flex-shrink-0 px-4 flex items-center gap-2 border-r border-[#1a1a1a] h-full">
          <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest">Markets Live</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex ticker-animate whitespace-nowrap">
            {[...TICKER, ...TICKER].map((t, i) => (
              <div key={i} className="inline-flex items-center gap-2 px-5 border-r border-[#1a1a1a]">
                <span className="text-[11px] font-mono text-[#555]">{t.s}</span>
                <span className="text-[11px] font-mono text-[#F2EDD7]">{t.p}</span>
                <span className={cn('text-[10px] font-bold', t.up ? 'text-[#22c55e]' : 'text-[#ef4444]')}>{t.c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-[#080808]/95 backdrop-blur border-b border-[#1a1a1a] px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/primex-logo-dark.webp" alt="PrimeX" width={32} height={32} className="rounded-lg" />
          <span className="font-black text-lg text-[#D4AF37] tracking-tight">PrimeX</span>
          <span className="text-[9px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-1.5 py-0.5 rounded tracking-widest">IA</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login"    className="btn-outline text-sm px-5 py-2 rounded-xl">Connexion</Link>
          <Link href="/register" className="btn-gold    text-sm px-5 py-2 rounded-xl">Essai gratuit</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-16 pb-20 px-6 bg-grid overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#D4AF37]/4 rounded-full blur-[130px]" />
        </div>

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">

          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/8 border border-[#D4AF37]/20 text-[#D4AF37] text-[11px] font-bold px-4 py-1.5 rounded-full mb-8 tracking-wide">
              <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse" />
              Propulsé par Claude AI · Anthropic
            </div>

            <h1 className="text-5xl md:text-[3.6rem] font-black mb-5 leading-[1.05] tracking-tight">
              L'IA qui analyse<br />
              les marchés<br />
              <span className="text-[#D4AF37]">à ta place.</span>
            </h1>

            <p className="text-[#777] text-lg max-w-[480px] mb-9 leading-relaxed">
              Signaux crypto en temps réel, analyse de graphiques par IA et assistant trading 24h/24 —
              prends des décisions éclairées en quelques secondes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-7">
              <Link
                href="/register"
                className="btn-gold inline-flex items-center justify-center gap-2 text-base px-8 py-3.5 rounded-xl font-bold"
              >
                Créer mon compte — gratuit <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="btn-outline inline-flex items-center justify-center gap-2 text-base px-8 py-3.5 rounded-xl"
              >
                Se connecter
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#444]">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#22c55e]" />Sans carte bancaire</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#22c55e]" />3 essais offerts</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#22c55e]" />Annulation libre</span>
            </div>
          </div>

          {/* Right — signal terminal preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#D4AF37]/6 rounded-3xl blur-3xl scale-95" />
            <div className="relative bg-[#0b0b0b] border border-[#202020] rounded-2xl overflow-hidden shadow-2xl">

              {/* Terminal header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#181818] bg-[#080808]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#F2EDD7]">Signaux Crypto</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1 h-1 bg-[#22c55e] rounded-full animate-pulse" />
                      <span className="text-[10px] text-[#22c55e]">Analyse en cours</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-[#333] font-mono bg-[#111] px-2 py-1 rounded-md">4 / 15</span>
              </div>

              {/* Signal rows */}
              <div className="p-4 space-y-1.5">
                {PREVIEW_SIGNALS.map((sig) => {
                  const bull  = sig.decision === 'ACHETER'
                  const color = bull ? '#22c55e' : '#ef4444'
                  const isActive  = !!(sig as any).active
                  const isPending = !sig.done && !isActive

                  return (
                    <div
                      key={sig.id}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                        sig.done   ? 'bg-[#111]' :
                        isActive   ? 'bg-[#D4AF37]/5 border border-[#D4AF37]/10' :
                                     'opacity-25',
                      )}
                    >
                      {/* Status icon */}
                      <div className="w-4 flex-shrink-0 flex items-center justify-center">
                        {sig.done   ? <Check    className="w-3.5 h-3.5 text-[#22c55e]" /> :
                         isActive   ? <Loader2  className="w-3.5 h-3.5 text-[#D4AF37] animate-spin" /> :
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#2a2a2a] block" />}
                      </div>

                      {/* Symbol */}
                      <span className="font-mono text-[11px] font-bold text-[#F2EDD7] w-14 flex-shrink-0">
                        {sig.id}/USD
                      </span>

                      {/* Decision + confidence */}
                      {sig.done && sig.decision && (
                        <>
                          <span
                            className="flex items-center gap-1 text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md flex-shrink-0"
                            style={{ background: color + '18', color }}
                          >
                            {bull
                              ? <><TrendingUp   className="w-2.5 h-2.5" />ACHETER</>
                              : <><TrendingDown className="w-2.5 h-2.5" />VENDRE</>}
                          </span>
                          <div className="flex-1 flex items-center gap-2 justify-end">
                            <div className="w-14 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${sig.conf}%`, backgroundColor: color }} />
                            </div>
                            <span className="text-[10px] font-mono font-bold w-8 text-right" style={{ color }}>
                              {sig.conf}%
                            </span>
                          </div>
                        </>
                      )}

                      {isActive && (
                        <span className="text-[11px] text-[#D4AF37] ml-1">
                          Analyse de {sig.id}/USD en cours…
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Progress bar */}
              <div className="px-4 pb-4">
                <div className="h-0.5 bg-[#181818] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#D4AF37]/60 to-[#D4AF37]/20 rounded-full" style={{ width: '26.6%' }} />
                </div>
                <p className="text-[10px] text-[#333] mt-1.5 font-mono">3 / 15 analysés · BTC · ETH · SOL</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="border-y border-[#1a1a1a] bg-[#060606] py-6">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: '15',     label: 'Cryptos analysées',   sub: 'BTC · ETH · SOL · BNB…' },
            { n: '3',      label: 'Modules IA',           sub: 'Signaux · Chat · Graphique' },
            { n: '24/7',   label: 'Disponible',           sub: 'Données en temps réel' },
            { n: 'Claude', label: 'Modèle IA',            sub: 'Anthropic · Dernière génération' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-black text-[#D4AF37]">{s.n}</p>
              <p className="text-xs font-semibold text-[#F2EDD7] mt-1">{s.label}</p>
              <p className="text-[10px] text-[#3a3a3a] mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modules ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-14">
            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[4px] mb-4">Modules</p>
            <h2 className="text-4xl font-black text-[#F2EDD7]">Trois outils.<br />Zéro compromis.</h2>
            <p className="text-[#555] text-sm mt-4 max-w-sm mx-auto">
              Chaque module fait une chose, et la fait parfaitement.
            </p>
          </div>

          {/* Module 1 — Signaux Crypto (grande carte) */}
          <div className="mb-5 bg-[#0b0b0b] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-10">
                <div className="inline-flex items-center gap-2 bg-[#D4AF37]/8 border border-[#D4AF37]/15 px-3 py-1 rounded-full mb-6">
                  <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">Live</span>
                </div>
                <h3 className="text-2xl font-black text-[#F2EDD7] mb-3">Signaux Crypto</h3>
                <p className="text-[#666] text-sm leading-relaxed mb-6">
                  En un clic, l'IA analyse les 15 principales cryptomonnaies et te donne une direction claire :
                  {' '}<strong className="text-[#F2EDD7]">ACHETER ou VENDRE</strong>. Prix d'entrée, trois objectifs de
                  profit et stop loss calculés automatiquement à partir de 5 indicateurs techniques.
                </p>
                <ul className="space-y-2.5">
                  {[
                    '15 cryptos en simultané — BTC, ETH, SOL, BNB…',
                    'RSI, MACD, EMA50/200, ATR, Volume',
                    'Confiance de 51 % à 95 % par signal',
                    'TP1, TP2, TP3 + Stop Loss automatiques',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-[#888]">
                      <Check className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Résultats preview */}
              <div className="bg-[#060606] border-l border-[#1a1a1a] p-6 flex items-center justify-center">
                <div className="w-full max-w-[270px] space-y-2">
                  {[
                    { id: 'BTC', d: 'ACHETER', c: 87, tp: '+3.8%', sl: '-2.1%' },
                    { id: 'ETH', d: 'ACHETER', c: 79, tp: '+4.2%', sl: '-2.5%' },
                    { id: 'SOL', d: 'VENDRE',  c: 71, tp: '+5.1%', sl: '-3.0%' },
                  ].map(sig => {
                    const bull  = sig.d === 'ACHETER'
                    const color = bull ? '#22c55e' : '#ef4444'
                    return (
                      <div
                        key={sig.id}
                        className="rounded-xl border p-3 overflow-hidden"
                        style={{ background: color + '07', borderColor: color + '25' }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-black text-[#F2EDD7]">{sig.id}/USD</span>
                          <span className="flex items-center gap-1 text-[10px] font-black" style={{ color }}>
                            {bull ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {sig.d}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${sig.c}%`, backgroundColor: color }} />
                          </div>
                          <span className="text-[10px] font-mono font-bold flex-shrink-0" style={{ color }}>{sig.c}%</span>
                        </div>
                        <div className="flex gap-3 mt-1.5">
                          <span className="text-[10px] text-[#22c55e] font-mono">TP {sig.tp}</span>
                          <span className="text-[10px] text-[#ef4444] font-mono">SL {sig.sl}</span>
                        </div>
                      </div>
                    )
                  })}
                  <p className="text-center text-[10px] text-[#2a2a2a] pt-1">+ 12 autres cryptos analysées</p>
                </div>
              </div>
            </div>
          </div>

          {/* Modules 2 + 3 — côte à côte */}
          <div className="grid md:grid-cols-2 gap-5">

            {/* Assistant IA */}
            <div className="bg-[#0b0b0b] border border-[#1a1a1a] rounded-2xl overflow-hidden">
              <div className="p-7">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-5">
                  <MessageSquare className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <h3 className="text-xl font-black text-[#F2EDD7] mb-2">Assistant IA</h3>
                <p className="text-[#666] text-sm leading-relaxed mb-5">
                  Ton analyste IA connecté aux marchés en temps réel. Pose n'importe quelle question —
                  marché, actif, stratégie — et reçois une analyse professionnelle en secondes.
                </p>
                {/* Mock chat */}
                <div className="bg-[#060606] border border-[#181818] rounded-xl p-3 space-y-2">
                  <div className="flex justify-end">
                    <div className="bg-[#D4AF37] text-[#080808] text-xs font-semibold px-3 py-2 rounded-xl rounded-br-sm max-w-[85%]">
                      EUR/USD : achat ou vente ?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-[#141414] border border-[#222] text-[#aaa] text-[11px] px-3 py-2 rounded-xl rounded-bl-sm max-w-[90%] leading-relaxed">
                      Signal haussier. RSI 44, EMA20 &gt; EMA50.{' '}
                      <span className="text-[#22c55e] font-semibold">Entrée 1.0840</span> ·{' '}
                      SL 1.0800 · TP 1.0920. Ratio 2:1.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analyse Graphique */}
            <div className="bg-[#0b0b0b] border border-[#1a1a1a] rounded-2xl overflow-hidden">
              <div className="p-7">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-5">
                  <ImageIcon className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <h3 className="text-xl font-black text-[#F2EDD7] mb-2">Analyse Graphique</h3>
                <p className="text-[#666] text-sm leading-relaxed mb-5">
                  Capture d'écran de ton graphique TradingView, MT4 ou Binance — l'IA analyse
                  les niveaux, la tendance et te donne un plan de trade complet en quelques secondes.
                </p>
                {/* Upload zone */}
                <div className="border-2 border-dashed border-[#1e1e1e] rounded-xl p-5 flex flex-col items-center gap-2 bg-[#060606] group hover:border-[#D4AF37]/20 transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-[#333]" />
                  </div>
                  <p className="text-xs text-[#3a3a3a] font-medium">Glisse ton graphique ici</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-1">
                    {['TradingView', 'MT4/5', 'Binance', 'Bybit'].map(p => (
                      <span key={p} className="text-[9px] font-semibold text-[#2a2a2a] border border-[#1a1a1a] px-2 py-0.5 rounded-md">{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section className="py-20 px-6 bg-[#060606] border-y border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[4px] mb-4">Simple</p>
            <h2 className="text-3xl font-black text-[#F2EDD7]">Opérationnel en 30 secondes</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-5 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />

            {[
              {
                n: '01',
                title: 'Crée ton compte',
                desc: 'Inscription en 30 secondes, sans carte bancaire. Tu reçois 3 essais gratuits immédiatement.',
              },
              {
                n: '02',
                title: 'Choisis ton outil',
                desc: 'Lance les Signaux Crypto, pose une question au Chat IA, ou uploade un graphique à analyser.',
              },
              {
                n: '03',
                title: 'Décide avec confiance',
                desc: 'L\'IA te donne une direction, des niveaux précis et un niveau de confiance. À toi de jouer.',
              },
            ].map((step) => (
              <div key={step.n} className="flex flex-col items-center text-center relative">
                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-5">
                  <span className="text-[11px] font-black text-[#D4AF37]">{step.n}</span>
                </div>
                <h3 className="font-bold text-[#F2EDD7] mb-2">{step.title}</h3>
                <p className="text-sm text-[#555] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield,   label: 'Données chiffrées',   sub: 'TLS · Paiements via Stripe' },
              { icon: Zap,      label: 'Données temps réel',  sub: 'Binance · Kraken · live' },
              { icon: MessageSquare, label: 'Claude AI',      sub: 'Anthropic · Last gen' },
              { icon: Check,    label: 'Annulation libre',    sub: 'Sans engagement' },
            ].map((t) => (
              <div key={t.label} className="flex flex-col items-center text-center bg-[#0b0b0b] border border-[#181818] rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/8 border border-[#D4AF37]/15 flex items-center justify-center mb-3">
                  <t.icon className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <p className="text-[11px] font-bold text-[#F2EDD7]">{t.label}</p>
                <p className="text-[10px] text-[#3a3a3a] mt-0.5">{t.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-[#D4AF37]/6 rounded-3xl blur-3xl" />
            <div className="relative bg-[#0b0b0b] border border-[#D4AF37]/25 rounded-2xl p-12">
              <Image
                src="/primex-logo-dark.webp"
                alt="PrimeX"
                width={56}
                height={56}
                className="rounded-xl mx-auto mb-6"
              />
              <h2 className="text-3xl font-black text-[#F2EDD7] mb-3">
                Prêt à trader<br />plus intelligemment ?
              </h2>
              <p className="text-[#555] text-sm mb-8 leading-relaxed">
                Rejoins PrimeX et accède instantanément à des analyses IA sur tous les marchés qui t'intéressent.
              </p>
              <Link
                href="/register"
                className="btn-gold inline-flex items-center gap-2 px-10 py-4 text-base rounded-xl font-bold"
              >
                Créer mon compte — c'est gratuit <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[#333] text-xs mt-4">
                Sans carte bancaire · 3 essais offerts · Annulation à tout moment
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1a1a1a] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/primex-logo-dark.webp" alt="PrimeX" width={24} height={24} className="rounded-md" />
            <span className="font-bold text-sm text-[#D4AF37]">PrimeX IA</span>
          </div>
          <p className="text-[11px] text-[#333] text-center leading-relaxed">
            © 2026 PrimeX IA · Contenu éducatif uniquement · Le trading comporte un risque de perte en capital
          </p>
          <div className="flex items-center gap-5">
            <Link href="/legal/privacy"  className="text-xs text-[#444] hover:text-[#D4AF37] transition-colors">Confidentialité</Link>
            <Link href="/legal/cgu"      className="text-xs text-[#444] hover:text-[#D4AF37] transition-colors">CGU</Link>
            <Link href="/legal/mentions" className="text-xs text-[#444] hover:text-[#D4AF37] transition-colors">Mentions légales</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
