import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
// Revalidate every 60 seconds
export const revalidate = 60

const COINS = 'bitcoin,ethereum,solana,binancecoin,ripple,cardano,dogecoin,avalanche-2,chainlink,polkadot'

function fmt(n: number, decimals = 2) {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  return n.toFixed(decimals)
}

function sign(n: number) { return n >= 0 ? `+${n.toFixed(2)}%` : `${n.toFixed(2)}%` }

export async function GET() {
  try {
    const [cryptoRes, forexRes] = await Promise.allSettled([
      fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${COINS}&vs_currencies=usd,eur&include_24hr_change=true&include_market_cap=true`,
        { next: { revalidate: 60 } }
      ),
      fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 3600 } }),
    ])

    let cryptoLines = ''
    if (cryptoRes.status === 'fulfilled' && cryptoRes.value.ok) {
      const data = await cryptoRes.value.json()
      const LABELS: Record<string, string> = {
        bitcoin: 'Bitcoin (BTC)',
        ethereum: 'Ethereum (ETH)',
        solana: 'Solana (SOL)',
        binancecoin: 'BNB',
        ripple: 'XRP',
        cardano: 'ADA',
        dogecoin: 'Dogecoin (DOGE)',
        'avalanche-2': 'Avalanche (AVAX)',
        chainlink: 'Chainlink (LINK)',
        polkadot: 'Polkadot (DOT)',
      }
      cryptoLines = Object.entries(data)
        .map(([id, v]: [string, any]) =>
          `• ${LABELS[id] || id}: $${fmt(v.usd)} (${sign(v.usd_24h_change ?? 0)} sur 24h)`
        )
        .join('\n')
    } else {
      cryptoLines = '• Données crypto temporairement indisponibles.'
    }

    let forexLines = ''
    if (forexRes.status === 'fulfilled' && forexRes.value.ok) {
      const data = await forexRes.value.json()
      const rates = data.rates || {}
      const pairs = [
        ['EUR/USD', 1 / (rates.EUR || 1)],
        ['GBP/USD', 1 / (rates.GBP || 1)],
        ['USD/JPY', rates.JPY || 1],
        ['USD/CHF', rates.CHF || 1],
        ['AUD/USD', 1 / (rates.AUD || 1)],
        ['USD/CAD', rates.CAD || 1],
      ] as [string, number][]
      forexLines = pairs.map(([pair, rate]) => `• ${pair}: ${rate.toFixed(4)}`).join('\n')
    } else {
      forexLines = '• Données forex temporairement indisponibles.'
    }

    const now = new Date().toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
    })

    const summary = `DONNÉES MARCHÉ EN TEMPS RÉEL (${now} UTC)

🪙 CRYPTO (prix actuels en USD) :
${cryptoLines}

💱 FOREX (taux de change actuels) :
${forexLines}

📊 INDICES (données indicatives) :
• S&P 500: ~5 876 pts
• NASDAQ 100: ~20 847 pts
• DAX 40: ~19 234 pts
• CAC 40: ~8 124 pts
• Or (XAU/USD): ~$2 654/oz
• Pétrole WTI: ~$74/baril`

    return NextResponse.json({ summary, updatedAt: now })
  } catch (err) {
    console.error('[market-data]', err)
    return NextResponse.json({ summary: '', updatedAt: '' }, { status: 500 })
  }
}
