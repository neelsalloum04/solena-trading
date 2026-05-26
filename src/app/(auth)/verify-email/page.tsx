'use client'
import { createClient } from '@/lib/supabase/client'
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const handleResend = async () => {
    setResending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        toast.error('Impossible de récupérer votre adresse email. Reconnectez-vous.')
        setResending(false)
        return
      }
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) {
        toast.error(error.message)
      } else {
        setResent(true)
        toast.success('Email de vérification renvoyé !')
      }
    } catch {
      toast.error('Erreur réseau. Réessayez.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="w-full max-w-sm text-center">
      <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mx-auto mb-6">
        <Mail className="w-8 h-8 text-[#D4AF37]" />
      </div>

      <h1 className="text-2xl font-bold text-[#F2EDD7] mb-2">Vérifiez votre email</h1>
      <p className="text-[#666] text-sm mb-6 leading-relaxed">
        Votre compte est créé mais votre adresse email n&apos;est pas encore confirmée.
        Cliquez sur le lien dans l&apos;email que nous vous avons envoyé pour accéder à votre espace.
      </p>

      <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-xl p-4 mb-6 text-left">
        <p className="text-xs text-[#555] leading-relaxed">
          <span className="text-[#888] font-medium">Vous ne trouvez pas l&apos;email ?</span>
          <br />
          Vérifiez votre dossier spam ou courrier indésirable. Si vous ne le trouvez toujours pas,
          cliquez sur le bouton ci-dessous pour renvoyer l&apos;email.
        </p>
      </div>

      <button
        onClick={handleResend}
        disabled={resending || resent}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#242424] bg-[#111] text-white text-sm font-medium hover:border-[#383838] hover:bg-[#161616] transition-all disabled:opacity-50 mb-4"
      >
        {resending
          ? <span className="w-4 h-4 border-2 border-[#555] border-t-[#D4AF37] rounded-full animate-spin" />
          : <RefreshCw className="w-4 h-4 text-[#666]" />}
        {resent ? 'Email envoyé !' : 'Renvoyer l\'email de vérification'}
      </button>

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-[#555] hover:text-[#888] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour à la connexion
      </Link>
    </div>
  )
}
