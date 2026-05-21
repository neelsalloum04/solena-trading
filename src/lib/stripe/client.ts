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
    price: 49,
    yearlyPrice: 39,
    plan: 'starter' as const,
    stripePriceId: process.env.STRIPE_PRICE_STARTER || '',
    features: [
      'AI Trading Chat (50 messages/day)',
      '10 Live Signals per day',
      'Basic market analysis',
      'Forex & Crypto markets',
      'Email support',
    ],
    highlighted: false,
    badge: undefined as string | undefined,
  },
  pro: {
    name: 'Pro',
    price: 149,
    yearlyPrice: 119,
    plan: 'pro' as const,
    stripePriceId: process.env.STRIPE_PRICE_PRO || '',
    features: [
      'Unlimited AI Trading Chat',
      'Unlimited Live Signals',
      'Advanced chart analysis',
      'All markets (Forex, Crypto, Indices, Stocks)',
      '1 Trading Bot connection',
      'Real-time alerts (Email + SMS)',
      'Priority support',
      'Performance analytics',
    ],
    highlighted: true,
    badge: 'Most Popular' as string | undefined,
  },
  elite: {
    name: 'Elite',
    price: 399,
    yearlyPrice: 319,
    plan: 'elite' as const,
    stripePriceId: process.env.STRIPE_PRICE_ELITE || '',
    features: [
      'Everything in Pro',
      'Unlimited Bot connections',
      'All markets + Futures & Options',
      'Institutional-grade signals',
      'Custom AI strategy configuration',
      'Dedicated account manager',
      'API access',
      'White-glove onboarding',
      '24/7 priority support',
    ],
    highlighted: false,
    badge: 'Best Value' as string | undefined,
  },
}
