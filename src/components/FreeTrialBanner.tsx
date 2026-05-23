'use client'
import { PLANS_DISPLAY } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { Check, Gift, Lock, Zap } from 'lucide-react'
import Link from 'next/link'

export interface FreeQuota {
  used: number
  limit: number
  remaining: number
  allowed: boolean
  isPaidPlan: boolean
}

interface FreeTrialBannerProps {
  quota: FreeQuota
  type: 'analyse' | 'chat'
}

export function FreeTrialBanner({ quota, type }: FreeTrialBannerProps) {
  if (quota.isPaidPlan) return null
  if (!quota.allowed) return <FreeTrialUpgradeWall type={type} />
  return <ActiveBanner quota={quota} type={type} />
}

// ─── Active trial banner ──────────────────────────────────────────────────────

function ActiveBanner({ quota, type }: { quota: FreeQuota; type: 'analyse' | 'chat' }) {
  const unit = type === 'analyse' ? 'analyse' : 'message'
  const plural = quota.remaining > 1 ? 's' : ''
  const pct = Math.round(((quota.limit - quota.remaining) / quota.limit) * 100)

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl">
      <Gift className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-[11px] font-black text-[#D4AF37] uppercase tracking-wide whitespace-nowrap">
          Essai gratuit
        </span>
        <div className="flex items-center gap-2 flex-1">
          <div className="h-1.5 w-20 bg-[#1a1a1a] rounded-full overflow-hidden flex-shrink-0">
            <div
              className="h-full bg-[#D4AF37] rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[11px] text-[#777] whitespace-nowrap">
            {quota.remaining} {unit}{plural} restante{plural}
          </span>
        </div>
      </div>
      <Link href="/settings#subscription">
        <button className="text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/30 px-2.5 py-1 rounded-lg hover:bg-[#D4AF37]/10 transition-colors whitespace-nowrap flex-shrink-0">
          Débloquer tout
        </button>
      </Link>
    </div>
  )
}

// ─── Upgrade wall (quota exhausted) ──────────────────────────────────────────

export function FreeTrialUpgradeWall({ type }: { type: 'analyse' | 'chat' }) {
  const unitLabel = type === 'analyse' ? '3 analyses gratuites' : '3 messages gratuits'

  return (
    <div className="flex-1 flex items-center justify-center p-6 md:p-10">
      <div className="max-w-3xl w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Essai gratuit terminé</h2>
          <p className="text-[#666] text-sm max-w-sm mx-auto">
            Tu as utilisé tes {unitLabel}. Choisis un forfait pour continuer sans limite.
          </p>
          <div className="inline-flex items-center gap-1.5 mt-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl px-3 py-1.5">
            <Gift className="w-3 h-3 text-[#D4AF37]" />
            <span className="text-[11px] font-bold text-[#D4AF37]">3 essais offerts utilisés</span>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {PLANS_DISPLAY.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-2xl border p-5 transition-all',
                plan.highlighted
                  ? 'bg-[#0f0f0f] border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/5'
                  : 'bg-[#0a0a0a] border-[#1a1a1a]',
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-[#080808] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  Le plus populaire
                </div>
              )}
              <div className="mb-4">
                <p className={cn('text-sm font-bold mb-1', plan.color)}>{plan.label}</p>
                <p className="text-xl font-black text-white">
                  {plan.price}<span className="text-sm font-normal text-[#555]">/mois</span>
                </p>
                <p className="text-[11px] text-[#444] mt-0.5">ou {plan.yearlyPrice}/mois en annuel</p>
              </div>
              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-[#22c55e] mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-[#888]">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/settings#subscription">
                <button className={cn(
                  'w-full py-2.5 rounded-xl text-xs font-bold transition-all',
                  plan.highlighted
                    ? 'bg-[#D4AF37] text-[#080808] hover:opacity-90'
                    : 'bg-[#0f0f0f] border border-[#2a2a2a] text-white hover:border-[#D4AF37]/40',
                )}>
                  Choisir {plan.label}
                </button>
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/settings#subscription"
            className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#080808] font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            <Zap className="w-4 h-4" />
            Débloquer toutes les fonctionnalités
          </Link>
          <p className="text-[11px] text-[#444] mt-3">Annulation possible à tout moment · Sans engagement</p>
        </div>

      </div>
    </div>
  )
}
