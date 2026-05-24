'use client'
import { createClient } from '@/lib/supabase/client'
import { useUserPlan } from '@/contexts/UserPlanContext'
import { PLAN_META } from '@/lib/plans'
import { PLANS } from '@/lib/stripe/client'
import { cn } from '@/lib/utils'
import { CheckCircle, ChevronRight, Crown, ExternalLink, Loader2, Shield, ShieldCheck, ShieldOff, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

const TABS = ['Abonnement', 'Sécurité']

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Abonnement')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const { plan } = useUserPlan()
  const planMeta = plan !== 'admin' ? PLAN_META[plan] : null
  const supabase = useMemo(() => createClient(), [])

  // ── MFA state ─────────────────────────────────────────────────────────────
  const [mfaStatus, setMfaStatus] = useState<'loading' | 'disabled' | 'active'>('loading')
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [enrollStep, setEnrollStep] = useState<'idle' | 'qr' | 'verify'>('idle')
  const [qrCode, setQrCode] = useState('')
  const [mfaSecret, setMfaSecret] = useState('')
  const [enrollFactorId, setEnrollFactorId] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)

  useEffect(() => {
    if (activeTab !== 'Sécurité') return
    supabase.auth.mfa.listFactors().then(({ data }: { data: { totp?: Array<{ id: string; status: string }> } | null }) => {
      const verified = data?.totp?.find((f: { status: string }) => f.status === 'verified')
      if (verified) {
        setMfaStatus('active')
        setMfaFactorId(verified.id)
      } else {
        setMfaStatus('disabled')
      }
    })
  }, [activeTab, supabase])

  const handleEnroll = async () => {
    setMfaLoading(true)
    try {
      // Remove any leftover unverified factor before enrolling
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const unverified = factors?.totp?.find((f: { status: string }) => f.status === 'unverified')
      if (unverified) await supabase.auth.mfa.unenroll({ factorId: unverified.id })

      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'PrimeX IA' })
      if (error || !data) { toast.error('Erreur lors de l\'activation. Réessayez.'); return }
      setQrCode(data.totp.qr_code)
      setMfaSecret(data.totp.secret)
      setEnrollFactorId(data.id)
      setEnrollStep('qr')
    } catch {
      toast.error('Erreur. Réessayez.')
    } finally {
      setMfaLoading(false)
    }
  }

  const handleEnrollVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (verifyCode.length !== 6) return
    setMfaLoading(true)
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: enrollFactorId })
      if (cErr || !challenge) { toast.error('Erreur. Réessayez.'); return }
      const { error } = await supabase.auth.mfa.verify({
        factorId: enrollFactorId,
        challengeId: challenge.id,
        code: verifyCode,
      })
      if (error) {
        toast.error('Code incorrect. Vérifiez votre application d\'authentification.')
        setVerifyCode('')
        return
      }
      setMfaStatus('active')
      setMfaFactorId(enrollFactorId)
      setEnrollStep('idle')
      setVerifyCode('')
      toast.success('Double authentification activée !')
    } catch {
      toast.error('Erreur. Réessayez.')
    } finally {
      setMfaLoading(false)
    }
  }

  const handleUnenroll = async () => {
    if (!window.confirm('Désactiver la double authentification ? Votre compte sera moins sécurisé.')) return
    setMfaLoading(true)
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId })
      if (error) { toast.error('Erreur lors de la désactivation.'); return }
      setMfaStatus('disabled')
      setMfaFactorId('')
      toast.success('Double authentification désactivée.')
    } catch {
      toast.error('Erreur. Réessayez.')
    } finally {
      setMfaLoading(false)
    }
  }

  // ── Subscription handlers ─────────────────────────────────────────────────
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
      if (data.url) window.location.href = data.url
      else { toast.error(data.error || 'Erreur lors du paiement.'); setLoadingPlan(null) }
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

      {/* ── Abonnement ── */}
      {activeTab === 'Abonnement' && (
        <div className="space-y-6">
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

      {/* ── Sécurité ── */}
      {activeTab === 'Sécurité' && (
        <div className="space-y-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="text-sm font-bold text-white">Sécurité du compte</h2>
            </div>

            {/* Password */}
            <div className="p-4 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Mot de passe</p>
                <p className="text-xs text-[#555] mt-0.5">Modifiez votre mot de passe de connexion</p>
              </div>
              <a href="/forgot-password" className="text-xs text-[#D4AF37] hover:underline font-medium">
                Modifier
              </a>
            </div>

            {/* 2FA section */}
            <div className="p-4 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl space-y-4">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {mfaStatus === 'active'
                    ? <ShieldCheck className="w-4 h-4 text-[#22c55e]" />
                    : <ShieldOff className="w-4 h-4 text-[#555]" />
                  }
                  <div>
                    <p className="text-sm font-medium text-white">Double authentification (2FA)</p>
                    <p className="text-xs text-[#555] mt-0.5">
                      {mfaStatus === 'loading' ? 'Chargement...'
                        : mfaStatus === 'active' ? 'Activée — via application TOTP'
                        : 'Non activée'}
                    </p>
                  </div>
                </div>
                {mfaStatus === 'active' && enrollStep === 'idle' && (
                  <span className="text-[10px] font-bold text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2 py-0.5 rounded-full">
                    ACTIF
                  </span>
                )}
              </div>

              {/* Disabled — propose activation */}
              {mfaStatus === 'disabled' && enrollStep === 'idle' && (
                <button
                  onClick={handleEnroll}
                  disabled={mfaLoading}
                  className="w-full py-2.5 rounded-lg bg-[#D4AF37] text-[#080808] text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {mfaLoading && <span className="w-4 h-4 border-2 border-[#080808]/40 border-t-[#080808] rounded-full animate-spin" />}
                  Activer la 2FA
                </button>
              )}

              {/* Enrollment: QR code step */}
              {enrollStep === 'qr' && (
                <div className="space-y-4 text-center">
                  <p className="text-xs text-[#888] leading-relaxed">
                    Scannez ce QR code avec <strong className="text-[#F2EDD7]">Google Authenticator</strong>, <strong className="text-[#F2EDD7]">Authy</strong> ou <strong className="text-[#F2EDD7]">1Password</strong>
                  </p>
                  <div className="flex justify-center">
                    <div className="p-3 bg-white rounded-xl inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrCode} alt="QR Code 2FA" className="w-40 h-40" />
                    </div>
                  </div>
                  <details className="text-left">
                    <summary className="text-xs text-[#555] cursor-pointer hover:text-[#888] select-none">
                      Pas de scanner ? Entrez le code manuellement
                    </summary>
                    <p className="mt-2 text-xs font-mono text-[#888] bg-[#111] rounded-lg p-3 break-all border border-[#1a1a1a]">
                      {mfaSecret}
                    </p>
                  </details>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEnrollStep('idle'); setQrCode(''); setMfaSecret('') }}
                      className="flex-1 py-2 rounded-lg border border-[#222] text-[#555] text-sm hover:border-[#333] hover:text-[#888] transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => setEnrollStep('verify')}
                      className="flex-1 py-2 rounded-lg bg-[#D4AF37] text-[#080808] text-sm font-bold hover:opacity-90"
                    >
                      Continuer →
                    </button>
                  </div>
                </div>
              )}

              {/* Enrollment: verification step */}
              {enrollStep === 'verify' && (
                <form onSubmit={handleEnrollVerify} className="space-y-4">
                  <p className="text-xs text-[#888]">
                    Entrez le code à 6 chiffres affiché dans votre application pour confirmer :
                  </p>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    autoFocus
                    className="input text-center text-xl tracking-[0.5em] font-mono placeholder:tracking-normal placeholder:text-base"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEnrollStep('qr')}
                      className="flex-1 py-2 rounded-lg border border-[#222] text-[#555] text-sm hover:border-[#333] hover:text-[#888] transition-colors"
                    >
                      ← Retour
                    </button>
                    <button
                      type="submit"
                      disabled={verifyCode.length !== 6 || mfaLoading}
                      className="flex-1 py-2.5 rounded-lg bg-[#D4AF37] text-[#080808] text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {mfaLoading && <span className="w-4 h-4 border-2 border-[#080808]/40 border-t-[#080808] rounded-full animate-spin" />}
                      Activer
                    </button>
                  </div>
                </form>
              )}

              {/* Active — propose deactivation */}
              {mfaStatus === 'active' && enrollStep === 'idle' && (
                <button
                  onClick={handleUnenroll}
                  disabled={mfaLoading}
                  className="w-full py-2 rounded-lg border border-[#ef4444]/30 text-[#ef4444] text-xs font-medium hover:bg-[#ef4444]/5 transition-colors disabled:opacity-60"
                >
                  {mfaLoading ? 'Désactivation...' : 'Désactiver la 2FA'}
                </button>
              )}
            </div>

            {/* RGPD */}
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
