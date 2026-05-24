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
    monthlyPrice: 59,
    yearlyTotal: 499,
    yearlyMonthly: '41,58',
    yearlyDiscount: '209',
    plan: 'starter' as const,
    monthlyPriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
    yearlyPriceId:  process.env.STRIPE_PRICE_STARTER_YEARLY  || '',
    color: '#38bdf8',
    features: [
      '60 analyses IA / mois',
      '60 messages IA / mois',
      'Signaux de trading IA illimités',
    ],
    highlighted: false,
    badge: undefined as string | undefined,
  },
  pro: {
    name: 'Pro X',
    monthlyPrice: 89,
    yearlyTotal: 819,
    yearlyMonthly: '68,25',
    yearlyDiscount: '249',
    plan: 'pro' as const,
    monthlyPriceId: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    yearlyPriceId:  process.env.STRIPE_PRICE_PRO_YEARLY  || '',
    color: '#D4AF37',
    features: [
      '200 analyses IA / mois',
      '200 messages IA / mois',
      'Signaux de trading IA illimités',
      'Accès au robot de trading',
    ],
    highlighted: true,
    badge: 'Populaire' as string | undefined,
  },
  expert: {
    name: 'Expert X',
    monthlyPrice: 139,
    yearlyTotal: 1399,
    yearlyMonthly: '116,58',
    yearlyDiscount: '269',
    plan: 'expert' as const,
    monthlyPriceId: process.env.STRIPE_PRICE_EXPERT_MONTHLY || '',
    yearlyPriceId:  process.env.STRIPE_PRICE_EXPERT_YEARLY  || '',
    color: '#a78bfa',
    features: [
      '1 000 analyses IA / mois',
      '1 000 messages IA / mois',
      'Signaux de trading IA illimités',
      'Accès au robot de trading',
    ],
    highlighted: false,
    badge: undefined as string | undefined,
  },
  premium: {
    name: 'Prime X',
    monthlyPrice: 509,
    yearlyTotal: 5699,
    yearlyMonthly: '474,92',
    yearlyDiscount: '409',
    plan: 'premium' as const,
    monthlyPriceId: process.env.STRIPE_PRICE_PRIME_MONTHLY || '',
    yearlyPriceId:  process.env.STRIPE_PRICE_PRIME_YEARLY  || '',
    color: '#22c55e',
    features: [
      'Analyses IA illimitées',
      'Messages IA illimités',
      'Signaux de trading IA illimités',
      'Robot de trading illimité',
      'Accès illimité à tous les modules actuels et futurs',
    ],
    highlighted: false,
    badge: 'Tout inclus' as string | undefined,
  },
}
