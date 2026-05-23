// ─── Plan system — single source of truth ─────────────────────────────────────

export type PlanId = 'free' | 'starter' | 'pro' | 'premium' | 'admin'

export const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'premium', 'admin']

export function planLevel(plan: PlanId): number {
  return PLAN_ORDER.indexOf(plan)
}

export function hasAccess(userPlan: PlanId, requiredPlan: PlanId): boolean {
  if (userPlan === 'admin') return true
  return planLevel(userPlan) >= planLevel(requiredPlan)
}

// DB plans include legacy 'elite' → mapped to 'premium'
export function normalizePlan(dbPlan: string | null | undefined): PlanId {
  if (!dbPlan) return 'free'
  if (dbPlan === 'elite') return 'premium'
  if (PLAN_ORDER.includes(dbPlan as PlanId)) return dbPlan as PlanId
  return 'free'
}

// ─── Route access ─────────────────────────────────────────────────────────────

export const ROUTE_REQUIREMENTS: Record<string, PlanId> = {
  '/dashboard': 'free',
  '/settings':  'free',
  '/support':   'free',
  '/analyse':   'starter',
  '/chat':      'pro',
  '/signals':   'pro',
  '/portfolio': 'pro',
  '/analytics': 'pro',
  '/bot':       'premium',
  '/admin':     'admin',
}

export function getRequiredPlan(pathname: string): PlanId {
  for (const [route, plan] of Object.entries(ROUTE_REQUIREMENTS)) {
    if (pathname === route || pathname.startsWith(route + '/')) return plan
  }
  return 'free'
}

// ─── Plan display metadata ────────────────────────────────────────────────────

export interface PlanMeta {
  id: PlanId
  label: string
  price: string
  yearlyPrice: string
  color: string
  borderColor: string
  bgColor: string
  features: string[]
  highlighted: boolean
  stripePriceKey?: 'STRIPE_PRICE_STARTER' | 'STRIPE_PRICE_PRO' | 'STRIPE_PRICE_ELITE'
}

export const PLAN_META: Record<Exclude<PlanId, 'admin'>, PlanMeta> = {
  free: {
    id: 'free',
    label: 'Gratuit',
    price: '0€',
    yearlyPrice: '0€',
    color: 'text-[#666]',
    borderColor: 'border-[#333]',
    bgColor: 'bg-[#111]',
    features: [
      'Tableau de bord',
      'Actualités des marchés',
      'Calendrier économique',
    ],
    highlighted: false,
  },
  starter: {
    id: 'starter',
    label: 'Starter',
    price: '49€',
    yearlyPrice: '39€',
    color: 'text-[#38bdf8]',
    borderColor: 'border-[#38bdf8]/40',
    bgColor: 'bg-[#38bdf8]/5',
    features: [
      'Tout le gratuit',
      'Analyse IA (3 analyses/jour)',
      'Chat IA (30 messages/jour)',
      'Actualités & Calendrier',
      'Support email',
    ],
    highlighted: false,
    stripePriceKey: 'STRIPE_PRICE_STARTER',
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    price: '149€',
    yearlyPrice: '119€',
    color: 'text-[#D4AF37]',
    borderColor: 'border-[#D4AF37]/40',
    bgColor: 'bg-[#D4AF37]/5',
    features: [
      'Tout le Starter',
      'Analyse IA illimitée',
      'Chat IA illimité',
      'Signaux live en temps réel',
      'Portfolio & Analytics',
      'Alertes email + SMS',
      'Support prioritaire',
    ],
    highlighted: true,
    stripePriceKey: 'STRIPE_PRICE_PRO',
  },
  premium: {
    id: 'premium',
    label: 'Premium',
    price: '399€',
    yearlyPrice: '319€',
    color: 'text-[#22c55e]',
    borderColor: 'border-[#22c55e]/40',
    bgColor: 'bg-[#22c55e]/5',
    features: [
      'Tout le Pro',
      'Bot de trading automatisé',
      'Connexions broker illimitées',
      'Signaux institutionnels',
      'Accès API',
      'Futures & Options',
      'Support dédié 24/7',
      'Nouvelles fonctionnalités en priorité',
    ],
    highlighted: false,
    stripePriceKey: 'STRIPE_PRICE_ELITE',
  },
}

export const PLANS_DISPLAY = Object.values(PLAN_META).filter(p => p.id !== 'free')
