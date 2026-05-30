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
    monthlyPrice: 39,
    yearlyTotal: 390,
    yearlyMonthly: '32,50',
    yearlyDiscount: '78',
    plan: 'starter' as const,
    monthlyPriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
    yearlyPriceId:  process.env.STRIPE_PRICE_STARTER_YEARLY  || '',
    color: '#38bdf8',
    features: [
      'Tous les modules PrimeX',
      '1 million de tokens / mois',
      'IA de dernière génération',
      'Mises à jour incluses',
    ],
    highlighted: false,
    badge: undefined as string | undefined,
  },
  pro: {
    name: 'Pro X',
    monthlyPrice: 99,
    yearlyTotal: 990,
    yearlyMonthly: '82,50',
    yearlyDiscount: '198',
    plan: 'pro' as const,
    monthlyPriceId: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    yearlyPriceId:  process.env.STRIPE_PRICE_PRO_YEARLY  || '',
    color: '#D4AF37',
    features: [
      'Tous les modules PrimeX',
      '3 millions de tokens / mois',
      'IA de dernière génération',
      'Mises à jour incluses',
    ],
    highlighted: true,
    badge: 'Populaire' as string | undefined,
  },
  expert: {
    name: 'Expert X',
    monthlyPrice: 199,
    yearlyTotal: 1990,
    yearlyMonthly: '165,83',
    yearlyDiscount: '398',
    plan: 'expert' as const,
    monthlyPriceId: process.env.STRIPE_PRICE_EXPERT_MONTHLY || '',
    yearlyPriceId:  process.env.STRIPE_PRICE_EXPERT_YEARLY  || '',
    color: '#a78bfa',
    features: [
      'Tous les modules PrimeX',
      '8 millions de tokens / mois',
      'IA de dernière génération',
      'Mises à jour incluses',
    ],
    highlighted: false,
    badge: undefined as string | undefined,
  },
}
