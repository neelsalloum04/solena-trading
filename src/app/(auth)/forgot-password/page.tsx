'use client'
import { Button } from '@/components/ui/button'
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
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-solena-primary/10 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-solena-primary" />
        </div>
        <h1 className="text-2xl font-bold text-solena-text mb-2">Check your email</h1>
        <p className="text-solena-text-muted text-sm mb-6">
          We sent a password reset link to <span className="text-solena-text font-medium">{email}</span>.
          Check your inbox (and spam folder).
        </p>
        <Link href="/login" className="text-sm text-solena-primary font-medium hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-solena-text mb-1">Reset your password</h1>
        <p className="text-solena-text-muted text-sm">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-solena-text-secondary mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-solena-text-muted pointer-events-none" aria-hidden />
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              suppressHydrationWarning
              className="input-field pl-10"
            />
          </div>
        </div>

        <Button type="submit" loading={loading} size="lg" className="w-full">
          Send Reset Link
        </Button>
      </form>

      <Link
        href="/login"
        className="flex items-center gap-2 text-sm text-solena-text-muted hover:text-solena-text transition-colors mt-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to sign in
      </Link>
    </div>
  )
}
