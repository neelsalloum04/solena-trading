import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function isConfigured() {
  if (!supabaseUrl || !supabaseAnonKey) return false
  if (supabaseUrl.includes('your-project')) return false
  if (supabaseAnonKey === 'your-anon-key') return false
  return true
}

function mockClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      upsert: () => Promise.resolve({ error: null }),
    }),
  } as any
}

export async function createClient() {
  if (!isConfigured()) return mockClient()

  const cookieStore = await cookies()
  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
      },
    },
  })
}

export async function createAdminClient() {
  if (!isConfigured() || !serviceRoleKey || serviceRoleKey === 'your-service-role-key') {
    return mockClient()
  }

  // Use the base supabase-js client for admin — no cookie management needed for service role
  return createSupabaseClient(supabaseUrl!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
