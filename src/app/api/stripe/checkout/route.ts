import { requireStripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const stripe = requireStripe()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, billing } = await req.json()
    const isYearly = billing === 'yearly'

    const priceMap: Record<string, { monthly: string; yearly: string }> = {
      starter: { monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || '', yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || '' },
      pro:     { monthly: process.env.STRIPE_PRICE_PRO_MONTHLY     || '', yearly: process.env.STRIPE_PRICE_PRO_YEARLY     || '' },
      expert:  { monthly: process.env.STRIPE_PRICE_EXPERT_MONTHLY  || '', yearly: process.env.STRIPE_PRICE_EXPERT_YEARLY  || '' },
      premium: { monthly: process.env.STRIPE_PRICE_PRIME_MONTHLY   || '', yearly: process.env.STRIPE_PRICE_PRIME_YEARLY   || '' },
    }

    const priceId = priceMap[plan]?.[isYearly ? 'yearly' : 'monthly']
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan or Stripe prices not configured' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
      metadata: { user_id: user.id, plan, billing: isYearly ? 'yearly' : 'monthly' },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    const isConfig = error.message?.includes('not configured')
    return NextResponse.json(
      { error: isConfig ? error.message : 'Payment setup failed.' },
      { status: isConfig ? 503 : 500 }
    )
  }
}
