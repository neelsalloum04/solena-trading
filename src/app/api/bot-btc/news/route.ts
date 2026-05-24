import type { NewsData, NewsArticle, NewsSentiment } from '@/lib/bot-btc/types'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Cache 10 min ─────────────────────────────────────────────────────────────

let cache: { data: NewsData; ts: number } | null = null
const CACHE_TTL = 10 * 60_000

// ─── NewsAPI fetch ────────────────────────────────────────────────────────────

async function fetchNews(): Promise<NewsArticle[]> {
  const key = process.env.NEWSAPI_KEY
  if (!key) return []

  const from = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  const url = `https://newsapi.org/v2/everything?q=bitcoin+BTC+crypto&language=en&sortBy=publishedAt&from=${from}&pageSize=10&apiKey=${key}`

  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return []
    const json = await res.json()
    return (json.articles ?? []).slice(0, 8).map((a: { title: string; url: string; source: { name: string }; publishedAt: string }) => ({
      title:       a.title,
      url:         a.url,
      source:      a.source?.name ?? 'Inconnu',
      publishedAt: a.publishedAt,
    }))
  } catch {
    return []
  }
}

// ─── Claude sentiment ─────────────────────────────────────────────────────────

async function analyzeSentiment(articles: NewsArticle[]): Promise<NewsSentiment> {
  if (articles.length === 0) {
    return { score: 50, direction: 'neutral', confidence: 0, summary: 'Aucune actualité disponible', keyEvent: '' }
  }

  const titles = articles.map((a, i) => `${i + 1}. [${a.source}] ${a.title}`).join('\n')

  const response = await ai.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Analyse le sentiment de ces actualités Bitcoin pour le trading.

${titles}

Réponds UNIQUEMENT avec un JSON valide:
{
  "score": <0-100, 50=neutre, >50=haussier, <50=baissier>,
  "direction": "bullish" | "bearish" | "neutral",
  "confidence": <0-100>,
  "summary": "<résumé en 1-2 phrases du sentiment global>",
  "keyEvent": "<événement clé le plus important pour le prix>"
}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return { score: 50, direction: 'neutral', confidence: 30, summary: 'Analyse indisponible', keyEvent: '' }

  return JSON.parse(match[0])
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const now = Date.now()
    if (cache && now - cache.ts < CACHE_TTL) {
      return NextResponse.json({ ...cache.data, cached: true })
    }

    const articles = await fetchNews()
    const sentiment = await analyzeSentiment(articles)

    const data: NewsData = {
      articles,
      sentiment,
      updatedAt: new Date().toISOString(),
    }

    cache = { data, ts: now }
    return NextResponse.json(data)
  } catch (err) {
    console.error('[bot-btc/news]', err)
    return NextResponse.json({ error: 'Erreur actualités' }, { status: 500 })
  }
}
