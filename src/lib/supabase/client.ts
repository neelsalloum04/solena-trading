import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function isConfigured() {
  if (!supabaseUrl || !supabaseAnonKey) return false
  if (supabaseUrl.includes('your-project')) return false
  if (supabaseAnonKey === 'your-anon-key') return false
  return true
}

export function createClient() {
  if (!isConfigured()) {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase non configuré.' } }),
        signUp: async () => ({ data: null, error: { message: 'Supabase non configuré.' } }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        upsert: () => Promise.resolve({ error: null }),
      }),
    } as any
  }

  return createBrowserClient(supabaseUrl!, supabaseAnonKey!)
}
