'use client'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { BarChart2, ImageIcon, LogOut, MessageSquare, Settings, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo } from 'react'

// ─── V1 : uniquement Chat IA + Analyse Graphique ─────────────────────────────
// Les autres modules (Dashboard, Portfolio, Signaux, Robot BTC, etc.)
// sont conservés dans le code mais masqués de la navigation.

const NAV = [
  { label: 'Marchés',           href: '/dashboard', icon: TrendingUp   },
  { label: 'Assistant IA',      href: '/chat',      icon: MessageSquare },
  { label: 'Analyse Graphique', href: '/analyse',   icon: ImageIcon    },
]

interface SidebarProps {
  user?: { email: string; full_name?: string | null; plan?: string }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex flex-col h-screen w-[220px] bg-[#0a0a0a] border-r border-[#1a1a1a] sticky top-0 z-40">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[#1a1a1a] flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <Image src="/primex-logo-dark.webp" alt="PrimeX" width={30} height={30} className="rounded-lg flex-shrink-0" />
          <span className="font-black text-base text-[#D4AF37] tracking-tight">PrimeX</span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/15'
                  : 'text-[#666] hover:text-[#F2EDD7] hover:bg-[#141414]'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom — user + settings */}
      <div className="px-3 py-3 border-t border-[#1a1a1a] space-y-1">
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#555] hover:text-[#F2EDD7] hover:bg-[#141414] transition-all">
          <Settings className="w-4 h-4 flex-shrink-0" />
          <span>Paramètres</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#141414] transition-all group"
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
      </div>
    </aside>
  )
}
