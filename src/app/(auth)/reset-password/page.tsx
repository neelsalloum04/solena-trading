'use client'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      toast.error('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Mot de passe mis à jour avec succès !')
      router.push('/login')
    } catch {
      toast.error('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#F2EDD7] mb-1">Nouveau mot de passe</h1>
        <p className="text-[#666] text-sm">Choisissez un mot de passe fort pour votre compte.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="password" className="block text-xs font-medium text-[#888] mb-1.5">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444] pointer-events-none" aria-hidden />
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 caractères"
              required
              autoComplete="new-password"
              minLength={8}
              suppressHydrationWarning
              className="input pl-9 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] transition-colors"
              aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
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

        <div>
          <label htmlFor="confirm" className="block text-xs font-medium text-[#888] mb-1.5">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444] pointer-events-none" aria-hidden />
            <input
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Répétez votre mot de passe"
              required
              autoComplete="new-password"
              suppressHydrationWarning
              className="input pl-9 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] transition-colors"
              aria-label={showConfirm ? 'Masquer' : 'Afficher'}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirm.length > 0 && password !== confirm && (
            <p className="text-xs text-red-400 mt-1">Les mots de passe ne correspondent pas.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-gold w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-[#080808]/40 border-t-[#080808] rounded-full animate-spin" />
          )}
          Mettre à jour le mot de passe
        </button>
      </form>

      <p className="text-center text-sm text-[#555] mt-6">
        <Link href="/login" className="text-[#D4AF37] font-medium hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  )
}
