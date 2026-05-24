// Server-only — never import this file from client components
import crypto from 'crypto'

const BASE = 'https://api.bybit.com'
const RECV_WINDOW = '5000'

function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

async function bybitRequest(
  method: 'GET' | 'POST',
  path: string,
  apiKey: string,
  apiSecret: string,
  params: Record<string, string> = {},
): Promise<any> {
  const ts = String(Date.now())

  let url = `${BASE}${path}`
  let body = ''
  let signStr: string

  if (method === 'GET') {
    const qs = new URLSearchParams(params).toString()
    signStr = ts + apiKey + RECV_WINDOW + qs
    if (qs) url += '?' + qs
  } else {
    body = JSON.stringify(params)
    signStr = ts + apiKey + RECV_WINDOW + body
  }

  const sig = sign(signStr, apiSecret)

  const res = await fetch(url, {
    method,
    headers: {
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-TIMESTAMP': ts,
      'X-BAPI-SIGN': sig,
      'X-BAPI-RECV-WINDOW': RECV_WINDOW,
      ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
    },
    body: method === 'POST' ? body : undefined,
    cache: 'no-store',
  })

  const data = await res.json()
  if (data.retCode !== 0) {
    const msg = data.retMsg ?? `Bybit error ${data.retCode}`
    throw new Error(msg)
  }
  return data.result
}

// ── Helpers ────────────────────────────────────────────────────────────────────

interface SymbolInfo {
  basePrecision: number
  minQty: number
  minOrderAmt: number
  tickSize: number
}

async function getSymbolInfo(symbol: string): Promise<SymbolInfo> {
  const res = await fetch(
    `${BASE}/v5/market/instruments-info?category=spot&symbol=${symbol}`,
    { cache: 'no-store' }
  )
  const data = await res.json()
  const info = data.result?.list?.[0]
  return {
    basePrecision: parseFloat(info?.lotSizeFilter?.basePrecision ?? '0.000001'),
    minQty:        parseFloat(info?.lotSizeFilter?.minOrderQty   ?? '0.000001'),
    minOrderAmt:   parseFloat(info?.lotSizeFilter?.minOrderAmt   ?? '10'),
    tickSize:      parseFloat(info?.priceFilter?.tickSize        ?? '0.01'),
  }
}

function floorToPrecision(value: number, step: number): string {
  const decimals = step < 1 ? Math.ceil(-Math.log10(step)) : 0
  return (Math.floor(value / step) * step).toFixed(decimals)
}

function roundToTick(value: number, tick: number): string {
  const decimals = tick < 1 ? Math.ceil(-Math.log10(tick)) : 0
  return (Math.round(value / tick) * tick).toFixed(decimals)
}

// ── Public price ───────────────────────────────────────────────────────────────

export async function getSymbolPrice(symbol: string): Promise<number> {
  const res = await fetch(
    `${BASE}/v5/market/tickers?category=spot&symbol=${symbol}`,
    { cache: 'no-store' }
  )
  const data = await res.json()
  const price = parseFloat(data.result?.list?.[0]?.lastPrice ?? '0')
  if (!price) throw new Error(`Prix ${symbol} indisponible`)
  return price
}

// ── Account ────────────────────────────────────────────────────────────────────

export interface AccountInfo {
  permissions: string[]
  canTrade: boolean
  balances: { asset: string; free: number; locked: number; total: number }[]
  usdtBalance: number
}

export async function getAccountInfo(apiKey: string, apiSecret: string): Promise<AccountInfo> {
  // Try UNIFIED account first (most common), then SPOT
  let coins: any[] = []
  for (const accountType of ['UNIFIED', 'SPOT']) {
    try {
      const result = await bybitRequest('GET', '/v5/account/wallet-balance', apiKey, apiSecret, { accountType })
      coins = result?.list?.[0]?.coin ?? []
      if (coins.length > 0) break
    } catch {}
  }

  const usdt = coins.find((c: any) => c.coin === 'USDT')
  const usdtBalance = parseFloat(
    usdt?.availableToWithdraw ?? usdt?.free ?? usdt?.walletBalance ?? '0'
  )

  return {
    permissions: ['Spot Trading'],
    canTrade: true,
    balances: coins
      .map((c: any) => ({
        asset: c.coin,
        free:   parseFloat(c.availableToWithdraw ?? c.free ?? '0'),
        locked: parseFloat(c.locked ?? '0'),
        total:  parseFloat(c.walletBalance ?? c.equity ?? '0'),
      }))
      .filter(b => b.total > 0),
    usdtBalance,
  }
}

// ── Orders ────────────────────────────────────────────────────────────────────

export interface OrderResult {
  orderId: string
  symbol: string
  executedQty: number
  avgPrice: number
  side: 'BUY' | 'SELL'
}

export async function placeMarketBuyWithTPSL(
  apiKey: string,
  apiSecret: string,
  symbol: string,
  usdtAmount: number,
  tpPrice: number,
  slPrice: number,
): Promise<OrderResult> {
  const info = await getSymbolInfo(symbol)
  const price = await getSymbolPrice(symbol)

  const rawQty = usdtAmount / price
  const qty = floorToPrecision(rawQty, info.basePrecision)

  if (parseFloat(qty) < info.minQty) {
    throw new Error(`Quantité trop petite. Minimum: ${info.minQty}`)
  }
  if (parseFloat(qty) * price < info.minOrderAmt) {
    throw new Error(`Montant trop faible. Minimum: $${info.minOrderAmt}`)
  }

  const tp = roundToTick(tpPrice, info.tickSize)
  const sl = roundToTick(slPrice, info.tickSize)

  const result = await bybitRequest('POST', '/v5/order/create', apiKey, apiSecret, {
    category:   'spot',
    symbol,
    side:       'Buy',
    orderType:  'Market',
    qty,
    takeProfit: tp,
    stopLoss:   sl,
    tpslMode:   'Full',
    tpOrderType: 'Market',
    slOrderType: 'Market',
  })

  return {
    orderId:     result.orderId,
    symbol,
    executedQty: parseFloat(qty),
    avgPrice:    price,
    side:        'BUY',
  }
}

export async function cancelAllOrders(
  apiKey: string,
  apiSecret: string,
  symbol: string,
): Promise<void> {
  try {
    await bybitRequest('POST', '/v5/order/cancel-all', apiKey, apiSecret, {
      category: 'spot',
      symbol,
    })
  } catch {
    // Ignore — no open orders
  }
}

export async function placeMarketSell(
  apiKey: string,
  apiSecret: string,
  symbol: string,
  quantity: number,
): Promise<OrderResult> {
  const info = await getSymbolInfo(symbol)
  const price = await getSymbolPrice(symbol)
  const qty = floorToPrecision(quantity, info.basePrecision)

  const result = await bybitRequest('POST', '/v5/order/create', apiKey, apiSecret, {
    category:  'spot',
    symbol,
    side:      'Sell',
    orderType: 'Market',
    qty,
  })

  return {
    orderId:     result.orderId,
    symbol,
    executedQty: parseFloat(qty),
    avgPrice:    price,
    side:        'SELL',
  }
}
