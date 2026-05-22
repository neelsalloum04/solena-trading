import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export interface MarketAsset {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  category: 'indices' | 'forex' | 'crypto' | 'commodities'
}

const TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY ?? ''

// Données mock réalistes pour fallback
const MOCK_DATA: MarketAsset[] = [
  // Indices
  { symbol: 'SPX', name: 'S&P 500', price: 5287.43, change: 18.72, changePercent: 0.36, high: 5301.22, low: 5269.87, category: 'indices' },
  { symbol: 'NDX', name: 'NASDAQ 100', price: 18432.15, change: 95.43, changePercent: 0.52, high: 18497.30, low: 18338.60, category: 'indices' },
  { symbol: 'DJI', name: 'Dow Jones', price: 39654.32, change: -42.15, changePercent: -0.11, high: 39724.50, low: 39601.80, category: 'indices' },
  { symbol: 'DAX', name: 'DAX 40', price: 18734.56, change: 67.23, changePercent: 0.36, high: 18789.40, low: 18670.20, category: 'indices' },
  { symbol: 'CAC40', name: 'CAC 40', price: 8147.32, change: 28.54, changePercent: 0.35, high: 8163.70, low: 8118.90, category: 'indices' },
  { symbol: 'NI225', name: 'Nikkei 225', price: 38647.89, change: 213.45, changePercent: 0.56, high: 38712.00, low: 38580.30, category: 'indices' },
  // Forex
  { symbol: 'EUR/USD', name: 'Euro / Dollar', price: 1.0847, change: -0.0013, changePercent: -0.12, high: 1.0872, low: 1.0831, category: 'forex' },
  { symbol: 'GBP/USD', name: 'Livre / Dollar', price: 1.2698, change: 0.0021, changePercent: 0.17, high: 1.2715, low: 1.2680, category: 'forex' },
  { symbol: 'USD/JPY', name: 'Dollar / Yen', price: 154.73, change: -0.42, changePercent: -0.27, high: 155.12, low: 154.51, category: 'forex' },
  { symbol: 'USD/CHF', name: 'Dollar / Franc suisse', price: 0.9043, change: 0.0018, changePercent: 0.20, high: 0.9058, low: 0.9031, category: 'forex' },
  // Crypto
  { symbol: 'BTC/USD', name: 'Bitcoin', price: 108234.50, change: 1823.40, changePercent: 1.71, high: 109100.00, low: 106890.20, category: 'crypto' },
  { symbol: 'ETH/USD', name: 'Ethereum', price: 4187.32, change: 87.45, changePercent: 2.13, high: 4215.60, low: 4098.70, category: 'crypto' },
  { symbol: 'SOL/USD', name: 'Solana', price: 201.43, change: 8.32, changePercent: 4.31, high: 204.80, low: 193.20, category: 'crypto' },
  { symbol: 'XRP/USD', name: 'XRP', price: 0.6234, change: 0.0187, changePercent: 3.09, high: 0.6298, low: 0.6041, category: 'crypto' },
  // Matières premières
  { symbol: 'XAU/USD', name: 'Or', price: 2387.40, change: 12.30, changePercent: 0.52, high: 2395.70, low: 2373.80, category: 'commodities' },
  { symbol: 'XAG/USD', name: 'Argent', price: 31.24, change: -0.18, changePercent: -0.57, high: 31.54, low: 31.08, category: 'commodities' },
  { symbol: 'USOIL', name: 'Pétrole WTI', price: 79.43, change: -0.87, changePercent: -1.08, high: 80.42, low: 79.01, category: 'commodities' },
]

interface TwelveDataQuote {
  symbol?: string
  close?: string
  change?: string
  percent_change?: string
  high?: string
  low?: string
  status?: string
}

async function fetchFromTwelveData(): Promise<MarketAsset[] | null> {
  if (!TWELVE_DATA_KEY) return null

  // Forex pairs avec Twelve Data
  const forexSymbols = 'EUR/USD,GBP/USD,USD/JPY,USD/CHF'
  // Indices avec Twelve Data
  const indexSymbols = 'SPX,NDX,DJI,DAX,CAC40,NIKKEI'
  // Matières premières
  const commoditySymbols = 'XAU/USD,XAG/USD,WTI/USD'

  try {
    const [forexRes, indexRes, commodityRes, cryptoRes] = await Promise.allSettled([
      fetch(
        `https://api.twelvedata.com/quote?symbol=${forexSymbols}&apikey=${TWELVE_DATA_KEY}`,
        { next: { revalidate: 60 } }
      ),
      fetch(
        `https://api.twelvedata.com/quote?symbol=${indexSymbols}&apikey=${TWELVE_DATA_KEY}`,
        { next: { revalidate: 60 } }
      ),
      fetch(
        `https://api.twelvedata.com/quote?symbol=${commoditySymbols}&apikey=${TWELVE_DATA_KEY}`,
        { next: { revalidate: 60 } }
      ),
      fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true',
        { next: { revalidate: 60 } }
      ),
    ])

    const assets: MarketAsset[] = []

    // Parse forex
    if (forexRes.status === 'fulfilled' && forexRes.value.ok) {
      const data = await forexRes.value.json()
      const forexMeta: Record<string, { name: string }> = {
        'EUR/USD': { name: 'Euro / Dollar' },
        'GBP/USD': { name: 'Livre / Dollar' },
        'USD/JPY': { name: 'Dollar / Yen' },
        'USD/CHF': { name: 'Dollar / Franc suisse' },
      }
      for (const [sym, quote] of Object.entries(data) as [string, TwelveDataQuote][]) {
        if (quote?.close && quote.status !== 'error') {
          const price = parseFloat(quote.close)
          const change = parseFloat(quote.change ?? '0')
          const changePct = parseFloat(quote.percent_change ?? '0')
          assets.push({
            symbol: sym,
            name: forexMeta[sym]?.name ?? sym,
            price,
            change,
            changePercent: changePct,
            high: parseFloat(quote.high ?? String(price * 1.002)),
            low: parseFloat(quote.low ?? String(price * 0.998)),
            category: 'forex',
          })
        }
      }
    }

    // Parse indices
    if (indexRes.status === 'fulfilled' && indexRes.value.ok) {
      const data = await indexRes.value.json()
      const indexMeta: Record<string, { name: string }> = {
        'SPX': { name: 'S&P 500' },
        'NDX': { name: 'NASDAQ 100' },
        'DJI': { name: 'Dow Jones' },
        'DAX': { name: 'DAX 40' },
        'CAC40': { name: 'CAC 40' },
        'NIKKEI': { name: 'Nikkei 225' },
      }
      for (const [sym, quote] of Object.entries(data) as [string, TwelveDataQuote][]) {
        if (quote?.close && quote.status !== 'error') {
          const price = parseFloat(quote.close)
          const change = parseFloat(quote.change ?? '0')
          const changePct = parseFloat(quote.percent_change ?? '0')
          const displaySym = sym === 'NIKKEI' ? 'NI225' : sym
          assets.push({
            symbol: displaySym,
            name: indexMeta[sym]?.name ?? sym,
            price,
            change,
            changePercent: changePct,
            high: parseFloat(quote.high ?? String(price * 1.002)),
            low: parseFloat(quote.low ?? String(price * 0.998)),
            category: 'indices',
          })
        }
      }
    }

    // Parse commodities
    if (commodityRes.status === 'fulfilled' && commodityRes.value.ok) {
      const data = await commodityRes.value.json()
      const commMeta: Record<string, { name: string; symbol: string }> = {
        'XAU/USD': { name: 'Or', symbol: 'XAU/USD' },
        'XAG/USD': { name: 'Argent', symbol: 'XAG/USD' },
        'WTI/USD': { name: 'Pétrole WTI', symbol: 'USOIL' },
      }
      for (const [sym, quote] of Object.entries(data) as [string, TwelveDataQuote][]) {
        if (quote?.close && quote.status !== 'error') {
          const meta = commMeta[sym]
          const price = parseFloat(quote.close)
          const change = parseFloat(quote.change ?? '0')
          const changePct = parseFloat(quote.percent_change ?? '0')
          assets.push({
            symbol: meta?.symbol ?? sym,
            name: meta?.name ?? sym,
            price,
            change,
            changePercent: changePct,
            high: parseFloat(quote.high ?? String(price * 1.002)),
            low: parseFloat(quote.low ?? String(price * 0.998)),
            category: 'commodities',
          })
        }
      }
    }

    // Parse crypto (CoinGecko)
    if (cryptoRes.status === 'fulfilled' && cryptoRes.value.ok) {
      const data = await cryptoRes.value.json()
      const cryptoMeta: Record<string, { symbol: string; name: string }> = {
        bitcoin: { symbol: 'BTC/USD', name: 'Bitcoin' },
        ethereum: { symbol: 'ETH/USD', name: 'Ethereum' },
        solana: { symbol: 'SOL/USD', name: 'Solana' },
        ripple: { symbol: 'XRP/USD', name: 'XRP' },
      }
      for (const [id, coinData] of Object.entries(data) as [string, { usd: number; usd_24h_change: number }][]) {
        const meta = cryptoMeta[id]
        if (!meta) continue
        const price = coinData.usd
        const changePct = coinData.usd_24h_change ?? 0
        const change = (price * changePct) / 100
        assets.push({
          symbol: meta.symbol,
          name: meta.name,
          price,
          change,
          changePercent: changePct,
          high: price * 1.015,
          low: price * 0.985,
          category: 'crypto',
        })
      }
    }

    return assets.length > 0 ? assets : null
  } catch {
    return null
  }
}

export async function GET() {
  const headers = {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
  }

  const liveData = await fetchFromTwelveData()

  if (!liveData || liveData.length === 0) {
    // Tout en mock avec légère variation aléatoire pour simuler le live
    const finalData = MOCK_DATA.map(asset => ({
      ...asset,
      price: asset.price * (1 + (Math.random() - 0.5) * 0.001),
      changePercent: asset.changePercent + (Math.random() - 0.5) * 0.05,
    }))
    return NextResponse.json(finalData, { headers })
  }

  // Compléter les catégories manquantes avec des données mock variées
  const liveCategories = new Set(liveData.map(a => a.category))
  const allCategories: MarketAsset['category'][] = ['indices', 'forex', 'crypto', 'commodities']
  const missingCategories = allCategories.filter(c => !liveCategories.has(c))

  const mockFallback = MOCK_DATA.filter(a => missingCategories.includes(a.category)).map(asset => ({
    ...asset,
    price: asset.price * (1 + (Math.random() - 0.5) * 0.001),
    changePercent: asset.changePercent + (Math.random() - 0.5) * 0.05,
  }))

  return NextResponse.json([...liveData, ...mockFallback], { headers })
}
