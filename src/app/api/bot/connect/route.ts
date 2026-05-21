import { getAccountInfo } from '@/lib/broker/binance'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { apiKey, apiSecret } = await req.json()
    if (!apiKey?.trim() || !apiSecret?.trim())
      return NextResponse.json({ error: 'Clé API et clé secrète requises.' }, { status: 400 })

    const info = await getAccountInfo(apiKey.trim(), apiSecret.trim())

    return NextResponse.json({
      ok: true,
      canTrade: info.canTrade,
      permissions: info.permissions,
      usdtBalance: info.usdtBalance,
      balances: info.balances.slice(0, 10),
    })
  } catch (error: any) {
    const msg: string = error?.message ?? 'Erreur inconnue'
    const hint =
      msg.includes('Signature') || msg.includes('Invalid') || msg.includes('1100')
        ? 'Clé API invalide ou permissions insuffisantes.'
        : msg.includes('IP') || msg.includes('restriction')
        ? 'IP non autorisée — vérifie les restrictions IP dans Binance.'
        : msg
    return NextResponse.json({ error: hint }, { status: 400 })
  }
}
