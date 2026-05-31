'use client'
import { PLANS_DISPLAY } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { Check, Lock, Loader2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface UpgradeOverlayProps {
  title?:    string
  subtitle?: string
}

export function UpgradeOverlay({
  title    = 'Fonctionnalité réservée aux abonnés',
  subtitle = 'Choisissez un forfait pour débloquer tous les modules PrimeX.',
}: UpgradeOverlayProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleChoose = async (planId: string) => {
    setLoadingPlan(planId)
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan: planId, billing: 'monthly' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Erreur lors du paiement.')
        setLoadingPlan(null)
      }
    } catch {
      toast.error('Erreur réseau. Réessayez.')
      setLoadingPlan(null)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-full py-10 px-4 md:px-8 bg-[#080808]">
      <div className="w-full max-w-5xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">{title}</h2>
          <p className="text-sm text-[#555] max-w-sm mx-auto leading-relaxed">{subtitle}</p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 max-w-3xl mx-auto">
          {PLANS_DISPLAY.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-2xl p-5 border flex flex-col',
                plan.highlighted
                  ? 'bg-[#141414] border-[#D4AF37]/40 shadow-xl shadow-[#D4AF37]/5'
                  : 'bg-[#0c0c0c] border-[#1c1c1c]',
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="text-[9px] font-black bg-[#D4AF37] text-[#080808] px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                    Populaire
                  </span>
                </div>
              )}

              <p className={cn('text-[11px] font-black uppercase tracking-widest mb-2 mt-1', plan.color)}>
                {plan.label}
              </p>

              <div className="mb-4">
                <div className="flex items-end gap-1 leading-none">
                  <span className="text-3xl font-black text-white leading-none">{plan.price}</span>
                  <span className="text-[#444] text-xs pb-1">€/mois</span>
                </div>
              </div>

              <div className="h-px bg-[#1e1e1e] mb-4" />

              <ul className="space-y-2 mb-5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-[#22c55e] mt-0.5 flex-shrink-0" />
                    <span className="text-[11px] text-[#666] leading-snug">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleChoose(plan.id)}
                disabled={!!loadingPlan}
                className={cn(
                  'w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2',
                  plan.highlighted
                    ? 'bg-[#D4AF37] text-[#080808] hover:brightness-110'
                    : 'bg-[#111] border border-[#242424] text-white hover:border-[#383838] hover:bg-[#161616]',
                  !!loadingPlan && loadingPlan !== plan.id && 'opacity-40'
                )}
              >
                {loadingPlan === plan.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : `Choisir ${plan.label}`}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-[#333]">
          Paiement sécurisé par Stripe · Annulation possible à tout moment · Sans engagement
        </p>

      </div>
    </div>
  )
}
