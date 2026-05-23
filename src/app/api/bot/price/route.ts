import { resolvePairConfig } from '@/lib/broker/binance-shared'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  XRP: 'ripple', ADA: 'cardano', DOT: 'polkadot', LINK: 'chainlink',
  AVAX: 'avalanche-2', MATIC: 'matic-network', LTC: 'litecoin',
  DOGE: 'dogecoin', ATOM: 'cosmos', TRX: 'tron', NEAR: 'near',
}

async function fetchCoinGeckoPrice(ticker: string): Promise<number> {
  const id = COINGECKO_IDS[ticker.toUpperCase()]
  if (!id) throw new Error(`CoinGecko ID inconnu pour ${ticker}`)
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
    { cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`)
  const data = await res.json()
  const price = data[id]?.usd
  if (!price) throw new Error('Prix CoinGecko indisponible')
  return price
}

async function fetchYahooPrice(yahooSymbol: string): Promise<number> {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1m&range=1d`,
    { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }, cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`)
  const data = await res.json()
  const closes: number[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
  const price = closes.filter(Boolean).at(-1)
  if (!price) throw new Error('Pas de données Yahoo')
  return price
}

export async function GET(req: NextRequest) {
  const pair = req.nextUrl.searchParams.get('pair')
  if (!pair) return NextResponse.json({ error: 'pair requis' }, { status: 400 })

  const config = resolvePairConfig(pair)
  if (!config) return NextResponse.json({ error: `Paire inconnue: ${pair}` }, { status: 400 })

  try {
    let price: number
    if (config.category === 'crypto') {
      // CoinGecko first (works on Vercel), Yahoo as fallback
      try {
        const ticker = config.displayPair.split('/')[0]
        price = await fetchCoinGeckoPrice(ticker)
      } catch {
        price = await fetchYahooPrice(config.yahooSymbol!)
      }
    } else {
      price = await fetchYahooPrice(config.yahooSymbol!)
    }
    return NextResponse.json({ price })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
