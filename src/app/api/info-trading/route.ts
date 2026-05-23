import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 120

export type NewsCategory = 'forex' | 'crypto' | 'actions' | 'indices' | 'matieres' | 'economie'
export type ImpactLevel = 'high' | 'medium' | 'low'

export interface InfoItem {
  id: string
  type: 'news' | 'event'
  title: string
  summary: string
  publishedAt: string        // ISO string
  scheduledAt?: string       // ISO — for upcoming events
  source: string
  category: NewsCategory
  impact: ImpactLevel
  url?: string
  country?: string
  countryFlag?: string
  forecast?: string
  previous?: string
  actual?: string
}

// ── helpers ────────────────────────────────────────────────────────────────────

const FINNHUB_TOKEN = process.env.FINNHUB_TOKEN ?? 'd0qs9g9r01qhsqt6e3bgd0qs9g9r01qhsqt6e3c0'

function classifyImpact(text: string): ImpactLevel {
  const t = text.toLowerCase()
  const HIGH = ['fed', 'bce', 'ecb', 'fomc', 'banque centrale', 'central bank', 'inflation', 'recession', 'crash', 'crisis', 'rate hike', 'rate cut', 'war', 'sanctions', 'collapse', 'emergency', 'nonfarm', 'cpi', 'gdp', 'bitcoin etf', 'sec', 'default', 'faillite', 'krach']
  const MED  = ['earnings', 'ipo', 'merger', 'acquisition', 'quarterly', 'results', 'outlook', 'forecast', 'guidance', 'jobs', 'unemployment', 'pmi', 'opec', 'dividende', 'résultats', 'bénéfices']
  if (HIGH.some(k => t.includes(k))) return 'high'
  if (MED.some(k => t.includes(k))) return 'medium'
  return 'low'
}

function classifyCategory(text: string): NewsCategory {
  const t = text.toLowerCase()
  if (t.match(/crypto|bitcoin|ethereum|btc|eth|blockchain|defi|altcoin|solana|binance coin/)) return 'crypto'
  if (t.match(/forex|eur\/usd|gbp\/usd|usd\/jpy|devise|currency|dollar|euro|livre|yen|franc suisse/)) return 'forex'
  if (t.match(/s&p|nasdaq|dow jones|cac 40|dax|nikkei|ftse|indice boursier|stock index/)) return 'indices'
  if (t.match(/or|argent|pétrole|gold|silver|oil|wti|brent|matière première|commodity|blé|cuivre/)) return 'matieres'
  if (t.match(/fed|bce|ecb|banque centrale|cpi|pib|gdp|taux|inflation|emploi|chômage|pmi|budget|fiscal|monetary/)) return 'economie'
  return 'actions'
}

// ── mock data ──────────────────────────────────────────────────────────────────

function getMockNews(): InfoItem[] {
  const now = Date.now()
  return [
    { id: 'n1', type: 'news', category: 'economie', impact: 'high', title: 'Fed : taux maintenus, Powell évoque une réduction conditionnelle à l\'inflation', summary: "Jerome Powell a réaffirmé la position hawkish de la Fed. Il a évoqué des baisses possibles uniquement si l'inflation continue de reculer vers la cible de 2 %.", publishedAt: new Date(now - 40 * 60 * 1000).toISOString(), source: 'Reuters', url: 'https://reuters.com' },
    { id: 'n2', type: 'news', category: 'crypto', impact: 'high', title: 'Bitcoin en hausse — afflux record des ETF spot institutionnels cette semaine', summary: "La demande institutionnelle propulse le BTC. Les ETF spot américains accumulent des milliards en entrées nettes, signalant un intérêt soutenu des grandes institutions.", publishedAt: new Date(now - 1.5 * 3600 * 1000).toISOString(), source: 'CoinDesk', url: 'https://coindesk.com' },
    { id: 'n3', type: 'news', category: 'forex', impact: 'high', title: "EUR/USD sous pression : la BCE ouvre la porte à un assouplissement prochain", summary: "La BCE pourrait abaisser ses taux directeurs prochainement si les données d'inflation restent conformes aux attentes. L'euro cède face au dollar après ces déclarations.", publishedAt: new Date(now - 2.2 * 3600 * 1000).toISOString(), source: 'Bloomberg', url: 'https://bloomberg.com' },
    { id: 'n4', type: 'news', category: 'actions', impact: 'high', title: "NVIDIA : résultats trimestriels record — IA booste la demande de puces", summary: "NVIDIA publie des résultats records portés par l'explosion de la demande pour ses puces IA. Les guidances dépassent le consensus des analystes.", publishedAt: new Date(now - 3.5 * 3600 * 1000).toISOString(), source: 'CNBC', url: 'https://cnbc.com' },
    { id: 'n5', type: 'news', category: 'economie', impact: 'high', title: 'CPI américain stable — marchés soulagés par des données conformes au consensus', summary: "L'indice des prix à la consommation américain ressort en ligne avec le consensus Bloomberg. La composante logement reste le principal facteur haussier.", publishedAt: new Date(now - 5 * 3600 * 1000).toISOString(), source: 'Bureau of Labor Statistics', url: 'https://bls.gov' },
    { id: 'n6', type: 'news', category: 'crypto', impact: 'medium', title: "Ethereum : record de transactions grâce à l'essor des Layer 2", summary: "Le réseau Ethereum traite des millions de transactions quotidiennes grâce aux solutions L2 comme Arbitrum et Base. Les frais atteignent leur niveau le plus bas depuis des années.", publishedAt: new Date(now - 6 * 3600 * 1000).toISOString(), source: 'The Block', url: 'https://theblock.co' },
    { id: 'n7', type: 'news', category: 'matieres', impact: 'medium', title: "OPEC+ maintient ses quotas de production — le Brent se stabilise", summary: "L'alliance OPEC+ a voté le maintien de ses niveaux de production lors de sa dernière réunion. Le prix du baril de Brent oscille avec une volatilité contenue.", publishedAt: new Date(now - 7 * 3600 * 1000).toISOString(), source: 'Reuters', url: 'https://reuters.com' },
    { id: 'n8', type: 'news', category: 'forex', impact: 'medium', title: "GBP/USD : la livre résiste malgré un PMI manufacturier décevant", summary: "L'indice PMI manufacturier britannique ressort en dessous du seuil d'expansion de 50. La livre sterling se maintient grâce aux anticipations d'un statu quo de la BoE.", publishedAt: new Date(now - 9 * 3600 * 1000).toISOString(), source: 'FXStreet', url: 'https://fxstreet.com' },
    { id: 'n9', type: 'news', category: 'indices', impact: 'medium', title: "S&P 500 inscrit un nouveau sommet — les valeurs tech en tête", summary: "L'indice S&P 500 inscrit un sommet historique porté par les méga-caps technologiques. Apple, Microsoft et Alphabet contribuent à la majorité de la hausse.", publishedAt: new Date(now - 12 * 3600 * 1000).toISOString(), source: 'MarketWatch', url: 'https://marketwatch.com' },
    { id: 'n10', type: 'news', category: 'crypto', impact: 'medium', title: "Solana en hausse — volumes on-chain en forte croissance", summary: "SOL atteint un plus haut de plusieurs mois porté par l'explosion des volumes de trading et une activité NFT gaming en croissance sur le réseau.", publishedAt: new Date(now - 14 * 3600 * 1000).toISOString(), source: 'Decrypt', url: 'https://decrypt.co' },
    { id: 'n11', type: 'news', category: 'economie', impact: 'low', title: "PMI Zone Euro en légère amélioration mais toujours en territoire de contraction", summary: "L'indice PMI composite de la zone euro progresse légèrement mais demeure sous le seuil de 50 points séparant contraction et expansion.", publishedAt: new Date(now - 18 * 3600 * 1000).toISOString(), source: 'S&P Global', url: 'https://spglobal.com' },
    { id: 'n12', type: 'news', category: 'actions', impact: 'low', title: "Tesla : livraisons trimestrielles au-dessus des prévisions", summary: "Tesla publie ses livraisons trimestrielles légèrement au-dessus des prévisions. Les marges brutes restent sous pression avec une guerre des prix persistante sur le marché des VE.", publishedAt: new Date(now - 20 * 3600 * 1000).toISOString(), source: 'Financial Times', url: 'https://ft.com' },
  ]
}

function getMockEvents(): InfoItem[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const t = (h: number) => new Date(today.getTime() + h * 3600 * 1000).toISOString()

  return [
    { id: 'ev1', type: 'event', category: 'economie', impact: 'high', title: 'Décision de taux — Banque du Canada', summary: 'Publication de la décision sur les taux directeurs de la Banque du Canada.', publishedAt: t(0), scheduledAt: t(16), source: 'Banque du Canada', country: 'Canada', countryFlag: '🇨🇦', forecast: '4,75%', previous: '5,00%', actual: '' },
    { id: 'ev2', type: 'event', category: 'economie', impact: 'high', title: 'PMI Manufacturier ISM — États-Unis (mai)', summary: 'Indice ISM des directeurs d\'achats dans le secteur manufacturier américain.', publishedAt: t(0), scheduledAt: t(15), source: 'ISM', country: 'États-Unis', countryFlag: '🇺🇸', forecast: '49,8', previous: '49,2', actual: '' },
    { id: 'ev3', type: 'event', category: 'economie', impact: 'medium', title: 'Inscriptions hebdomadaires au chômage — États-Unis', summary: 'Nombre de nouvelles inscriptions aux allocations chômage pour la semaine écoulée.', publishedAt: t(0), scheduledAt: t(14.5), source: 'DOL', country: 'États-Unis', countryFlag: '🇺🇸', forecast: '220K', previous: '215K', actual: '' },
    { id: 'ev4', type: 'event', category: 'economie', impact: 'medium', title: 'PMI Services — Royaume-Uni (mai, préliminaire)', summary: 'Indice PMI des services au Royaume-Uni, publication préliminaire.', publishedAt: t(0), scheduledAt: t(9.5), source: 'S&P Global', country: 'Royaume-Uni', countryFlag: '🇬🇧', forecast: '52,3', previous: '52,9', actual: '' },
    { id: 'ev5', type: 'event', category: 'economie', impact: 'high', title: 'NFP — Rapport emploi Non-Farm Payrolls (États-Unis)', summary: 'Rapport mensuel sur l\'emploi américain hors secteur agricole — indicateur clé pour la Fed.', publishedAt: t(0), scheduledAt: new Date(today.getTime() + 2 * 24 * 3600 * 1000 + 14.5 * 3600 * 1000).toISOString(), source: 'BLS', country: 'États-Unis', countryFlag: '🇺🇸', forecast: '185K', previous: '175K', actual: '' },
    { id: 'ev6', type: 'event', category: 'economie', impact: 'high', title: 'PIB Zone Euro — 2e estimation trimestrielle', summary: 'Deuxième estimation du PIB de la zone euro pour le dernier trimestre publié.', publishedAt: t(0), scheduledAt: new Date(today.getTime() + 3 * 24 * 3600 * 1000 + 10 * 3600 * 1000).toISOString(), source: 'Eurostat', country: 'Zone Euro', countryFlag: '🇪🇺', forecast: '+0,3%', previous: '+0,1%', actual: '' },
    { id: 'ev7', type: 'event', category: 'economie', impact: 'high', title: 'IPC — Inflation zone euro (données préliminaires)', summary: 'Indice des prix à la consommation harmonisé de la zone euro, dernières données préliminaires.', publishedAt: t(0), scheduledAt: new Date(today.getTime() + 4 * 24 * 3600 * 1000 + 9 * 3600 * 1000).toISOString(), source: 'Eurostat', country: 'Zone Euro', countryFlag: '🇪🇺', forecast: '+2,4%', previous: '+2,6%', actual: '' },
  ]
}

const FLAG_MAP: Record<string, string> = {
  US: '🇺🇸', EU: '🇪🇺', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
  JP: '🇯🇵', CA: '🇨🇦', AU: '🇦🇺', CH: '🇨🇭', CN: '🇨🇳',
  IT: '🇮🇹', ES: '🇪🇸', KR: '🇰🇷', IN: '🇮🇳', BR: '🇧🇷',
  MX: '🇲🇽', NZ: '🇳🇿', SE: '🇸🇪', NO: '🇳🇴',
}

// ── NewsAPI: news ──────────────────────────────────────────────────────────────

async function fetchNewsAPI(): Promise<InfoItem[]> {
  const key = process.env.NEWSAPI_KEY
  if (!key) throw new Error('NEWSAPI_KEY not configured')

  const q = encodeURIComponent('forex OR crypto OR bitcoin OR stocks OR trading OR inflation OR fed OR ecb OR oil OR gold')
  const res = await fetch(
    `https://newsapi.org/v2/everything?q=${q}&sortBy=publishedAt&pageSize=20&language=en&apiKey=${key}`,
    { next: { revalidate: 120 } }
  )
  if (!res.ok) throw new Error(`NewsAPI ${res.status}`)
  const data = await res.json()
  if (data.status !== 'ok' || !Array.isArray(data.articles)) throw new Error('NewsAPI bad response')

  return data.articles
    .filter((a: Record<string, unknown>) => a.title && a.title !== '[Removed]')
    .slice(0, 20)
    .map((a: Record<string, unknown>, idx: number) => {
      const title = String(a.title ?? '')
      const desc = String(a.description ?? '')
      const src = (a.source as Record<string, unknown>)?.name
      return {
        id: `na-${idx}-${String(a.publishedAt ?? '').slice(0, 10)}`,
        type: 'news' as const,
        title,
        summary: desc,
        publishedAt: String(a.publishedAt ?? new Date().toISOString()),
        source: String(src ?? 'NewsAPI'),
        category: classifyCategory(title + ' ' + desc),
        impact: classifyImpact(title),
        url: String(a.url ?? '#'),
      }
    })
}

// ── Finnhub: economic calendar ─────────────────────────────────────────────────

async function fetchFinnhubCalendar(): Promise<InfoItem[]> {
  const now = new Date()
  const from = now.toISOString().split('T')[0]
  const to = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]

  const res = await fetch(
    `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${FINNHUB_TOKEN}`,
    { next: { revalidate: 1800 } }
  )
  if (!res.ok) throw new Error(`Finnhub calendar ${res.status}`)
  const raw = await res.json()
  const calData = raw.economicCalendar
  if (!Array.isArray(calData) || calData.length === 0) throw new Error('empty calendar')

  return calData
    .filter((item: Record<string, unknown>) => item.event && item.time)
    .slice(0, 25)
    .map((item: Record<string, unknown>, idx: number) => {
      const eventName = String(item.event ?? 'Événement économique')
      const country = String(item.country ?? '')
      const scheduledAt = item.time ? new Date(String(item.time)).toISOString() : new Date().toISOString()
      const impactRaw = String(item.impact ?? '').toLowerCase()
      const impact: ImpactLevel = impactRaw === 'high' ? 'high' : impactRaw === 'medium' ? 'medium' : 'low'

      return {
        id: `cal-${idx}`,
        type: 'event' as const,
        title: eventName,
        summary: `Publication ${country ? `(${country})` : ''} — ${eventName}`,
        publishedAt: scheduledAt,
        scheduledAt,
        source: 'Finnhub Calendar',
        category: 'economie' as NewsCategory,
        impact,
        country: country || undefined,
        countryFlag: FLAG_MAP[country] ?? '🌍',
        forecast: item.estimate != null ? String(item.estimate) : '—',
        previous: item.prev != null ? String(item.prev) : '—',
        actual: item.actual != null && String(item.actual) !== '' ? String(item.actual) : '',
      }
    })
}

// ── handler ───────────────────────────────────────────────────────────────────

export async function GET() {
  const headers = {
    'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60',
  }

  // Fetch news and calendar in parallel, fall back independently
  const [news, events] = await Promise.all([
    fetchNewsAPI().catch(() => getMockNews()),
    fetchFinnhubCalendar().catch(() => getMockEvents()),
  ])

  const all: InfoItem[] = [...news, ...events].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )

  return NextResponse.json(all, { headers })
}
