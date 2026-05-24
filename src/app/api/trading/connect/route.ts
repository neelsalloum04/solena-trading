import { encrypt } from '@/lib/bybit/encryption'
import { verifyApiKeys } from '@/lib/bybit/client'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { apiKey, apiSecret, mode } = await req.json()
    if (!apiKey?.trim() || !apiSecret?.trim()) {
      return NextResponse.json({ error: 'Clés API requises' }, { status: 400 })
    }

    // Vérification des clés sur Bybit
    const check = await verifyApiKeys(apiKey.trim(), apiSecret.trim())
    if (!check.valid) {
      return NextResponse.json({ error: 'Clés API invalides ou permissions insuffisantes' }, { status: 400 })
    }

    // Chiffrement AES-256-GCM
    const apiKeyEnc    = encrypt(apiKey.trim())
    const apiSecretEnc = encrypt(apiSecret.trim())

    // Upsert dans Supabase
    const { error } = await supabase.from('bybit_credentials').upsert({
      user_id:         user.id,
      api_key_enc:     apiKeyEnc,
      api_secret_enc:  apiSecretEnc,
      api_key_preview: apiKey.slice(0, 8) + '...',
      is_valid:        true,
      permissions:     check.permissions,
      validated_at:    new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (error) throw error

    // Créer session robot si inexistante
    await supabase.from('bot_sessions').upsert({
      user_id: user.id, mode: mode ?? 'paper', is_active: false,
    }, { onConflict: 'user_id' })

    // Créer paramètres risque par défaut si inexistants
    await supabase.from('risk_settings').upsert({
      user_id: user.id,
    }, { onConflict: 'user_id' })

    // Créer compte paper si inexistant
    await supabase.from('paper_accounts').upsert({
      user_id: user.id, balance: 10000, initial_balance: 10000,
    }, { onConflict: 'user_id' })

    return NextResponse.json({
      success:     true,
      balance:     check.balance,
      permissions: check.permissions,
      preview:     apiKey.slice(0, 8) + '...',
    })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    await supabase.from('bybit_credentials').delete().eq('user_id', user.id)
    await supabase.from('bot_sessions').update({ is_active: false, mode: 'paper' }).eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
