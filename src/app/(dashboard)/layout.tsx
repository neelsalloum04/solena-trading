import { MobileBottomNav, MobileHeader } from '@/components/layout/MobileNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { TickerBar } from '@/components/layout/TickerBar'
import { UserPlanProvider } from '@/contexts/UserPlanContext'
import { normalizePlan } from '@/lib/plans'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null }

  const plan = normalizePlan(profile?.plan)

  const mockUser = {
    email: user?.email || 'trader@solena.ai',
    full_name: profile?.full_name || null,
    plan,
  }

  return (
    <UserPlanProvider plan={plan}>
      <div className="flex h-screen overflow-hidden bg-[#080808]">
        <div className="hidden md:flex">
          <Sidebar user={mockUser} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <MobileHeader />
          <TickerBar />
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
            {children}
          </main>
        </div>

        <MobileBottomNav />
      </div>
    </UserPlanProvider>
  )
}
