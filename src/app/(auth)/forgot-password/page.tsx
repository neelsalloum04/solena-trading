'use client'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email.trim()) { toast.error('Veuillez saisir votre adresse email.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      setSent(true)
    } catch {
      toast.error('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-[#D4AF37]" />
        </div>
        <h1 className="text-2xl font-bold text-[#F2EDD7] mb-2">Vérifiez vos emails</h1>
        <p className="text-[#666] text-sm mb-6 leading-relaxed">
          Un lien de réinitialisation a été envoyé à{' '}
          <span className="text-[#F2EDD7] font-medium">{email}</span>.
          Vérifiez votre boîte de réception (et les spams).
        </p>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-[#D4AF37] font-medium hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#F2EDD7] mb-1">Mot de passe oublié</h1>
        <p className="text-[#666] text-sm">
          Saisissez votre email et nous vous enverrons un lien de réinitialisation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-[#888] mb-1.5">
            Adresse email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444] pointer-events-none" aria-hidden />
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
              autoComplete="email"
              suppressHydrationWarning
              className="input pl-9"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-gold w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-[#080808]/40 border-t-[#080808] rounded-full animate-spin" />
          )}
          Envoyer le lien de réinitialisation
        </button>
      </form>

      <Link
        href="/login"
        className="flex items-center gap-2 text-sm text-[#555] hover:text-[#888] transition-colors mt-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la connexion
      </Link>
    </div>
  )
}
