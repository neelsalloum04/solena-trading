// Server-only — never import this file from client components
import crypto from 'crypto'

export { TRADEABLE_PAIRS, resolveBinanceSymbol } from './binance-shared'

const BASE = 'https://api.binance.com'

function sign(queryString: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex')
}

async function binanceSigned(
  path: string,
  apiKey: string,
  apiSecret: string,
  extra: Record<string, string> = {},
): Promise<any> {
  const params = new URLSearchParams({ ...extra, timestamp: String(Date.now()) })
  const sig = sign(params.toString(), apiSecret)
  params.set('signature', sig)

  const res = await fetch(`${BASE}${path}?${params}`, {
    headers: { 'X-MBX-APIKEY': apiKey },
    cache: 'no-store',
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.msg ?? `Binance ${res.status}`)
  return data
}

// ─── Public endpoints (no signature) ─────────────────────────────────────────

export async function getSymbolPrice(symbol: string): Promise<number> {
  const res = await fetch(`${BASE}/api/v3/ticker/price?symbol=${symbol}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Prix ${symbol} indisponible`)
  const data = await res.json()
  return parseFloat(data.price)
}

// ─── Authenticated endpoints ──────────────────────────────────────────────────

export interface BinanceBalance {
  asset: string
  free: number
  locked: number
  total: number
}

export interface AccountInfo {
  permissions: string[]
  canTrade: boolean
  balances: BinanceBalance[]
  usdtBalance: number
}

export async function getAccountInfo(apiKey: string, apiSecret: string): Promise<AccountInfo> {
  const data = await binanceSigned('/api/v3/account', apiKey, apiSecret)

  const balances: BinanceBalance[] = (data.balances ?? [])
    .map((b: any) => ({
      asset: b.asset,
      free: parseFloat(b.free),
      locked: parseFloat(b.locked),
      total: parseFloat(b.free) + parseFloat(b.locked),
    }))
    .filter((b: BinanceBalance) => b.total > 0)

  const usdt = balances.find(b => b.asset === 'USDT')

  return {
    permissions: data.permissions ?? [],
    canTrade: data.canTrade ?? false,
    balances,
    usdtBalance: usdt?.free ?? 0,
  }
}

