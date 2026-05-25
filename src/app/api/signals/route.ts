import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const category  = searchParams.get('category')  ?? 'all'
    const timeframe = searchParams.get('timeframe')  ?? 'all'
    const direction = searchParams.get('direction')  ?? 'all'
    const limit     = Math.min(200, parseInt(searchParams.get('limit') ?? '100', 10))

    const supabase = await createAdminClient()
    let query = supabase
      .from('signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (category  !== 'all') query = query.eq('category', category)
    if (timeframe !== 'all') query = query.eq('timeframe', timeframe)
    if (direction !== 'all') query = query.eq('direction', direction)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ signals: data ?? [], total: data?.length ?? 0 })
  } catch (err: any) {
    console.error('[api/signals]', err?.message)
    return NextResponse.json({ signals: [], total: 0, error: err?.message }, { status: 500 })
  }
}
