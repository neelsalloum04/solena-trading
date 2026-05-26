import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import { PlansGrid } from './PlansGrid'

export const metadata: Metadata = {
  title: 'Tarifs — PrimeX',
  description: 'Starter X, Pro X, Expert X ou Prime X. Sans engagement, résiliable à tout moment.',
}

const FAQ = [
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui. Vous pouvez annuler votre abonnement depuis Paramètres → Abonnement. L'accès reste actif jusqu'à la fin de la période facturée.",
  },
  {
    q: "Y a-t-il un engagement ?",
    a: "Aucun. Les abonnements mensuels sont sans durée minimale supplémentaire.",
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
        <p className="text-[#555] text-sm">Sans engagement · Annulation à tout moment · Paiement sécurisé Stripe</p>
      </div>

      {/* Plans grid with billing toggle */}
      <PlansGrid />

      {/* Free plan note */}
      <div className="text-center p-5 bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl">
        <p className="text-sm text-[#555]">
          <span className="text-[#F2EDD7] font-semibold">Plan Gratuit également disponible</span> —
          Accès au tableau de bord et au calendrier économique. Pas de carte bancaire requise.
        </p>
        <Link href="/signup" className="inline-flex items-center gap-1 text-xs text-[#D4AF37] mt-2 hover:underline">
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
