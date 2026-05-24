// Server-only — never import from client components
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = 'PrimeX IA <noreply@primex-trading.com>'
export const REPLY_TO   = 'support@primex-trading.com'

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY non configuré — email non envoyé')
    return { ok: false, error: 'RESEND_API_KEY manquant' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: REPLY_TO,
      subject,
      html,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: data?.id }
  } catch (err: any) {
    console.error('[email] Erreur Resend:', err?.message)
    return { ok: false, error: err?.message }
  }
}
