import crypto from 'crypto'

// ─── Bybit V5 REST Client ─────────────────────────────────────────────────────
// Authentification HMAC-SHA256 : timestamp + apiKey + recvWindow + params

const BASE = 'https://api.bybit.com'
const RECV = '5000'

export interface BybitResponse<T = unknown> {
  retCode: number
  retMsg:  string
  result:  T
}

export interface OrderResult {
  orderId:     string
  orderLinkId: string
}

export interface PositionInfo {
  symbol:        string
  side:          'Buy' | 'Sell' | 'None'
  size:          string
  avgPrice:      string
  unrealisedPnl: string
  leverage:      string
  markPrice:     string
  liqPrice:      string
  stopLoss:      string
  takeProfit:    string
}

export interface WalletBalance {
  totalEquity:           string
  totalAvailableBalance: string
  totalWalletBalance:    string
}

function sign(apiKey: string, apiSecret: string, ts: number, params: string): string {
  const msg = `${ts}${apiKey}${RECV}${params}`
  return crypto.createHmac('sha256', apiSecret).update(msg).digest('hex')
}

function headers(apiKey: string, apiSecret: string, ts: number, params: string) {
  return {
    'Content-Type':       'application/json',
    'X-BAPI-API-KEY':     apiKey,
    'X-BAPI-SIGN':        sign(apiKey, apiSecret, ts, params),
    'X-BAPI-TIMESTAMP':   String(ts),
    'X-BAPI-RECV-WINDOW': RECV,
  }
}

async function bybitGet<T>(
  apiKey: string, apiSecret: string,
  path: string, query: Record<string, string> = {}
): Promise<BybitResponse<T>> {
  const ts = Date.now()
  const qs = new URLSearchParams(query).toString()
  const res = await fetch(`${BASE}${path}${qs ? '?' + qs : ''}`, {
    headers: headers(apiKey, apiSecret, ts, qs),
    cache: 'no-store',
  })
  return res.json()
}

async function bybitPost<T>(
  apiKey: string, apiSecret: string,
  path: string, body: Record<string, unknown>
): Promise<BybitResponse<T>> {
  const ts  = Date.now()
  const raw = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: headers(apiKey, apiSecret, ts, raw),
    body:    raw,
    cache:   'no-store',
  })
  return res.json()
}

// ─── Account ──────────────────────────────────────────────────────────────────

export async function getWalletBalance(
  apiKey: string, apiSecret: string
): Promise<WalletBalance | null> {
  const r = await bybitGet<{ list: { totalEquity: string; totalAvailableBalance: string; totalWalletBalance: string }[] }>(
    apiKey, apiSecret, '/v5/account/wallet-balance', { accountType: 'UNIFIED' }
  )
  return r.retCode === 0 ? r.result.list[0] : null
}

export async function verifyApiKeys(apiKey: string, apiSecret: string): Promise<{
  valid: boolean; permissions: string[]; balance?: string
}> {
  try {
    const r = await bybitGet<{
      result: { permissions?: { ContractTrade?: string[] } }
    }>(apiKey, apiSecret, '/v5/user/query-api', {})
    if (r.retCode !== 0) return { valid: false, permissions: [] }
    const perms = (r as any).result?.permissions?.ContractTrade ?? []
    const wallet = await getWalletBalance(apiKey, apiSecret)
    return {
      valid: true,
      permissions: perms,
      balance: wallet?.totalEquity ?? '0',
    }
  } catch {
    return { valid: false, permissions: [] }
  }
}

// ─── Position ─────────────────────────────────────────────────────────────────

export async function getPositions(
  apiKey: string, apiSecret: string
): Promise<PositionInfo[]> {
  const r = await bybitGet<{ list: PositionInfo[] }>(
    apiKey, apiSecret, '/v5/position/list',
    { category: 'linear', symbol: 'BTCUSDT' }
  )
  return r.retCode === 0 ? r.result.list : []
}

export async function setLeverage(
  apiKey: string, apiSecret: string, leverage: number
): Promise<boolean> {
  const r = await bybitPost(apiKey, apiSecret, '/v5/position/set-leverage', {
    category: 'linear', symbol: 'BTCUSDT',
    buyLeverage: String(leverage), sellLeverage: String(leverage),
  })
  return r.retCode === 0 || r.retMsg.includes('leverage not modified')
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function placeMarketOrder(
  apiKey: string, apiSecret: string,
  side: 'Buy' | 'Sell',
  qty: string,
  stopLoss: string,
  takeProfit: string,
): Promise<OrderResult | null> {
  const r = await bybitPost<OrderResult>(apiKey, apiSecret, '/v5/order/create', {
    category:    'linear',
    symbol:      'BTCUSDT',
    side,
    orderType:   'Market',
    qty,
    stopLoss,
    takeProfit,
    slTriggerBy: 'MarkPrice',
    tpTriggerBy: 'MarkPrice',
    timeInForce: 'GTC',
    reduceOnly:  false,
  })
  return r.retCode === 0 ? r.result : null
}

export async function placeReduceOrder(
  apiKey: string, apiSecret: string,
  side: 'Buy' | 'Sell',
  qty: string,
): Promise<OrderResult | null> {
  const r = await bybitPost<OrderResult>(apiKey, apiSecret, '/v5/order/create', {
    category:    'linear',
    symbol:      'BTCUSDT',
    side,
    orderType:   'Market',
    qty,
    reduceOnly:  true,
    timeInForce: 'GTC',
  })
  return r.retCode === 0 ? r.result : null
}

export async function setTradingStop(
  apiKey: string, apiSecret: string,
  stopLoss: string,
  takeProfit?: string,
): Promise<boolean> {
  const body: Record<string, string> = {
    category: 'linear', symbol: 'BTCUSDT', stopLoss, positionIdx: '0',
  }
  if (takeProfit) body.takeProfit = takeProfit
  const r = await bybitPost(apiKey, apiSecret, '/v5/position/trading-stop', body)
  return r.retCode === 0
}

export async function closePosition(
  apiKey: string, apiSecret: string,
  side: 'LONG' | 'SHORT',
  qty: string,
): Promise<boolean> {
  const closeSide = side === 'LONG' ? 'Sell' : 'Buy'
  const r = await placeReduceOrder(apiKey, apiSecret, closeSide, qty)
  return r !== null
}
