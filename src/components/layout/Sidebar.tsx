'use client'
import { useUserPlan } from '@/contexts/UserPlanContext'
import { createClient } from '@/lib/supabase/client'
import { FREE_TRIAL_ROUTES, PLAN_META, getRequiredPlan, hasAccess, normalizePlan, type PlanId } from '@/lib/plans'
import { cn } from '@/lib/utils'
import {
  BarChart2,
  Bot,
  ChevronLeft,
  HelpCircle,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquare,
  Newspaper,
  Radio,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

const NAV = [
  { label: 'Dashboard',    href: '/dashboard',    icon: LayoutDashboard },
  { label: 'Info Minute',  href: '/info-minute',  icon: Newspaper       },
  { label: 'Chat IA',      href: '/chat',         icon: MessageSquare   },
  { label: 'Signaux Live', href: '/signals',      icon: Radio           },
  { label: 'Trading Bot',  href: '/bot',          icon: Bot             },
  { label: 'Analytics',    href: '/analytics',    icon: BarChart2       },
]

const BOTTOM_NAV = [
  { label: 'Support',      href: '/support',  icon: HelpCircle  },
  { label: 'Paramètres',   href: '/settings', icon: Settings    },
  { label: 'Admin',        href: '/admin',    icon: ShieldCheck, adminOnly: true },
]

interface SidebarProps {
  user?: { email: string; full_name?: string | null; plan?: string }
}

const PLAN_COLORS: Record<string, string> = {
  free:     'text-[#666]',
  starter:  'text-[#38bdf8]',
  pro:      'text-[#D4AF37]',
  premium:  'text-[#22c55e]',
  admin:    'text-[#a78bfa]',
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const { plan, isAdmin } = useUserPlan()

  const planMeta = plan !== 'admin' ? PLAN_META[plan] : null
  const planColor = PLAN_COLORS[plan] ?? 'text-[#D4AF37]'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className={cn(
      'flex flex-col h-screen bg-[#0a0a0a] border-r border-[#1a1a1a] sticky top-0 z-40 transition-all duration-300',
      collapsed ? 'w-[60px]' : 'w-[220px]'
    )}>

      {/* Logo */}
      <div className="flex items-center justify-between px-3 h-16 border-b border-[#1a1a1a] flex-shrink-0">
        {!collapsed ? (
          <>
            <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
              <Image src="/primex-logo-dark.webp" alt="PrimeX" width={30} height={30} className="rounded-lg flex-shrink-0" />
              <span className="font-black text-base text-[#D4AF37] tracking-tight truncate">PrimeX</span>
            </Link>
            <button onClick={() => setCollapsed(true)} className="p-1.5 rounded-lg text-[#555] hover:text-[#D4AF37] hover:bg-[#141414] transition-colors flex-shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center w-full gap-2 py-1">
            <Image src="/primex-logo-dark.webp" alt="PrimeX" width={30} height={30} className="rounded-lg" />
            <button onClick={() => setCollapsed(false)} className="p-1 rounded-lg text-[#555] hover:text-[#D4AF37] hover:bg-[#141414] transition-colors">
              <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        )}
      </div>

      {/* Plan badge */}
      {!collapsed && (
        <div className="px-3 py-2.5 border-b border-[#1a1a1a]">
          <Link href="/settings#subscription">
            <div className="flex items-center gap-1.5 bg-[#141414] border border-[#1a1a1a] hover:border-[#D4AF37]/30 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer">
              <Zap className={cn('w-3 h-3 flex-shrink-0', planColor)} />
              <span className={cn('text-xs font-bold capitalize truncate', planColor)}>
                {planMeta?.label ?? 'Admin'}
              </span>
              {plan === 'free' && (
                <span className="ml-auto text-[9px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded flex-shrink-0">UPGRADE</span>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {NAV.map((item) => {
          const required = getRequiredPlan(item.href)
          const locked = !hasAccess(plan, required)
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const isFreeTrial = plan === 'free' && FREE_TRIAL_ROUTES.has(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 relative',
                active
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20'
                  : locked
                  ? 'text-[#383838] hover:bg-[#0f0f0f] cursor-pointer'
                  : 'text-[#666] hover:text-[#F2EDD7] hover:bg-[#141414]',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="font-medium flex-1">{item.label}</span>
                  {locked && <Lock className="w-3 h-3 text-[#333] flex-shrink-0" />}
                  {isFreeTrial && !active && (
                    <span className="text-[9px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded flex-shrink-0">
                      ESSAI
                    </span>
                  )}
                  {!locked && !isFreeTrial && item.href === '/signals' && (
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
                      <span className="text-[9px] text-[#22c55e] font-bold">LIVE</span>
                    </span>
                  )}
                </>
              )}
              {collapsed && locked && (
                <Lock className="w-2.5 h-2.5 text-[#333] absolute bottom-1 right-1" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-2 border-t border-[#1a1a1a] space-y-0.5">
        {BOTTOM_NAV.filter(item => !item.adminOnly || isAdmin).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#555] hover:text-[#F2EDD7] hover:bg-[#141414] transition-colors',
              collapsed && 'justify-center px-2'
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}

        {/* User */}
        {!collapsed ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[#141414] transition-colors group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-[#D4AF37]">
                {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-[#F2EDD7] truncate">{user?.full_name || 'Trader'}</p>
              <p className="text-[10px] text-[#555] truncate">{user?.email}</p>
            </div>
            <LogOut className="w-3.5 h-3.5 text-[#444] group-hover:text-[#ef4444] transition-colors flex-shrink-0" />
          </button>
        ) : (
          <button onClick={handleLogout} className="flex justify-center w-full py-2">
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/20 flex items-center justify-center">
              <span className="text-xs font-bold text-[#D4AF37]">
                {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          </button>
        )}
      </div>
    </aside>
  )
}
