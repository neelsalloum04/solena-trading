import { MobileBottomNav, MobileHeader } from '@/components/layout/MobileNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { TokenBar } from '@/components/layout/TokenBar'
import { TokenProvider } from '@/contexts/TokenContext'
import { UserPlanProvider } from '@/contexts/UserPlanContext'
import { normalizePlan, PLAN_TOKEN_LIMITS } from '@/lib/plans'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null }

  const plan          = normalizePlan(profile?.plan)
  const tokenBalance  = profile?.token_balance  ?? PLAN_TOKEN_LIMITS[plan]
  const tokenLimit    = profile?.token_monthly_limit ?? PLAN_TOKEN_LIMITS[plan]

  const mockUser = {
    email: user?.email || 'trader@solena.ai',
    full_name: profile?.full_name || null,
    plan,
  }

  return (
    <UserPlanProvider plan={plan}>
      <TokenProvider
        userId={user?.id ?? ''}
        initialBalance={tokenBalance}
        initialLimit={tokenLimit}
      >
        <div className="flex h-screen overflow-hidden bg-[#080808]">
          <div className="hidden md:flex">
            <Sidebar user={mockUser} />
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <MobileHeader />
            <TokenBar />
            <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
              {children}
            </main>
          </div>

          <MobileBottomNav />
        </div>
      </TokenProvider>
    </UserPlanProvider>
  )
}
