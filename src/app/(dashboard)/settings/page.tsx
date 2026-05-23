'use client'
import { useUserPlan } from '@/contexts/UserPlanContext'
import { PLAN_META } from '@/lib/plans'
import { PLANS } from '@/lib/stripe/client'
import { cn } from '@/lib/utils'
import { CheckCircle, ChevronRight, Crown, ExternalLink, Loader2, Shield, Zap } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const TABS = ['Abonnement', 'Sécurité']

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Abonnement')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const { plan } = useUserPlan()
  const planMeta = plan !== 'admin' ? PLAN_META[plan] : null

  const handleUpgrade = async (targetPlan: string) => {
    if (targetPlan === plan) return
    setLoadingPlan(targetPlan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan }),
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

  const handlePortal = async () => {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error('Portail non disponible. Contactez le support.')
    } catch {
      toast.error('Erreur réseau.')
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Paramètres</h1>
        <p className="text-sm text-[#555]">Gérez votre abonnement et votre compte.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              activeTab === tab ? 'bg-[#D4AF37] text-[#080808]' : 'text-[#555] hover:text-white'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Abonnement */}
      {activeTab === 'Abonnement' && (
        <div className="space-y-6">

          {/* Current plan */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/20 flex items-center justify-center">
                <Crown className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-xs text-[#555] font-medium">Forfait actuel</p>
                <p className="text-sm font-bold text-white capitalize">{planMeta?.label ?? 'Admin'}</p>
              </div>
              <span className="ml-auto text-[10px] font-bold text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2.5 py-1 rounded-full">
                ACTIF
              </span>
            </div>
            {plan !== 'free' && plan !== 'admin' && (
              <button
                onClick={handlePortal}
                className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1"
              >
                Gérer mon abonnement (annuler, changer) <ExternalLink className="w-3 h-3" />
              </button>
            )}
            {plan === 'free' && (
              <p className="text-xs text-[#555]">Vous utilisez la version gratuite. Passez à un forfait payant pour accéder à toutes les fonctionnalités.</p>
            )}
          </div>

          {/* Plan cards */}
          <div className="grid md:grid-cols-3 gap-4" id="subscription">
            {Object.values(PLANS).map((p) => {
              const isCurrent = plan === p.plan
              const isLoading = loadingPlan === p.plan
              return (
                <div
                  key={p.plan}
                  className={cn(
                    'bg-[#0a0a0a] border rounded-2xl p-5 flex flex-col',
                    p.highlighted
                      ? 'border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/5'
                      : isCurrent
                      ? 'border-[#22c55e]/30'
                      : 'border-[#1a1a1a]'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-black text-white">{p.name}</h3>
                    {p.badge && (
                      <span className={cn(
                        'text-[9px] font-bold px-2 py-0.5 rounded-full',
                        p.highlighted
                          ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                          : 'bg-[#1a1a1a] text-[#555] border border-[#222]'
                      )}>
                        {p.badge.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-black text-white mb-1">
                    {p.price.toFixed(2).replace('.', ',')}€
                    <span className="text-xs font-normal text-[#555]">/mois</span>
                  </p>
                  <ul className="space-y-2 mb-5 mt-3 flex-1">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-[#888]">
                        <CheckCircle className="w-3.5 h-3.5 text-[#22c55e] flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(p.plan)}
                    disabled={isCurrent || !!loadingPlan}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all',
                      isCurrent
                        ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 cursor-default'
                        : p.highlighted
                        ? 'bg-[#D4AF37] text-[#080808] hover:opacity-90'
                        : 'bg-[#141414] text-white border border-[#222] hover:border-[#444]',
                      !!loadingPlan && !isLoading && 'opacity-40'
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrent ? (
                      'Forfait actuel'
                    ) : (
                      <>Choisir <ChevronRight className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-[#444] text-center">
            Paiement sécurisé par Stripe · Annulation possible à tout moment · Sans engagement
          </p>
        </div>
      )}

      {/* Sécurité */}
      {activeTab === 'Sécurité' && (
        <div className="space-y-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="text-sm font-bold text-white">Sécurité du compte</h2>
            </div>

            <div className="p-4 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Mot de passe</p>
                <p className="text-xs text-[#555] mt-0.5">Modifiez votre mot de passe de connexion</p>
              </div>
              <a
                href="/forgot-password"
                className="text-xs text-[#D4AF37] hover:underline font-medium"
              >
                Modifier
              </a>
            </div>

            <div className="p-4 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Sessions actives</p>
                <p className="text-xs text-[#555] mt-0.5">Gérez les appareils connectés à votre compte</p>
              </div>
              <span className="text-xs text-[#555]">Via Supabase</span>
            </div>

            <div className="p-4 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Données personnelles</p>
                  <p className="text-xs text-[#555] mt-0.5">
                    Pour toute demande RGPD (accès, rectification, suppression), contactez-nous à{' '}
                    <a href="mailto:contact@ecomstartprofits.com" className="text-[#D4AF37] hover:underline">
                      contact@ecomstartprofits.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
