import { requireAnthropic } from '@/lib/anthropic/client'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 55

// ─── Types ────────────────────────────────────────────────────────────────────

interface Kline { open: number; high: number; low: number; close: number; volume: number }

interface AssetConfig {
  name: string
  category: 'crypto' | 'forex' | 'metals' | 'indices' | 'commodities' | 'stocks'
  kraken?: string        // Kraken pair for price + OHLCV (primary for crypto)
  coingecko?: string     // CoinGecko ID (price + OHLCV fallback)
  forex?: { base: string; quote: string }
  stooq?: string
  decimals?: number
}

// ─── Asset config ─────────────────────────────────────────────────────────────

const ASSETS: Record<string, AssetConfig> = {
  // Crypto — Kraken (primary) + CoinGecko ID (fallback)
  BTC:    { name: 'Bitcoin',           category: 'crypto', kraken: 'XBTUSD',    coingecko: 'bitcoin',              decimals: 0 },
  ETH:    { name: 'Ethereum',          category: 'crypto', kraken: 'ETHUSD',    coingecko: 'ethereum',             decimals: 2 },
  SOL:    { name: 'Solana',            category: 'crypto', kraken: 'SOLUSD',    coingecko: 'solana',               decimals: 2 },
  XRP:    { name: 'XRP',               category: 'crypto', kraken: 'XRPUSD',    coingecko: 'ripple',               decimals: 4 },
  BNB:    { name: 'BNB',               category: 'crypto', kraken: 'BNBUSD',    coingecko: 'binancecoin',          decimals: 1 },
  ADA:    { name: 'Cardano',           category: 'crypto', kraken: 'ADAUSD',    coingecko: 'cardano',              decimals: 4 },
  DOGE:   { name: 'Dogecoin',          category: 'crypto', kraken: 'DOGEUSD',   coingecko: 'dogecoin',             decimals: 5 },
  AVAX:   { name: 'Avalanche',         category: 'crypto', kraken: 'AVAXUSD',   coingecko: 'avalanche-2',          decimals: 2 },
  LINK:   { name: 'Chainlink',         category: 'crypto', kraken: 'LINKUSD',   coingecko: 'chainlink',            decimals: 3 },
  SUI:    { name: 'Sui',               category: 'crypto', kraken: 'SUIUSD',    coingecko: 'sui',                  decimals: 4 },
  TON:    { name: 'Toncoin',           category: 'crypto', kraken: 'TONUSD',    coingecko: 'the-open-network',     decimals: 4 },
  TRX:    { name: 'TRON',              category: 'crypto', kraken: 'TRXUSD',    coingecko: 'tron',                 decimals: 5 },
  DOT:    { name: 'Polkadot',          category: 'crypto', kraken: 'DOTUSD',    coingecko: 'polkadot',             decimals: 3 },
  LTC:    { name: 'Litecoin',          category: 'crypto', kraken: 'LTCUSD',    coingecko: 'litecoin',             decimals: 2 },
  SHIB:   { name: 'Shiba Inu',         category: 'crypto', kraken: 'SHIBUSDT',  coingecko: 'shiba-inu',            decimals: 8 },
  APT:    { name: 'Aptos',             category: 'crypto', kraken: 'APTUSD',    coingecko: 'aptos',                decimals: 3 },
  NEAR:   { name: 'Near Protocol',     category: 'crypto', kraken: 'NEARUSD',   coingecko: 'near',                 decimals: 3 },
  ARB:    { name: 'Arbitrum',          category: 'crypto', kraken: 'ARBUSD',    coingecko: 'arbitrum',             decimals: 4 },
  OP:     { name: 'Optimism',          category: 'crypto', kraken: 'OPUSD',     coingecko: 'optimism',             decimals: 4 },
  RNDR:   { name: 'Render',            category: 'crypto', kraken: 'RENDERUSD', coingecko: 'render-token',         decimals: 3 },
  INJ:    { name: 'Injective',         category: 'crypto', kraken: 'INJUSD',    coingecko: 'injective-protocol',   decimals: 3 },
  PEPE:   { name: 'Pepe',              category: 'crypto', kraken: 'PEPEUSD',   coingecko: 'pepe',                 decimals: 8 },
  BONK:   { name: 'Bonk',              category: 'crypto', kraken: 'BONKUSD',   coingecko: 'bonk',                 decimals: 8 },
  HBAR:   { name: 'Hedera',            category: 'crypto', kraken: 'HBARUSD',   coingecko: 'hedera-hashgraph',     decimals: 5 },
  XLM:    { name: 'Stellar',           category: 'crypto', kraken: 'XLMUSD',    coingecko: 'stellar',              decimals: 5 },
  KAS:    { name: 'Kaspa',             category: 'crypto', kraken: 'KASUSD',    coingecko: 'kaspa',                decimals: 5 },
  ICP:    { name: 'Internet Computer', category: 'crypto', kraken: 'ICPUSD',    coingecko: 'internet-computer',    decimals: 2 },
  VET:    { name: 'VeChain',           category: 'crypto', kraken: 'VETUSD',    coingecko: 'vechain',              decimals: 5 },
  ALGO:   { name: 'Algorand',          category: 'crypto', kraken: 'ALGOUSD',   coingecko: 'algorand',             decimals: 4 },
  FIL:    { name: 'Filecoin',          category: 'crypto', kraken: 'FILUSD',    coingecko: 'filecoin',             decimals: 3 },
  ATOM:   { name: 'Cosmos',            category: 'crypto', kraken: 'ATOMUSD',   coingecko: 'cosmos',               decimals: 3 },
  UNI:    { name: 'Uniswap',           category: 'crypto', kraken: 'UNIUSD',    coingecko: 'uniswap',              decimals: 3 },
  AAVE:   { name: 'Aave',              category: 'crypto', kraken: 'AAVEUSD',   coingecko: 'aave',                 decimals: 2 },
  MKR:    { name: 'Maker',             category: 'crypto',                       coingecko: 'maker',                decimals: 0 },
  ETC:    { name: 'Ethereum Classic',  category: 'crypto', kraken: 'ETCUSD',    coingecko: 'ethereum-classic',     decimals: 2 },
  XMR:    { name: 'Monero',            category: 'crypto', kraken: 'XMRUSD',    coingecko: 'monero',               decimals: 2 },
  SEI:    { name: 'Sei',               category: 'crypto', kraken: 'SEIUSD',    coingecko: 'sei-network',          decimals: 4 },
  TIA:    { name: 'Celestia',          category: 'crypto', kraken: 'TIAUSD',    coingecko: 'celestia',             decimals: 3 },
  WLD:    { name: 'Worldcoin',         category: 'crypto', kraken: 'WLDUSD',    coingecko: 'worldcoin-wld',        decimals: 3 },
  ONDO:   { name: 'Ondo',              category: 'crypto', kraken: 'ONDOUSD',   coingecko: 'ondo-finance',         decimals: 4 },
  PENDLE: { name: 'Pendle',            category: 'crypto', kraken: 'PENDLEUSD', coingecko: 'pendle',               decimals: 3 },

  // Forex
  EURUSD: { name: 'EUR/USD', category: 'forex', forex: { base: 'EUR', quote: 'USD' }, stooq: 'eurusd',  decimals: 5 },
  GBPUSD: { name: 'GBP/USD', category: 'forex', forex: { base: 'GBP', quote: 'USD' }, stooq: 'gbpusd',  decimals: 5 },
  USDJPY: { name: 'USD/JPY', category: 'forex', forex: { base: 'USD', quote: 'JPY' }, stooq: 'usdjpy',  decimals: 3 },
  USDCHF: { name: 'USD/CHF', category: 'forex', forex: { base: 'USD', quote: 'CHF' }, stooq: 'usdchf',  decimals: 5 },
  AUDUSD: { name: 'AUD/USD', category: 'forex', forex: { base: 'AUD', quote: 'USD' }, stooq: 'audusd',  decimals: 5 },
  NZDUSD: { name: 'NZD/USD', category: 'forex', forex: { base: 'NZD', quote: 'USD' }, stooq: 'nzdusd',  decimals: 5 },
  USDCAD: { name: 'USD/CAD', category: 'forex', forex: { base: 'USD', quote: 'CAD' }, stooq: 'usdcad',  decimals: 5 },
  EURGBP: { name: 'EUR/GBP', category: 'forex', forex: { base: 'EUR', quote: 'GBP' }, stooq: 'eurgbp',  decimals: 5 },
  EURJPY: { name: 'EUR/JPY', category: 'forex', forex: { base: 'EUR', quote: 'JPY' }, stooq: 'eurjpy',  decimals: 3 },
  GBPJPY: { name: 'GBP/JPY', category: 'forex', forex: { base: 'GBP', quote: 'JPY' }, stooq: 'gbpjpy',  decimals: 3 },

  // Metals
  GOLD:   { name: 'Or (XAU/USD)',       category: 'metals',      stooq: 'xauusd',  decimals: 2 },
  SILVER: { name: 'Argent (XAG/USD)',   category: 'metals',      stooq: 'xagusd',  decimals: 3 },
  PLAT:   { name: 'Platine (XPT/USD)',  category: 'metals',      stooq: 'xptusd',  decimals: 2 },
  PALL:   { name: 'Palladium',          category: 'metals',      stooq: 'xpdusd',  decimals: 2 },

  // Indices
  NASDAQ: { name: 'NASDAQ 100',  category: 'indices', stooq: '^ndx',   decimals: 0 },
  SPX:    { name: 'S&P 500',     category: 'indices', stooq: '^spx',   decimals: 0 },
  DJI:    { name: 'Dow Jones',   category: 'indices', stooq: '^dji',   decimals: 0 },
  DAX:    { name: 'DAX 40',      category: 'indices', stooq: '^daxi',  decimals: 0 },
  CAC:    { name: 'CAC 40',      category: 'indices', stooq: '^cac',   decimals: 0 },
  FTSE:   { name: 'FTSE 100',    category: 'indices', stooq: '^ftse',  decimals: 0 },
  NKY:    { name: 'Nikkei 225',  category: 'indices', stooq: '^nkx',   decimals: 0 },
  HSI:    { name: 'Hang Seng',   category: 'indices', stooq: '^hsi',   decimals: 0 },

  // Commodities
  BRENT:  { name: 'Pétrole Brent', category: 'commodities', stooq: 'brent.f', decimals: 2 },
  WTI:    { name: 'WTI Pétrole',   category: 'commodities', stooq: 'cl.f',    decimals: 2 },
  NATGAS: { name: 'Gaz Naturel',   category: 'commodities', stooq: 'ng.f',    decimals: 3 },
  COPPER: { name: 'Cuivre',        category: 'commodities', stooq: 'hg.f',    decimals: 3 },
  WHEAT:  { name: 'Blé',           category: 'commodities', stooq: 'w.f',     decimals: 2 },
  CORN:   { name: 'Maïs',          category: 'commodities', stooq: 'c.f',     decimals: 2 },
  COFFEE: { name: 'Café',          category: 'commodities', stooq: 'kc.f',    decimals: 2 },
  COCOA:  { name: 'Cacao',         category: 'commodities', stooq: 'cc.f',    decimals: 0 },

  // Stocks
  AAPL:   { name: 'Apple',          category: 'stocks', stooq: 'aapl.us',  decimals: 2 },
  MSFT:   { name: 'Microsoft',      category: 'stocks', stooq: 'msft.us',  decimals: 2 },
  NVDA:   { name: 'NVIDIA',         category: 'stocks', stooq: 'nvda.us',  decimals: 2 },
  AMZN:   { name: 'Amazon',         category: 'stocks', stooq: 'amzn.us',  decimals: 2 },
  META:   { name: 'Meta Platforms', category: 'stocks', stooq: 'meta.us',  decimals: 2 },
  TSLA:   { name: 'Tesla',          category: 'stocks', stooq: 'tsla.us',  decimals: 2 },
  GOOGL:  { name: 'Alphabet',       category: 'stocks', stooq: 'googl.us', decimals: 2 },
  NFLX:   { name: 'Netflix',        category: 'stocks', stooq: 'nflx.us',  decimals: 2 },
}

// ─── Technical indicators ──────────────────────────────────────────────────────

function calcRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null
  let gains = 0, losses = 0
  for (let i = closes.length - period; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    if (d > 0) gains += d; else losses -= d
  }
  const ag = gains / period, al = losses / period
  if (al === 0) return 100
  return Math.round((100 - 100 / (1 + ag / al)) * 10) / 10
}

function emaArr(data: number[], period: number): number[] {
  if (data.length < period) return []
  const k = 2 / (period + 1)
  let val = data.slice(0, period).reduce((a, b) => a + b) / period
  const res = [val]
  for (let i = period; i < data.length; i++) { val = data[i] * k + val * (1 - k); res.push(val) }
  return res
}

function calcEMA(data: number[], period: number): number | null {
  const arr = emaArr(data, period)
  return arr.length ? arr[arr.length - 1] : null
}

function calcMACD(closes: number[]): { value: number; signal: number; histogram: number } | null {
  if (closes.length < 35) return null
  const e12 = emaArr(closes, 12), e26 = emaArr(closes, 26)
  if (!e12.length || !e26.length) return null
  const off = e12.length - e26.length
  const macdLine = e26.map((v, i) => e12[i + off] - v)
  const sig = emaArr(macdLine, 9)
  if (!sig.length) return null
  const m = macdLine[macdLine.length - 1], s = sig[sig.length - 1]
  const r4 = (n: number) => Math.round(n * 10000) / 10000
  return { value: r4(m), signal: r4(s), histogram: r4(m - s) }
}

function calcATR(highs: number[], lows: number[], closes: number[], period = 14): number | null {
  if (highs.length < period + 1) return null
  const trs: number[] = []
  for (let i = 1; i < highs.length; i++) {
    trs.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])))
  }
  return trs.slice(-period).reduce((a, b) => a + b) / period
}

function calcVWAP(highs: number[], lows: number[], closes: number[], volumes: number[]): number | null {
  const n = Math.min(highs.length, 20)
  if (n < 3) return null
  let sumTPV = 0, sumV = 0
  for (let i = highs.length - n; i < highs.length; i++) {
    const tp = (highs[i] + lows[i] + closes[i]) / 3
    sumTPV += tp * volumes[i]; sumV += volumes[i]
  }
  return sumV > 0 ? sumTPV / sumV : null
}

function findSR(highs: number[], lows: number[], current: number) {
  const rH = highs.slice(-50), rL = lows.slice(-50)
  const pH: number[] = [], pL: number[] = []
  for (let i = 2; i < rH.length - 2; i++) {
    if (rH[i] > rH[i-1] && rH[i] > rH[i-2] && rH[i] > rH[i+1] && rH[i] > rH[i+2]) pH.push(rH[i])
    if (rL[i] < rL[i-1] && rL[i] < rL[i-2] && rL[i] < rL[i+1] && rL[i] < rL[i+2]) pL.push(rL[i])
  }
  const sup = pL.filter(p => p < current).sort((a, b) => b - a)
  const res = pH.filter(p => p > current).sort((a, b) => a - b)
  return {
    s1: sup[0] ?? Math.min(...rL.slice(-20)),
    s2: sup[1] ?? null,
    r1: res[0] ?? Math.max(...rH.slice(-20)),
    r2: res[1] ?? null,
  }
}

// ─── Fetch helpers ─────────────────────────────────────────────────────────────

async function get(url: string, ms = 8000): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(ms), cache: 'no-store' })
}

// Kraken ticker — returns price, change24h (day open → now), volume, high, low
async function getKrakenTicker(pair: string): Promise<{ price: number; change24h: number; volume: number; high24h: number; low24h: number } | null> {
  try {
    const r = await get(`https://api.kraken.com/0/public/Ticker?pair=${pair}`)
    if (!r.ok) return null
    const d = await r.json()
    const key = Object.keys(d.result ?? {}).find(k => k !== 'last')
    if (!key) return null
    const t = d.result[key]
    const price = parseFloat(t.c[0])
    const open  = parseFloat(t.o)
    return {
      price,
      change24h: open ? Math.round((price - open) / open * 10000) / 100 : 0,
      volume:    parseFloat(t.v[1]),
      high24h:   parseFloat(t.h[1]),
      low24h:    parseFloat(t.l[1]),
    }
  } catch { return null }
}

// Kraken OHLCV — interval in minutes (60=1H, 240=4H, 1440=1D)
async function getKrakenOHLCV(pair: string, interval: number): Promise<Kline[]> {
  try {
    const r = await get(`https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${interval}`)
    if (!r.ok) return []
    const d = await r.json()
    const key = Object.keys(d.result ?? {}).find(k => k !== 'last')
    if (!key) return []
    const raw: [number, string, string, string, string, string, string, number][] = d.result[key]
    return raw.map(c => ({ open: +c[1], high: +c[2], low: +c[3], close: +c[4], volume: +c[6] }))
  } catch { return [] }
}

// CoinGecko simple price (price + 24h change)
async function getCGPrice(id: string): Promise<{ price: number; change24h: number; volume: number } | null> {
  try {
    const r = await get(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`)
    if (!r.ok) return null
    const d = await r.json()
    const c = d[id]
    if (!c?.usd) return null
    return { price: c.usd, change24h: Math.round(c.usd_24h_change * 100) / 100, volume: c.usd_24h_vol ?? 0 }
  } catch { return null }
}

// CoinGecko daily OHLCV — closes only (no high/low from this endpoint)
async function getCGCloses(id: string): Promise<number[]> {
  try {
    const r = await get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=365&interval=daily`)
    if (!r.ok) return []
    const d = await r.json()
    const prices: [number, number][] = d.prices ?? []
    return prices.map(p => p[1])
  } catch { return [] }
}

// CoinGecko global market data
async function getCGGlobal(): Promise<{ btcDom: number; totalMcap: number } | null> {
  try {
    const r = await get('https://api.coingecko.com/api/v3/global')
    if (!r.ok) return null
    const d = await r.json()
    return { btcDom: Math.round(d.data.market_cap_percentage.btc * 10) / 10, totalMcap: d.data.total_market_cap.usd }
  } catch { return null }
}

// Fear & Greed index
async function getFearGreed(): Promise<{ value: number; label: string } | null> {
  try {
    const r = await get('https://api.alternative.me/fng/?limit=1')
    if (!r.ok) return null
    const d = await r.json()
    return { value: +d.data[0].value, label: d.data[0].value_classification }
  } catch { return null }
}

// Stooq current price
async function getStooqPrice(symbol: string): Promise<{ price: number; change24h: number } | null> {
  try {
    const r = await get(`https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcvn&h&e=csv`)
    if (!r.ok) return null
    const lines = (await r.text()).trim().split('\n')
    if (lines.length < 2) return null
    const cols = lines[1].split(',')
    const open = +cols[3], close = +cols[6] || +cols[5]
    if (!close || isNaN(close)) return null
    return { price: close, change24h: open ? Math.round((close - open) / open * 10000) / 100 : 0 }
  } catch { return null }
}

// Forex rate
async function getForexRate(base: string, quote: string): Promise<number | null> {
  try {
    const r = await get(`https://open.er-api.com/v6/latest/${base}`)
    if (!r.ok) return null
    const d = await r.json()
    return d.rates?.[quote] ?? null
  } catch { return null }
}

// ─── Prompt ────────────────────────────────────────────────────────────────────

function nd(v: number | null, dec: number): string {
  if (v === null || isNaN(v)) return 'N/D'
  return v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function buildPrompt(
  ticker: string, cfg: AssetConfig, price: number,
  info: {
    change24h: number | null; volume24h: number | null
    high24h: number | null; low24h: number | null; change7d: number | null
    rsi1h: number | null; rsi4h: number | null; rsi1d: number | null
    macd1d: { value: number; signal: number; histogram: number } | null
    ema20: number | null; ema50: number | null; ema200: number | null
    atr: number | null; vwap: number | null
    s1: number | null; s2: number | null; r1: number | null; r2: number | null
    btcDom: number | null; totalMcap: number | null
    fearGreed: { value: number; label: string } | null
    hasFullOHLCV: boolean
  }
): string {
  const dec = cfg.decimals ?? 2
  const pct = (v: number | null) => v !== null ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` : 'N/D'
  const rsiLabel = (v: number | null) => v === null ? 'N/D' : `${v}${v > 70 ? ' ⚠️suracheté' : v < 30 ? ' ⚠️survendu' : ''}`
  const emaPos = (ema: number | null) => ema ? ` → prix ${price > ema ? 'AU-DESSUS' : 'EN-DESSOUS'}` : ''
  const macdStr = info.macd1d
    ? `valeur=${info.macd1d.value}, signal=${info.macd1d.signal}, histogramme=${info.macd1d.histogram} → ${info.macd1d.histogram > 0 ? 'HAUSSIER' : 'BAISSIER'}`
    : 'N/D'

  return `Tu es un analyste financier professionnel.

RÈGLES ABSOLUES :
1. N'invente AUCUNE donnée. Chaque valeur "N/D" ne doit PAS être utilisée dans tes arguments.
2. Chaque argument DOIT citer un chiffre exact des données ci-dessous.
3. Tous les prix (entry_low, entry_high, sl, tp1, tp2, tp3) DOIVENT être cohérents avec le prix actuel.
4. Si des indicateurs se contredisent, signale-le dans "contradictions".

=== ACTIF : ${cfg.name} (${ticker}) | Catégorie : ${cfg.category} ===
Prix actuel     : ${nd(price, dec)}
Variation 24h   : ${pct(info.change24h)}
Variation 7j    : ${pct(info.change7d)}
Volume 24h      : ${info.volume24h ? '$' + (info.volume24h / 1e6).toFixed(0) + 'M' : 'N/D'}
High 24h        : ${nd(info.high24h, dec)}
Low 24h         : ${nd(info.low24h, dec)}
${cfg.category === 'crypto' ? `
=== MARCHÉ CRYPTO GLOBAL ===
Dominance BTC   : ${info.btcDom !== null ? info.btcDom + '%' : 'N/D'}
Cap totale      : ${info.totalMcap ? '$' + (info.totalMcap / 1e12).toFixed(2) + 'T' : 'N/D'}
Fear & Greed    : ${info.fearGreed ? info.fearGreed.value + '/100 — ' + info.fearGreed.label : 'N/D'}` : ''}

=== INDICATEURS TECHNIQUES (calculés sur données OHLCV réelles${!info.hasFullOHLCV ? ' — closes uniquement, ATR/VWAP/S&R non disponibles' : ''}) ===
RSI 1H          : ${rsiLabel(info.rsi1h)}
RSI 4H          : ${rsiLabel(info.rsi4h)}
RSI 1D          : ${rsiLabel(info.rsi1d)}
MACD 1D         : ${macdStr}
EMA 20 (1D)     : ${nd(info.ema20, dec)}${emaPos(info.ema20)}
EMA 50 (1D)     : ${nd(info.ema50, dec)}${emaPos(info.ema50)}
EMA 200 (1D)    : ${nd(info.ema200, dec)}${emaPos(info.ema200)}
ATR 14 (1D)     : ${nd(info.atr, dec)}
VWAP 20j        : ${nd(info.vwap, dec)}${info.vwap ? ` → prix ${price > info.vwap ? 'AU-DESSUS' : 'EN-DESSOUS'}` : ''}

=== NIVEAUX CLÉS ===
Résistance 2    : ${nd(info.r2, dec)}
Résistance 1    : ${nd(info.r1, dec)}
▶ Prix actuel   : ${nd(price, dec)}
Support 1       : ${nd(info.s1, dec)}
Support 2       : ${nd(info.s2, dec)}

Réponds UNIQUEMENT avec ce JSON valide (sans markdown) :
{
  "trend": "HAUSSIÈRE" ou "BAISSIÈRE" ou "NEUTRE",
  "confidence": <entier 50-90>,
  "arguments": [
    "<cite exactement un chiffre réel ci-dessus>",
    "<cite exactement un chiffre réel ci-dessus>",
    "<cite exactement un chiffre réel ci-dessus>",
    "<cite exactement un chiffre réel ci-dessus>"
  ],
  "bullish_scenario": "<scénario haussier avec prix cohérents avec ${nd(price, dec)}>",
  "bearish_scenario": "<scénario baissier avec prix cohérents avec ${nd(price, dec)}>",
  "entry_low": "<prix bas d'entrée>",
  "entry_high": "<prix haut d'entrée>",
  "sl": "<stop loss basé sur supports réels ou ATR>",
  "tp1": "<take profit 1>",
  "tp2": "<take profit 2>",
  "tp3": "<take profit 3>",
  "rr": "<ratio R/R format '1:2.3'>",
  "duration": "<'1-4h' | '4-12h' | '24-48h' | '2-5 jours' | '1-2 semaines'>",
  "contradictions": "<si indicateurs divergent entre timeframes, sinon null>"
}`
}

// ─── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { asset: ticker } = (await req.json()) as { asset: string }
    const cfg = ASSETS[ticker?.toUpperCase()]
    if (!cfg) return NextResponse.json({ error: 'Actif non reconnu' }, { status: 400 })

    const anthropic = requireAnthropic()

    // ── Fetch price + OHLCV in parallel ─────────────────────────────────────
    let price: number | null = null
    let change24h: number | null = null
    let volume24h: number | null = null
    let high24h: number | null = null
    let low24h: number | null = null
    let k1h: Kline[] = [], k4h: Kline[] = [], k1d: Kline[] = []
    let cgCloses: number[] = []
    let btcDom: number | null = null, totalMcap: number | null = null
    let fearGreed: { value: number; label: string } | null = null

    if (cfg.kraken || cfg.coingecko) {
      // Crypto branch
      const fetches: Promise<unknown>[] = [
        getCGGlobal(),
        getFearGreed(),
      ]

      if (cfg.kraken) {
        fetches.push(
          getKrakenTicker(cfg.kraken),
          getKrakenOHLCV(cfg.kraken, 60),   // 1H
          getKrakenOHLCV(cfg.kraken, 240),  // 4H
          getKrakenOHLCV(cfg.kraken, 1440), // 1D
        )
      }
      if (cfg.coingecko) {
        fetches.push(
          getCGPrice(cfg.coingecko),
          getCGCloses(cfg.coingecko),
        )
      }

      const results = await Promise.allSettled(fetches)
      let idx = 0
      const val = <T>(i: number): T | null => results[i]?.status === 'fulfilled' ? results[i].value as T : null

      const global = val<{ btcDom: number; totalMcap: number }>(idx++)
      const fg     = val<{ value: number; label: string }>(idx++)
      btcDom = global?.btcDom ?? null; totalMcap = global?.totalMcap ?? null; fearGreed = fg

      if (cfg.kraken) {
        const kTicker = val<{ price: number; change24h: number; volume: number; high24h: number; low24h: number }>(idx++)
        k1h = (val<Kline[]>(idx++) ?? [])
        k4h = (val<Kline[]>(idx++) ?? [])
        k1d = (val<Kline[]>(idx++) ?? [])
        if (kTicker) {
          price = kTicker.price; change24h = kTicker.change24h
          volume24h = kTicker.volume; high24h = kTicker.high24h; low24h = kTicker.low24h
        }
      }

      if (cfg.coingecko) {
        const cgP = val<{ price: number; change24h: number; volume: number }>(idx++)
        cgCloses = val<number[]>(idx++) ?? []
        if (!price && cgP) {
          price = cgP.price; change24h = cgP.change24h; volume24h = cgP.volume
        }
        if (!price && cgP) price = cgP.price
      }

    } else if (cfg.forex) {
      const [rRate, rStooq] = await Promise.allSettled([
        getForexRate(cfg.forex.base, cfg.forex.quote),
        cfg.stooq ? getStooqPrice(cfg.stooq) : Promise.resolve(null),
      ])
      price = (rRate.status === 'fulfilled' ? rRate.value : null)
      const stooqFallback = rStooq.status === 'fulfilled' ? rStooq.value : null
      if (!price && stooqFallback) { price = stooqFallback.price; change24h = stooqFallback.change24h }
      if (price && stooqFallback?.change24h !== undefined) change24h = stooqFallback.change24h

    } else if (cfg.stooq) {
      const r = await getStooqPrice(cfg.stooq)
      if (r) { price = r.price; change24h = r.change24h }
    }

    if (!price) return NextResponse.json({ error: 'Prix indisponible pour cet actif, réessayez dans quelques secondes.' }, { status: 503 })

    // ── Calculate indicators ─────────────────────────────────────────────────
    // Use Kraken OHLCV if available (full OHLCV), else CoinGecko closes only
    const hasFullOHLCV = k1d.length > 0
    const c1h = k1h.map(k => k.close)
    const c4h = k4h.map(k => k.close)
    const c1d = hasFullOHLCV ? k1d.map(k => k.close) : cgCloses
    const h1d = k1d.map(k => k.high)
    const l1d = k1d.map(k => k.low)
    const v1d = k1d.map(k => k.volume)

    const rsi1h  = calcRSI(c1h)
    const rsi4h  = calcRSI(c4h)
    const rsi1d  = calcRSI(c1d)
    const macd1d = calcMACD(c1d)
    const ema20  = calcEMA(c1d, 20)
    const ema50  = calcEMA(c1d, 50)
    const ema200 = calcEMA(c1d, 200)
    const atr    = hasFullOHLCV ? calcATR(h1d, l1d, c1d) : null
    const vwap   = hasFullOHLCV ? calcVWAP(h1d, l1d, c1d, v1d) : null
    const sr     = hasFullOHLCV && c1d.length >= 10 ? findSR(h1d, l1d, price) : { s1: null, s2: null, r1: null, r2: null }

    const change7d = c1d.length >= 8
      ? Math.round((c1d[c1d.length - 1] - c1d[c1d.length - 8]) / c1d[c1d.length - 8] * 10000) / 100
      : null

    const pts = [rsi1d, macd1d, ema50, ema200, atr, volume24h, change24h].filter(v => v !== null).length
    const dataQuality: 'haute' | 'moyenne' | 'faible' = pts >= 5 ? 'haute' : pts >= 3 ? 'moyenne' : 'faible'

    // ── Call Claude with real data ────────────────────────────────────────────
    const prompt = buildPrompt(ticker, cfg, price, {
      change24h, volume24h, high24h, low24h, change7d,
      rsi1h, rsi4h, rsi1d, macd1d,
      ema20, ema50, ema200, atr, vwap,
      s1: sr.s1, s2: sr.s2, r1: sr.r1, r2: sr.r2,
      btcDom, totalMcap, fearGreed,
      hasFullOHLCV,
    })

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: 'Analyste financier. Réponds UNIQUEMENT en JSON valide, sans markdown.',
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (msg.content[0] as { type: string; text: string }).text.trim()
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Réponse IA invalide')
    const r = JSON.parse(match[0])

    const validTrends = ['HAUSSIÈRE', 'BAISSIÈRE', 'NEUTRE']
    return NextResponse.json({
      trend:            validTrends.includes(r.trend) ? r.trend : 'NEUTRE',
      confidence:       Math.min(90, Math.max(50, Number(r.confidence) || 65)),
      arguments:        Array.isArray(r.arguments) ? r.arguments.slice(0, 4) : [],
      bullish_scenario: r.bullish_scenario ?? '',
      bearish_scenario: r.bearish_scenario ?? '',
      entry_low:        r.entry_low ?? '',
      entry_high:       r.entry_high ?? '',
      sl:               r.sl ?? '',
      tp1:              r.tp1 ?? '',
      tp2:              r.tp2 ?? '',
      tp3:              r.tp3 ?? '',
      rr:               r.rr ?? '',
      duration:         r.duration ?? '',
      contradictions:   r.contradictions ?? null,
      price,
      change24h,
      volume24h,
      high24h,
      low24h,
      rsi1h, rsi4h, rsi1d,
      macd1d,
      ema20, ema50, ema200,
      ema20pos:  ema20  ? (price > ema20  ? 'dessus' : 'dessous') : null,
      ema50pos:  ema50  ? (price > ema50  ? 'dessus' : 'dessous') : null,
      ema200pos: ema200 ? (price > ema200 ? 'dessus' : 'dessous') : null,
      atr, vwap,
      s1: sr.s1, s2: sr.s2, r1: sr.r1, r2: sr.r2,
      oi: null, funding: null,
      btcDom, totalMcap, fearGreed,
      dataQuality,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
