import { generateLiveSignals, type SignalResult } from '@/lib/signal-engine'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

// ─── 5-minute module-level cache ─────────────────────────────────────────────

let cache: { result: SignalResult; ts: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

export async function GET() {
  try {
    const now = Date.now()
    if (cache && now - cache.ts < CACHE_TTL) {
      return NextResponse.json({
        signals:          cache.result.signals,
        failedMarkets:    cache.result.failedMarkets,
        analyzedMarkets:  cache.result.analyzedMarkets,
        cached:           true,
        generatedAt:      new Date(cache.ts).toISOString(),
      })
    }

    const result = await generateLiveSignals()
    cache = { result, ts: now }

    if (result.failedMarkets.length > 0) {
      console.warn('[signals] Marchés en échec:', result.failedMarkets.join(', '))
    }

    return NextResponse.json({
      signals:         result.signals,
      failedMarkets:   result.failedMarkets,
      analyzedMarkets: result.analyzedMarkets,
      cached:          false,
      generatedAt:     new Date(now).toISOString(),
    })
  } catch (error: any) {
    console.error('[signals]', error?.message)
    return NextResponse.json(
      { error: 'Impossible de générer les signaux.', signals: [], failedMarkets: [], analyzedMarkets: 0 },
      { status: 500 }
    )
  }
}
