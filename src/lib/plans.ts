// ─── Plan system — single source of truth ─────────────────────────────────────

export const DEV_UNLOCK_ALL = true

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

// ─── Monthly quotas per plan ──────────────────────────────────────────────────

export const PLAN_MONTHLY_QUOTAS: Record<string, { analyse: number; chat: number }> = {
  free:    { analyse: 3,        chat: 3 },
  starter: { analyse: 60,       chat: 60 },
  pro:     { analyse: 200,      chat: 200 },
  expert:  { analyse: 1000,     chat: 1000 },
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
    price: '59€',
    yearlyPrice: '41,58€',
    yearlyTotal: '499€',
    yearlyDiscount: '209€',
    color: 'text-[#38bdf8]',
    borderColor: 'border-[#38bdf8]/40',
    bgColor: 'bg-[#38bdf8]/5',
    features: [
      '60 analyses IA / mois',
      '60 messages IA / mois',
      'Signaux de trading IA illimités',
    ],
    highlighted: false,
    stripePriceKey: 'STRIPE_PRICE_STARTER',
  },
  pro: {
    id: 'pro',
    label: 'Pro X',
    price: '89€',
    yearlyPrice: '68,25€',
    yearlyTotal: '819€',
    yearlyDiscount: '249€',
    color: 'text-[#D4AF37]',
    borderColor: 'border-[#D4AF37]/40',
    bgColor: 'bg-[#D4AF37]/5',
    features: [
      '200 analyses IA / mois',
      '200 messages IA / mois',
      'Signaux de trading IA illimités',
      'Accès au robot de trading',
    ],
    highlighted: true,
    badge: 'Populaire',
    stripePriceKey: 'STRIPE_PRICE_PRO',
  },
  expert: {
    id: 'expert',
    label: 'Expert X',
    price: '139€',
    yearlyPrice: '116,58€',
    yearlyTotal: '1 399€',
    yearlyDiscount: '269€',
    color: 'text-[#a78bfa]',
    borderColor: 'border-[#a78bfa]/40',
    bgColor: 'bg-[#a78bfa]/5',
    features: [
      '1 000 analyses IA / mois',
      '1 000 messages IA / mois',
      'Signaux de trading IA illimités',
      'Accès au robot de trading',
    ],
    highlighted: false,
    stripePriceKey: 'STRIPE_PRICE_EXPERT',
  },
  premium: {
    id: 'premium',
    label: 'Prime X',
    price: '509€',
    yearlyPrice: '474,92€',
    yearlyTotal: '5 699€',
    yearlyDiscount: '409€',
    color: 'text-[#22c55e]',
    borderColor: 'border-[#22c55e]/40',
    bgColor: 'bg-[#22c55e]/5',
    features: [
      'Analyses IA illimitées',
      'Messages IA illimités',
      'Signaux de trading IA illimités',
      'Robot de trading illimité',
      'Accès illimité à tous les modules actuels et futurs',
    ],
    highlighted: false,
    badge: 'Tout inclus',
    stripePriceKey: 'STRIPE_PRICE_PRIME',
  },
}

export const PLANS_DISPLAY = Object.values(PLAN_META).filter(p => p.id !== 'free')
