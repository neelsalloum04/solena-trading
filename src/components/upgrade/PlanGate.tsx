'use client'
import { useUserPlan } from '@/contexts/UserPlanContext'
import { PLANS_DISPLAY, type PlanId } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { Check, Lock, Loader2, Zap } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface PlanGateProps {
  requiredPlan: PlanId
  children: React.ReactNode
  inline?: boolean
}

export function PlanGate({ requiredPlan, children, inline = false }: PlanGateProps) {
  const { canAccess } = useUserPlan()
  if (canAccess(requiredPlan)) return <>{children}</>
  if (inline) return <InlineUpgrade requiredPlan={requiredPlan} />
  return <FullPageUpgrade requiredPlan={requiredPlan} />
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function checkoutPlan(planId: string, setLoading: (v: string | null) => void) {
  setLoading(planId)
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
      setLoading(null)
    }
  } catch {
    toast.error('Erreur réseau. Réessayez.')
    setLoading(null)
  }
}

// ─── Full page upgrade gate ───────────────────────────────────────────────────

function FullPageUpgrade({ requiredPlan }: { requiredPlan: PlanId }) {
  const target = PLANS_DISPLAY.find(p => p.id === requiredPlan)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-8">
      <div className="max-w-4xl w-full">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">
            {target ? `Fonctionnalité ${target.label}` : 'Accès restreint'}
          </h1>
          <p className="text-[#666] max-w-md mx-auto text-sm leading-relaxed">
            Cette fonctionnalité est réservée aux abonnés. Choisissez le forfait adapté pour débloquer l&apos;ensemble des outils de trading.
          </p>
          {target && (
            <div className="inline-flex items-center gap-2 mt-4 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl px-4 py-2">
              <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-xs font-bold text-[#D4AF37]">Nécessite le forfait {target.label} ou supérieur</span>
            </div>
          )}
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
          {PLANS_DISPLAY.map((plan) => {
            const isTarget = plan.id === requiredPlan
            return (
              <div key={plan.id} className={cn(
                'relative rounded-2xl p-5 border transition-all',
                plan.highlighted
                  ? 'bg-[#0f0f0f] border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/5'
                  : 'bg-[#0a0a0a] border-[#1a1a1a]',
                isTarget && 'ring-2 ring-[#D4AF37]/30'
              )}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-[#080808] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Le plus populaire
                  </div>
                )}
                <div className="mb-4">
                  <p className={cn('text-sm font-bold mb-1', plan.color)}>{plan.label}</p>
                  <p className="text-2xl font-black text-white">{plan.price}<span className="text-sm font-normal text-[#555]">/mois</span></p>
                </div>
                <ul className="space-y-2 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#22c55e] mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-[#888]">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => checkoutPlan(plan.id, setLoadingPlan)}
                  disabled={!!loadingPlan}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2',
                    plan.highlighted
                      ? 'bg-[#D4AF37] text-[#080808] hover:opacity-90'
                      : 'bg-[#0f0f0f] border border-[#2a2a2a] text-white hover:border-[#D4AF37]/40',
                    !!loadingPlan && loadingPlan !== plan.id && 'opacity-40'
                  )}
                >
                  {loadingPlan === plan.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : `Choisir ${plan.label}`}
                </button>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <p className="text-[11px] text-[#444]">Annulation possible à tout moment · Sans engagement</p>
        </div>
      </div>
    </div>
  )
}

// ─── Inline banner (for partial sections) ────────────────────────────────────

function InlineUpgrade({ requiredPlan }: { requiredPlan: PlanId }) {
  const target = PLANS_DISPLAY.find(p => p.id === requiredPlan)
  return (
    <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-6 text-center">
      <Lock className="w-6 h-6 text-[#D4AF37] mx-auto mb-2" />
      <p className="text-sm font-bold text-white mb-1">Fonctionnalité {target?.label ?? 'Premium'}</p>
      <p className="text-xs text-[#555] mb-4">Disponible dès le forfait {target?.label ?? 'Premium'}</p>
      <Link
        href="/plans"
        className="inline-block text-xs font-bold bg-[#D4AF37] text-[#080808] px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
      >
        Voir les forfaits
      </Link>
    </div>
  )
}
