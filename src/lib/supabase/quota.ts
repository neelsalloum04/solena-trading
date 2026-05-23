import { normalizePlan } from '@/lib/plans'
import { createAdminClient } from './server'

export interface FreeQuota {
  used: number
  limit: number
  remaining: number
  allowed: boolean
  isPaidPlan: boolean
}

const DEFAULT_LIMITS = { analyse_limit: 3, chat_limit: 3 }

async function getLimits(): Promise<typeof DEFAULT_LIMITS> {
  try {
    const supabase = await createAdminClient()
    const { data } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'free_trial')
      .single()
    return (data?.value as typeof DEFAULT_LIMITS) ?? DEFAULT_LIMITS
  } catch {
    return DEFAULT_LIMITS
  }
}

export async function checkAndIncrementQuota(
  userId: string,
  type: 'analyse' | 'chat',
): Promise<FreeQuota> {
  const supabase = await createAdminClient()
  const limits = await getLimits()
  const limit = type === 'analyse' ? limits.analyse_limit : limits.chat_limit
  const column = type === 'analyse' ? 'free_analyse_used' : 'free_chat_used'

  const { data: profile } = await supabase
    .from('profiles')
    .select(`plan, ${column}`)
    .eq('id', userId)
    .single()

  if (!profile) return { used: 0, limit, remaining: 0, allowed: false, isPaidPlan: false }

  const plan = normalizePlan(profile.plan)
  if (plan !== 'free') return { used: 0, limit, remaining: limit, allowed: true, isPaidPlan: true }

  const used = (profile as Record<string, unknown>)[column] as number ?? 0
  if (used >= limit) return { used, limit, remaining: 0, allowed: false, isPaidPlan: false }

  await supabase
    .from('profiles')
    .update({ [column]: used + 1, updated_at: new Date().toISOString() })
    .eq('id', userId)

  const newUsed = used + 1
  return { used: newUsed, limit, remaining: limit - newUsed, allowed: true, isPaidPlan: false }
}

export async function getQuota(
  userId: string,
  type: 'analyse' | 'chat',
): Promise<FreeQuota> {
  const supabase = await createAdminClient()
  const limits = await getLimits()
  const limit = type === 'analyse' ? limits.analyse_limit : limits.chat_limit
  const column = type === 'analyse' ? 'free_analyse_used' : 'free_chat_used'

  const { data: profile } = await supabase
    .from('profiles')
    .select(`plan, ${column}`)
    .eq('id', userId)
    .single()

  if (!profile) return { used: 0, limit, remaining: 0, allowed: false, isPaidPlan: false }

  const plan = normalizePlan(profile.plan)
  if (plan !== 'free') return { used: 0, limit, remaining: limit, allowed: true, isPaidPlan: true }

  const used = (profile as Record<string, unknown>)[column] as number ?? 0
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    allowed: used < limit,
    isPaidPlan: false,
  }
}
