'use client'
import { PLANS_DISPLAY } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { Check, Lock, Zap } from 'lucide-react'
import Link from 'next/link'

interface UpgradeOverlayProps {
  title?: string
  subtitle?: string
}

export function UpgradeOverlay({
  title   = 'Fonctionnalité réservée aux abonnés',
  subtitle = 'Choisissez un forfait pour débloquer tous les modules PrimeX.',
}: UpgradeOverlayProps) {
  const plans = PLANS_DISPLAY.filter(p => ['starter', 'pro', 'expert'].includes(p.id))

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center p-4 md:p-8"
      style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', backgroundColor: 'rgba(8,8,8,0.80)' }}
    >
      <div className="max-w-3xl w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">{title}</h2>
          <p className="text-sm text-[#555] max-w-sm mx-auto">{subtitle}</p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'rounded-2xl p-4 border',
                plan.highlighted
                  ? 'bg-[#0f0f0f] border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/5'
                  : 'bg-[#0a0a0a] border-[#1a1a1a]',
              )}
            >
              {plan.highlighted && (
                <div className="text-center mb-2">
                  <span className="text-[10px] font-black bg-[#D4AF37] text-[#080808] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Populaire
                  </span>
                </div>
              )}
              <p className={cn('text-sm font-bold mb-0.5', plan.color)}>{plan.label}</p>
              <p className="text-xl font-black text-white mb-3">
                {plan.price}
                <span className="text-xs font-normal text-[#555]">/mois</span>
              </p>
              <ul className="space-y-1.5 mb-4">
                {plan.features.slice(0, 3).map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <Check className="w-3 h-3 text-[#22c55e] mt-0.5 flex-shrink-0" />
                    <span className="text-[11px] text-[#777]">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/settings#subscription">
                <button
                  className={cn(
                    'w-full py-2 rounded-xl text-xs font-bold transition-all',
                    plan.highlighted
                      ? 'bg-[#D4AF37] text-[#080808] hover:opacity-90'
                      : 'bg-[#111] border border-[#2a2a2a] text-white hover:border-[#D4AF37]/40',
                  )}
                >
                  Choisir {plan.label}
                </button>
              </Link>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/settings#subscription">
            <button className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#080808] font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm">
              <Zap className="w-4 h-4" />
              Voir tous les forfaits
            </button>
          </Link>
          <p className="text-[11px] text-[#444] mt-2">Annulation possible à tout moment · Sans engagement</p>
        </div>

      </div>
    </div>
  )
}
