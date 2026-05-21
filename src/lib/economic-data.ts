export interface MarketNewsItem {
  title: string
  source: string
  url: string
  publishedAt: string   // "20260515T143000" → parse in UI
  sentiment: string | null  // "Bullish" | "Somewhat-Bullish" | "Neutral" | "Somewhat-Bearish" | "Bearish"
  sentimentScore: number | null
}

export interface EconomicContext {
  news: MarketNewsItem[]
  source: string
}

// ─── Alpha Vantage ticker mapping ─────────────────────────────────────────────

function toAlphaVantageTicker(market: string): string {
  const m = market.toUpperCase().replace(/[\s\/\-]/g, '')

  // Crypto
  const cryptoMap: Record<string, string> = {
    'BTCUSD': 'CRYPTO:BTC', 'BTCUSDT': 'CRYPTO:BTC',
    'ETHUSD': 'CRYPTO:ETH', 'ETHUSDT': 'CRYPTO:ETH',
    'SOLUSD': 'CRYPTO:SOL', 'SOLUSDT': 'CRYPTO:SOL',
    'BNBUSD': 'CRYPTO:BNB', 'BNBUSDT': 'CRYPTO:BNB',
    'XRPUSD': 'CRYPTO:XRP', 'XRPUSDT': 'CRYPTO:XRP',
    'ADAUSD': 'CRYPTO:ADA', 'DOGEUSD': 'CRYPTO:DOGE',
    'LINKUSD': 'CRYPTO:LINK', 'AVAXUSD': 'CRYPTO:AVAX',
  }
  if (cryptoMap[m]) return cryptoMap[m]
  // Generic crypto prefix check
  const cryptoPrefixes = ['BTC','ETH','SOL','BNB','XRP','ADA','DOGE','LINK','AVAX','MATIC','DOT','UNI','LTC','TRX']
  for (const prefix of cryptoPrefixes) {
    if (m.startsWith(prefix)) return `CRYPTO:${prefix}`
  }

  // Gold / Silver
  if (m.startsWith('XAU') || m === 'GOLD') return 'FOREX:XAUUSD'
  if (m.startsWith('XAG') || m === 'SILVER') return 'FOREX:XAGUSD'

  // Oil → ETF proxy
  if (m === 'WTI' || m === 'USOIL' || m === 'OIL' || m === 'CL') return 'USO'

  // Indices → ETF proxies
  const indexEtf: Record<string, string> = {
    'NASDAQ': 'QQQ', 'NAS100': 'QQQ', 'NDX': 'QQQ', 'US100': 'QQQ',
    'SPX': 'SPY', 'SP500': 'SPY', 'SPX500': 'SPY', 'US500': 'SPY',
    'DOW': 'DIA', 'US30': 'DIA', 'DJI': 'DIA',
    'DAX': 'EWG', 'DAX40': 'EWG', 'GER40': 'EWG',
    'FTSE': 'EWU', 'UK100': 'EWU',
  }
  for (const [key, etf] of Object.entries(indexEtf)) {
    if (m === key) return etf
  }

  // Forex (6 chars)
  if (m.length === 6) {
    const validFx = new Set(['EUR','USD','GBP','JPY','CHF','CAD','AUD','NZD'])
    if (validFx.has(m.slice(0, 3)) && validFx.has(m.slice(3, 6))) {
      return `FOREX:${m}`
    }
  }

  return ''
}

function getAlphaVantageTopics(market: string): string {
  const m = market.toUpperCase()
  if (m.includes('BTC') || m.includes('ETH') || m.includes('CRYPTO') || m.includes('SOL')) return 'blockchain,cryptocurrency'
  if (m.includes('XAU') || m.includes('GOLD') || m.includes('XAG') || m.includes('OIL') || m.includes('WTI')) return 'financial_markets,economy_commodities'
  if (m.includes('NASDAQ') || m.includes('NAS') || m.includes('SPX') || m.includes('DOW')) return 'financial_markets,economy_macro'
  if (m.includes('USD') || m.includes('EUR') || m.includes('GBP') || m.includes('JPY')) return 'economy_monetary,economy_macro,financial_markets'
  return 'financial_markets,economy_macro'
}

// AV time format: YYYYMMDDTHHMM
function avTimeFrom(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const Y = d.getFullYear()
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  return `${Y}${M}${D}T0000`
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchEconomicContext(market: string): Promise<EconomicContext> {
  const empty: EconomicContext = { news: [], source: 'Alpha Vantage' }
  const key = process.env.ALPHA_VANTAGE_API_KEY
  if (!key || !market || market === 'Inconnu') return empty

  const ticker = toAlphaVantageTicker(market)
  const params = new URLSearchParams({
    function: 'NEWS_SENTIMENT',
    ...(ticker ? { tickers: ticker } : { topics: getAlphaVantageTopics(market) }),
    time_from: avTimeFrom(4),
    limit: '6',
    sort: 'LATEST',
    apikey: key,
  })

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 7000)
    const res = await fetch(`https://www.alphavantage.co/query?${params}`, {
      signal: ctrl.signal,
      cache: 'no-store',
    })
    clearTimeout(timer)

    if (!res.ok) return empty
    const data = await res.json()

    if (data.Information || data.Note || !Array.isArray(data.feed)) return empty

    const news: MarketNewsItem[] = data.feed.slice(0, 5).map((item: any) => ({
      title: item.title ?? '',
      source: item.source ?? '',
      url: item.url ?? '',
      publishedAt: item.time_published ?? '',
      sentiment: item.overall_sentiment_label ?? null,
      sentimentScore: parseFloat(item.overall_sentiment_score) || null,
    }))

    return { news, source: 'Alpha Vantage' }
  } catch {
    return empty
  }
}
