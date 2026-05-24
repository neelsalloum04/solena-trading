'use client'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

export default function MfaPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [factorId, setFactorId] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function init() {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      // Check if MFA is actually needed
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (!aal || aal.nextLevel !== 'aal2' || aal.currentLevel === 'aal2') {
        router.replace('/dashboard')
        return
      }

      // Get TOTP factor and create challenge
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totp = factors?.totp?.find((f: { status: string }) => f.status === 'verified')
      if (!totp) { router.replace('/dashboard'); return }

      const { data: challenge, error } = await supabase.auth.mfa.challenge({ factorId: totp.id })
      if (error || !challenge) { router.replace('/dashboard'); return }

      setFactorId(totp.id)
      setChallengeId(challenge.id)
      setInitializing(false)
    }
    init()
  }, [supabase, router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code })
      if (error) {
        toast.error('Code incorrect ou expiré. Réessayez.')
        setCode('')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Erreur. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="w-full max-w-sm flex items-center justify-center h-48">
        <span className="w-6 h-6 border-2 border-[#222] border-t-[#D4AF37] rounded-full animate-spin" />
      </div>
    )
  }

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

      <form onSubmit={handleVerify} className="space-y-4">
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          autoFocus
          className="input text-center text-2xl tracking-[0.6em] font-mono placeholder:tracking-normal placeholder:text-base"
        />
        <button
          type="submit"
          disabled={code.length !== 6 || loading}
          className="btn-gold w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading && <span className="w-4 h-4 border-2 border-[#080808]/40 border-t-[#080808] rounded-full animate-spin" />}
          Vérifier
        </button>
      </form>

      <button
        onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
        className="w-full text-center text-xs text-[#555] mt-4 hover:text-[#888] transition-colors"
      >
        Se déconnecter
      </button>
    </div>
  )
}
