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

const SYSTEM_PROMPT = `Tu es un analyste technique senior, objectif et sans biais directionnel. Tu analyses les marchés financiers avec rigueur et présentes PLUSIEURS SCÉNARIOS possibles avec leurs probabilités et conditions de déclenchement. Tu ne donnes jamais d'instruction directe d'achat ou de vente.

RÈGLE ABSOLUE : Réponds UNIQUEMENT en JSON valide. Zéro texte avant ou après.

━━━ MÉTHODE D'ANALYSE (dans cet ordre) ━━━
① Si plusieurs graphiques sont fournis (multi-timeframes ou multi-actifs) → analyse chaque graphique et croise les informations pour renforcer ou invalider les scénarios
② Identifie la paire/marché et le(s) timeframe(s) visibles
③ Si des INDICATEURS TECHNIQUES CALCULÉS sont fournis dans le contexte → utilise ces valeurs exactes (EMA, RSI, ATR, supports, résistances). Ne les ré-estime pas depuis l'image.
④ Identifie les niveaux clés : supports, résistances, zones de liquidité, FVG/imbalances
⑤ Construis 2 ou 3 scénarios objectifs (haussier, baissier, neutre) avec leurs probabilités et arguments factuels
⑥ Les probabilités des 3 scénarios doivent totaliser exactement 100
⑦ Si contexte macro/news fourni → intègre-le dans l'analyse des scénarios

━━━ RÈGLES IMPORTANTES ━━━
⚠ NE DIS PAS "achète", "vends", "BUY", "SELL" — présente les scénarios objectivement avec des conditions
⚠ Chaque scénario actif (probabilite > 0) doit avoir un déclencheur précis et vérifiable
⚠ Les niveaux SL/TP sont basés sur les données calculées fournies (ATR, swings) — pas inventés
⚠ Si le scénario neutre n'est pas pertinent, mets probabilite: 0 et arguments: []
⚠ confiance : honnête — 80+ si structure très claire, 60-75 si correct mais incertain, 40-55 si ambigu

━━━ JSON À RETOURNER ━━━
{
  "marche": "paire ex: BTC/USD, EUR/USD, XAU/USD — Inconnu si illisible",
  "timeframe": "ex: M15, H1, H4, D1 — ou 'multi-TF' si plusieurs graphiques — 'Non visible' si illisible",
  "tendance": "HAUSSIÈRE | BAISSIÈRE | NEUTRE | CONSOLIDATION | RETOURNEMENT POSSIBLE",
  "confiance": <entier 0-100>,
  "structure": "description concise de la structure de marché (BOS / CHoCH / continuation / sweep / range)",
  "zones": "niveaux clés identifiés : supports et résistances avec prix approximatifs",
  "scenario_haussier": {
    "probabilite": <entier 0-100>,
    "arguments": ["argument 1 citant des données réelles", "argument 2", "argument 3"],
    "entree": "zone d'entrée longue ex: 42000-42500 | null si non pertinent",
    "sl": "stop loss logique | null",
    "tp1": "premier objectif | null",
    "tp2": "deuxième objectif | null",
    "tp3": "extension si forte impulsion | null",
    "ratio_rr": "ex: 1:2.5 (sur TP1) | null",
    "declencheur": "condition exacte et vérifiable pour valider ce scénario | null"
  },
  "scenario_baissier": {
    "probabilite": <entier 0-100>,
    "arguments": ["argument 1 citant des données réelles", "argument 2", "argument 3"],
    "entree": "zone d'entrée courte | null si non pertinent",
    "sl": "stop loss logique | null",
    "tp1": "premier objectif | null",
    "tp2": "deuxième objectif | null",
    "tp3": "extension si forte impulsion | null",
    "ratio_rr": "ex: 1:2.0 (sur TP1) | null",
    "declencheur": "condition exacte et vérifiable pour valider ce scénario | null"
  },
  "scenario_neutre": {
    "probabilite": <entier 0-100>,
    "arguments": ["argument si pertinent — sinon tableau vide"],
    "declencheur": "condition de résolution (cassure d'un côté ou de l'autre) | null"
  },
  "analyse": "3-4 phrases de synthèse objective : tendance actuelle, niveaux structurants, scénario dominant et sa condition de déclenchement. Référence les données calculées si fournies.",
  "manque": null | "info manquante : timeframe illisible / image floue / contexte HTF absent / etc."
}`

// ─── Phase 1 : fast market identification ────────────────────────────────────

const IDENTIFY_PROMPT = `Identifie le marché et estime le prix médian visible sur ce graphique.
Réponds UNIQUEMENT en JSON : {"marche":"EUR/USD","prix_approx":1.0850} ou {"marche":"Inconnu","prix_approx":null} si illisible.
Exemples de marchés : BTC/USD · ETH/USD · EUR/USD · GBP/JPY · XAU/USD · XAG/USD · WTI · BRENT · NASDAQ · NAS100 · US100 · SPX500 · US500 · DOW · US30 · DAX · CAC40 · NQ · NQ1 · ES · YM · RTY · NIKKEI · N225 · HK50 · HSI`

async function identifyMarket(
  ai: ReturnType<typeof requireAnthropic>,
  base64: string,
  mediaType: string,
): Promise<{ market: string; approxPrice?: number }> {
  try {
    const res = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      system: IDENTIFY_PROMPT,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType as any, data: base64 } },
          { type: 'text', text: 'Identifie le marché et le prix visible.' },
        ],
      }],
    })
    const raw = res.content[0]?.type === 'text' ? res.content[0].text : ''
    const m = raw.indexOf('{'), n = raw.lastIndexOf('}')
    if (m === -1 || n === -1) return { market: 'Inconnu' }
    const json = JSON.parse(raw.slice(m, n + 1))
    const approxPrice = typeof json.prix_approx === 'number' && json.prix_approx > 0 ? json.prix_approx : undefined
    return { market: json.marche ?? 'Inconnu', approxPrice }
  } catch {
    return { market: 'Inconnu' }
  }
}

// Returns true if the live price and the price visible on the chart are in the same order of magnitude.
// A 5× gap almost certainly means a misidentified market (e.g. NQ futures vs XAU/USD).
function pricesCompatible(livePrice: number, chartPrice: number): boolean {
  const ratio = livePrice / chartPrice
  return ratio >= 0.2 && ratio <= 5.0
}

// ─── Build enriched system prompt ────────────────────────────────────────────

function buildPrompt(
  market: string,
  priceInfo: Awaited<ReturnType<typeof fetchLivePrice>>,
  newsItems: Awaited<ReturnType<typeof fetchEconomicContext>>,
  indicatorBlock: string | null,
): string {
  let extra = ''

  if (priceInfo) {
    const sign = priceInfo.isUp ? '+' : ''
    extra += `\n━━━ PRIX EN TEMPS RÉEL ━━━\n`
    extra += `${market} : ${priceInfo.currencySymbol}${priceInfo.priceFormatted}  (${sign}${priceInfo.changePercent.toFixed(2)}% aujourd'hui)\n`
    extra += `Source : ${priceInfo.source}\n`
  }

  if (indicatorBlock) {
    extra += `\n${indicatorBlock}\n`
  }

  if (newsItems.news.length > 0) {
    extra += `\n━━━ ACTUALITÉS RÉCENTES ━━━\n`
    newsItems.news.slice(0, 4).forEach((item, i) => {
      const sent = item.sentiment ? ` [${item.sentiment}]` : ''
      extra += `${i + 1}. ${item.source}${sent} : "${item.title}"\n`
    })
    extra += `\nIntègre ces actualités dans tes scénarios si pertinent.\n`
  }

  return extra ? SYSTEM_PROMPT + extra : SYSTEM_PROMPT
}

// ─── JSON extraction ─────────────────────────────────────────────────────────

function extractJSON(text: string): string {
  // Strip markdown code fences first
  const stripped = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()

  // Find the outermost { ... } by tracking brace depth
  let depth = 0, start = -1, end = -1
  for (let i = 0; i < stripped.length; i++) {
    if (stripped[i] === '{') {
      if (depth === 0) start = i
      depth++
    } else if (stripped[i] === '}') {
      depth--
      if (depth === 0 && start !== -1) { end = i; break }
    }
  }
  if (start !== -1 && end !== -1) return stripped.slice(start, end + 1)

  // Fallback: simple first/last brace
  const s = stripped.indexOf('{'), e = stripped.lastIndexOf('}')
  return s !== -1 && e > s ? stripped.slice(s, e + 1) : stripped
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { user } = await getUserFromRequest(req)
    if (user) {
      const quota = await checkAndIncrementQuota(user.id, 'analyse')
      if (!quota.allowed && !quota.isPaidPlan) {
        return NextResponse.json({ error: 'free_quota_exceeded', quota }, { status: 403 })
      }
    }

    const ai = requireAnthropic()
    const body = await req.json()

    // Support both multi-image array and legacy single image
    const imageList: { imageBase64: string; mediaType: string }[] =
      Array.isArray(body.images) && body.images.length > 0
        ? body.images
        : body.imageBase64
          ? [{ imageBase64: body.imageBase64, mediaType: body.mediaType || 'image/png' }]
          : []

    if (!imageList.length) return NextResponse.json({ error: 'Image manquante' }, { status: 400 })
    if (imageList.length > 4) return NextResponse.json({ error: 'Maximum 4 graphiques.' }, { status: 400 })

    // Phase 1 — identify market using the first image
    const first = imageList[0]
    const firstBase64 = first.imageBase64.includes(',') ? first.imageBase64.split(',')[1] : first.imageBase64
    const { market: detectedMarket, approxPrice: chartApproxPrice } = await identifyMarket(ai, firstBase64, first.mediaType)

    // Phase 2 — fetch price + news + indicators in parallel
    const [priceData, economicContext, indicatorBlock] = await Promise.all([
      fetchLivePrice(detectedMarket).catch(() => null),
      fetchEconomicContext(detectedMarket).catch(() => ({ news: [], source: 'Alpha Vantage' })),
      buildIndicatorBlock(detectedMarket).catch(() => null),
    ])

    // Discard indicators when the live price and visible chart price are incompatible —
    // this catches misidentified markets (e.g. NQ futures labelled as XAU/USD).
    let validatedPriceData = priceData
    let validatedIndicatorBlock = indicatorBlock
    if (chartApproxPrice && priceData && !pricesCompatible(priceData.price, chartApproxPrice)) {
      console.warn(`[analyse] Price mismatch: live=${priceData.price} chart≈${chartApproxPrice} market=${detectedMarket} — discarding indicators`)
      validatedPriceData = null
      validatedIndicatorBlock = null
    }

    // Phase 3 — build content blocks with all images
    const imgContentBlocks: any[] = []
    imageList.forEach((img, index) => {
      const base64 = img.imageBase64.includes(',') ? img.imageBase64.split(',')[1] : img.imageBase64
      if (imageList.length > 1) {
        imgContentBlocks.push({ type: 'text', text: `Graphique ${index + 1} sur ${imageList.length} :` })
      }
      imgContentBlocks.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType as any, data: base64 } })
    })
    imgContentBlocks.push({
      type: 'text',
      text: imageList.length > 1
        ? `Analyse ces ${imageList.length} graphiques ensemble. Identifie les convergences et divergences entre timeframes pour construire tes scénarios multi-TF.`
        : validatedIndicatorBlock
          ? 'Analyse ce graphique en utilisant les indicateurs calculés fournis dans le contexte.'
          : 'Analyse ce graphique en te basant uniquement sur la lecture visuelle — aucun indicateur calculé n\'est disponible pour ce marché.',
    })

    const enrichedPrompt = buildPrompt(detectedMarket, validatedPriceData, economicContext, validatedIndicatorBlock)

    const response = await ai.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: enrichedPrompt,
      messages: [{ role: 'user', content: imgContentBlocks }],
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const stopReason = response.stop_reason

    // If truncated by token limit the JSON will be incomplete — catch it explicitly
    if (stopReason === 'max_tokens') {
      console.error('[analyse] Response truncated (max_tokens). Raw length:', raw.length)
      return NextResponse.json(
        { error: 'La réponse a été tronquée. Réessaie — le modèle produira une analyse complète.' },
        { status: 422 },
      )
    }

    const cleaned = extractJSON(raw)

    let analysis: Record<string, unknown>
    try {
      analysis = JSON.parse(cleaned)
    } catch {
      console.error('[analyse] JSON parse failed. stop_reason:', stopReason, '| Raw:', raw)
      return NextResponse.json(
        { error: 'Le modèle n\'a pas retourné un JSON valide. Réessaie — cela fonctionne généralement au second essai.' },
        { status: 422 },
      )
    }

    const hasIndicators = !!validatedIndicatorBlock
    console.log(`[analyse] tendance=${analysis.tendance} confiance=${analysis.confiance} marche=${analysis.marche} imgs=${imageList.length} indicators=${hasIndicators}`)

    return NextResponse.json({ analysis, liveData: validatedPriceData, economicContext, hasIndicators })

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
