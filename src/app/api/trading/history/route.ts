import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const limit  = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
    const offset = parseInt(searchParams.get('offset') ?? '0')
    const mode   = searchParams.get('mode')

    let q = supabase.from('trades').select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('closed_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (mode) q = q.eq('mode', mode)

    const { data: trades, count } = await q

    return NextResponse.json({ trades: trades ?? [], total: count ?? 0 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
