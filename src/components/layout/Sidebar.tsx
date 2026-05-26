'use client'
import { createClient } from '@/lib/supabase/client'
import { useUserPlan } from '@/contexts/UserPlanContext'
import { cn } from '@/lib/utils'
import {
  ChevronUp,
  CreditCard,
  HelpCircle,
  ImageIcon,
  Lock,
  LogOut,
  MessageSquare,
  Settings,
  Zap,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

const NAV = [
  { label: 'Assistant IA',      href: '/chat',    icon: MessageSquare, live: false },
  { label: 'Analyse Graphique', href: '/analyse', icon: ImageIcon,     live: false },
  { label: 'Signaux Crypto',    href: '/signals', icon: Zap,           live: true  },
]

interface SidebarProps {
  user?: { email: string; full_name?: string | null; plan?: string }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname      = usePathname()
  const router        = useRouter()
  const supabase      = useMemo(() => createClient(), [])
  const { canAccess } = useUserPlan()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleLogout = async () => {
    setMenuOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initial = user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'

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
          const locked = item.href === '/signals' && !canAccess('starter')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/15'
                  : locked
                    ? 'text-[#444] opacity-50 cursor-default'
                    : 'text-[#666] hover:text-[#F2EDD7] hover:bg-[#141414]'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {locked && <Lock className="ml-auto w-3 h-3 text-[#555]" />}
              {!locked && item.live && !active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              )}
              {!locked && active && <span className="ml-auto w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-[#1a1a1a] space-y-1">
        <Link
          href="/support"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
            pathname === '/support'
              ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/15'
              : 'text-[#555] hover:text-[#F2EDD7] hover:bg-[#141414]'
          )}
        >
          <HelpCircle className="w-4 h-4 flex-shrink-0" />
          <span>Assistance IA</span>
        </Link>

        {/* Profile button + dropdown */}
        <div className="relative" ref={menuRef}>

          {/* Dropdown (opens upward) */}
          {menuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#111] border border-[#222] rounded-2xl overflow-hidden shadow-2xl shadow-black/60 z-50">
              {/* User header */}
              <div className="px-4 py-3 border-b border-[#1a1a1a]">
                <p className="text-xs font-semibold text-[#F2EDD7] truncate">{user?.full_name || 'Trader'}</p>
                <p className="text-[10px] text-[#555] truncate mt-0.5">{user?.email}</p>
              </div>

              <div className="p-1.5 space-y-0.5">
                <Link
                  href="/settings?tab=profil"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#999] hover:text-[#F2EDD7] hover:bg-[#181818] transition-all"
                >
                  <Settings className="w-4 h-4 flex-shrink-0" />
                  <span>Mon profil</span>
                </Link>
                <Link
                  href="/settings?tab=securite"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#999] hover:text-[#F2EDD7] hover:bg-[#181818] transition-all"
                >
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  <span>Mot de passe</span>
                </Link>
                <Link
                  href="/plans"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#999] hover:text-[#F2EDD7] hover:bg-[#181818] transition-all"
                >
                  <CreditCard className="w-4 h-4 flex-shrink-0" />
                  <span>Changer de forfait</span>
                </Link>
                <Link
                  href="/support"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#999] hover:text-[#F2EDD7] hover:bg-[#181818] transition-all"
                >
                  <HelpCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Assistance IA</span>
                </Link>
              </div>

              <div className="p-1.5 border-t border-[#1a1a1a]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#ef4444]/70 hover:text-[#ef4444] hover:bg-[#ef4444]/8 transition-all"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          )}

          {/* Profile trigger */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
              menuOpen ? 'bg-[#141414]' : 'hover:bg-[#141414]'
            )}
          >
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-[#D4AF37]">{initial}</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-[#F2EDD7] truncate">{user?.full_name || 'Trader'}</p>
              <p className="text-[10px] text-[#555] truncate">{user?.email}</p>
            </div>
            <ChevronUp
              className={cn('w-3.5 h-3.5 text-[#444] flex-shrink-0 transition-transform duration-200', menuOpen ? 'rotate-180' : '')}
            />
          </button>
        </div>
      </div>
    </aside>
  )
}
