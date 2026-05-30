import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import { PlansGrid } from './PlansGrid'

export const metadata: Metadata = {
  title: 'Tarifs — PrimeX',
  description: 'Starter X, Pro X, Expert X ou Prime X. Sans engagement, résiliable à tout moment.',
}


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

      {/* Risk disclaimer */}
      <p className="text-center text-[11px] text-[#333] leading-relaxed max-w-xl mx-auto pb-4">
        Le trading comporte des risques. Les performances passées ne préjugent pas des résultats futurs.
        Les outils PrimeX sont fournis à titre éducatif et ne constituent pas des conseils en investissement.
      </p>
    </div>
  )
}
