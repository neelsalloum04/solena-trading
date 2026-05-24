import type { MarketData } from '@/lib/bot-btc/types'
import type { BtcSignal, NewsSentiment } from '@/lib/bot-btc/types'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function formatIndicators(market: MarketData): string {
  const tf = (label: string, key: keyof MarketData['indicators']) => {
    const i = market.indicators[key]
    return `
  [${label}]
    RSI: ${i.rsi.toFixed(1)} | MACD: ${i.macd.macd.toFixed(1)} / Signal: ${i.macd.signal.toFixed(1)} / Histo: ${i.macd.histogram.toFixed(1)} (${i.macd.bullish ? 'haussier' : 'baissier'})
    EMA20: ${i.ema20.toFixed(0)} | EMA50: ${i.ema50.toFixed(0)} | EMA200: ${i.ema200.toFixed(0)}
    VWAP: ${i.vwap.toFixed(0)} (prix ${i.priceVsVwap > 0 ? '+' : ''}${i.priceVsVwap.toFixed(2)}%)
    ATR: ${i.atr.toFixed(0)} | Trend: ${i.trend} | Momentum: ${i.momentum.toFixed(0)}/100
    Vol ratio buy/sell: ${i.volumeRatio.toFixed(2)} | MACD crossing: ${i.macdCrossing}
    Supports: ${i.support.slice(0, 3).join(', ')} | Résistances: ${i.resistance.slice(0, 3).join(', ')}`
  }

  return `
=== DONNÉES DE MARCHÉ BTC/USDT ===
Prix actuel: ${market.price.toFixed(2)} $
Variation 24h: ${market.change24h > 0 ? '+' : ''}${market.change24h.toFixed(2)}%
Volume 24h: ${(market.volume24h / 1_000_000).toFixed(0)}M $
High/Low 24h: ${market.high24h.toFixed(0)} / ${market.low24h.toFixed(0)}
Funding Rate: ${(market.fundingRate * 100).toFixed(4)}%
Open Interest: ${(market.openInterest / 1_000_000).toFixed(0)}M $
Carnet d'ordres bid/ask ratio: ${market.orderBook.ratio.toFixed(2)}

=== INDICATEURS TECHNIQUES ===
${tf('1 minute', '1m')}
${tf('3 minutes', '3m')}
${tf('5 minutes', '5m')}
${tf('15 minutes', '15m')}
${tf('1 heure', '1h')}
`
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const market: MarketData = body.market
    const news: NewsSentiment | null = body.news ?? null

    if (!market) {
      return NextResponse.json({ error: 'market data requis' }, { status: 400 })
    }

    const newsSection = news
      ? `\n=== SENTIMENT NEWS ===\nScore: ${news.score}/100 (${news.direction})\nConfiance: ${news.confidence}%\nRésumé: ${news.summary}\nÉvénement clé: ${news.keyEvent}`
      : ''

    const prompt = `Tu es un expert en scalping Bitcoin avec 10 ans d'expérience sur les marchés crypto.
Analyse ces données de marché en temps réel et génère un signal de trading précis.

${formatIndicators(market)}${newsSection}

=== RÈGLES DE TRADING ===
- Scalping BTC/USDT perpetual futures
- Timeframes primaires: 5m et 15m pour entrée, 1h pour biais
- Stop Loss: toujours basé sur l'ATR × 1.5 ou support/résistance clé
- TP1: 1×ATR, TP2: 2×ATR, TP3: 3×ATR
- Risk/Reward minimum: 1.5
- NE PAS prendre de position si: RSI extrême sans divergence, MACD sans confirmation, ou signal faible
- Funding rate élevé (>0.05%) = éviter position dans ce sens
- Volume ratio < 0.7 = pression vendeuse forte

=== FORMAT DE RÉPONSE ATTENDU ===
Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans commentaires:
{
  "signal": "LONG" | "SHORT" | "WAIT",
  "confidence": <0-100>,
  "entryPrice": <prix actuel ou légèrement mieux>,
  "stopLoss": <prix stop loss>,
  "tp1": <premier objectif>,
  "tp2": <deuxième objectif>,
  "tp3": <troisième objectif>,
  "riskReward": <ratio R/R calculé>,
  "probability": <probabilité succès 0-100>,
  "scores": {
    "technical": <0-100, qualité setup technique>,
    "fundamental": <0-100, funding/OI/biais macro>,
    "liquidity": <0-100, liquidité carnet ordres>,
    "momentum": <0-100, force du momentum actuel>,
    "volatility": <0-100, volatilité favorable>,
    "news": <0-100, impact actualités>
  },
  "reasoning": "<explication détaillée du signal en français, 3-5 phrases>",
  "validConditions": "<conditions qui maintiennent le signal valide>",
  "invalidConditions": "<conditions qui invalident le signal, sortie recommandée>",
  "timeframe": "<timeframe optimal pour ce trade>",
  "marketBias": "bullish" | "bearish" | "neutral"
}`

    const response = await ai.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Réponse Claude invalide')

    const signal: BtcSignal = {
      ...JSON.parse(jsonMatch[0]),
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(signal)
  } catch (err) {
    console.error('[bot-btc/signal]', err)
    return NextResponse.json({ error: 'Erreur génération signal' }, { status: 500 })
  }
}
