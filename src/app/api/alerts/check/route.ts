import { sendEmail } from '@/lib/email/resend'
import { priceAlertEmail } from '@/lib/email/templates'
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = await createAdminClient()

  const { data: alerts } = await supabase
    .from('price_alerts')
    .select('*, profiles(email, full_name)')
    .eq('active', true)

  if (!alerts?.length) return NextResponse.json({ triggered: 0 })

  const coinIds = [...new Set(alerts.map((a: any) => a.coin_id))].join(',')

  let prices: Record<string, number> = {}
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`,
      { next: { revalidate: 0 } }
    )
    const data = await res.json()
    for (const [id, val] of Object.entries(data as Record<string, { usd: number }>)) {
      prices[id] = val.usd
    }
  } catch {
    return NextResponse.json({ error: 'Impossible de récupérer les prix' }, { status: 500 })
  }

  let triggered = 0
  for (const alert of alerts as any[]) {
    const currentPrice = prices[alert.coin_id]
    if (!currentPrice) continue

    const conditionMet =
      (alert.direction === 'above' && currentPrice >= alert.target_price) ||
      (alert.direction === 'below' && currentPrice <= alert.target_price)

    if (!conditionMet) continue

    await supabase
      .from('price_alerts')
      .update({ active: false, triggered_at: new Date().toISOString() })
      .eq('id', alert.id)

    const userEmail = alert.profiles?.email
    const userName = alert.profiles?.full_name || 'Trader'
    if (userEmail) {
      const { subject, html } = priceAlertEmail(
        userName,
        alert.coin_symbol,
        `$${Number(alert.target_price).toLocaleString('en-US')}`,
        alert.direction,
        `$${currentPrice.toLocaleString('en-US')}`
      )
      await sendEmail({ to: userEmail, subject, html })
    }
    triggered++
  }

  return NextResponse.json({ triggered })
}
