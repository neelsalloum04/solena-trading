// ─── Plan system — single source of truth ─────────────────────────────────────

export const DEV_UNLOCK_ALL = false

export type PlanId = 'free' | 'starter' | 'pro' | 'expert' | 'premium' | 'admin'

export const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'expert', 'premium', 'admin']

export function planLevel(plan: PlanId): number {
  return PLAN_ORDER.indexOf(plan)
}

export function hasAccess(userPlan: PlanId, requiredPlan: PlanId): boolean {
  if (DEV_UNLOCK_ALL && requiredPlan !== 'admin') return true
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

// ─── Token limits per plan ────────────────────────────────────────────────────
// free    → 5 000 tokens à vie (pas de reset mensuel)
// starter → 1 M  tokens / mois
// pro     → 3 M  tokens / mois
// expert  → 8 M  tokens / mois
// premium → 50 M tokens / mois
// admin   → pratiquement illimité

export const PLAN_TOKEN_LIMITS: Record<PlanId, number> = {
  free:    5_000,
  starter: 1_000_000,
  pro:     3_000_000,
  expert:  8_000_000,
  premium: 50_000_000,
  admin:   999_999_999,
}

// ─── Monthly quotas per plan ──────────────────────────────────────────────────

export const PLAN_MONTHLY_QUOTAS: Record<string, { analyse: number; chat: number }> = {
  free:    { analyse: 3,        chat: 3        },
  starter: { analyse: 500,      chat: 1000     },
  pro:     { analyse: 1500,     chat: 3000     },
  expert:  { analyse: 4000,     chat: 8000     },
  premium: { analyse: Infinity, chat: Infinity },
  admin:   { analyse: Infinity, chat: Infinity },
}

// ─── Route access ─────────────────────────────────────────────────────────────

export const ROUTE_REQUIREMENTS: Record<string, PlanId> = {
  '/dashboard':   'free',
  '/portfolio':   'free',
  '/settings':    'free',
  '/support':     'free',
  '/analyse':     'starter',
  '/chat':        'free',
  '/signals':     'starter',
  '/bot':         'pro',
  '/bot-btc':     'pro',
  '/admin':       'admin',
}

export const FREE_TRIAL_ROUTES = new Set(['/chat'])

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
  yearlyTotal: string
  yearlyDiscount: string
  color: string
  borderColor: string
  bgColor: string
  features: string[]
  highlighted: boolean
  badge?: string
  stripePriceKey?: 'STRIPE_PRICE_STARTER' | 'STRIPE_PRICE_PRO' | 'STRIPE_PRICE_EXPERT' | 'STRIPE_PRICE_PRIME'
}

export const PLAN_META: Record<Exclude<PlanId, 'admin'>, PlanMeta> = {
  free: {
    id: 'free',
    label: 'Gratuit',
    price: '0€',
    yearlyPrice: '0€',
    yearlyTotal: '0€',
    yearlyDiscount: '0€',
    color: 'text-[#666]',
    borderColor: 'border-[#333]',
    bgColor: 'bg-[#111]',
    features: [
      'Tableau de bord',
      'Calendrier économique',
    ],
    highlighted: false,
  },
  starter: {
    id: 'starter',
    label: 'Starter X',
    price: '39€',
    yearlyPrice: '32,50€',
    yearlyTotal: '390€',
    yearlyDiscount: '78€',
    color: 'text-[#38bdf8]',
    borderColor: 'border-[#38bdf8]/40',
    bgColor: 'bg-[#38bdf8]/5',
    features: [
      'Tous les modules PrimeX',
      '1 million de tokens / mois',
      'IA de dernière génération',
      'Mises à jour incluses',
    ],
    highlighted: false,
    stripePriceKey: 'STRIPE_PRICE_STARTER',
  },
  pro: {
    id: 'pro',
    label: 'Pro X',
    price: '99€',
    yearlyPrice: '82,50€',
    yearlyTotal: '990€',
    yearlyDiscount: '198€',
    color: 'text-[#D4AF37]',
    borderColor: 'border-[#D4AF37]/40',
    bgColor: 'bg-[#D4AF37]/5',
    features: [
      'Tous les modules PrimeX',
      '3 millions de tokens / mois',
      'IA de dernière génération',
      'Mises à jour incluses',
    ],
    highlighted: true,
    badge: 'Populaire',
    stripePriceKey: 'STRIPE_PRICE_PRO',
  },
  expert: {
    id: 'expert',
    label: 'Expert X',
    price: '199€',
    yearlyPrice: '165,83€',
    yearlyTotal: '1 990€',
    yearlyDiscount: '398€',
    color: 'text-[#a78bfa]',
    borderColor: 'border-[#a78bfa]/40',
    bgColor: 'bg-[#a78bfa]/5',
    features: [
      'Tous les modules PrimeX',
      '8 millions de tokens / mois',
      'IA de dernière génération',
      'Mises à jour incluses',
    ],
    highlighted: false,
    stripePriceKey: 'STRIPE_PRICE_EXPERT',
  },
  premium: {
    id: 'premium',
    label: 'PrimeX',
    price: '699€',
    yearlyPrice: '582,50€',
    yearlyTotal: '6 990€',
    yearlyDiscount: '1 398€',
    color: 'text-[#22c55e]',
    borderColor: 'border-[#22c55e]/40',
    bgColor: 'bg-[#22c55e]/5',
    features: [
      'Tous les modules PrimeX',
      '50 millions de tokens / mois',
      'IA de dernière génération',
      'Accès prioritaire aux nouveautés',
      'Mises à jour incluses',
    ],
    highlighted: false,
    badge: 'Tout inclus',
    stripePriceKey: 'STRIPE_PRICE_PRIME',
  },
}

export const PLANS_DISPLAY = Object.values(PLAN_META).filter(p => p.id !== 'free')
