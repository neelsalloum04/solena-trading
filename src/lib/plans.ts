// ─── Plan system — single source of truth ─────────────────────────────────────

// DEV MODE: set to true to bypass all subscription gates (any logged-in user = full access)
// Set back to false before going live with paid plans.
export const DEV_UNLOCK_ALL = false

export type PlanId = 'free' | 'starter' | 'pro' | 'premium' | 'admin'

export const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'premium', 'admin']

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

// ─── Route access ─────────────────────────────────────────────────────────────

export const ROUTE_REQUIREMENTS: Record<string, PlanId> = {
  '/dashboard':   'free',
  '/portfolio':   'free',
  '/settings':    'free',
  '/support':     'free',
  '/analyse':     'starter',
  '/chat':        'free',
  '/signals':     'pro',

  '/bot':         'premium',
  '/admin':       'admin',
}

// Routes with free trial access (3 uses, then upgrade wall)
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
      'Analyse IA : 3 analyses par jour',
      'Chat IA : 50 messages par jour',
      'Tableau de bord trading',
      'Suivi du portefeuille',
      'Actualités financières',
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
      'Analyse IA : 50 analyses par jour',
      'Chat IA : Illimité',
      'Accès complet aux signaux de trading',
      'Tableau de bord trading avancé',
      'Actualités financières en temps réel',
      'Outils d\'aide à la décision',
      'Support prioritaire',
    ],
    highlighted: true,
    stripePriceKey: 'STRIPE_PRICE_PRO',
  },
  premium: {
    id: 'premium',
    label: 'Prime',
    price: '399€',
    yearlyPrice: '319€',
    color: 'text-[#22c55e]',
    borderColor: 'border-[#22c55e]/40',
    bgColor: 'bg-[#22c55e]/5',
    features: [
      'Analyse IA : Illimitée',
      'Chat IA : Illimité',
      'Signaux de trading premium',
      'Robot de trading automatisé',
      'Actualités financières mondiales en temps réel',
      'Alertes personnalisées',
      'Toutes les futures mises à jour incluses',
      'Accès prioritaire aux nouvelles fonctionnalités',
    ],
    highlighted: false,
    stripePriceKey: 'STRIPE_PRICE_ELITE',
  },
}

export const PLANS_DISPLAY = Object.values(PLAN_META).filter(p => p.id !== 'free')
