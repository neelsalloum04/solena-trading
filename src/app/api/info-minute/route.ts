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

const FINNHUB_TOKEN = 'd0qs9g9r01qhsqt6e3bgd0qs9g9r01qhsqt6e3c0'

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
    { id: 'n1', type: 'news', category: 'economie', impact: 'high', title: 'Fed : Powell confirme le maintien des taux, deux baisses envisagées en 2025', summary: "Jerome Powell a réaffirmé la position hawkish de la Fed, maintenant les taux entre 5,25 % et 5,50 %. Il a évoqué deux baisses possibles d'ici fin 2025 si l'inflation continue de reculer vers la cible de 2 %.", publishedAt: new Date(now - 40 * 60 * 1000).toISOString(), source: 'Reuters', url: 'https://reuters.com' },
    { id: 'n2', type: 'news', category: 'crypto', impact: 'high', title: 'Bitcoin franchit 108 000$ — afflux record des ETF spot (+1,2 Md$ en une semaine)', summary: "La demande institutionnelle propulse le BTC à de nouveaux sommets. Les ETF spot américains accumulent 1,2 milliard de dollars en entrées nettes sur sept jours, signalant un intérêt soutenu des grandes institutions.", publishedAt: new Date(now - 1.5 * 3600 * 1000).toISOString(), source: 'CoinDesk', url: 'https://coindesk.com' },
    { id: 'n3', type: 'news', category: 'forex', impact: 'high', title: "EUR/USD sous pression : la BCE ouvre la porte à un assouplissement en juin", summary: "Christine Lagarde a laissé entendre que la BCE pourrait abaisser ses taux directeurs dès juin si les données d'inflation restent conformes aux attentes. L'euro cède 0,4 % face au dollar après ces déclarations.", publishedAt: new Date(now - 2.2 * 3600 * 1000).toISOString(), source: 'Bloomberg', url: 'https://bloomberg.com' },
    { id: 'n4', type: 'news', category: 'actions', impact: 'high', title: "NVIDIA : BPA de 0,89$ — révision en hausse de +22%, titre en hausse de 9% after-hours", summary: "NVIDIA publie des résultats record avec un CA en hausse de 94 % sur un an, porté par l'explosion de la demande pour ses puces IA H100 et H200. Les guidances Q3 dépassent le consensus de 15 %.", publishedAt: new Date(now - 3.5 * 3600 * 1000).toISOString(), source: 'CNBC', url: 'https://cnbc.com' },
    { id: 'n5', type: 'news', category: 'economie', impact: 'high', title: 'CPI américain : +3,2% sur un an, données stables — marchés soulagés', summary: "L'indice des prix à la consommation américain ressort à +3,2 % en glissement annuel, exactement en ligne avec le consensus Bloomberg. La composante logement reste le principal facteur haussier.", publishedAt: new Date(now - 5 * 3600 * 1000).toISOString(), source: 'Bureau of Labor Statistics', url: 'https://bls.gov' },
    { id: 'n6', type: 'news', category: 'crypto', impact: 'medium', title: 'Ethereum : record de transactions avec l\'essor des Layer 2 (2M tx/jour)', summary: "Le réseau Ethereum traite désormais plus de 2 millions de transactions quotidiennes grâce aux solutions L2 comme Arbitrum et Base. Les frais de transaction atteignent leur niveau le plus bas depuis 2022.", publishedAt: new Date(now - 6 * 3600 * 1000).toISOString(), source: 'The Block', url: 'https://theblock.co' },
    { id: 'n7', type: 'news', category: 'matieres', impact: 'medium', title: "OPEC+ maintient ses quotas — le Brent se stabilise autour de 85$", summary: "L'alliance OPEC+ a voté à l'unanimité le maintien de ses niveaux de production lors de sa dernière réunion. Le prix du baril de Brent oscille autour de 85 dollars avec une volatilité contenue.", publishedAt: new Date(now - 7 * 3600 * 1000).toISOString(), source: 'Reuters', url: 'https://reuters.com' },
    { id: 'n8', type: 'news', category: 'forex', impact: 'medium', title: "GBP/USD : la livre résiste malgré un PMI manufacturier décevant (47,3)", summary: "L'indice PMI manufacturier britannique ressort à 47,3, en dessous du seuil d'expansion de 50. Malgré cette déception, la livre sterling se maintient grâce aux anticipations d'un statu quo de la BoE.", publishedAt: new Date(now - 9 * 3600 * 1000).toISOString(), source: 'FXStreet', url: 'https://fxstreet.com' },
    { id: 'n9', type: 'news', category: 'indices', impact: 'medium', title: "S&P 500 clôture à un record — les valeurs tech en tête (+0,8%)", summary: "L'indice S&P 500 inscrit un nouveau sommet historique porté par les méga-caps technologiques. Apple, Microsoft et Alphabet contribuent à hauteur de 60 % de la hausse de la séance.", publishedAt: new Date(now - 12 * 3600 * 1000).toISOString(), source: 'MarketWatch', url: 'https://marketwatch.com' },
    { id: 'n10', type: 'news', category: 'crypto', impact: 'medium', title: "Solana dépasse 200$ — memecoins et gaming on-chain en plein essor", summary: "SOL atteint un plus haut de plusieurs mois porté par l'explosion des volumes de trading de memecoins (+340 % sur 30 jours) et une activité NFT gaming en forte croissance sur le réseau.", publishedAt: new Date(now - 14 * 3600 * 1000).toISOString(), source: 'Decrypt', url: 'https://decrypt.co' },
    { id: 'n11', type: 'news', category: 'economie', impact: 'low', title: "PMI Zone Euro : légère amélioration à 46,2 mais reste en territoire de contraction", summary: "L'indice PMI composite de la zone euro progresse légèrement à 46,2 contre 45,7 le mois précédent, mais demeure sous le seuil de 50 points séparant contraction et expansion.", publishedAt: new Date(now - 18 * 3600 * 1000).toISOString(), source: 'S&P Global', url: 'https://spglobal.com' },
    { id: 'n12', type: 'news', category: 'actions', impact: 'low', title: "Tesla : livraisons Q2 en hausse de 3% — premiers signes de stabilisation", summary: "Tesla a livré 443 956 véhicules au second trimestre, légèrement au-dessus des prévisions. Les marges brutes restent sous pression avec une guerre des prix persistante sur le marché des VE.", publishedAt: new Date(now - 20 * 3600 * 1000).toISOString(), source: 'Financial Times', url: 'https://ft.com' },
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
    { id: 'ev6', type: 'event', category: 'economie', impact: 'high', title: 'PIB Zone Euro (T1 2025, 2e estimation)', summary: 'Deuxième estimation du PIB de la zone euro pour le premier trimestre 2025.', publishedAt: t(0), scheduledAt: new Date(today.getTime() + 3 * 24 * 3600 * 1000 + 10 * 3600 * 1000).toISOString(), source: 'Eurostat', country: 'Zone Euro', countryFlag: '🇪🇺', forecast: '+0,3%', previous: '+0,1%', actual: '' },
    { id: 'ev7', type: 'event', category: 'economie', impact: 'high', title: 'IPC — Inflation zone euro (mai)', summary: 'Indice des prix à la consommation harmonisé de la zone euro, données préliminaires de mai.', publishedAt: t(0), scheduledAt: new Date(today.getTime() + 4 * 24 * 3600 * 1000 + 9 * 3600 * 1000).toISOString(), source: 'Eurostat', country: 'Zone Euro', countryFlag: '🇪🇺', forecast: '+2,4%', previous: '+2,6%', actual: '' },
  ]
}

const FLAG_MAP: Record<string, string> = {
  US: '🇺🇸', EU: '🇪🇺', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
  JP: '🇯🇵', CA: '🇨🇦', AU: '🇦🇺', CH: '🇨🇭', CN: '🇨🇳',
  IT: '🇮🇹', ES: '🇪🇸', KR: '🇰🇷', IN: '🇮🇳', BR: '🇧🇷',
  MX: '🇲🇽', NZ: '🇳🇿', SE: '🇸🇪', NO: '🇳🇴',
}

// ── Finnhub: news ──────────────────────────────────────────────────────────────

async function fetchFinnhubNews(): Promise<InfoItem[]> {
  const res = await fetch(
    `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_TOKEN}`,
    { next: { revalidate: 120 } }
  )
  if (!res.ok) throw new Error(`Finnhub news ${res.status}`)
  const raw = await res.json()
  if (!Array.isArray(raw) || raw.length === 0) throw new Error('empty news')

  return raw.slice(0, 20).map((item: Record<string, unknown>, idx: number) => {
    const title = String(item.headline ?? '')
    const text = title + ' ' + String(item.category ?? '')
    return {
      id: `fh-${item.id ?? idx}`,
      type: 'news' as const,
      title: title || 'Sans titre',
      summary: String(item.summary ?? ''),
      publishedAt: item.datetime ? new Date(Number(item.datetime) * 1000).toISOString() : new Date().toISOString(),
      source: String(item.source ?? 'Finnhub'),
      category: classifyCategory(text),
      impact: classifyImpact(title),
      url: String(item.url ?? '#'),
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
    fetchFinnhubNews().catch(() => getMockNews()),
    fetchFinnhubCalendar().catch(() => getMockEvents()),
  ])

  const all: InfoItem[] = [...news, ...events].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )

  return NextResponse.json(all, { headers })
}
