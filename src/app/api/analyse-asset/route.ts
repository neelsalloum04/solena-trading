import { requireAnthropic } from '@/lib/anthropic/client'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

type Asset = 'BTC' | 'ETH' | 'GOLD' | 'EURUSD' | 'NASDAQ'

interface MarketData {
  price: number | null
  change24h: number | null
  high?: number | null
  low?: number | null
  volume?: number | null
}

// ─── Kraken (BTC / ETH) ───────────────────────────────────────────────────────
async function fetchKraken(pair: string, key: string): Promise<MarketData> {
  const r = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}`, {
    signal: AbortSignal.timeout(6000),
  })
  const d = await r.json()
  const t = d.result[key]
  const price = parseFloat(t.c[0])
  const open  = parseFloat(t.o)
  return {
    price,
    change24h: ((price - open) / open) * 100,
    high:   parseFloat(t.h[1]),
    low:    parseFloat(t.l[1]),
    volume: parseFloat(t.v[1]),
  }
}

// ─── Stooq (NASDAQ / GOLD) ────────────────────────────────────────────────────
async function fetchStooq(symbol: string): Promise<MarketData> {
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcvn&h&e=csv`
  const r = await fetch(url, { signal: AbortSignal.timeout(6000) })
  const text = await r.text()
  const lines = text.trim().split('\n')
  if (lines.length < 2) return { price: null, change24h: null }
  const cols = lines[1].split(',')
  // CSV: Symbol,Date,Time,Open,High,Low,Close,Volume,OpenInt
  const open  = parseFloat(cols[3])
  const high  = parseFloat(cols[4])
  const low   = parseFloat(cols[5])
  const close = parseFloat(cols[6])
  if (isNaN(close)) return { price: null, change24h: null }
  return { price: close, change24h: ((close - open) / open) * 100, high, low }
}

// ─── open.er-api.com (EUR/USD) ────────────────────────────────────────────────
async function fetchEURUSD(): Promise<MarketData> {
  const r = await fetch('https://open.er-api.com/v6/latest/EUR', { signal: AbortSignal.timeout(6000) })
  const d = await r.json()
  const price = d.rates?.USD ?? null
  return { price, change24h: null }
}

async function fetchMarketData(asset: Asset): Promise<MarketData> {
  try {
    if (asset === 'BTC')    return await fetchKraken('XBTUSD', 'XXBTZUSD')
    if (asset === 'ETH')    return await fetchKraken('ETHUSD', 'XETHZUSD')
    if (asset === 'GOLD')   return await fetchStooq('xauusd')
    if (asset === 'NASDAQ') return await fetchStooq('^ndx')
    if (asset === 'EURUSD') return await fetchEURUSD()
  } catch {}
  return { price: null, change24h: null }
}

// ─── Prompt ───────────────────────────────────────────────────────────────────
const ASSET_LABELS: Record<Asset, string> = {
  BTC:    'Bitcoin (BTC/USD)',
  ETH:    'Ethereum (ETH/USD)',
  GOLD:   'Or (XAU/USD)',
  EURUSD: 'EUR/USD',
  NASDAQ: 'NASDAQ 100 (NDX)',
}

function buildPrompt(asset: Asset, d: MarketData): string {
  const label = ASSET_LABELS[asset]
  const now   = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
  const isDecimal = asset === 'EURUSD'
  const fmt = (n: number) => isDecimal ? n.toFixed(4) : n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })

  let dataLines = ''
  if (d.price    !== null) dataLines += `\n- Prix actuel : ${fmt(d.price)}`
  if (d.change24h !== null) dataLines += `\n- Variation 24h : ${d.change24h >= 0 ? '+' : ''}${d.change24h.toFixed(2)}%`
  if (d.high     !== null && d.high) dataLines += `\n- Plus haut 24h : ${fmt(d.high)}`
  if (d.low      !== null && d.low)  dataLines += `\n- Plus bas 24h : ${fmt(d.low)}`
  if (d.volume   !== null && d.volume) dataLines += `\n- Volume 24h : ${d.volume.toFixed(0)}`

  return `Tu es un analyste financier professionnel senior. Analyse ${label} pour un horizon court terme (24h à 72h).

Date de l'analyse : ${now}
${dataLines ? `\nDonnées marché temps réel :${dataLines}` : ''}

Analyse complète : tendance (EMA 20/50/200), RSI (survente/surachat), MACD (divergences), supports/résistances clés, momentum, volume, contexte macroéconomique récent.

Réponds UNIQUEMENT avec ce JSON valide, pas de texte autour, pas de markdown :
{
  "decision": "ACHETER",
  "confidence": "ÉLEVÉ",
  "points": [
    "Point d'analyse 1 — court et précis",
    "Point d'analyse 2 — court et précis",
    "Point d'analyse 3 — court et précis",
    "Point d'analyse 4 — court et précis"
  ],
  "conclusion": "Une phrase de conclusion claire et directe",
  "risks": "Principaux risques en une phrase courte"
}

"decision" : "ACHETER" | "VENDRE" | "ATTENDRE"
"confidence" : "FAIBLE" | "MOYEN" | "ÉLEVÉ"`
}

// ─── Route ────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { asset } = await req.json() as { asset: Asset }
    if (!['BTC', 'ETH', 'GOLD', 'EURUSD', 'NASDAQ'].includes(asset)) {
      return NextResponse.json({ error: 'Actif invalide' }, { status: 400 })
    }

    const anthropic = requireAnthropic()

    const [data] = await Promise.all([fetchMarketData(asset)])
    const prompt  = buildPrompt(asset, data)

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      system: 'Tu es un analyste financier expert. Tu réponds UNIQUEMENT en JSON valide sans aucun texte supplémentaire ni markdown.',
      messages: [{ role: 'user', content: prompt }],
    })

    const raw       = (msg.content[0] as { type: string; text: string }).text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Réponse IA invalide')

    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      decision:   result.decision   ?? 'ATTENDRE',
      confidence: result.confidence ?? 'MOYEN',
      points:     Array.isArray(result.points) ? result.points : [],
      conclusion: result.conclusion ?? '',
      risks:      result.risks      ?? '',
      price:      data.price,
      change24h:  data.change24h,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
