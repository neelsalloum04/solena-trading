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

const PREVIEW_SIGNALS = [
  { id: 'BTC', decision: 'ACHETER', conf: 87, done: true  },
  { id: 'ETH', decision: 'ACHETER', conf: 79, done: true  },
  { id: 'SOL', decision: 'VENDRE',  conf: 71, done: true  },
  { id: 'BNB', decision: null,      conf: 0,  active: true },
  { id: 'XRP', decision: null,      conf: 0   },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-[#F2EDD7] overflow-x-hidden">

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

          {/* Right — terminal preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#D4AF37]/5 rounded-3xl blur-3xl scale-95" />
            <div className="relative bg-[#0b0b0b] border border-[#202020] rounded-2xl overflow-hidden shadow-2xl">

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

              <div className="p-4 space-y-1.5">
                {PREVIEW_SIGNALS.map((sig) => {
                  const bull     = sig.decision === 'ACHETER'
                  const color    = bull ? '#22c55e' : '#ef4444'
                  const isActive = !!(sig as any).active

                  return (
                    <div
                      key={sig.id}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                        sig.done ? 'bg-[#111]' : isActive ? 'bg-[#D4AF37]/5 border border-[#D4AF37]/10' : 'opacity-25',
                      )}
                    >
                      <div className="w-4 flex-shrink-0 flex items-center justify-center">
                        {sig.done
                          ? <Check   className="w-3.5 h-3.5 text-[#22c55e]" />
                          : isActive
                            ? <span className="w-3 h-3 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin block" />
                            : <span className="w-1.5 h-1.5 rounded-full bg-[#2a2a2a] block" />}
                      </div>

                      <span className="font-mono text-[11px] font-bold text-[#F2EDD7] w-14 flex-shrink-0">
                        {sig.id}/USD
                      </span>

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
                        <span className="text-[11px] text-[#D4AF37] ml-1">Analyse de {sig.id}/USD en cours…</span>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="px-4 pb-4">
                <div className="h-0.5 bg-[#181818] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#D4AF37]/60 to-[#D4AF37]/20 rounded-full" style={{ width: '26%' }} />
                </div>
                <p className="text-[10px] text-[#333] mt-1.5 font-mono">3 / 15 analysés</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Stats ── */}
      <div className="border-y border-[#151515] bg-[#060606] py-8">
        <div className="max-w-4xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { n: '15',    label: 'Cryptos analysées'  },
            { n: '3',     label: 'Modules IA'          },
            { n: '24/7',  label: 'Disponible'          },
            { n: 'Claude',label: 'Modèle IA'           },
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
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md" style={{ color: r.bull ? '#22c55e' : '#ef4444', background: (r.bull ? '#22c55e' : '#ef4444') + '18' }}>
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
                Envoie une capture d'écran de n'importe quel graphique. L'IA l'analyse et te donne une stratégie complète en quelques secondes.
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

      {/* ── Comment ça marche ── */}
      <section className="py-20 px-5 border-t border-[#151515]">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[4px] mb-4">Démarrage</p>
          <h2 className="text-4xl font-black text-[#F2EDD7]">Prêt en 60 secondes.</h2>
        </div>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { n: '1', title: 'Créez votre compte', desc: 'Inscription gratuite en 30 secondes. Aucune carte bancaire requise.' },
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
            { icon: <ShieldCheck className="w-4 h-4" />, label: 'Paiements sécurisés', sub: 'Stripe' },
            { icon: <BarChart2   className="w-4 h-4" />, label: 'Données temps réel',  sub: 'Binance, Kraken' },
            { icon: <Check       className="w-4 h-4" />, label: 'Sans engagement',      sub: 'Résiliable à tout moment' },
            { icon: <Zap         className="w-4 h-4" />, label: 'IA de pointe',         sub: 'Claude par Anthropic' },
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
