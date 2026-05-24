import { requireAnthropic } from '@/lib/anthropic/client'
import { NextResponse } from 'next/server'

export const runtime  = 'nodejs'
export const maxDuration = 30

// ─── Types ────────────────────────────────────────────────────────────────────

interface MarketData {
  price:     number | null
  change24h: number | null
  high?:     number | null
  low?:      number | null
  volume?:   number | null
}

interface AssetConfig {
  name:      string
  category:  'crypto' | 'forex' | 'metals' | 'indices' | 'commodities' | 'stocks'
  coingecko?: string
  kraken?:   { pair: string; key: string }
  forex?:    { base: string; quote: string }
  stooq?:    string
  decimals?: number
}

// ─── Asset configuration ──────────────────────────────────────────────────────

const ASSETS: Record<string, AssetConfig> = {
  // ── Crypto ──────────────────────────────────────────────────────────────────
  BTC:    { name: 'Bitcoin',            category: 'crypto',      kraken: { pair: 'XBTUSD', key: 'XXBTZUSD' }, decimals: 0 },
  ETH:    { name: 'Ethereum',           category: 'crypto',      kraken: { pair: 'ETHUSD', key: 'XETHZUSD' }, decimals: 2 },
  SOL:    { name: 'Solana',             category: 'crypto',      coingecko: 'solana',             decimals: 2 },
  XRP:    { name: 'XRP',                category: 'crypto',      coingecko: 'ripple',             decimals: 4 },
  BNB:    { name: 'BNB',                category: 'crypto',      coingecko: 'binancecoin',        decimals: 2 },
  ADA:    { name: 'Cardano',            category: 'crypto',      coingecko: 'cardano',            decimals: 4 },
  DOGE:   { name: 'Dogecoin',           category: 'crypto',      coingecko: 'dogecoin',           decimals: 5 },
  AVAX:   { name: 'Avalanche',          category: 'crypto',      coingecko: 'avalanche-2',        decimals: 2 },
  LINK:   { name: 'Chainlink',          category: 'crypto',      coingecko: 'chainlink',          decimals: 3 },
  SUI:    { name: 'Sui',                category: 'crypto',      coingecko: 'sui',                decimals: 4 },
  TON:    { name: 'Toncoin',            category: 'crypto',      coingecko: 'the-open-network',   decimals: 4 },
  TRX:    { name: 'TRON',               category: 'crypto',      coingecko: 'tron',               decimals: 5 },
  DOT:    { name: 'Polkadot',           category: 'crypto',      coingecko: 'polkadot',           decimals: 3 },
  LTC:    { name: 'Litecoin',           category: 'crypto',      coingecko: 'litecoin',           decimals: 2 },
  SHIB:   { name: 'Shiba Inu',          category: 'crypto',      coingecko: 'shiba-inu',          decimals: 8 },
  APT:    { name: 'Aptos',              category: 'crypto',      coingecko: 'aptos',              decimals: 3 },
  NEAR:   { name: 'Near Protocol',      category: 'crypto',      coingecko: 'near',               decimals: 3 },
  ARB:    { name: 'Arbitrum',           category: 'crypto',      coingecko: 'arbitrum',           decimals: 4 },
  OP:     { name: 'Optimism',           category: 'crypto',      coingecko: 'optimism',           decimals: 4 },
  RNDR:   { name: 'Render',             category: 'crypto',      coingecko: 'render-token',       decimals: 3 },
  INJ:    { name: 'Injective',          category: 'crypto',      coingecko: 'injective-protocol', decimals: 3 },
  PEPE:   { name: 'Pepe',               category: 'crypto',      coingecko: 'pepe',               decimals: 8 },
  BONK:   { name: 'Bonk',               category: 'crypto',      coingecko: 'bonk',               decimals: 8 },
  HBAR:   { name: 'Hedera',             category: 'crypto',      coingecko: 'hedera-hashgraph',   decimals: 5 },
  XLM:    { name: 'Stellar',            category: 'crypto',      coingecko: 'stellar',            decimals: 5 },
  KAS:    { name: 'Kaspa',              category: 'crypto',      coingecko: 'kaspa',              decimals: 5 },
  ICP:    { name: 'Internet Computer',  category: 'crypto',      coingecko: 'internet-computer',  decimals: 2 },
  VET:    { name: 'VeChain',            category: 'crypto',      coingecko: 'vechain',            decimals: 5 },
  ALGO:   { name: 'Algorand',           category: 'crypto',      coingecko: 'algorand',           decimals: 4 },
  FIL:    { name: 'Filecoin',           category: 'crypto',      coingecko: 'filecoin',           decimals: 3 },
  ATOM:   { name: 'Cosmos',             category: 'crypto',      coingecko: 'cosmos',             decimals: 3 },
  UNI:    { name: 'Uniswap',            category: 'crypto',      coingecko: 'uniswap',            decimals: 3 },
  AAVE:   { name: 'Aave',               category: 'crypto',      coingecko: 'aave',               decimals: 2 },
  MKR:    { name: 'Maker',              category: 'crypto',      coingecko: 'maker',              decimals: 0 },
  ETC:    { name: 'Ethereum Classic',   category: 'crypto',      coingecko: 'ethereum-classic',   decimals: 2 },
  XMR:    { name: 'Monero',             category: 'crypto',      coingecko: 'monero',             decimals: 2 },
  SEI:    { name: 'Sei',                category: 'crypto',      coingecko: 'sei-network',        decimals: 4 },
  TIA:    { name: 'Celestia',           category: 'crypto',      coingecko: 'celestia',           decimals: 3 },
  WLD:    { name: 'Worldcoin',          category: 'crypto',      coingecko: 'worldcoin-wld',      decimals: 3 },
  ONDO:   { name: 'Ondo',               category: 'crypto',      coingecko: 'ondo-finance',       decimals: 4 },
  PENDLE: { name: 'Pendle',             category: 'crypto',      coingecko: 'pendle',             decimals: 3 },

  // ── Forex ────────────────────────────────────────────────────────────────────
  EURUSD: { name: 'EUR/USD', category: 'forex', forex: { base: 'EUR', quote: 'USD' }, decimals: 5 },
  GBPUSD: { name: 'GBP/USD', category: 'forex', forex: { base: 'GBP', quote: 'USD' }, decimals: 5 },
  USDJPY: { name: 'USD/JPY', category: 'forex', forex: { base: 'USD', quote: 'JPY' }, decimals: 3 },
  USDCHF: { name: 'USD/CHF', category: 'forex', forex: { base: 'USD', quote: 'CHF' }, decimals: 5 },
  AUDUSD: { name: 'AUD/USD', category: 'forex', forex: { base: 'AUD', quote: 'USD' }, decimals: 5 },
  NZDUSD: { name: 'NZD/USD', category: 'forex', forex: { base: 'NZD', quote: 'USD' }, decimals: 5 },
  USDCAD: { name: 'USD/CAD', category: 'forex', forex: { base: 'USD', quote: 'CAD' }, decimals: 5 },
  EURGBP: { name: 'EUR/GBP', category: 'forex', forex: { base: 'EUR', quote: 'GBP' }, decimals: 5 },
  EURJPY: { name: 'EUR/JPY', category: 'forex', forex: { base: 'EUR', quote: 'JPY' }, decimals: 3 },
  GBPJPY: { name: 'GBP/JPY', category: 'forex', forex: { base: 'GBP', quote: 'JPY' }, decimals: 3 },

  // ── Metals ───────────────────────────────────────────────────────────────────
  GOLD:   { name: 'Or (XAU/USD)',      category: 'metals',      stooq: 'xauusd', decimals: 2 },
  SILVER: { name: 'Argent (XAG/USD)',  category: 'metals',      stooq: 'xagusd', decimals: 3 },
  PLAT:   { name: 'Platine (XPT/USD)', category: 'metals',      stooq: 'xptusd', decimals: 2 },
  PALL:   { name: 'Palladium',         category: 'metals',      stooq: 'xpdusd', decimals: 2 },

  // ── Indices ──────────────────────────────────────────────────────────────────
  NASDAQ: { name: 'NASDAQ 100',   category: 'indices', stooq: '^ndx',   decimals: 0 },
  SPX:    { name: 'S&P 500',      category: 'indices', stooq: '^spx',   decimals: 0 },
  DJI:    { name: 'Dow Jones',    category: 'indices', stooq: '^dji',   decimals: 0 },
  DAX:    { name: 'DAX 40',       category: 'indices', stooq: '^daxi',  decimals: 0 },
  CAC:    { name: 'CAC 40',       category: 'indices', stooq: '^cac',   decimals: 0 },
  FTSE:   { name: 'FTSE 100',     category: 'indices', stooq: '^ftse',  decimals: 0 },
  NKY:    { name: 'Nikkei 225',   category: 'indices', stooq: '^nkx',   decimals: 0 },
  HSI:    { name: 'Hang Seng',    category: 'indices', stooq: '^hsi',   decimals: 0 },

  // ── Commodities ───────────────────────────────────────────────────────────────
  BRENT:  { name: 'Pétrole Brent', category: 'commodities', stooq: 'brent.f', decimals: 2 },
  WTI:    { name: 'WTI (Pétrole)', category: 'commodities', stooq: 'cl.f',    decimals: 2 },
  NATGAS: { name: 'Gaz Naturel',   category: 'commodities', stooq: 'ng.f',    decimals: 3 },
  COPPER: { name: 'Cuivre',        category: 'commodities', stooq: 'hg.f',    decimals: 3 },
  WHEAT:  { name: 'Blé',           category: 'commodities', stooq: 'w.f',     decimals: 2 },
  CORN:   { name: 'Maïs',          category: 'commodities', stooq: 'c.f',     decimals: 2 },
  COFFEE: { name: 'Café',          category: 'commodities', stooq: 'kc.f',    decimals: 2 },
  COCOA:  { name: 'Cacao',         category: 'commodities', stooq: 'cc.f',    decimals: 0 },

  // ── Stocks ───────────────────────────────────────────────────────────────────
  AAPL:   { name: 'Apple',          category: 'stocks', stooq: 'aapl.us',  decimals: 2 },
  MSFT:   { name: 'Microsoft',      category: 'stocks', stooq: 'msft.us',  decimals: 2 },
  NVDA:   { name: 'NVIDIA',         category: 'stocks', stooq: 'nvda.us',  decimals: 2 },
  AMZN:   { name: 'Amazon',         category: 'stocks', stooq: 'amzn.us',  decimals: 2 },
  META:   { name: 'Meta Platforms', category: 'stocks', stooq: 'meta.us',  decimals: 2 },
  TSLA:   { name: 'Tesla',          category: 'stocks', stooq: 'tsla.us',  decimals: 2 },
  GOOGL:  { name: 'Alphabet',       category: 'stocks', stooq: 'googl.us', decimals: 2 },
  NFLX:   { name: 'Netflix',        category: 'stocks', stooq: 'nflx.us',  decimals: 2 },
}

// ─── Market data fetchers ─────────────────────────────────────────────────────

async function fetchKraken(pair: string, key: string): Promise<MarketData> {
  const r = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}`, { signal: AbortSignal.timeout(6000) })
  const d = await r.json()
  const t = d.result[key]
  if (!t) return { price: null, change24h: null }
  const price = parseFloat(t.c[0])
  const open  = parseFloat(t.o)
  return { price, change24h: ((price - open) / open) * 100, high: parseFloat(t.h[1]), low: parseFloat(t.l[1]), volume: parseFloat(t.v[1]) }
}

async function fetchCoinGecko(id: string): Promise<MarketData> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
  const r = await fetch(url, { signal: AbortSignal.timeout(7000), headers: { 'Accept': 'application/json' } })
  const d = await r.json()
  const coin = d[id]
  if (!coin) return { price: null, change24h: null }
  return { price: coin.usd, change24h: coin.usd_24h_change, volume: coin.usd_24h_vol }
}

async function fetchForex(base: string, quote: string): Promise<MarketData> {
  const r = await fetch(`https://open.er-api.com/v6/latest/${base}`, { signal: AbortSignal.timeout(6000) })
  const d = await r.json()
  const price = d.rates?.[quote] ?? null
  return { price, change24h: null }
}

async function fetchStooq(symbol: string): Promise<MarketData> {
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcvn&h&e=csv`
  const r = await fetch(url, { signal: AbortSignal.timeout(7000) })
  const text = await r.text()
  const lines = text.trim().split('\n')
  if (lines.length < 2) return { price: null, change24h: null }
  const cols = lines[1].split(',')
  const open  = parseFloat(cols[3])
  const high  = parseFloat(cols[4])
  const low   = parseFloat(cols[5])
  const close = parseFloat(cols[6])
  if (isNaN(close) || close === 0) return { price: null, change24h: null }
  return { price: close, change24h: ((close - open) / open) * 100, high, low }
}

async function getMarketData(ticker: string, config: AssetConfig): Promise<MarketData> {
  try {
    if (config.kraken)    return await fetchKraken(config.kraken.pair, config.kraken.key)
    if (config.coingecko) return await fetchCoinGecko(config.coingecko)
    if (config.forex)     return await fetchForex(config.forex.base, config.forex.quote)
    if (config.stooq)     return await fetchStooq(config.stooq)
  } catch {}
  return { price: null, change24h: null }
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

const CATEGORY_CONTEXT: Record<string, string> = {
  crypto:      'cryptomonnaie (Bitcoin/altcoin). Analyse on-chain, sentiment crypto, corrélation BTC, DeFi/adoption.',
  forex:       'paire de devises Forex. Analyse différentiels de taux directeurs, données macro (NFP, CPI, PIB), sentiment risk-on/off.',
  metals:      'métal précieux. Analyse flux refuge, taux réels US, dollar index (DXY), géopolitique, inflation.',
  indices:     'indice boursier. Analyse macro US/global, Fed/BCE, résultats entreprises, flux institutionnels, rotation sectorielle.',
  commodities: 'matière première. Analyse offre/demande, stocks mondiaux, météo/géopolitique, dollar, coûts de production.',
  stocks:      'action cotée en bourse. Analyse fondamentale (PE ratio, revenus), technique, secteur tech/growth, Fed, IA/cloud/semi.',
}

function buildPrompt(ticker: string, config: AssetConfig, data: MarketData): string {
  const now     = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
  const dec     = config.decimals ?? 2
  const fmtNum  = (n: number) => n.toFixed(dec)
  const context = CATEGORY_CONTEXT[config.category] ?? ''

  let dataStr = ''
  if (data.price !== null)    dataStr += `\n• Prix actuel : ${fmtNum(data.price)}`
  if (data.change24h !== null) dataStr += `\n• Variation 24h : ${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%`
  if (data.high)              dataStr += `\n• Plus haut 24h : ${fmtNum(data.high)}`
  if (data.low)               dataStr += `\n• Plus bas 24h : ${fmtNum(data.low)}`

  return `Tu es un trader quantitatif institutionnel senior. Analyse ${config.name} (${ticker}) — ${context}

Date/heure : ${now}
${dataStr ? `\nDonnées marché :${dataStr}` : ''}

Analyse COMPLÈTE : tendance multi-timeframe (15m/1h/4h/Daily), EMA 20/50/200, RSI, MACD, Bollinger, ATR, volumes, structure de marché (HH/LL/HL/LH), supports/résistances clés, momentum, sentiment, flux institutionnels, catalyseurs macro récents.

RÈGLE ABSOLUE : Tu dois donner ACHAT ou VENTE. Pas d'attente, pas de neutre. En cas d'incertitude, choisis la direction à probabilité statistique la plus haute selon les 9 facteurs ci-dessus.

Réponds UNIQUEMENT avec ce JSON valide, sans texte autour :
{
  "direction": "ACHAT",
  "confidence": 74,
  "entry": "${data.price ? fmtNum(data.price) : 'XX.XX'}",
  "sl": "XX.XX",
  "tp1": "XX.XX",
  "tp2": "XX.XX",
  "tp3": "XX.XX",
  "rr": "2.4",
  "duration": "24-48h",
  "points": [
    "Point technique court et précis 1",
    "Point technique court et précis 2",
    "Point technique court et précis 3",
    "Point technique court et précis 4"
  ],
  "conclusion": "Phrase de conclusion directe et exploitable",
  "risks": "Principaux risques et niveaux d'invalidation"
}

Règles JSON :
- "direction" : "ACHAT" ou "VENTE" uniquement
- "confidence" : entier entre 52 et 94
- "entry"/"sl"/"tp1"/"tp2"/"tp3" : valeurs numériques cohérentes avec le prix actuel, précision ${dec} décimales
- "rr" : ratio risque/rendement TP2 au format "X.X"
- "duration" : "1-4h" | "4-12h" | "24-48h" | "2-5 jours" | "1-2 semaines"`
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { asset: ticker } = await req.json() as { asset: string }
    const config = ASSETS[ticker?.toUpperCase()]
    if (!config) return NextResponse.json({ error: 'Actif non reconnu' }, { status: 400 })

    const anthropic = requireAnthropic()
    const data      = await getMarketData(ticker, config)
    const prompt    = buildPrompt(ticker, config, data)

    const msg = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system:     'Tu es un analyste quantitatif expert. Réponds UNIQUEMENT en JSON valide, sans markdown ni texte supplémentaire.',
      messages:   [{ role: 'user', content: prompt }],
    })

    const raw       = (msg.content[0] as { type: string; text: string }).text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Réponse IA invalide')

    const r = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      direction:  r.direction  === 'VENTE' ? 'VENTE' : 'ACHAT',
      confidence: Math.min(94, Math.max(52, Number(r.confidence) || 70)),
      entry:      r.entry     ?? '',
      sl:         r.sl        ?? '',
      tp1:        r.tp1       ?? '',
      tp2:        r.tp2       ?? '',
      tp3:        r.tp3       ?? '',
      rr:         r.rr        ?? '',
      duration:   r.duration  ?? '',
      points:     Array.isArray(r.points) ? r.points.slice(0, 4) : [],
      conclusion: r.conclusion ?? '',
      risks:      r.risks      ?? '',
      price:      data.price,
      change24h:  data.change24h,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
