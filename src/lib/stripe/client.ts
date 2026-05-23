import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

export const stripe = stripeSecretKey && !stripeSecretKey.startsWith('sk_test_xxx')
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia', typescript: true })
  : null

export function requireStripe(): Stripe {
  if (!stripe) throw new Error('Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local.')
  return stripe
}

export const PLANS = {
  starter: {
    name: 'Starter',
    price: 9.99,
    plan: 'starter' as const,
    stripePriceId: process.env.STRIPE_PRICE_STARTER || '',
    features: [
      '3 analyses IA / jour',
      '50 messages chat / jour',
      'Accès Portfolio',
      'Support par email',
    ],
    highlighted: false,
    badge: undefined as string | undefined,
  },
  pro: {
    name: 'Pro',
    price: 29.99,
    plan: 'pro' as const,
    stripePriceId: process.env.STRIPE_PRICE_PRO || '',
    features: [
      '50 analyses IA / jour',
      'Chat illimité',
      'Signaux Live en temps réel',
      'Outils de décision avancés',
      'Support prioritaire',
    ],
    highlighted: true,
    badge: 'Populaire' as string | undefined,
  },
  premium: {
    name: 'Prime',
    price: 79.99,
    plan: 'premium' as const,
    stripePriceId: process.env.STRIPE_PRICE_ELITE || '',
    features: [
      'Tout illimité',
      'Bot de trading automatisé',
      'Alertes email',
      'Accès prioritaire aux nouvelles fonctionnalités',
    ],
    highlighted: false,
    badge: 'Meilleure valeur' as string | undefined,
  },
}
