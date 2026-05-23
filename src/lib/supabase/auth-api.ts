import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'

export async function getUserFromRequest(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return { user: null }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return req.cookies.getAll() },
      setAll() {},
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  return { user }
}
