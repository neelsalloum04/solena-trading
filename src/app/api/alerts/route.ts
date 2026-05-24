import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { coin_id, coin_symbol, coin_name, target_price, direction } = body

  if (!coin_id || !coin_symbol || !coin_name || !target_price || !direction) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  // Plans free et starter : max 3 alertes actives
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = profile?.plan ?? 'free'
  if (plan === 'free' || plan === 'starter') {
    const { count } = await supabase
      .from('price_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('active', true)

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Limite de 3 alertes actives atteinte. Passez au plan Pro pour des alertes illimitées.' },
        { status: 403 }
      )
    }
  }

  const { data, error } = await supabase
    .from('price_alerts')
    .insert({
      user_id: user.id,
      coin_id,
      coin_symbol,
      coin_name,
      target_price: Number(target_price),
      direction,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const { error } = await supabase
    .from('price_alerts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
