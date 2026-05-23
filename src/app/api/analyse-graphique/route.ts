import { requireAnthropic } from '@/lib/anthropic/client'
import { fetchLivePrice } from '@/lib/market-data'
import { fetchEconomicContext } from '@/lib/economic-data'
import { buildIndicatorBlock } from '@/lib/indicators'
import { getUserFromRequest } from '@/lib/supabase/auth-api'
import { checkAndIncrementQuota } from '@/lib/supabase/quota'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es un analyste trading institutionnel senior de hedge fund. Tu analyses les marchés avec précision, objectivité et conviction. Tu PRENDS des décisions — l'ambiguïté n'est pas une option professionnelle.

RÈGLE ABSOLUE : Réponds UNIQUEMENT en JSON valide. Zéro texte avant ou après.

━━━ MÉTHODE D'ANALYSE (dans cet ordre) ━━━
① Identifie la paire/marché et le timeframe visibles sur l'image
② Si des INDICATEURS TECHNIQUES CALCULÉS sont fournis dans le contexte → utilise ces valeurs exactes (EMA, RSI, ATR, supports, résistances). Ne les ré-estime pas depuis l'image.
③ Tendance globale : haussière / baissière / range / retournement — confirme avec les EMAs et biais fournis
④ Structure de marché : BOS (Break of Structure) · CHoCH (Change of Character) · continuation · consolidation — identifie visuellement sur le graphique
⑤ Zones clés : utilise les swing highs/lows calculés comme références. Identifie visuellement les imbalances / FVG / zones institutionnelles sur le graphique
⑥ Signal de confirmation : rejet · pullback · cassure · englobante · momentum visible sur l'image
⑦ Si contexte macro/news fourni → intègre-le dans l'analyse et la décision finale

━━━ RÈGLES DE DÉCISION ━━━
"BUY NOW"  → tendance haussière + zone support/demande + signal bullish déclenché
"SELL NOW" → tendance baissière + zone résistance/offre + signal bearish déclenché
"WAIT FOR CONFIRMATION" → setup visible, signal pas encore déclenché — donner quand même entrée/SL/TP potentiels + condition exacte
"NO TRADE" → aucune structure lisible, range sans biais. CAS RARES — jamais par défaut.

⚠ Setup suffisamment propre = BUY NOW ou SELL NOW. Pas de WAIT par prudence excessive.
⚠ confiance : honnête — 80+ si très clair, 60-75 si correct, 40-55 si douteux.
⚠ TP1 = premier objectif réaliste · TP2 = second niveau · TP3 = extension si tendance forte.
⚠ SL et TP basés sur les niveaux calculés fournis (ATR, swings) — pas inventés.

━━━ JSON À RETOURNER ━━━
{
  "marche": "paire ex: BTC/USD, EUR/USD, XAU/USD, NASDAQ — Inconnu si illisible",
  "timeframe": "ex: M15, H1, H4, D1 — Non visible si illisible",
  "decision": "BUY NOW | SELL NOW | WAIT FOR CONFIRMATION | NO TRADE",
  "confiance": <entier 0-100>,
  "tendance": "HAUSSIÈRE | BAISSIÈRE | RANGE | CONSOLIDATION | RETOURNEMENT POSSIBLE",
  "structure": "BOS / CHoCH / continuation / sweep / etc. — concis et précis",
  "zones": "niveaux clés avec prix approx : support X, résistance Y, liquidité sous/au-dessus Z",
  "entree": "zone d'entrée idéale | null si NO TRADE",
  "stop_loss": "SL logique basé ATR/swing | null",
  "take_profit": "TP1 | null",
  "tp2": "TP2 | null",
  "tp3": "TP3 si tendance forte, sinon null",
  "invalidation": "condition d'invalidation | null",
  "ratio_rr": "ex: 1:2.5 (sur TP1) | null",
  "analyse": "3-4 phrases : tendance + structure + signal + logique + contexte macro si pertinent. Direct, professionnel.",
  "manque": null | "info manquante : timeframe / qualité image / contexte HTF / etc."
}`

// ─── Phase 1 : fast market identification ────────────────────────────────────

const IDENTIFY_PROMPT = `Identifie uniquement la paire ou le marché visible sur ce graphique. Réponds UNIQUEMENT en JSON : {"marche":"EUR/USD"} ou {"marche":"Inconnu"} si illisible. Exemples : BTC/USD · EUR/USD · XAU/USD · NASDAQ · SPX500 · GBP/JPY`

async function identifyMarket(ai: ReturnType<typeof requireAnthropic>, base64: string, mediaType: string): Promise<string> {
  try {
    const res = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 40,
      system: IDENTIFY_PROMPT,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType as any, data: base64 } },
          { type: 'text', text: 'Identifie le marché.' },
        ],
      }],
    })
    const raw = res.content[0]?.type === 'text' ? res.content[0].text : ''
    const m = raw.indexOf('{'), n = raw.lastIndexOf('}')
    if (m === -1 || n === -1) return 'Inconnu'
    const json = JSON.parse(raw.slice(m, n + 1))
    return json.marche ?? 'Inconnu'
  } catch {
    return 'Inconnu'
  }
}

// ─── Build enriched system prompt ────────────────────────────────────────────

function buildPrompt(
  market: string,
  priceInfo: Awaited<ReturnType<typeof fetchLivePrice>>,
  newsItems: Awaited<ReturnType<typeof fetchEconomicContext>>,
  indicatorBlock: string | null,
): string {
  let extra = ''

  // 1. Real-time price
  if (priceInfo) {
    const sign = priceInfo.isUp ? '+' : ''
    extra += `\n━━━ PRIX EN TEMPS RÉEL ━━━\n`
    extra += `${market} : ${priceInfo.currencySymbol}${priceInfo.priceFormatted}  (${sign}${priceInfo.changePercent.toFixed(2)}% aujourd'hui)\n`
    extra += `Source : ${priceInfo.source}\n`
  }

  // 2. Calculated technical indicators (the key addition)
  if (indicatorBlock) {
    extra += `\n${indicatorBlock}\n`
  }

  // 3. News / macro context
  if (newsItems.news.length > 0) {
    extra += `\n━━━ ACTUALITÉS RÉCENTES ━━━\n`
    newsItems.news.slice(0, 4).forEach((item, i) => {
      const sent = item.sentiment ? ` [${item.sentiment}]` : ''
      extra += `${i + 1}. ${item.source}${sent} : "${item.title}"\n`
    })
    extra += `\nIntègre ces actualités dans ton analyse si pertinent.\n`
  }

  return extra ? SYSTEM_PROMPT + extra : SYSTEM_PROMPT
}

// ─── JSON extraction ─────────────────────────────────────────────────────────

function extractJSON(text: string): string {
  const s = text.indexOf('{'), e = text.lastIndexOf('}')
  if (s !== -1 && e !== -1 && e > s) return text.slice(s, e + 1)
  return text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Free trial quota check ─────────────────────────────────────
    const { user } = await getUserFromRequest(req)
    if (user) {
      const quota = await checkAndIncrementQuota(user.id, 'analyse')
      if (!quota.allowed && !quota.isPaidPlan) {
        return NextResponse.json({ error: 'free_quota_exceeded', quota }, { status: 403 })
      }
    }

    const ai = requireAnthropic()
    const body = await req.json()
    const { imageBase64, mediaType = 'image/png' } = body

    if (!imageBase64) return NextResponse.json({ error: 'Image manquante' }, { status: 400 })

    const base64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
    const imgContent = [
      { type: 'image' as const, source: { type: 'base64' as const, media_type: mediaType as any, data: base64 } },
      { type: 'text' as const, text: 'Analyse ce graphique en utilisant les indicateurs calculés fournis dans le contexte.' },
    ]

    // Phase 1 — identify market (fast, cheap, Haiku)
    const detectedMarket = await identifyMarket(ai, base64, mediaType)

    // Phase 2 — fetch price + news + OHLCV indicators in parallel
    const [priceData, economicContext, indicatorBlock] = await Promise.all([
      fetchLivePrice(detectedMarket).catch(() => null),
      fetchEconomicContext(detectedMarket).catch(() => ({ news: [], source: 'Alpha Vantage' })),
      buildIndicatorBlock(detectedMarket).catch(() => null),
    ])

    // Phase 3 — full analysis with all real data injected
    const enrichedPrompt = buildPrompt(detectedMarket, priceData, economicContext, indicatorBlock)

    const response = await ai.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: enrichedPrompt,
      messages: [{ role: 'user', content: imgContent }],
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const cleaned = extractJSON(raw)

    let analysis: Record<string, unknown>
    try {
      analysis = JSON.parse(cleaned)
    } catch {
      console.error('[analyse] JSON parse failed. Raw:', raw.slice(0, 300))
      return NextResponse.json({ error: 'Réponse invalide du modèle. Essaie avec un graphique plus net.' }, { status: 422 })
    }

    const hasIndicators = !!indicatorBlock
    console.log(`[analyse] decision=${analysis.decision} confiance=${analysis.confiance} marche=${analysis.marche} indicators=${hasIndicators} price=${priceData?.priceFormatted ?? 'n/a'} news=${economicContext.news.length}`)

    return NextResponse.json({ analysis, liveData: priceData, economicContext, hasIndicators })

  } catch (error: any) {
    const msg = error?.message || 'Erreur interne'
    const isConfig = msg.includes('non configuré')
    console.error('[analyse]', msg)
    return NextResponse.json(
      { error: isConfig ? 'Clé API Anthropic non configurée. Ajoute ANTHROPIC_API_KEY dans .env.local.' : msg },
      { status: isConfig ? 503 : 500 }
    )
  }
}
