'use client'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  starter: { monthly: 39,  yearly: 390  },
  pro:     { monthly: 99,  yearly: 990  },
  expert:  { monthly: 199, yearly: 1990 },
}

function MerciContent() {
  const router  = useRouter()
  const params  = useSearchParams()
  const plan    = params.get('plan')    ?? 'starter'
  const billing = params.get('billing') ?? 'monthly'

  useEffect(() => {
    // Fire TikTok CompletePayment event
    const prices = PLAN_PRICES[plan] ?? PLAN_PRICES.starter
    const value  = billing === 'yearly' ? prices.yearly : prices.monthly

    if (typeof window !== 'undefined' && (window as any).ttq) {
      ;(window as any).ttq.track('CompletePayment', {
        value,
        currency: 'EUR',
        contents: [{ content_id: plan, content_name: `PrimeX ${plan}`, quantity: 1, price: value }],
      })
    }

    // Redirect to dashboard after 3 seconds
    const timer = setTimeout(() => router.replace('/analyse'), 3000)
    return () => clearTimeout(timer)
  }, [plan, billing, router])

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-[#22c55e]" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black text-[#F2EDD7] mb-2">Paiement confirmé !</h1>
          <p className="text-[#888] text-sm">
            Bienvenue sur PrimeX. Ton abonnement <span className="text-[#D4AF37] font-semibold capitalize">{plan}</span> est actif.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-[#555]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Redirection vers le tableau de bord…
        </div>
      </div>
    </div>
  )
}

export default function MerciPage() {
  return (
    <Suspense>
      <MerciContent />
    </Suspense>
  )
}
