import { Sidebar } from '@/components/layout/Sidebar'
import { TickerBar } from '@/components/layout/TickerBar'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null }

  const mockUser = {
    email: user?.email || 'trader@solena.ai',
    full_name: profile?.full_name || null,
    plan: profile?.plan || 'starter',
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#080808]">
      <Sidebar user={mockUser} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TickerBar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
