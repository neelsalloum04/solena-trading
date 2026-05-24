import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, ChevronRight, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tarifs — PrimeX',
  description: 'Choisissez le plan qui correspond à votre style de trading. Starter X, Pro X, Expert X ou PrimeX.',
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter X',
    price: 49,
    yearlyPrice: '41,58',
    yearlyTotal: '499',
    description: 'Pour commencer à trader avec l\'IA',
    features: [
      '60 analyses IA / mois',
      '60 messages chat / mois',
      'Signaux de trading illimités',
      'Support par email',
    ],
    highlighted: false,
    badge: undefined as string | undefined,
    href: '/register',
    color: '#38bdf8',
    borderColor: 'border-[#38bdf8]/30',
    bg: 'bg-[#0e0e0e]',
  },
  {
    id: 'pro',
    name: 'Pro X',
    price: 79,
    yearlyPrice: '74,91',
    yearlyTotal: '899',
    description: 'Pour les traders actifs',
    features: [
      '200 analyses IA / mois',
      '200 messages chat / mois',
      'Signaux de trading illimités',
      'Robot de trading',
      'Support prioritaire',
    ],
    highlighted: true,
    badge: 'Populaire',
    href: '/register',
    color: '#D4AF37',
    borderColor: 'border-[#D4AF37]/50',
    bg: 'bg-[#141414]',
  },
  {
    id: 'expert',
    name: 'Expert X',
    price: 129,
    yearlyPrice: '124,91',
    yearlyTotal: '1 499',
    description: 'Pour les traders confirmés',
    features: [
      '1000 analyses IA / mois',
      '1000 messages chat / mois',
      'Signaux de trading illimités',
      'Robot de trading',
      'Support prioritaire',
    ],
    highlighted: false,
    badge: undefined as string | undefined,
    href: '/register',
    color: '#a78bfa',
    borderColor: 'border-[#a78bfa]/30',
    bg: 'bg-[#0e0e0e]',
  },
  {
    id: 'premium',
    name: 'PrimeX',
    price: 499,
    yearlyPrice: '483,25',
    yearlyTotal: '5 799',
    description: 'Pour les pros et institutions',
    features: [
      'Accès illimité à tous les modules',
      'Analyses IA illimitées',
      'Chat IA illimité',
      'Signaux de trading illimités',
      'Robot de trading',
      'Support VIP dédié',
    ],
    highlighted: false,
    badge: 'Tout inclus',
    href: '/register',
    color: '#22c55e',
    borderColor: 'border-[#22c55e]/30',
    bg: 'bg-[#0e0e0e]',
  },
]

const FAQ = [
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui. Vous pouvez annuler votre abonnement depuis Paramètres → Abonnement. L'accès reste actif jusqu'à la fin de la période facturée.",
  },
  {
    q: "Y a-t-il un engagement ?",
    a: "Aucun. Les abonnements sont mensuels ou annuels sans durée minimale supplémentaire.",
  },
  {
    q: "Les paiements sont-ils sécurisés ?",
    a: "Oui. Les paiements sont traités par Stripe, certifié PCI-DSS. PrimeX ne stocke aucune donnée bancaire.",
  },
  {
    q: "Est-ce que les outils IA donnent des conseils financiers ?",
    a: "Non. Les analyses et signaux ont une vocation éducative et informative uniquement. Ils ne constituent pas des conseils en investissement.",
  },
]

export default function PlansPage() {
  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="text-center pt-4">
        <span className="inline-block text-xs font-bold text-[#D4AF37] border border-[#D4AF37]/30 bg-[#D4AF37]/10 rounded-full px-3 py-1 mb-4">
          Tarifs
        </span>
        <h1 className="text-3xl font-black text-[#F2EDD7] mb-3">Tarification Transparente</h1>
        <p className="text-[#555] text-sm">Sans engagement — Annulation à tout moment — Paiement sécurisé Stripe</p>
      </div>

      {/* Plans grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative p-6 rounded-xl border transition-colors flex flex-col ${plan.bg} ${plan.borderColor}`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span
                  className="text-[#080808] text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap"
                  style={{ backgroundColor: plan.color }}
                >
                  {plan.badge}
                </span>
              </div>
            )}

            <div className="mb-5">
              <p className="font-bold text-[#F2EDD7] mb-1">{plan.name}</p>
              <p className="text-xs text-[#555] mb-3">{plan.description}</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-black" style={{ color: plan.color }}>
                  {plan.price}€
                </span>
                <span className="text-[#555] mb-1 text-sm">/mois</span>
              </div>
              <p className="text-[11px] text-[#444]">
                ou {plan.yearlyPrice}€/mois · <span className="text-[#555]">{plan.yearlyTotal}€/an</span>
              </p>
            </div>

            <ul className="space-y-2.5 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-[#888]">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: plan.color }} />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={plan.href}
              className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                plan.highlighted
                  ? 'bg-[#D4AF37] text-[#080808] hover:bg-[#B8960C]'
                  : 'border border-[#333] text-[#F2EDD7] hover:border-[#D4AF37]/40 hover:text-[#D4AF37]'
              }`}
            >
              Commencer <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>

      {/* Free plan note */}
      <div className="text-center p-5 bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl">
        <p className="text-sm text-[#555]">
          <span className="text-[#F2EDD7] font-semibold">Plan Gratuit également disponible</span> —
          Accès au tableau de bord et au calendrier économique. Pas de carte bancaire requise.
        </p>
        <Link href="/register" className="inline-flex items-center gap-1 text-xs text-[#D4AF37] mt-2 hover:underline">
          <Zap className="w-3 h-3" /> Créer un compte gratuit
        </Link>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-lg font-bold text-[#F2EDD7] mb-6 text-center">Questions fréquentes</h2>
        <div className="space-y-4 max-w-2xl mx-auto">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl p-5">
              <p className="text-sm font-semibold text-[#F2EDD7] mb-2">{q}</p>
              <p className="text-sm text-[#666] leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk disclaimer */}
      <p className="text-center text-[11px] text-[#333] leading-relaxed max-w-xl mx-auto pb-4">
        Le trading comporte des risques. Les performances passées ne préjugent pas des résultats futurs.
        Les outils PrimeX sont fournis à titre éducatif et ne constituent pas des conseils en investissement.
      </p>
    </div>
  )
}
