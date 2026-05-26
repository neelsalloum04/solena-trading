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
    <div
      className="absolute inset-0 z-20 flex items-center justify-center p-4 md:p-8 overflow-y-auto"
      style={{ backgroundColor: 'rgba(8,8,8,0.75)' }}
    >
      <div className="max-w-4xl w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">{title}</h2>
          <p className="text-sm text-[#555] max-w-sm mx-auto">{subtitle}</p>
        </div>

        {/* All 4 plan cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {PLANS_DISPLAY.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-2xl p-4 border flex flex-col',
                plan.highlighted
                  ? 'bg-[#0f0f0f] border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/5'
                  : 'bg-[#0a0a0a] border-[#1a1a1a]',
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[9px] font-black bg-[#D4AF37] text-[#080808] px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                    Populaire
                  </span>
                </div>
              )}
              <p className={cn('text-sm font-bold mb-0.5 mt-1', plan.color)}>{plan.label}</p>
              <p className="text-xl font-black text-white mb-3">
                {plan.price}<span className="text-xs font-normal text-[#555]">/mois</span>
              </p>
              <ul className="space-y-1.5 mb-4 flex-1">
                {plan.features.slice(0, 3).map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <Check className="w-3 h-3 text-[#22c55e] mt-0.5 flex-shrink-0" />
                    <span className="text-[11px] text-[#777]">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleChoose(plan.id)}
                disabled={!!loadingPlan}
                className={cn(
                  'w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                  plan.highlighted
                    ? 'bg-[#D4AF37] text-[#080808] hover:opacity-90'
                    : 'bg-[#111] border border-[#2a2a2a] text-white hover:border-[#D4AF37]/40',
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

        <p className="text-center text-[11px] text-[#444]">Annulation possible à tout moment · Sans engagement</p>

      </div>
    </div>
  )
}
