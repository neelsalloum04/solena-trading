import { requireAnthropic } from '@/lib/anthropic/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const SYSTEM_SUPPORT = `Tu es l'assistant support de PrimeX, une plateforme de trading IA.
Réponds en français, de façon concise, utile et bienveillante. Jamais de bullet points inutiles — des phrases courtes et directes.

INFORMATIONS PLATEFORME :
- PrimeX propose des outils d'analyse IA pour le trading éducatif (forex, crypto, indices, matières premières)
- Les analyses IA sont fournies à titre éducatif uniquement — pas des conseils financiers
- Éditeur : ECOMSTART GROUP LLC (Wyoming, USA)

FORFAITS :
- Gratuit : 3 analyses et 3 messages chat offerts (essai)
- Starter (9,99€/mois) : 3 analyses/jour, 50 messages chat/jour, accès Portfolio
- Pro (29,99€/mois) : 50 analyses/jour, chat illimité, Signaux Live, outils de décision
- Prime (79,99€/mois) : Tout illimité + Bot de trading + Alertes email

QUESTIONS FRÉQUENTES :
- Annuler l'abonnement : Paramètres → Abonnement → Annuler. Accès conservé jusqu'à fin de période.
- Remboursement : cas par cas pour problème technique avéré — contacter support.
- Changement de forfait : upgrade immédiat (prorata), downgrade au prochain cycle.
- Analyses acceptées : captures d'écran TradingView, MT4, MT5, Binance, Bybit, etc.
- Quotas : se réinitialisent chaque jour à minuit UTC pour les forfaits payants.
- Bot de trading : disponible forfait Prime uniquement, requiert clé API Binance (permissions Spot uniquement).
- Données sécurisées : TLS, données bancaires gérées par Stripe (pas stockées sur PrimeX).
- Contact direct : contact@ecomstartprofits.com

RÈGLES :
- Si la question dépasse tes connaissances ou nécessite une action humaine (remboursement, bug critique, accès compte), indique de contacter contact@ecomstartprofits.com
- Ne promets jamais de rendements ou de performances de trading
- Reste dans le périmètre PrimeX — redirige les questions hors-sujet poliment
- Réponses max 120 mots`

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json() as { message: string; history: Message[] }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message vide' }, { status: 400 })
    }

    const anthropic = requireAnthropic()

    const messages = [
      ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: message.trim() },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM_SUPPORT,
      messages,
    })

    const reply = response.content[0]?.type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[support-chat]', err)
    return NextResponse.json(
      { error: 'Service temporairement indisponible. Contactez contact@ecomstartprofits.com' },
      { status: 500 }
    )
  }
}
