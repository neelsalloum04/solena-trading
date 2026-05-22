import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export interface NewsItem {
  id: string
  title: string
  summary: string
  publishedAt: string
  source: string
  impact: 'high' | 'medium' | 'low'
  category: 'forex' | 'crypto' | 'stocks' | 'macro' | 'general'
  url: string
}

const FINNHUB_TOKEN = 'd0qs9g9r01qhsqt6e3bgd0qs9g9r01qhsqt6e3c0'

function classifyImpact(headline: string): 'high' | 'medium' | 'low' {
  const h = headline.toLowerCase()
  const highKeywords = ['fed', 'bce', 'banque centrale', 'inflation', 'recession', 'crash', 'crisis', 'rate hike', 'rate cut', 'war', 'sanctions', 'collapse', 'emergency', 'fomc', 'ecb', 'nonfarm', 'cpi', 'gdp', 'bitcoin etf', 'sec']
  const medKeywords = ['earnings', 'ipo', 'merger', 'acquisition', 'quarterly', 'results', 'outlook', 'forecast', 'guidance', 'jobs', 'unemployment', 'pmi', 'opec']
  if (highKeywords.some(k => h.includes(k))) return 'high'
  if (medKeywords.some(k => h.includes(k))) return 'medium'
  return 'low'
}

function classifyCategory(headline: string, category: string): NewsItem['category'] {
  const h = (headline + ' ' + category).toLowerCase()
  if (h.includes('crypto') || h.includes('bitcoin') || h.includes('ethereum') || h.includes('blockchain') || h.includes('btc') || h.includes('eth') || h.includes('defi')) return 'crypto'
  if (h.includes('forex') || h.includes('eur') || h.includes('dollar') || h.includes('currency') || h.includes('exchange rate') || h.includes('devises')) return 'forex'
  if (h.includes('stock') || h.includes('equit') || h.includes('nasdaq') || h.includes('s&p') || h.includes('dow') || h.includes('shares') || h.includes('action')) return 'stocks'
  if (h.includes('fed') || h.includes('ecb') || h.includes('central bank') || h.includes('gdp') || h.includes('inflation') || h.includes('employment') || h.includes('cpi') || h.includes('pmi')) return 'macro'
  return 'general'
}

const MOCK_NEWS: NewsItem[] = [
  {
    id: 'mock-1',
    title: 'La Fed maintient ses taux directeurs, signale deux baisses en 2025',
    summary: 'La Réserve fédérale américaine a décidé à l\'unanimité de maintenir ses taux entre 5,25% et 5,50%, tout en révisant ses projections pour anticiper deux baisses de taux d\'ici fin 2025 si l\'inflation continue de ralentir.',
    publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    source: 'Reuters',
    impact: 'high',
    category: 'macro',
    url: 'https://reuters.com',
  },
  {
    id: 'mock-2',
    title: 'Bitcoin dépasse les 108 000$ — les ETF spot accumulent 1,2 milliard en une semaine',
    summary: 'Le bitcoin a franchi un nouveau sommet historique porté par une demande institutionnelle record. Les ETF spot américains enregistrent des entrées nettes de 1,2 milliard de dollars sur la semaine, propulsant la crypto reine vers de nouveaux records.',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    source: 'CoinDesk',
    impact: 'high',
    category: 'crypto',
    url: 'https://coindesk.com',
  },
  {
    id: 'mock-3',
    title: 'EUR/USD : la BCE ouvre la porte à une baisse des taux en juin',
    summary: 'Christine Lagarde a laissé entendre que la Banque centrale européenne pourrait assouplir sa politique monétaire dès juin si les données d\'inflation restent favorables. L\'euro a reculé face au dollar suite à ces déclarations.',
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    source: 'Bloomberg',
    impact: 'high',
    category: 'forex',
    url: 'https://bloomberg.com',
  },
  {
    id: 'mock-4',
    title: 'NVIDIA bat le consensus avec un BPA de 0,89$ — action en hausse de 8% après clôture',
    summary: 'NVIDIA a publié des résultats trimestriels nettement supérieurs aux attentes, avec un chiffre d\'affaires en hausse de 94% sur un an, porté par une demande explosive pour ses puces dédiées à l\'intelligence artificielle.',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    source: 'CNBC',
    impact: 'high',
    category: 'stocks',
    url: 'https://cnbc.com',
  },
  {
    id: 'mock-5',
    title: 'CPI américain à +3,2% sur un an, en ligne avec les attentes',
    summary: 'L\'indice des prix à la consommation américain progresse de 3,2% sur un an en avril, conformément aux prévisions des économistes. La composante logement reste le principal contributeur à la hausse.',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    source: 'Bureau of Labor Statistics',
    impact: 'high',
    category: 'macro',
    url: 'https://bls.gov',
  },
  {
    id: 'mock-6',
    title: 'Ethereum : le réseau atteint un record de transactions avec l\'essor des Layer 2',
    summary: 'Le réseau Ethereum traite désormais plus de 2 millions de transactions par jour grâce à la montée en puissance des solutions Layer 2 comme Arbitrum et Base. Les frais de transaction sont au plus bas depuis 2 ans.',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    source: 'The Block',
    impact: 'medium',
    category: 'crypto',
    url: 'https://theblock.co',
  },
  {
    id: 'mock-7',
    title: 'L\'OPEC+ maintient ses quotas de production — le pétrole se stabilise autour de 85$',
    summary: 'L\'alliance OPEC+ a décidé de maintenir ses niveaux de production inchangés lors de sa réunion, rassurant les marchés pétroliers. Le WTI se négocie autour de 85$ le baril avec une volatilité contenue.',
    publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    source: 'Reuters',
    impact: 'medium',
    category: 'macro',
    url: 'https://reuters.com',
  },
  {
    id: 'mock-8',
    title: 'GBP/USD : la livre sterling résiste malgré un PMI manufacturier décevant',
    summary: 'Malgré un indice PMI manufacturier britannique inférieur aux attentes à 47,3, la livre sterling se maintient face au dollar grâce aux anticipations d\'un statu quo de la Banque d\'Angleterre pour les prochains mois.',
    publishedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    source: 'FXStreet',
    impact: 'medium',
    category: 'forex',
    url: 'https://fxstreet.com',
  },
  {
    id: 'mock-9',
    title: 'Solana dépasse les 200$ grâce à l\'engouement pour les memecoins et le gaming on-chain',
    summary: 'SOL atteint un nouveau plus haut de plusieurs mois porté par l\'explosion des volumes de trading de memecoins et une activité NFT gaming en forte croissance. Le réseau traite plus de 5 000 transactions par seconde.',
    publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    source: 'Decrypt',
    impact: 'medium',
    category: 'crypto',
    url: 'https://decrypt.co',
  },
  {
    id: 'mock-10',
    title: 'S&P 500 clôture à un nouveau record — les valeurs technologiques en tête',
    summary: 'L\'indice S&P 500 a clôturé en hausse de 0,8% à un niveau record, porté par les géants de la tech. L\'indice a progressé de 12% depuis le début de l\'année, surpassant les attentes des stratèges de marché.',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    source: 'MarketWatch',
    impact: 'medium',
    category: 'stocks',
    url: 'https://marketwatch.com',
  },
]

export async function GET() {
  const headers = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_TOKEN}`,
      { next: { revalidate: 300 } }
    )

    if (!res.ok) throw new Error(`Finnhub error: ${res.status}`)

    const raw = await res.json()

    if (!Array.isArray(raw) || raw.length === 0) throw new Error('Empty response')

    const news: NewsItem[] = raw.slice(0, 15).map((item: {
      id?: number
      headline?: string
      summary?: string
      datetime?: number
      source?: string
      category?: string
      url?: string
    }, idx: number) => ({
      id: String(item.id ?? idx),
      title: item.headline ?? 'Sans titre',
      summary: item.summary ?? '',
      publishedAt: item.datetime ? new Date(item.datetime * 1000).toISOString() : new Date().toISOString(),
      source: item.source ?? 'Finnhub',
      impact: classifyImpact(item.headline ?? ''),
      category: classifyCategory(item.headline ?? '', item.category ?? ''),
      url: item.url ?? '#',
    }))

    return NextResponse.json(news, { headers })
  } catch {
    // Retourne les données mock si Finnhub est indisponible
    return NextResponse.json(MOCK_NEWS, { headers })
  }
}
