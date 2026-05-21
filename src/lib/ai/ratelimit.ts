// Server-side IP-based rate limiting (daily quotas)
interface RateLimitEntry {
  count: number
  resetAt: number // timestamp when quota resets (next day midnight UTC)
}

const store = new Map<string, RateLimitEntry>()

function nextMidnightUTC(): number {
  const d = new Date()
  d.setUTCHours(24, 0, 0, 0)
  return d.getTime()
}

function getEntry(ip: string): RateLimitEntry {
  const now = Date.now()
  const existing = store.get(ip)
  if (!existing || now > existing.resetAt) {
    const entry: RateLimitEntry = { count: 0, resetAt: nextMidnightUTC() }
    store.set(ip, entry)
    return entry
  }
  return existing
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  limit: number
  resetAt: number
}

// Free tier: 30 req/day. Pro: 150. Elite: 999.
const PLAN_LIMITS: Record<string, number> = {
  free: 30,
  starter: 30,
  pro: 150,
  elite: 999,
}

export function checkRateLimit(ip: string, plan: string = 'free'): RateLimitResult {
  const limit = PLAN_LIMITS[plan] ?? 30
  const entry = getEntry(ip)

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, limit, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, limit, resetAt: entry.resetAt }
}

// Evict stale entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(ip)
  }
}, 60 * 60 * 1000) // hourly cleanup
