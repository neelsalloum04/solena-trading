import {
  cancelAllOrders,
  getAccountInfo,
  placeMarketBuyWithTPSL,
  placeMarketSell,
} from '@/lib/broker/bybit'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// POST — Open a live trade: market BUY with native TP/SL (Bybit)
export async function POST(req: NextRequest) {
  try {
    const { apiKey, apiSecret, symbol, usdtAmount, tpPrice, slPrice } = await req.json()

    if (!apiKey || !apiSecret || !symbol || !usdtAmount || !tpPrice || !slPrice) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    // Verify account can trade
    const account = await getAccountInfo(apiKey, apiSecret)
    if (!account.canTrade) {
      return NextResponse.json({ error: "Le compte Bybit n'a pas la permission de trader." }, { status: 403 })
    }
    if (account.usdtBalance < usdtAmount) {
      return NextResponse.json({ error: `Solde insuffisant. Disponible: $${account.usdtBalance.toFixed(2)}` }, { status: 400 })
    }

    // Market BUY with TP/SL in a single Bybit order
    const entry = await placeMarketBuyWithTPSL(apiKey, apiSecret, symbol, usdtAmount, tpPrice, slPrice)

    return NextResponse.json({
      ok: true,
      entryOrderId:  entry.orderId,
      avgEntryPrice: entry.avgPrice,
      executedQty:   entry.executedQty,
    })
  } catch (err: any) {
    const msg: string = err?.message ?? 'Erreur inconnue'
    const hint = msg.includes('signature') || msg.includes('Invalid')
      ? 'Clé API invalide. Vérifie tes clés Bybit.'
      : msg.includes('insufficient') || msg.includes('Solde')
      ? 'Solde insuffisant sur Bybit.'
      : msg.includes('trop faible') || msg.includes('trop petite')
      ? 'Montant trop faible (minimum $10 par trade).'
      : msg
    return NextResponse.json({ error: hint }, { status: 400 })
  }
}

// DELETE — Close a live position (cancel TP/SL orders + market SELL)
export async function DELETE(req: NextRequest) {
  try {
    const { apiKey, apiSecret, symbol, quantity } = await req.json()

    if (!apiKey || !apiSecret || !symbol || !quantity) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    // Cancel all open TP/SL orders first
    await cancelAllOrders(apiKey, apiSecret, symbol)

    // Market SELL to close
    const result = await placeMarketSell(apiKey, apiSecret, symbol, quantity)

    return NextResponse.json({
      ok: true,
      closeOrderId:  result.orderId,
      avgClosePrice: result.avgPrice,
      executedQty:   result.executedQty,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Erreur inconnue' }, { status: 400 })
  }
}
