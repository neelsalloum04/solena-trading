export interface LivePrice {
  market: string
  price: number
  priceFormatted: string
  currency: string
  currencySymbol: string
  change: number
  changePercent: number
  isUp: boolean
  source: string
}

type AssetType = 'forex' | 'crypto' | 'commodity' | 'index'

interface AssetInfo {
  type: AssetType
  yahooSymbol: string
  binanceSymbol?: string
  twelveDataSymbol?: string
  base: string
  quote: string
  displayCurrency: string
}

// ─── Lookup tables ────────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CHF: 'Fr.', CAD: 'C$',
  AUD: 'A$', NZD: 'NZ$', SEK: 'kr', NOK: 'kr', DKK: 'kr',
  SGD: 'S$', HKD: 'HK$', CNY: '¥', MXN: 'MX$', ZAR: 'R',
}

const VALID_FOREX = new Set([
  'EUR','USD','GBP','JPY','CHF','CAD','AUD','NZD','SEK','NOK','DKK',
  'SGD','HKD','CNY','MXN','ZAR','TRY','PLN','CZK','HUF',
])

const CRYPTO_TICKERS: Record<string, string> = {
  BTC: 'BTCUSDT', ETH: 'ETHUSDT', SOL: 'SOLUSDT', BNB: 'BNBUSDT',
  XRP: 'XRPUSDT', ADA: 'ADAUSDT', DOT: 'DOTUSDT', LINK: 'LINKUSDT',
  AVAX: 'AVAXUSDT', MATIC: 'MATICUSDT', LTC: 'LTCUSDT', UNI: 'UNIUSDT',
  DOGE: 'DOGEUSDT', ATOM: 'ATOMUSDT', TRX: 'TRXUSDT', NEAR: 'NEARUSDT',
  ARB: 'ARBUSDT', OP: 'OPUSDT', INJ: 'INJUSDT', SUI: 'SUIUSDT',
}

const INDEX_YAHOO: Record<string, string> = {
  'NASDAQ': '^IXIC', 'NAS100': '^NDX', 'NDX': '^NDX', 'US100': '^NDX',
  'SPX': '^GSPC', 'SP500': '^GSPC', 'SPX500': '^GSPC', 'US500': '^GSPC',
  'DOW': '^DJI', 'DJI': '^DJI', 'US30': '^DJI', 'DJIA': '^DJI',
  'DAX': '^GDAXI', 'DAX40': '^GDAXI', 'GER40': '^GDAXI',
  'CAC': '^FCHI', 'CAC40': '^FCHI', 'FRA40': '^FCHI',
  'FTSE': '^FTSE', 'UK100': '^FTSE', 'FTSE100': '^FTSE',
  'NIKKEI': '^N225', 'JPN225': '^N225', 'NI225': '^N225',
  'HSI': '^HSI', 'HK50': '^HSI',
  'VIX': '^VIX', 'RUT': '^RUT', 'US2000': '^RUT',
}

// ─── Asset classifier ─────────────────────────────────────────────────────────

function classifyMarket(raw: string): AssetInfo | null {
  if (!raw || raw === 'Inconnu') return null
  const m = raw.toUpperCase().trim().replace(/[\s\/\-]/g, '')

  // Indices (Yahoo Finance is most reliable for these)
  for (const [key, yahoo] of Object.entries(INDEX_YAHOO)) {
    if (m === key.replace(/[\s\/\-]/g, '')) {
      return { type: 'index', yahooSymbol: yahoo, base: key, quote: 'USD', displayCurrency: 'USD' }
    }
  }

  // Gold
  if (m.startsWith('XAU') || m === 'GOLD' || m === 'GC')
    return { type: 'commodity', yahooSymbol: 'GC=F', twelveDataSymbol: 'XAU/USD', base: 'XAU', quote: 'USD', displayCurrency: 'USD' }

  // Silver
  if (m.startsWith('XAG') || m === 'SILVER')
    return { type: 'commodity', yahooSymbol: 'SI=F', twelveDataSymbol: 'XAG/USD', base: 'XAG', quote: 'USD', displayCurrency: 'USD' }

  // WTI Oil
  if (m === 'WTI' || m === 'USOIL' || m === 'OIL' || m === 'CL' || m === 'CRUDEOIL')
    return { type: 'commodity', yahooSymbol: 'CL=F', base: 'OIL', quote: 'USD', displayCurrency: 'USD' }

  // Brent
  if (m === 'BRENT' || m === 'UKOIL')
    return { type: 'commodity', yahooSymbol: 'BZ=F', base: 'BRENT', quote: 'USD', displayCurrency: 'USD' }

  // Crypto
  for (const [ticker, binance] of Object.entries(CRYPTO_TICKERS)) {
    if (m === ticker || m === ticker + 'USD' || m === ticker + 'USDT' || m === ticker + 'BUSD') {
      return {
        type: 'crypto',
        yahooSymbol: `${ticker}-USD`,
        binanceSymbol: binance,
        twelveDataSymbol: `${ticker}/USD`,
        base: ticker,
        quote: 'USD',
        displayCurrency: 'USD',
      }
    }
  }

  // Forex
  if (m.length === 6) {
    const base = m.slice(0, 3)
    const quote = m.slice(3, 6)
    if (VALID_FOREX.has(base) && VALID_FOREX.has(quote)) {
      return {
        type: 'forex',
        yahooSymbol: `${base}${quote}=X`,
        twelveDataSymbol: `${base}/${quote}`,
        base,
        quote,
        displayCurrency: quote,
      }
    }
  }

  return null
}

// ─── Price formatting ─────────────────────────────────────────────────────────

function formatPrice(price: number, asset: AssetInfo): string {
  if (asset.type === 'index' || price > 10000)
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (asset.base === 'JPY' || price > 100)
    return price.toFixed(2)
  if (asset.type === 'crypto' && price > 1)
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (asset.type === 'crypto')
    return price.toFixed(6)
  return price.toFixed(5)
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, ms = 6000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    })
  } finally {
    clearTimeout(timer)
  }
}

async function twelveDataQuote(symbol: string): Promise<{ price: number; prevClose: number } | null> {
  const key = process.env.TWELVE_DATA_API_KEY
  if (!key) return null
  try {
    const res = await fetchWithTimeout(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${key}`
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data.code || data.status === 'error' || !data.close) return null
    const price = parseFloat(data.close)
    const prevClose = parseFloat(data.previous_close)
    if (isNaN(price)) return null
    return { price, prevClose }
  } catch { return null }
}

async function binanceQuote(symbol: string): Promise<{ price: number; prevClose: number } | null> {
  try {
    const res = await fetchWithTimeout(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
    if (!res.ok) return null
    const data = await res.json()
    const price = parseFloat(data.lastPrice)
    const prevClose = parseFloat(data.prevClosePrice)
    if (isNaN(price)) return null
    return { price, prevClose }
  } catch { return null }
}

const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  XRP: 'ripple', ADA: 'cardano', DOT: 'polkadot', LINK: 'chainlink',
  AVAX: 'avalanche-2', MATIC: 'matic-network', LTC: 'litecoin', UNI: 'uniswap',
  DOGE: 'dogecoin', ATOM: 'cosmos', TRX: 'tron', NEAR: 'near',
  ARB: 'arbitrum', OP: 'optimism', INJ: 'injective-protocol', SUI: 'sui',
}

async function coinGeckoQuote(ticker: string): Promise<{ price: number; prevClose: number } | null> {
  const id = COINGECKO_IDS[ticker.toUpperCase()]
  if (!id) return null
  try {
    const res = await fetchWithTimeout(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=false`
    )
    if (!res.ok) return null
    const data = await res.json()
    const coin = data[id]
    if (!coin?.usd) return null
    const price = coin.usd
    const change24h = coin.usd_24h_change ?? 0
    const prevClose = price / (1 + change24h / 100)
    return { price, prevClose }
  } catch { return null }
}

async function yahooQuote(symbol: string): Promise<{ price: number; prevClose: number } | null> {
  try {
    const res = await fetchWithTimeout(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`
    )
    if (!res.ok) return null
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta) return null
    const price = meta.regularMarketPrice ?? meta.price
    const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price
    if (!price) return null
    return { price, prevClose }
  } catch { return null }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchLivePrice(market: string): Promise<LivePrice | null> {
  const asset = classifyMarket(market)
  if (!asset) return null

  let raw: { price: number; prevClose: number } | null = null
  let source = ''

  if (asset.type === 'crypto') {
    // CoinGecko first (works on Vercel/server), Binance second, Twelve Data third, Yahoo fallback
    raw = await coinGeckoQuote(asset.base); source = 'CoinGecko'
    if (!raw && asset.binanceSymbol) { raw = await binanceQuote(asset.binanceSymbol); source = 'Binance' }
    if (!raw && asset.twelveDataSymbol) { raw = await twelveDataQuote(asset.twelveDataSymbol); source = 'Twelve Data' }
    if (!raw) { raw = await yahooQuote(asset.yahooSymbol); source = 'Yahoo Finance' }
  } else if (asset.type === 'index') {
    // Yahoo Finance most reliable for indices
    raw = await yahooQuote(asset.yahooSymbol); source = 'Yahoo Finance'
  } else {
    // Forex / commodities: Twelve Data first, Yahoo fallback
    if (asset.twelveDataSymbol) { raw = await twelveDataQuote(asset.twelveDataSymbol); source = 'Twelve Data' }
    if (!raw) { raw = await yahooQuote(asset.yahooSymbol); source = 'Yahoo Finance' }
  }

  if (!raw) return null

  const { price, prevClose } = raw
  const change = price - prevClose
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0

  return {
    market,
    price,
    priceFormatted: formatPrice(price, asset),
    currency: asset.displayCurrency,
    currencySymbol: CURRENCY_SYMBOLS[asset.displayCurrency] ?? asset.displayCurrency,
    change,
    changePercent,
    isUp: change >= 0,
    source,
  }
}
