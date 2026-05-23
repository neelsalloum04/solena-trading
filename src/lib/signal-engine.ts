import { requireAnthropic } from './anthropic/client'
import {
  type Candle,
  aggregate4h,
  buildSignalSummary,
  fetchBinanceKlines,
  fetchYahooKlines,
} from './indicators'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignalType = 'BUY' | 'SELL' | 'WAIT'
export type MarketType = 'crypto' | 'forex' | 'commodities' | 'indices'

export interface SignalResult {
  signals: LiveSignal[]
  failedMarkets: string[]
  analyzedMarkets: number
}

export interface LiveSignal {
  id: string
  pair: string
  type: SignalType
  market: MarketType
  currentPrice: number
  priceFormatted: string
  entry: string | null
  stopLoss: string | null
  tp1: string | null
  tp2: string | null
  rr: string | null
  confidence: number
  riskLevel: string
  tendance: string
  timeframe: string
  justification: string
  generatedAt: string
}

// ─── Markets config ───────────────────────────────────────────────────────────

const WATCHED_MARKETS: Array<{
  pair: string
  binanceSymbol: string | null
  yahooSymbol: string
  market: MarketType
}> = [
  { pair: 'BTC/USD',  binanceSymbol: 'BTCUSDT',  yahooSymbol: 'BTC-USD',  market: 'crypto'      },
  { pair: 'ETH/USD',  binanceSymbol: 'ETHUSDT',  yahooSymbol: 'ETH-USD',  market: 'crypto'      },
  { pair: 'SOL/USD',  binanceSymbol: 'SOLUSDT',  yahooSymbol: 'SOL-USD',  market: 'crypto'      },
  { pair: 'EUR/USD',  binanceSymbol: null,        yahooSymbol: 'EURUSD=X', market: 'forex'       },
  { pair: 'GBP/USD',  binanceSymbol: null,        yahooSymbol: 'GBPUSD=X', market: 'forex'       },
  { pair: 'XAU/USD',  binanceSymbol: null,        yahooSymbol: 'GC=F',     market: 'commodities' },
]

// ─── Price formatting ─────────────────────────────────────────────────────────

function formatPx(price: number, pair: string): string {
  if (price > 10000) return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (price > 100)   return price.toFixed(2)
  if (price > 1)     return price.toFixed(4)
  return price.toFixed(6)
}

// ─── Claude signal generation ─────────────────────────────────────────────────

const SIGNAL_SYSTEM = `Tu es un analyste trading institutionnel senior de hedge fund. Tu génères des signaux basés UNIQUEMENT sur les données techniques réelles fournies.

RÈGLES STRICTES :
① R/R < 1:2 → signal INVALIDE → retourner WAIT
② RSI H1 > 75 → NE PAS BUY sauf divergence explicite
③ RSI H1 < 25 → NE PAS SELL sauf divergence explicite
④ Tendances H4 et H1 DOIVENT être alignées pour BUY ou SELL
⑤ Biais MIXED → WAIT sauf setup exceptionnel
⑥ WAIT si structure floue, range ou confirmation insuffisante
⑦ SL : 1.5× ATR H1 sous/au-dessus entrée, ou niveau de swing clé le plus proche
⑧ TP1 = 2× risque | TP2 = 3.5× risque | arrondir aux niveaux de prix logiques
⑨ Confiance : honnête (55-85%) — jamais inventé

Logique institutionnelle à appliquer :
- Zones de liquidité (equal highs/lows)
- Order blocks (dernière bougie opposée avant un move fort)
- Fake breakouts (prix sort brièvement d'un niveau puis revient)
- Smart money : toujours chercher où les stops retail se trouvent

RÉPONSE : JSON array uniquement. Un objet par marché. Aucun texte avant ou après.
[
  {
    "pair": "BTC/USD",
    "type": "BUY | SELL | WAIT",
    "confidence": <55-85>,
    "entry": "niveau ou zone ex: 67000–67200 | null si WAIT",
    "stop_loss": "niveau précis | null",
    "tp1": "TP1 | null",
    "tp2": "TP2 | null",
    "rr": "ex: 1:2.5 | null",
    "risk": "FAIBLE | MODÉRÉ | ÉLEVÉ",
    "tendance": "HAUSSIÈRE | BAISSIÈRE | RANGE | MIXTE",
    "justification": "1-2 phrases max : niveau clé + signal + logique. Direct et professionnel."
  }
]`

async function callClaude(summaries: string): Promise<any[]> {
  const ai = requireAnthropic()
  const res = await ai.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    system: SIGNAL_SYSTEM,
    messages: [{
      role: 'user',
      content: `Données de marché en temps réel (${new Date().toUTCString()}):\n\n${summaries}\n\nGénère les signaux pour CHAQUE marché ci-dessus.`,
    }],
  })
  const raw = res.content[0]?.type === 'text' ? res.content[0].text : '[]'
  const s = raw.indexOf('['), e = raw.lastIndexOf(']')
  if (s === -1 || e === -1) return []
  return JSON.parse(raw.slice(s, e + 1))
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateRR(signal: any): boolean {
  if (signal.type === 'WAIT') return true
  if (!signal.rr) return false
  const m = String(signal.rr).match(/1\s*:\s*(\d+\.?\d*)/)
  if (!m) return false
  return parseFloat(m[1]) >= 2
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateLiveSignals(): Promise<SignalResult> {
  const now = new Date().toISOString()
  const failedMarkets: string[] = []

  const marketData = await Promise.all(
    WATCHED_MARKETS.map(async (m) => {
      try {
        let h1: Candle[], h4: Candle[]
        if (m.binanceSymbol) {
          try {
            ;[h1, h4] = await Promise.all([
              fetchBinanceKlines(m.binanceSymbol, '1h', 200),
              fetchBinanceKlines(m.binanceSymbol, '4h', 100),
            ])
          } catch {
            // Binance geo-blocked on Vercel → fallback to Yahoo Finance
            h1 = await fetchYahooKlines(m.yahooSymbol)
            h4 = aggregate4h(h1)
          }
        } else {
          h1 = await fetchYahooKlines(m.yahooSymbol)
          h4 = aggregate4h(h1)
        }
        if (h1.length < 60) {
          failedMarkets.push(m.pair)
          return null
        }
        const currentPrice = h1.at(-1)!.close
        const price24hAgo  = h1.length >= 24 ? h1[h1.length - 24].close : h1[0].close
        const change24h    = ((currentPrice - price24hAgo) / price24hAgo) * 100
        const summary      = buildSignalSummary(m.pair, m.market, h1, h4, currentPrice, change24h)
        return { meta: m, currentPrice, summary }
      } catch {
        failedMarkets.push(m.pair)
        return null
      }
    })
  )

  const valid = marketData.filter(Boolean) as NonNullable<(typeof marketData)[0]>[]
  if (valid.length === 0) return { signals: [], failedMarkets, analyzedMarkets: 0 }

  const summaries = valid.map(v => v.summary).join('\n\n')

  let rawSignals: any[] = []
  try {
    rawSignals = await callClaude(summaries)
  } catch (e: any) {
    console.error('[signal-engine] Claude call failed:', e?.message)
    return { signals: [], failedMarkets, analyzedMarkets: valid.length }
  }

  const signals: LiveSignal[] = []

  for (const raw of rawSignals) {
    const marketInfo = valid.find(v => v.meta.pair === raw.pair)
    if (!marketInfo) continue
    if (!validateRR(raw)) raw.type = 'WAIT'
    signals.push({
      id:            `${raw.pair.replace('/', '')}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      pair:          raw.pair           ?? marketInfo.meta.pair,
      type:          raw.type           ?? 'WAIT',
      market:        marketInfo.meta.market,
      currentPrice:  marketInfo.currentPrice,
      priceFormatted: formatPx(marketInfo.currentPrice, raw.pair ?? ''),
      entry:         raw.entry          ?? null,
      stopLoss:      raw.stop_loss      ?? null,
      tp1:           raw.tp1            ?? null,
      tp2:           raw.tp2            ?? null,
      rr:            raw.rr             ?? null,
      confidence:    Math.min(85, Math.max(40, raw.confidence ?? 60)),
      riskLevel:     raw.risk           ?? 'MODÉRÉ',
      tendance:      raw.tendance       ?? 'MIXTE',
      timeframe:     'H1/H4',
      justification: raw.justification  ?? '',
      generatedAt:   now,
    })
  }

  return {
    signals: signals.sort((a, b) => {
      if (a.type !== 'WAIT' && b.type === 'WAIT') return -1
      if (a.type === 'WAIT' && b.type !== 'WAIT') return 1
      return b.confidence - a.confidence
    }),
    failedMarkets,
    analyzedMarkets: valid.length,
  }
}
