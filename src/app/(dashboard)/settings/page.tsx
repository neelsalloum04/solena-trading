'use client'
import { createClient } from '@/lib/supabase/client'
import { useUserPlan } from '@/contexts/UserPlanContext'
import { PLAN_META } from '@/lib/plans'
import { PLANS } from '@/lib/stripe/client'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  ChevronRight,
  Crown,
  ExternalLink,
  Loader2,
  Moon,
  Save,
  Shield,
  ShieldCheck,
  ShieldOff,
  Sun,
  User,
  Zap,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

const TABS = ['Profil', 'Abonnement', 'Sécurité']

function SettingsContent() {
  const searchParams  = useSearchParams()
  const { plan }      = useUserPlan()
  const planMeta      = plan !== 'admin' ? PLAN_META[plan] : null
  const supabase      = useMemo(() => createClient(), [])

  const initialTab = (() => {
    const t = searchParams.get('tab')
    if (t === 'securite') return 'Sécurité'
    if (t === 'abonnement') return 'Abonnement'
    return 'Profil'
  })()
  const [activeTab, setActiveTab] = useState(initialTab)

  // ── Theme ─────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  const applyTheme = (t: 'dark' | 'light') => {
    setTheme(t)
    localStorage.setItem('theme', t)
    if (t === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
  }

  // ── Profile state ──────────────────────────────────────────────────────────
  const [userId,       setUserId]       = useState('')
  const [fullName,     setFullName]     = useState('')
  const [email,        setEmail]        = useState('')
  const [newEmail,     setNewEmail]     = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then((res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const u = res.data?.user
      if (!u) return
      setUserId(u.id)
      setEmail(u.email || '')
      setNewEmail(u.email || '')
    })
    supabase.from('profiles').select('full_name').single().then((res: { data: { full_name: string | null } | null }) => {
      if (res.data) setFullName(res.data.full_name || '')
      setProfileLoaded(true)
    })
  }, [supabase])

  const handleSaveProfile = async () => {
    if (!userId) return
    setProfileSaving(true)
    try {
      const tasks: Promise<unknown>[] = []

      // Update display name
      tasks.push(
        supabase.from('profiles').update({ full_name: fullName }).eq('id', userId)
      )

      // Update email if changed
      if (newEmail.trim() && newEmail !== email) {
        tasks.push(
          supabase.auth.updateUser({ email: newEmail.trim() }).then((res: { error: Error | null }) => {
            if (res.error) throw res.error
          })
        )
      }

      await Promise.all(tasks)

      if (newEmail !== email) {
        toast.success('Un email de confirmation a été envoyé à ' + newEmail)
      } else {
        toast.success('Profil mis à jour.')
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde. Réessayez.')
    } finally {
      setProfileSaving(false)
    }
  }

  // ── Subscription state ─────────────────────────────────────────────────────
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleUpgrade = async (targetPlan: string) => {
    if (targetPlan === plan) return
    setLoadingPlan(targetPlan)
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan, billing: 'monthly' }),
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
      const res  = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error('Portail non disponible. Contactez le support.')
    } catch {
      toast.error('Erreur réseau.')
    }
  }

  // ── MFA state ─────────────────────────────────────────────────────────────
  const [mfaStatus,     setMfaStatus]     = useState<'loading' | 'disabled' | 'active'>('loading')
  const [mfaFactorId,   setMfaFactorId]   = useState('')
  const [enrollStep,    setEnrollStep]    = useState<'idle' | 'qr' | 'verify'>('idle')
  const [qrCode,        setQrCode]        = useState('')
  const [mfaSecret,     setMfaSecret]     = useState('')
  const [enrollFactorId,setEnrollFactorId] = useState('')
  const [verifyCode,    setVerifyCode]    = useState('')
  const [mfaLoading,    setMfaLoading]    = useState(false)

  useEffect(() => {
    if (activeTab !== 'Sécurité') return
    supabase.auth.mfa.listFactors().then(({ data }: { data: { totp?: Array<{ id: string; status: string }> } | null }) => {
      const verified = data?.totp?.find((f: { status: string }) => f.status === 'verified')
      if (verified) { setMfaStatus('active'); setMfaFactorId(verified.id) }
      else           setMfaStatus('disabled')
    })
  }, [activeTab, supabase])

  const handleEnroll = async () => {
    setMfaLoading(true)
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const unverified = factors?.totp?.find((f: { status: string }) => f.status === 'unverified')
      if (unverified) await supabase.auth.mfa.unenroll({ factorId: unverified.id })
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'PrimeX IA' })
      if (error || !data) { toast.error("Erreur lors de l'activation. Réessayez."); return }
      setQrCode(data.totp.qr_code)
      setMfaSecret(data.totp.secret)
      setEnrollFactorId(data.id)
      setEnrollStep('qr')
    } catch { toast.error('Erreur. Réessayez.') }
    finally  { setMfaLoading(false) }
  }

  const handleEnrollVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (verifyCode.length !== 6) return
    setMfaLoading(true)
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: enrollFactorId })
      if (cErr || !challenge) { toast.error('Erreur. Réessayez.'); return }
      const { error } = await supabase.auth.mfa.verify({ factorId: enrollFactorId, challengeId: challenge.id, code: verifyCode })
      if (error) { toast.error("Code incorrect. Vérifiez votre application d'authentification."); setVerifyCode(''); return }
      setMfaStatus('active')
      setMfaFactorId(enrollFactorId)
      setEnrollStep('idle')
      setVerifyCode('')
      toast.success('Double authentification activée !')
    } catch { toast.error('Erreur. Réessayez.') }
    finally  { setMfaLoading(false) }
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
    } catch { toast.error('Erreur. Réessayez.') }
    finally  { setMfaLoading(false) }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Paramètres</h1>
        <p className="text-sm text-[#555]">Gérez votre profil, abonnement et sécurité.</p>
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

      {/* ── Profil ── */}
      {activeTab === 'Profil' && (
        <div className="space-y-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                {profileLoaded
                  ? <span className="text-lg font-black text-[#D4AF37]">{fullName?.[0] || email?.[0]?.toUpperCase() || 'T'}</span>
                  : <User className="w-5 h-5 text-[#D4AF37]" />}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{fullName || 'Trader'}</p>
                <p className="text-xs text-[#555]">{email}</p>
              </div>
            </div>

            <div className="h-px bg-[#1a1a1a]" />

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#888] mb-1.5">Prénom / Nom affiché</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Ton prénom ou pseudo"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#888] mb-1.5">Adresse email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="ton@email.com"
                  className="input w-full"
                />
                {newEmail !== email && newEmail && (
                  <p className="text-[11px] text-[#D4AF37] mt-1.5">
                    Un email de confirmation sera envoyé à cette adresse.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={profileSaving || !profileLoaded}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#080808] text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {profileSaving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>

          {/* Plan badge */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/20 flex items-center justify-center">
                <Crown className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-[10px] text-[#555]">Forfait actuel</p>
                <p className="text-sm font-bold text-white capitalize">{planMeta?.label ?? 'Admin'}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('Abonnement')}
              className="text-xs text-[#D4AF37] hover:underline font-medium flex items-center gap-1"
            >
              Changer <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Theme toggle */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4">
            <p className="text-xs font-semibold text-[#888] mb-3">Apparence</p>
            <div className="flex gap-2">
              <button
                onClick={() => applyTheme('dark')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                  theme === 'dark'
                    ? 'bg-[#D4AF37] text-[#080808] border-[#D4AF37]'
                    : 'text-[#555] border-[#222] hover:border-[#333] hover:text-white'
                )}
              >
                <Moon className="w-3.5 h-3.5" />
                Sombre
              </button>
              <button
                onClick={() => applyTheme('light')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                  theme === 'light'
                    ? 'bg-[#D4AF37] text-[#080808] border-[#D4AF37]'
                    : 'text-[#555] border-[#222] hover:border-[#333] hover:text-white'
                )}
              >
                <Sun className="w-3.5 h-3.5" />
                Clair
              </button>
            </div>
          </div>
        </div>
      )}

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
              <button onClick={handlePortal} className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1">
                Gérer mon abonnement (annuler, changer) <ExternalLink className="w-3 h-3" />
              </button>
            )}
            {plan === 'free' && (
              <p className="text-xs text-[#555]">Version gratuite. Passez à un forfait payant pour accéder à toutes les fonctionnalités.</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Object.values(PLANS).map((p) => {
              const isCurrent = plan === p.plan
              const isLoading = loadingPlan === p.plan
              return (
                <div key={p.plan} className={cn(
                  'bg-[#0a0a0a] border rounded-2xl p-5 flex flex-col',
                  p.highlighted ? 'border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/5'
                    : isCurrent  ? 'border-[#22c55e]/30'
                    : 'border-[#1a1a1a]'
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: p.color }}>{p.name}</p>
                    {p.badge && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#1a1a1a] text-[#555] border border-[#222]">
                        {p.badge.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="mb-4">
                    <div className="flex items-end gap-1 leading-none">
                      <span className="text-3xl font-black text-white leading-none">{p.monthlyPrice}</span>
                      <span className="text-[#444] text-xs pb-0.5">€/mois</span>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-5 flex-1">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-[#666]">
                        <span className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${p.color}18` }}>
                          <CheckCircle className="w-2 h-2" style={{ color: p.color }} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(p.plan)}
                    disabled={isCurrent || !!loadingPlan}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all',
                      isCurrent    ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 cursor-default'
                        : p.highlighted ? 'bg-[#D4AF37] text-[#080808] hover:brightness-110'
                        : 'border border-[#222] text-white hover:border-[#383838] hover:bg-[#111]',
                      !!loadingPlan && !isLoading && 'opacity-40'
                    )}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" />
                      : isCurrent ? 'Forfait actuel'
                      : <><span>Choisir</span><ChevronRight className="w-3.5 h-3.5" /></>}
                  </button>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-[#333] text-center">
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

            {/* 2FA */}
            <div className="p-4 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {mfaStatus === 'active'
                    ? <ShieldCheck className="w-4 h-4 text-[#22c55e]" />
                    : <ShieldOff   className="w-4 h-4 text-[#555]" />}
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
                  <span className="text-[10px] font-bold text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2 py-0.5 rounded-full">ACTIF</span>
                )}
              </div>

              {mfaStatus === 'disabled' && enrollStep === 'idle' && (
                <button onClick={handleEnroll} disabled={mfaLoading}
                  className="w-full py-2.5 rounded-lg bg-[#D4AF37] text-[#080808] text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                  {mfaLoading && <span className="w-4 h-4 border-2 border-[#080808]/40 border-t-[#080808] rounded-full animate-spin" />}
                  Activer la 2FA
                </button>
              )}

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
                    <p className="mt-2 text-xs font-mono text-[#888] bg-[#111] rounded-lg p-3 break-all border border-[#1a1a1a]">{mfaSecret}</p>
                  </details>
                  <div className="flex gap-2">
                    <button onClick={() => { setEnrollStep('idle'); setQrCode(''); setMfaSecret('') }}
                      className="flex-1 py-2 rounded-lg border border-[#222] text-[#555] text-sm hover:border-[#333] hover:text-[#888] transition-colors">
                      Annuler
                    </button>
                    <button onClick={() => setEnrollStep('verify')}
                      className="flex-1 py-2 rounded-lg bg-[#D4AF37] text-[#080808] text-sm font-bold hover:opacity-90">
                      Continuer →
                    </button>
                  </div>
                </div>
              )}

              {enrollStep === 'verify' && (
                <form onSubmit={handleEnrollVerify} className="space-y-4">
                  <p className="text-xs text-[#888]">Entrez le code à 6 chiffres affiché dans votre application :</p>
                  <input
                    type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                    value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000" autoFocus
                    className="input text-center text-xl tracking-[0.5em] font-mono placeholder:tracking-normal placeholder:text-base"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEnrollStep('qr')}
                      className="flex-1 py-2 rounded-lg border border-[#222] text-[#555] text-sm hover:border-[#333] hover:text-[#888] transition-colors">
                      ← Retour
                    </button>
                    <button type="submit" disabled={verifyCode.length !== 6 || mfaLoading}
                      className="flex-1 py-2.5 rounded-lg bg-[#D4AF37] text-[#080808] text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                      {mfaLoading && <span className="w-4 h-4 border-2 border-[#080808]/40 border-t-[#080808] rounded-full animate-spin" />}
                      Activer
                    </button>
                  </div>
                </form>
              )}

              {mfaStatus === 'active' && enrollStep === 'idle' && (
                <button onClick={handleUnenroll} disabled={mfaLoading}
                  className="w-full py-2 rounded-lg border border-[#ef4444]/30 text-[#ef4444] text-xs font-medium hover:bg-[#ef4444]/5 transition-colors disabled:opacity-60">
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

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[#555] text-sm">Chargement…</div>}>
      <SettingsContent />
    </Suspense>
  )
}
