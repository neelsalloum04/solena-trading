import {
  cancelOCO,
  getAccountInfo,
  placeMarketOrder,
  placeMarketSell,
  placeOCOSell,
} from '@/lib/broker/binance'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// POST — Open a live trade: market BUY + OCO for SL/TP
export async function POST(req: NextRequest) {
  try {
    const { apiKey, apiSecret, symbol, usdtAmount, tpPrice, slPrice } = await req.json()

    if (!apiKey || !apiSecret || !symbol || !usdtAmount || !tpPrice || !slPrice) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    // Verify account can trade
    const account = await getAccountInfo(apiKey, apiSecret)
    if (!account.canTrade) {
      return NextResponse.json({ error: 'Le compte Binance n\'a pas la permission de trader.' }, { status: 403 })
    }
    if (account.usdtBalance < usdtAmount) {
      return NextResponse.json({ error: `Solde insuffisant. Disponible: $${account.usdtBalance.toFixed(2)}` }, { status: 400 })
    }

    // 1. Market BUY
    const entry = await placeMarketOrder(apiKey, apiSecret, symbol, 'BUY', usdtAmount)

    // 2. OCO SELL (SL + TP)
    let oco = null
    try {
      oco = await placeOCOSell(apiKey, apiSecret, symbol, entry.executedQty, tpPrice, slPrice)
    } catch (ocoErr: any) {
      // OCO failed — try to close the position immediately to avoid unprotected exposure
      try { await placeMarketSell(apiKey, apiSecret, symbol, entry.executedQty) } catch {}
      return NextResponse.json({
        error: `Ordre d'entrée exécuté mais OCO échoué: ${ocoErr.message}. Position fermée immédiatement.`
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      entryOrderId:  entry.orderId,
      avgEntryPrice: entry.avgPrice,
      executedQty:   entry.executedQty,
      orderListId:   oco.orderListId,
      tpOrderId:     oco.tpOrderId,
      slOrderId:     oco.slOrderId,
    })
  } catch (err: any) {
    const msg: string = err?.message ?? 'Erreur inconnue'
    const hint = msg.includes('Signature') || msg.includes('Invalid')
      ? 'Clé API invalide. Vérifie tes clés Binance.'
      : msg.includes('insufficient')
      ? 'Solde insuffisant sur Binance.'
      : msg.includes('MIN_NOTIONAL') || msg.includes('trop faible')
      ? 'Montant trop faible (minimum $10 par trade).'
      : msg
    return NextResponse.json({ error: hint }, { status: 400 })
  }
}

// DELETE — Close a live position (market SELL + cancel OCO)
export async function DELETE(req: NextRequest) {
  try {
    const { apiKey, apiSecret, symbol, quantity, orderListId } = await req.json()

    if (!apiKey || !apiSecret || !symbol || !quantity) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    // Cancel OCO first
    if (orderListId) {
      try { await cancelOCO(apiKey, apiSecret, symbol, orderListId) } catch {}
    }

    // Market SELL to close
    const result = await placeMarketSell(apiKey, apiSecret, symbol, quantity)

    return NextResponse.json({
      ok: true,
      closeOrderId: result.orderId,
      avgClosePrice: result.avgPrice,
      executedQty:   result.executedQty,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Erreur inconnue' }, { status: 400 })
  }
}
