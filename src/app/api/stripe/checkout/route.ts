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

    const { plan } = await req.json()
    const priceMap: Record<string, string> = {
      starter: process.env.STRIPE_PRICE_STARTER || '',
      pro: process.env.STRIPE_PRICE_PRO || '',
      expert: process.env.STRIPE_PRICE_EXPERT || '',
      premium: process.env.STRIPE_PRICE_ELITE || '',
    }

    const priceId = priceMap[plan]
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
      metadata: { user_id: user.id, plan },
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
