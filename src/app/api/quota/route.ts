import { getUserFromRequest } from '@/lib/supabase/auth-api'
import { getQuota } from '@/lib/supabase/quota'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { user } = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const type = (req.nextUrl.searchParams.get('type') ?? 'analyse') as 'analyse' | 'chat'
  const quota = await getQuota(user.id, type)

  return NextResponse.json(quota)
}
