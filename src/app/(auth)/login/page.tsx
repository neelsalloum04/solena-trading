'use client'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // MFA step
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials')
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaChallengeId, setMfaChallengeId] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)

  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError === 'auth_failed') toast.error('Authentification échouée. Réessayez.')
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Veuillez saisir une adresse email valide.')
      return
    }
    if (!password) { toast.error('Veuillez saisir votre mot de passe.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        if (error.message.includes('Invalid login credentials')) toast.error('Email ou mot de passe incorrect.')
        else if (error.message.includes('Email not confirmed')) toast.error('Veuillez confirmer votre email avant de vous connecter.')
        else toast.error(error.message)
        return
      }

      // Check if user has MFA enrolled
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
        const { data: factors } = await supabase.auth.mfa.listFactors()
        const totp = factors?.totp?.[0]
        if (totp) {
          const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: totp.id })
          if (!cErr && challenge) {
            setMfaFactorId(totp.id)
            setMfaChallengeId(challenge.id)
            setStep('mfa')
            return
          }
        }
      }

      window.location.href = '/analyse'
    } catch {
      toast.error('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mfaCode.length !== 6) return
    setMfaLoading(true)
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code: mfaCode,
      })
      if (error) {
        toast.error('Code incorrect ou expiré. Réessayez.')
        setMfaCode('')
        return
      }
      window.location.href = '/analyse'
    } catch {
      toast.error('Erreur. Réessayez.')
    } finally {
      setMfaLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
        },
      })
      if (error) { toast.error(error.message); setGoogleLoading(false) }
    } catch {
      toast.error('Connexion Google échouée.')
      setGoogleLoading(false)
    }
  }

  // ── MFA verification step ─────────────────────────────────────────────────
  if (step === 'mfa') {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-bold text-[#F2EDD7] mb-1">Vérification</h1>
          <p className="text-[#666] text-sm leading-relaxed">
            Entrez le code à 6 chiffres<br />de votre application d&apos;authentification
          </p>
        </div>

        <form onSubmit={handleMfaVerify} className="space-y-4">
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={mfaCode}
            onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            autoFocus
            className="input text-center text-2xl tracking-[0.6em] font-mono placeholder:tracking-normal placeholder:text-base"
          />
          <button
            type="submit"
            disabled={mfaCode.length !== 6 || mfaLoading}
            className="btn-gold w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {mfaLoading && <span className="w-4 h-4 border-2 border-[#080808]/40 border-t-[#080808] rounded-full animate-spin" />}
            Vérifier
          </button>
        </form>

        <button
          onClick={() => { setStep('credentials'); setMfaCode('') }}
          className="w-full text-center text-xs text-[#555] mt-4 hover:text-[#888] transition-colors"
        >
          ← Retour à la connexion
        </button>
      </div>
    )
  }

  // ── Credentials step ──────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#F2EDD7] mb-1">Bon retour</h1>
        <p className="text-[#666] text-sm">Connectez-vous à votre compte PrimeX IA</p>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 bg-[#0e0e0e] border border-[#222] text-[#F2EDD7] text-sm font-medium py-2.5 rounded-lg hover:border-[#333] hover:bg-[#141414] transition-colors mb-5 disabled:opacity-50"
      >
        {googleLoading ? (
          <span className="w-4 h-4 border-2 border-[#555] border-t-[#D4AF37] rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        Continuer avec Google
      </button>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#1a1a1a]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#080808] px-3 text-xs text-[#555]">ou continuer avec email</span>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-[#888] mb-1.5">Adresse email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444] pointer-events-none" />
            <input
              id="email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required autoComplete="email" suppressHydrationWarning
              className="input pl-9"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-xs font-medium text-[#888]">Mot de passe</label>
            <Link href="/forgot-password" className="text-xs text-[#D4AF37] hover:underline">Oublié ?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444] pointer-events-none" />
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required autoComplete="current-password" suppressHydrationWarning
              className="input pl-9 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] transition-colors"
              aria-label={showPass ? 'Masquer' : 'Afficher'}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="btn-gold w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading && <span className="w-4 h-4 border-2 border-[#080808]/40 border-t-[#080808] rounded-full animate-spin" />}
          Se connecter
        </button>
      </form>

      <p className="text-center text-sm text-[#555] mt-6">
        Pas encore de compte ?{' '}
        <Link href="/signup" className="text-[#D4AF37] font-medium hover:underline">
          Essai gratuit
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm h-96 bg-[#0e0e0e] rounded-xl animate-pulse" />}>
      <LoginForm />
    </Suspense>
  )
}
