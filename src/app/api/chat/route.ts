import { getCached, isCacheable, setCached } from '@/lib/ai/cache'
import { checkRateLimit } from '@/lib/ai/ratelimit'
import { getMaxTokens, getModel, routeMessage } from '@/lib/ai/router'
import { requireAnthropic, SYSTEM_FAST, SYSTEM_SMART } from '@/lib/anthropic/client'
import { getUserFromRequest } from '@/lib/supabase/auth-api'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

// Fetch pre-cached market data (revalidated every 60s by /api/market-data)
async function getMarketData(origin: string): Promise<string> {
  try {
    const res = await fetch(`${origin}/api/market-data`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return ''
    const data = await res.json()
    return data.summary || ''
  } catch {
    return ''
  }
}

// Compress history: keep only the last N messages and strip image data
function compressHistory(history: any[], maxMessages = 5): any[] {
  return history
    .slice(-maxMessages)
    .map(m => ({
      role: m.role,
      // Drop image URLs from history to save tokens (only current message can have image)
      content: typeof m.content === 'string' ? m.content : '[graphique analysé précédemment]',
    }))
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  try {
    const ai = requireAnthropic()
    const body = await req.json()
    const { message = '', imageUrl, history = [], plan = 'free' } = body

    const { user } = await getUserFromRequest(req)

    // ── Rate limiting (IP-based daily quotas) ──────────────────────
    const ip = getClientIp(req)
    const rateLimit = checkRateLimit(ip, plan)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Quota journalier atteint (${rateLimit.limit} messages/jour). Revient demain ou passe au plan supérieur.`, quota: rateLimit },
        { status: 429 }
      )
    }

    const hasImage = !!imageUrl

    // ── Cache check ─────────────────────────────────────────────────
    const cacheable = isCacheable(message, hasImage, history.length)
    if (cacheable) {
      const cached = getCached(message)
      if (cached) {
        return NextResponse.json({
          content: cached.response,
          model: cached.model,
          cached: true,
          quota: rateLimit,
        })
      }
    }

    // ── Model routing ───────────────────────────────────────────────
    const tier = routeMessage(message, hasImage)
    const model = getModel(tier)
    const maxTokens = getMaxTokens(tier)
    const systemBase = tier === 'smart' ? SYSTEM_SMART : SYSTEM_FAST

    // ── Market data (inject only if query seems market-related) ─────
    const marketKeywords = ['prix', 'cours', 'btc', 'eth', 'bitcoin', 'eur', 'usd', 'gold', 'or', 'marché', 'analyse', 'signal']
    const needsMarketData = marketKeywords.some(k => message.toLowerCase().includes(k)) || hasImage
    const marketData = needsMarketData ? await getMarketData(req.nextUrl.origin) : ''
    const system = marketData ? `${systemBase}\n\n📊 MARCHÉ (temps réel):\n${marketData}` : systemBase

    // ── Build messages ──────────────────────────────────────────────
    const messages: any[] = compressHistory(history, 5)

    if (hasImage) {
      const base64Match = imageUrl.match(/^data:(.+);base64,(.+)$/)
      if (base64Match) {
        messages.push({
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: base64Match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Match[2],
              },
            },
            { type: 'text', text: message || 'Analyse ce graphique.' },
          ],
        })
      } else {
        messages.push({ role: 'user', content: message })
      }
    } else {
      messages.push({ role: 'user', content: message })
    }

    // ── API call ────────────────────────────────────────────────────
    const response = await ai.messages.create({ model, max_tokens: maxTokens, system, messages })
    const content = response.content[0]?.type === 'text' ? response.content[0].text : ''

    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens
    console.log(`[chat] model=${model} in=${response.usage.input_tokens} out=${response.usage.output_tokens} tier=${tier}`)

    // ── Cache response ──────────────────────────────────────────────
    if (cacheable) setCached(message, content, model)

    return NextResponse.json({ content, model, quota: rateLimit, tokensUsed })
  } catch (error: any) {
    const isConfig = error.message?.includes('non configuré')
    const errMsg = error?.error?.error?.message || error?.message || 'Erreur inconnue'
    console.error('[chat]', errMsg)
    return NextResponse.json({ error: errMsg }, { status: isConfig ? 503 : 500 })
  }
}
