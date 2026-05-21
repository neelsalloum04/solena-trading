'use client'
import { PLANS } from '@/lib/stripe/client'
import { cn } from '@/lib/utils'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle,
  ChevronRight,
  Globe,
  MessageSquare,
  Radio,
  Shield,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

const TICKER = [
  { s: 'BTC/USD',  p: '67,432', c: '+2.34%', up: true  },
  { s: 'ETH/USD',  p: '3,241',  c: '+1.87%', up: true  },
  { s: 'EUR/USD',  p: '1.0842', c: '-0.12%', up: false },
  { s: 'XAU/USD',  p: '2,654',  c: '+0.43%', up: true  },
  { s: 'SPX500',   p: '5,876',  c: '+0.67%', up: true  },
  { s: 'NAS100',   p: '20,847', c: '+0.91%', up: true  },
  { s: 'GBP/USD',  p: '1.2634', c: '-0.08%', up: false },
  { s: 'USD/JPY',  p: '157.42', c: '+0.22%', up: true  },
]

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Chat IA',
    desc: 'Posez vos questions à votre analyste IA. Uploadez vos graphiques TradingView pour une analyse complète : zones d\'entrée, stop loss, take profit, tendance et niveaux S/R.',
    items: ['Analyse GPT-4o Vision', 'Upload de graphiques', 'Tous les marchés', 'Insights institutionnels'],
  },
  {
    icon: Radio,
    title: 'Signaux Live',
    desc: 'Signaux buy/sell générés en temps réel avec setup complet : entrée, SL, TP1/2/3, ratio R/R et score de confiance. Alertes email & SMS.',
    items: ['Flux temps réel', 'Multi-marchés', 'Alertes email & SMS', 'Suivi des performances'],
  },
  {
    icon: Bot,
    title: 'Bot Automatique',
    desc: 'Connectez votre exchange et laissez l\'IA trader 24h/24. Compatible Binance, Bybit, MT4/5, Alpaca, Interactive Brokers, Kraken.',
    items: ['7+ intégrations', 'Trading 24h/24', 'Gestion du risque', 'Dashboard temps réel'],
  },
]

const TESTIMONIALS = [
  { name: 'Marcus Chen',    role: 'Trader Indépendant',  text: 'Les signaux IA sont précis et le bot a généré +34% de ROI en 3 mois. Je ne reviens plus en arrière.',      stars: 5 },
  { name: 'Sarah Williams', role: 'Trader Forex',         text: 'Mon taux de réussite est passé de 52% à 71% grâce à l\'analyse de graphiques. Outil indispensable.',       stars: 5 },
  { name: 'Alex Dubois',    role: 'Investisseur Crypto',  text: 'Le bot tourne 24h/24, je ne surveille plus mes trades. +12 000$ de profit en 6 mois. Exceptionnel.',       stars: 5 },
]

const WHY = [
  { icon: Shield,     title: 'Sécurité Bancaire',   desc: 'Chiffrement de niveau bancaire pour vos données et connexions broker.' },
  { icon: Zap,        title: 'Signaux en 2 sec',     desc: 'Soyez toujours premier. Signaux générés et envoyés en moins de 2 secondes.' },
  { icon: TrendingUp, title: '73% Win Rate vérifié', desc: 'Taux calculé sur 18 mois de données réelles de marché, pas de démo.' },
  { icon: Globe,      title: 'Multi-Marchés',        desc: 'Forex, Crypto, Indices, Actions — une seule plateforme pour tout trader.' },
]

export default function LandingPage() {
  const [yearly, setYearly] = useState(false)

  return (
    <div className="min-h-screen bg-[#080808] text-[#F2EDD7] overflow-x-hidden">

      {/* ── Ticker ── */}
      <div className="border-b border-[#1a1a1a] bg-[#0a0a0a] h-9 flex items-center overflow-hidden">
        <div className="flex-shrink-0 px-4 flex items-center gap-2 border-r border-[#1a1a1a] h-full">
          <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest">Markets Live</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex ticker-animate whitespace-nowrap">
            {[...TICKER, ...TICKER].map((t, i) => (
              <div key={i} className="inline-flex items-center gap-2 px-5 border-r border-[#1a1a1a]">
                <span className="text-[11px] font-mono font-medium text-[#888]">{t.s}</span>
                <span className="text-[11px] font-mono text-[#F2EDD7]">{t.p}</span>
                <span className={cn('text-[10px] font-bold', t.up ? 'text-[#22c55e]' : 'text-[#ef4444]')}>{t.c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-[#080808]/95 backdrop-blur border-b border-[#1a1a1a] px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/primex-logo-dark.webp" alt="PrimeX" width={34} height={34} className="rounded-lg" />
          <span className="font-black text-lg text-[#D4AF37] tracking-tight">PrimeX</span>
          <span className="text-[10px] font-semibold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-1.5 py-0.5 rounded">IA</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {[['Fonctionnalités', '#features'], ['Tarifs', '#pricing'], ['Témoignages', '#testimonials']].map(([l, h]) => (
            <a key={h} href={h} className="text-sm text-[#888] hover:text-[#D4AF37] transition-colors">{l}</a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-outline text-sm px-4 py-2">Connexion</Link>
          <Link href="/register" className="btn-gold text-sm px-4 py-2">Essai Gratuit</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-24 px-6 text-center bg-grid overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#D4AF37]/3 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-[#D4AF37]/10 rounded-2xl blur-xl scale-150" />
              <Image
                src="/primex-logo-dark.webp"
                alt="PrimeX"
                width={96}
                height={96}
                className="relative rounded-2xl"
              />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/8 border border-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold px-4 py-1.5 rounded-full mb-7">
            <Zap className="w-3 h-3" />
            Propulsé par GPT-4o Vision · 18 000+ Traders Actifs
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-black mb-5 leading-[1.05] tracking-tight">
            Tradez Comme un<br />
            <span className="text-[#D4AF37]">Hedge Fund</span>
            <span className="text-[#9EAAB8]"> grâce à l'IA</span>
          </h1>

          <p className="text-[#888] text-lg max-w-xl mx-auto mb-9 leading-relaxed">
            Signaux institutionnels, bots automatisés et analyse en temps réel.
            Forex, Crypto, Indices, Actions. 73% de win rate. 24h/24.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="btn-gold inline-flex items-center gap-2 text-base px-7 py-3">
              Commencer Gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn-outline inline-flex items-center gap-2 text-base px-7 py-3">
              Voir la Démo <Activity className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-[#555] text-sm mt-4">Sans carte bancaire · 14 jours gratuits · Annulation à tout moment</p>
        </div>

        {/* Stats */}
        <div className="relative max-w-2xl mx-auto mt-16 grid grid-cols-3 gap-4">
          {[
            { value: '$2.4B+',  label: 'Volume Tradé',    icon: BarChart3 },
            { value: '73.2%',   label: 'Taux de Réussite', icon: Activity  },
            { value: '18 000+', label: 'Traders Actifs',   icon: Globe     },
          ].map((s) => (
            <div key={s.label} className="card-gold p-5 text-center">
              <s.icon className="w-5 h-5 text-[#D4AF37] mx-auto mb-3" />
              <p className="text-2xl font-bold text-[#D4AF37]">{s.value}</p>
              <p className="text-xs text-[#555] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="badge-gold mb-3 inline-block">Fonctionnalités</span>
            <h2 className="text-3xl font-bold text-[#F2EDD7] mt-3 mb-3">Tout ce qu'il faut pour Gagner</h2>
            <p className="text-[#888] text-sm max-w-md mx-auto">Trois outils puissants conçus pour les traders professionnels</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6 hover:border-[#D4AF37]/20 transition-colors duration-200 group">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-5 group-hover:bg-[#D4AF37]/15 transition-colors">
                  <f.icon className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <h3 className="font-bold text-[#F2EDD7] mb-2 text-base">{f.title}</h3>
                <p className="text-[#666] text-sm leading-relaxed mb-5">{f.desc}</p>
                <ul className="space-y-2">
                  {f.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[#888]">
                      <CheckCircle className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why PrimeX ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="badge-gold mb-3 inline-block">Pourquoi PrimeX</span>
            <h2 className="text-3xl font-bold text-[#F2EDD7] mt-3">L'IA au Service de votre Performance</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY.map((w) => (
              <div key={w.title} className="card p-5 text-center hover:border-[#D4AF37]/20 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/8 border border-[#D4AF37]/15 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#D4AF37]/15 transition-colors">
                  <w.icon className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <h3 className="font-semibold text-[#F2EDD7] text-sm mb-1.5">{w.title}</h3>
                <p className="text-[#666] text-xs leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="badge-gold mb-3 inline-block">Tarifs</span>
            <h2 className="text-3xl font-bold text-[#F2EDD7] mt-3 mb-2">Tarification Transparente</h2>
            <p className="text-[#666] text-sm mb-7">14 jours d'essai gratuit. Sans carte bancaire.</p>

            <div className="inline-flex bg-[#0e0e0e] border border-[#222] rounded-lg p-1">
              <button
                onClick={() => setYearly(false)}
                className={cn('px-5 py-2 rounded-md text-sm font-medium transition-all',
                  !yearly ? 'bg-[#D4AF37] text-[#080808] font-bold' : 'text-[#666] hover:text-[#F2EDD7]'
                )}
              >Mensuel</button>
              <button
                onClick={() => setYearly(true)}
                className={cn('px-5 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
                  yearly ? 'bg-[#D4AF37] text-[#080808] font-bold' : 'text-[#666] hover:text-[#F2EDD7]'
                )}
              >
                Annuel
                <span className="text-[10px] bg-[#22c55e] text-white px-1.5 py-0.5 rounded font-bold">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {Object.values(PLANS).map((plan) => (
              <div
                key={plan.plan}
                className={cn('relative p-6 rounded-xl border transition-colors',
                  plan.highlighted
                    ? 'bg-[#141414] border-[#D4AF37]/50 shadow-gold'
                    : 'bg-[#0e0e0e] border-[#222] hover:border-[#333]'
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#D4AF37] text-[#080808] text-xs font-bold px-3 py-1 rounded-full">{plan.badge}</span>
                  </div>
                )}
                <div className="mb-5">
                  <p className="font-semibold text-[#F2EDD7] mb-1">{plan.name}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-[#D4AF37]">${yearly ? plan.yearlyPrice : plan.price}</span>
                    <span className="text-[#555] mb-1 text-sm">/mois</span>
                  </div>
                  {yearly && <p className="text-xs text-[#22c55e] mt-1">Économisez ${(plan.price - plan.yearlyPrice) * 12}/an</p>}
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#888]">
                      <CheckCircle className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={cn(
                    'flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors',
                    plan.highlighted
                      ? 'bg-[#D4AF37] text-[#080808] hover:bg-[#B8960C]'
                      : 'border border-[#333] text-[#F2EDD7] hover:border-[#D4AF37]/40 hover:text-[#D4AF37]'
                  )}
                >
                  Commencer Gratuitement <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="badge-gold mb-3 inline-block">Témoignages</span>
            <h2 className="text-3xl font-bold text-[#F2EDD7] mt-3">Approuvé par 18 000+ Traders</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card p-6 hover:border-[#D4AF37]/20 transition-colors">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                  ))}
                </div>
                <p className="text-sm text-[#888] leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#D4AF37]">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#F2EDD7]">{t.name}</p>
                    <p className="text-xs text-[#555]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card-gold p-12 rounded-2xl">
            <div className="flex justify-center mb-5">
              <Image src="/primex-logo-dark.webp" alt="PrimeX" width={64} height={64} className="rounded-xl" />
            </div>
            <h2 className="text-3xl font-bold text-[#F2EDD7] mb-3">Prêt à Trader Plus Intelligemment ?</h2>
            <p className="text-[#666] text-sm mb-7 max-w-md mx-auto leading-relaxed">
              Rejoignez 18 000+ traders. 14 jours d'essai gratuit, sans carte bancaire, annulation à tout moment.
            </p>
            <Link href="/register" className="btn-gold inline-flex items-center gap-2 px-8 py-3 text-sm">
              Démarrer l'Essai Gratuit <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1a1a1a] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/primex-logo-dark.webp" alt="PrimeX" width={26} height={26} className="rounded-md" />
            <span className="font-bold text-sm text-[#D4AF37]">PrimeX IA</span>
          </div>
          <p className="text-xs text-[#444] text-center">
            © 2026 PrimeX IA. Le trading comporte des risques. Les performances passées ne préjugent pas des résultats futurs.
          </p>
          <div className="flex items-center gap-5">
            {['Confidentialité', 'CGU', 'Risques'].map((l) => (
              <a key={l} href="#" className="text-xs text-[#555] hover:text-[#D4AF37] transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
