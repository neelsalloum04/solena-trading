import { requireAnthropic } from '@/lib/anthropic/client'
import { getUserFromRequest } from '@/lib/supabase/auth-api'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const SYSTEM_SUPPORT = `Tu es l'assistant support de PrimeX, une plateforme de trading IA.
Réponds en français, de façon concise, utile et bienveillante. Phrases courtes et directes.

MODULES DE LA PLATEFORME :

1. Assistant IA (/chat)
   - Chat avec une IA spécialisée en trading (analyse de marchés, graphiques, signaux)
   - Peut analyser des captures d'écran de graphiques (TradingView, MT4, Binance, etc.)
   - Fournit entrée, stop loss, take profit, ratio R/R pour des idées de trade éducatives
   - Utilise des données de marché en temps réel
   - Pour l'utiliser : tape ta question ou clique sur une suggestion rapide

2. Analyse Graphique (/analyse)
   - Upload une image de graphique → l'IA l'analyse et génère un rapport détaillé
   - Idéal pour avoir un second avis sur ta propre analyse
   - Accepte : TradingView, MT4, MT5, Binance, Bybit, cTrader et tout graphique

3. Signaux Crypto (/signals)
   - Analyse automatique des 15 principales cryptomonnaies (BTC, ETH, SOL, BNB, XRP, ADA, DOGE, AVAX, LINK, MATIC, DOT, TRX, LTC, BCH, NEAR)
   - Indicateurs : RSI, EMA50/200, MACD, ATR, volume
   - Résultat par crypto : ACHETER ou VENDRE, prix d'entrée, TP1/TP2/TP3, Stop Loss, % de confiance (51–95%)
   - Pour l'utiliser : clique "Lancer l'analyse" → la console affiche l'analyse en direct → résultats complets à la fin (~30 secondes)
   - Données provenant de Binance (fallback Kraken si indisponible)

4. Assistance IA (/support) — c'est ici, tu y es déjà !
   - Chat support pour toutes questions sur l'application
   - FAQ complète sur les abonnements, modules, problèmes techniques

FORFAITS :
- Gratuit : 3 analyses et 3 messages chat (essai)
- Starter X (39€/mois) : tous modules, 1M tokens/mois
- Pro X (99€/mois) : tous modules, 3M tokens/mois
- Expert X (199€/mois) : tous modules, 8M tokens/mois
- PrimeX (699€/mois) : tous modules, 50M tokens/mois, accès prioritaire

PROBLÈMES FRÉQUENTS :
- Signaux affichent 0 résultats : temporairement, l'API Binance peut être indisponible. Réessaie dans 1–2 min.
- Chat IA ne répond pas : vérifier que ANTHROPIC_API_KEY est configurée (erreur visible dans le chat)
- Analyse graphique ne fonctionne pas : même cause (clé Anthropic)
- Quota atteint : se réinitialise à minuit UTC

GESTION COMPTE :
- Annuler abonnement : Paramètres → Abonnement → Annuler (accès conservé jusqu'à fin de période)
- Remboursement : cas par cas pour problème technique — contacter contact@ecomstartprofits.com
- Upgrade/downgrade : upgrade immédiat (prorata), downgrade au prochain cycle
- Données sécurisées : TLS, paiements via Stripe (PrimeX ne stocke pas les données bancaires)
- Contact : contact@ecomstartprofits.com — réponse sous 24h

RÈGLES :
- Pour toute action sur un compte (remboursement, bug bloquant, accès perdu), renvoie vers contact@ecomstartprofits.com
- Ne promets jamais de rendements — tout est éducatif
- Réponses max 150 mots`

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

    // ── Token balance check ───────────────────────────────────────
    const { user } = await getUserFromRequest(req)
    const adminDb  = await createAdminClient()

    if (user) {
      const { data: profile } = await adminDb
        .from('profiles')
        .select('token_balance')
        .eq('id', user.id)
        .single()

      if (profile && profile.token_balance <= 0) {
        return NextResponse.json({ error: 'token_balance_empty' }, { status: 402 })
      }
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

    // ── Token deduction ───────────────────────────────────────────
    let newBalance: number | null = null
    if (user) {
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens
      const { data } = await adminDb.rpc('deduct_tokens', { p_user_id: user.id, p_amount: tokensUsed })
      if (typeof data === 'number') newBalance = data
    }

    return NextResponse.json({ reply, newBalance })
  } catch (err) {
    console.error('[support-chat]', err)
    return NextResponse.json(
      { error: 'Service temporairement indisponible. Contactez contact@ecomstartprofits.com' },
      { status: 500 }
    )
  }
}
