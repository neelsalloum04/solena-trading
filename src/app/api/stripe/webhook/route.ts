import { sendEmail } from '@/lib/email/resend'
import { cancellationEmail, subscriptionEmail } from '@/lib/email/templates'
import { requireStripe } from '@/lib/stripe/client'
import { normalizePlan } from '@/lib/plans'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Map Stripe price IDs to DB plan names
function priceIdToPlan(priceId: string): string {
  const map: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER || '']: 'starter',
    [process.env.STRIPE_PRICE_PRO     || '']: 'pro',
    [process.env.STRIPE_PRICE_EXPERT  || '']: 'expert',
    [process.env.STRIPE_PRICE_ELITE   || '']: 'premium',
  }
  return map[priceId] || 'starter'
}

export async function POST(req: NextRequest) {
  try {
    const stripe = requireStripe()
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret || webhookSecret.startsWith('whsec_...')) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('[webhook] Signature verification failed:', err.message)
      return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
    }

    const supabase = await createAdminClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        // Plan from metadata (set at checkout creation) OR derived from price
        const plan = session.metadata?.plan || 'starter'

        if (!userId) {
          console.warn('[webhook] checkout.session.completed: missing user_id in metadata')
          break
        }

        // Fetch actual subscription to get period_end
        let periodEnd: string | null = null
        if (session.subscription) {
          try {
            const sub = await stripe.subscriptions.retrieve(session.subscription as string)
            periodEnd = new Date(sub.current_period_end * 1000).toISOString()
          } catch {}
        }

        const { error: subError } = await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan,
          status: 'active',
          current_period_end: periodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

        if (subError) console.error('[webhook] subscriptions upsert error:', subError)

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ plan, updated_at: new Date().toISOString() })
          .eq('id', userId)

        if (profileError) console.error('[webhook] profiles update error:', profileError)

        // Send subscription confirmation email
        try {
          const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
          const { data: authUser } = await supabase.auth.admin.getUserById(userId)
          const email = authUser?.user?.email
          const amount = session.amount_total ? `${(session.amount_total / 100).toFixed(2)}€` : ''
          if (email) {
            const { subject, html } = subscriptionEmail(profile?.full_name ?? '', plan, amount)
            await sendEmail({ to: email, subject, html })
          }
        } catch (emailErr) {
          console.warn('[webhook] email send failed:', emailErr)
        }

        console.log(`[webhook] checkout.completed: user=${userId} plan=${plan}`)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        // Find user by stripe_subscription_id
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .single()

        const userId = subscription?.user_id || sub.metadata?.user_id
        if (!userId) break

        const priceId = sub.items.data[0]?.price.id
        const plan = priceId ? priceIdToPlan(priceId) : 'starter'
        const status = sub.status
        const periodEnd = new Date(sub.current_period_end * 1000).toISOString()

        await supabase.from('subscriptions').update({
          plan, status, current_period_end: periodEnd, updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', sub.id)

        if (status === 'active') {
          await supabase.from('profiles').update({ plan, updated_at: new Date().toISOString() }).eq('id', userId)
        }

        console.log(`[webhook] subscription.updated: user=${userId} plan=${plan} status=${status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .single()

        const userId = subscription?.user_id || sub.metadata?.user_id
        if (!userId) break

        await supabase.from('subscriptions').update({
          status: 'canceled', updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', sub.id)

        // Downgrade to free when subscription is deleted
        const { data: deletedProfile } = await supabase.from('profiles').select('full_name, plan').eq('id', userId).single()
        await supabase.from('profiles').update({
          plan: 'free', updated_at: new Date().toISOString(),
        }).eq('id', userId)

        // Send cancellation email
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(userId)
          const email = authUser?.user?.email
          const endsAt = new Date(sub.current_period_end * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
          if (email) {
            const { subject, html } = cancellationEmail(deletedProfile?.full_name ?? '', deletedProfile?.plan ?? 'pro', endsAt)
            await sendEmail({ to: email, subject, html })
          }
        } catch (emailErr) {
          console.warn('[webhook] cancellation email failed:', emailErr)
        }

        console.log(`[webhook] subscription.deleted: user=${userId} → downgraded to free`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = (invoice as any).subscription
        if (subId) {
          await supabase.from('subscriptions').update({
            status: 'past_due', updated_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', subId)
        }
        console.warn('[webhook] payment_failed for subscription:', subId)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[webhook] Unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
