import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 60

export async function GET() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=1h,24h,7d',
      { next: { revalidate: 60 }, headers: { Accept: 'application/json' } }
    )

    if (!res.ok) throw new Error('CoinGecko unavailable')
    const data = await res.json()

    return NextResponse.json({ coins: data, updatedAt: new Date().toISOString() })
  } catch {
    return NextResponse.json({ coins: [], updatedAt: new Date().toISOString() }, { status: 200 })
  }
}
