import { getSymbolPrice } from '@/lib/broker/binance'
import { resolvePairConfig } from '@/lib/broker/binance-shared'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

async function fetchYahooPrice(yahooSymbol: string): Promise<number> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1m&range=1d`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`)
  const data = await res.json()
  const result = data?.chart?.result?.[0]
  const closes: number[] = result?.indicators?.quote?.[0]?.close ?? []
  const price = closes.filter(Boolean).at(-1)
  if (!price) throw new Error('No price data from Yahoo')
  return price
}

export async function GET(req: NextRequest) {
  const pair = req.nextUrl.searchParams.get('pair')
  if (!pair) return NextResponse.json({ error: 'pair requis' }, { status: 400 })

  const config = resolvePairConfig(pair)
  if (!config) return NextResponse.json({ error: `Paire inconnue: ${pair}` }, { status: 400 })

  try {
    let price: number
    if (config.source === 'binance' && config.binanceSymbol) {
      price = await getSymbolPrice(config.binanceSymbol)
    } else if (config.yahooSymbol) {
      price = await fetchYahooPrice(config.yahooSymbol)
    } else {
      return NextResponse.json({ error: 'Source de prix non configurée' }, { status: 500 })
    }
    return NextResponse.json({ price })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
