// Server-only — never import this file from client components
import crypto from 'crypto'

export { TRADEABLE_PAIRS, resolveBinanceSymbol } from './binance-shared'

const BASE = 'https://api.binance.com'

function sign(queryString: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex')
}

async function binanceSigned(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  apiKey: string,
  apiSecret: string,
  extra: Record<string, string> = {},
): Promise<any> {
  const params = new URLSearchParams({ ...extra, timestamp: String(Date.now()) })
  const sig = sign(params.toString(), apiSecret)
  params.set('signature', sig)

  const url = method === 'GET' || method === 'DELETE'
    ? `${BASE}${path}?${params}`
    : `${BASE}${path}`

  const res = await fetch(url, {
    method,
    headers: {
      'X-MBX-APIKEY': apiKey,
      ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: method === 'POST' ? params.toString() : undefined,
    cache: 'no-store',
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.msg ?? `Binance ${res.status}`)
  return data
}

// ─── Precision helpers ────────────────────────────────────────────────────────

function stepToPrecision(step: string): number {
  if (step.includes('.')) return step.split('.')[1].replace(/0+$/, '').length
  return 0
}

function floorToStep(value: number, step: string): string {
  const precision = stepToPrecision(step)
  const stepNum = parseFloat(step)
  return (Math.floor(value / stepNum) * stepNum).toFixed(precision)
}

function roundToTick(value: number, tick: string): string {
  const precision = stepToPrecision(tick)
  const tickNum = parseFloat(tick)
  return (Math.round(value / tickNum) * tickNum).toFixed(precision)
}

// ─── Public endpoints ─────────────────────────────────────────────────────────

export async function getSymbolPrice(symbol: string): Promise<number> {
  const res = await fetch(`${BASE}/api/v3/ticker/price?symbol=${symbol}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Prix ${symbol} indisponible`)
  const data = await res.json()
  return parseFloat(data.price)
}

export interface SymbolInfo {
  baseAsset: string
  quoteAsset: string
  stepSize: string   // lot size step
  tickSize: string   // price tick
  minNotional: string
  minQty: string
}

export async function getSymbolInfo(symbol: string): Promise<SymbolInfo> {
  const res = await fetch(`${BASE}/api/v3/exchangeInfo?symbol=${symbol}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Info ${symbol} indisponible`)
  const data = await res.json()
  const info = data.symbols?.[0]
  if (!info) throw new Error(`Symbole ${symbol} introuvable`)

  const lot      = info.filters.find((f: any) => f.filterType === 'LOT_SIZE')
  const price    = info.filters.find((f: any) => f.filterType === 'PRICE_FILTER')
  const notional = info.filters.find((f: any) => f.filterType === 'NOTIONAL' || f.filterType === 'MIN_NOTIONAL')

  return {
    baseAsset:   info.baseAsset,
    quoteAsset:  info.quoteAsset,
    stepSize:    lot?.stepSize    ?? '0.00001',
    tickSize:    price?.tickSize  ?? '0.01',
    minNotional: notional?.minNotional ?? notional?.notional ?? '10',
    minQty:      lot?.minQty     ?? '0.00001',
  }
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
  const data = await binanceSigned('GET', '/api/v3/account', apiKey, apiSecret)

  const balances: BinanceBalance[] = (data.balances ?? [])
    .map((b: any) => ({
      asset:  b.asset,
      free:   parseFloat(b.free),
      locked: parseFloat(b.locked),
      total:  parseFloat(b.free) + parseFloat(b.locked),
    }))
    .filter((b: BinanceBalance) => b.total > 0)

  const usdt = balances.find(b => b.asset === 'USDT')

  return {
    permissions: data.permissions ?? [],
    canTrade:    data.canTrade ?? false,
    balances,
    usdtBalance: usdt?.free ?? 0,
  }
}

// ─── Order placement ──────────────────────────────────────────────────────────

export interface MarketOrderResult {
  orderId: number
  symbol: string
  executedQty: number
  avgPrice: number
  side: 'BUY' | 'SELL'
}

export async function placeMarketOrder(
  apiKey: string,
  apiSecret: string,
  symbol: string,
  side: 'BUY' | 'SELL',
  usdtAmount: number,
): Promise<MarketOrderResult> {
  // Get symbol info for precision
  const info = await getSymbolInfo(symbol)
  const price = await getSymbolPrice(symbol)

  const rawQty = usdtAmount / price
  const qty = floorToStep(rawQty, info.stepSize)

  if (parseFloat(qty) < parseFloat(info.minQty)) {
    throw new Error(`Taille trop petite. Minimum: ${info.minQty} ${info.baseAsset}`)
  }
  if (parseFloat(qty) * price < parseFloat(info.minNotional)) {
    throw new Error(`Montant trop faible. Minimum: $${info.minNotional}`)
  }

  const data = await binanceSigned('POST', '/api/v3/order', apiKey, apiSecret, {
    symbol,
    side,
    type: 'MARKET',
    quantity: qty,
  })

  const fills = data.fills ?? []
  const avgPrice = fills.length > 0
    ? fills.reduce((s: number, f: any) => s + parseFloat(f.price) * parseFloat(f.qty), 0)
      / fills.reduce((s: number, f: any) => s + parseFloat(f.qty), 0)
    : price

  return {
    orderId:     data.orderId,
    symbol:      data.symbol,
    executedQty: parseFloat(data.executedQty),
    avgPrice,
    side,
  }
}

export interface OCOResult {
  orderListId: number
  tpOrderId: number
  slOrderId: number
}

// Place OCO sell order (exit a LONG position with SL + TP)
export async function placeOCOSell(
  apiKey: string,
  apiSecret: string,
  symbol: string,
  quantity: number,
  tpPrice: number,
  slPrice: number,
): Promise<OCOResult> {
  const info = await getSymbolInfo(symbol)

  const qty       = floorToStep(quantity, info.stepSize)
  const tpPriceFmt = roundToTick(tpPrice, info.tickSize)
  const slPriceFmt = roundToTick(slPrice, info.tickSize)
  // Stop limit price = SL - 0.1% buffer to ensure execution
  const slLimitFmt = roundToTick(slPrice * 0.999, info.tickSize)

  const data = await binanceSigned('POST', '/api/v3/order/oco', apiKey, apiSecret, {
    symbol,
    side:                 'SELL',
    quantity:             qty,
    price:                tpPriceFmt,      // Take profit limit price
    stopPrice:            slPriceFmt,      // Stop loss trigger
    stopLimitPrice:       slLimitFmt,      // Stop loss execution price
    stopLimitTimeInForce: 'GTC',
  })

  const orders = data.orders ?? data.orderReports ?? []
  const limitOrder = orders.find((o: any) => o.type === 'LIMIT_MAKER' || o.type === 'LIMIT')
  const stopOrder  = orders.find((o: any) => o.type === 'STOP_LOSS_LIMIT')

  return {
    orderListId: data.orderListId,
    tpOrderId:   limitOrder?.orderId ?? 0,
    slOrderId:   stopOrder?.orderId  ?? 0,
  }
}

// Cancel an OCO order list
export async function cancelOCO(
  apiKey: string,
  apiSecret: string,
  symbol: string,
  orderListId: number,
): Promise<void> {
  await binanceSigned('DELETE', '/api/v3/orderList', apiKey, apiSecret, {
    symbol,
    orderListId: String(orderListId),
  })
}

// Place a market sell (close position manually)
export async function placeMarketSell(
  apiKey: string,
  apiSecret: string,
  symbol: string,
  quantity: number,
): Promise<MarketOrderResult> {
  const info = await getSymbolInfo(symbol)
  const qty  = floorToStep(quantity, info.stepSize)

  const data = await binanceSigned('POST', '/api/v3/order', apiKey, apiSecret, {
    symbol,
    side:     'SELL',
    type:     'MARKET',
    quantity: qty,
  })

  const fills = data.fills ?? []
  const price = await getSymbolPrice(symbol)
  const avgPrice = fills.length > 0
    ? fills.reduce((s: number, f: any) => s + parseFloat(f.price) * parseFloat(f.qty), 0)
      / fills.reduce((s: number, f: any) => s + parseFloat(f.qty), 0)
    : price

  return {
    orderId:     data.orderId,
    symbol:      data.symbol,
    executedQty: parseFloat(data.executedQty),
    avgPrice,
    side: 'SELL',
  }
}

// Get all open OCO order lists
export async function getOpenOCOs(
  apiKey: string,
  apiSecret: string,
): Promise<any[]> {
  return binanceSigned('GET', '/api/v3/openOrderList', apiKey, apiSecret)
}
