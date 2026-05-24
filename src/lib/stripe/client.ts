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
    name: 'Starter X',
    price: 49,
    yearlyPrice: '41,58',
    yearlyTotal: '499',
    plan: 'starter' as const,
    stripePriceId: process.env.STRIPE_PRICE_STARTER || '',
    color: '#38bdf8',
    features: [
      '60 analyses IA / mois',
      '60 messages chat / mois',
      'Signaux de trading illimités',
    ],
    highlighted: false,
    badge: undefined as string | undefined,
  },
  pro: {
    name: 'Pro X',
    price: 79,
    yearlyPrice: '74,91',
    yearlyTotal: '899',
    plan: 'pro' as const,
    stripePriceId: process.env.STRIPE_PRICE_PRO || '',
    color: '#D4AF37',
    features: [
      '200 analyses IA / mois',
      '200 messages chat / mois',
      'Signaux de trading illimités',
      'Robot de trading',
    ],
    highlighted: true,
    badge: 'Populaire' as string | undefined,
  },
  expert: {
    name: 'Expert X',
    price: 129,
    yearlyPrice: '124,91',
    yearlyTotal: '1 499',
    plan: 'expert' as const,
    stripePriceId: process.env.STRIPE_PRICE_EXPERT || '',
    color: '#a78bfa',
    features: [
      '1000 analyses IA / mois',
      '1000 messages chat / mois',
      'Signaux de trading illimités',
      'Robot de trading',
    ],
    highlighted: false,
    badge: undefined as string | undefined,
  },
  premium: {
    name: 'PrimeX',
    price: 499,
    yearlyPrice: '483,25',
    yearlyTotal: '5 799',
    plan: 'premium' as const,
    stripePriceId: process.env.STRIPE_PRICE_ELITE || '',
    color: '#22c55e',
    features: [
      'Accès illimité à tous les modules',
      'Analyses IA illimitées',
      'Chat IA illimité',
      'Robot de trading',
    ],
    highlighted: false,
    badge: 'Tout inclus' as string | undefined,
  },
}
