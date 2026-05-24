import { sendEmail } from '@/lib/email/resend'
import { welcomeEmail } from '@/lib/email/templates'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()
    if (!email) return NextResponse.json({ error: 'email requis' }, { status: 400 })

    const { subject, html } = welcomeEmail(name ?? '')
    const result = await sendEmail({ to: email, subject, html })

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
