// Server-side in-memory response cache (lives for the duration of the process)
interface CacheEntry {
  response: string
  model: string
  expiresAt: number
  hits: number
}

const store = new Map<string, CacheEntry>()

// Normalize message for cache key
function normalize(msg: string): string {
  return msg
    .toLowerCase()
    .trim()
    .replace(/[?!.,;:]/g, '')
    .replace(/\s+/g, ' ')
    .substring(0, 120) // cap key length
}

// Keywords that indicate a price/data query → short TTL (prices change fast)
const PRICE_KEYWORDS = ['prix', 'combien', 'cours', 'actuel', 'aujourd', 'rate', 'cost', 'valeur', 'cote']
const EDUCATION_KEYWORDS = ['c\'est quoi', 'qu\'est-ce', 'définition', 'expliqu', 'comment fonctionne', 'qu\'est']

function getTTL(message: string): number {
  const lower = message.toLowerCase()
  if (PRICE_KEYWORDS.some(k => lower.includes(k))) return 2 * 60 * 1000      // 2 min for prices
  if (EDUCATION_KEYWORDS.some(k => lower.includes(k))) return 30 * 60 * 1000  // 30 min for education
  return 5 * 60 * 1000                                                          // 5 min default
}

export function getCached(message: string): { response: string; model: string } | null {
  const key = normalize(message)
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { store.delete(key); return null }
  entry.hits++
  return { response: entry.response, model: entry.model + ' (cached)' }
}

export function setCached(message: string, response: string, model: string): void {
  const key = normalize(message)
  const ttl = getTTL(message)
  store.set(key, { response, model, expiresAt: Date.now() + ttl, hits: 0 })

  // Evict oldest entries if cache grows too large
  if (store.size > 500) {
    const oldest = [...store.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0]
    store.delete(oldest[0])
  }
}

// Only cache text-only, short messages (not image analysis, not conversation-dependent)
export function isCacheable(message: string, hasImage: boolean, historyLength: number): boolean {
  if (hasImage) return false           // never cache image analyses
  if (historyLength > 1) return false  // don't cache messages that depend on conversation context
  if (message.length > 200) return false
  return true
}
