'use client'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Veuillez saisir votre nom complet.'); return }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Veuillez saisir une adresse email valide.')
      return
    }
    if (password.length < 8) { toast.error('Mot de passe : 8 caractères minimum.'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Une erreur est survenue.')
        return
      }

      if (data.requiresEmailConfirmation) {
        setEmailSent(true)
        fetch('/api/email/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), name: name.trim() }),
        }).catch(() => {})
      } else {
        fetch('/api/email/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), name: name.trim() }),
        }).catch(() => {})
        toast.success('Compte créé avec succès !')
        window.location.href = '/analyse'
      }
    } catch {
      toast.error('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
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
      toast.error('Inscription Google échouée.')
      setGoogleLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-[#D4AF37]" />
        </div>
        <h1 className="text-2xl font-bold text-[#F2EDD7] mb-2">Vérifiez vos emails</h1>
        <p className="text-[#666] text-sm mb-6 leading-relaxed">
          Un email de confirmation a été envoyé à{' '}
          <span className="text-[#F2EDD7] font-medium">{email}</span>.
          Cliquez sur le lien pour activer votre compte.
        </p>
        <p className="text-xs text-[#444] mb-4">
          Vous ne trouvez pas l&apos;email ? Vérifiez vos spams.
        </p>
        <Link href="/login" className="text-sm text-[#D4AF37] font-medium hover:underline">
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#F2EDD7] mb-1">Créez votre compte</h1>
        <p className="text-[#666] text-sm">5 000 tokens offerts, sans carte bancaire</p>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
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
          <span className="bg-[#080808] px-3 text-xs text-[#555]">ou s&apos;inscrire avec email</span>
        </div>
      </div>

      <form onSubmit={handleSignup} className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="block text-xs font-medium text-[#888] mb-1.5">Nom complet</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444] pointer-events-none" />
            <input
              id="name" type="text" value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jean Dupont"
              required autoComplete="name" suppressHydrationWarning
              className="input pl-9"
            />
          </div>
        </div>

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
          <label htmlFor="password" className="block text-xs font-medium text-[#888] mb-1.5">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444] pointer-events-none" />
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 caractères"
              required autoComplete="new-password" minLength={8} suppressHydrationWarning
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
          {password.length > 0 && password.length < 8 && (
            <p className="text-xs text-red-400 mt-1">
              {8 - password.length} caractère{8 - password.length > 1 ? 's' : ''} manquant{8 - password.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="btn-gold w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading && <span className="w-4 h-4 border-2 border-[#080808]/40 border-t-[#080808] rounded-full animate-spin" />}
          Créer mon compte gratuit
        </button>
      </form>

      <p className="text-center text-xs text-[#444] mt-4 leading-relaxed">
        En créant un compte, vous acceptez nos{' '}
        <Link href="/legal/cgu" className="text-[#D4AF37] hover:underline">CGU</Link>{' '}
        et notre{' '}
        <Link href="/legal/privacy" className="text-[#D4AF37] hover:underline">Politique de confidentialité</Link>.
      </p>

      <p className="text-center text-sm text-[#555] mt-5">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-[#D4AF37] font-medium hover:underline">Se connecter</Link>
      </p>
    </div>
  )
}
