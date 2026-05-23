'use client'
import { cn } from '@/lib/utils'
import { Bot, LayoutDashboard, MessageSquare, Newspaper, Radio } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Dashboard', href: '/dashboard',   icon: LayoutDashboard },
  { label: 'Infos',     href: '/info-minute', icon: Newspaper },
  { label: 'Chat',      href: '/chat',        icon: MessageSquare },
  { label: 'Signaux',   href: '/signals',     icon: Radio },
  { label: 'Bot',       href: '/bot',         icon: Bot },
]

export function MobileHeader() {
  return (
    <header className="md:hidden flex items-center justify-between px-4 h-14 bg-[#0a0a0a] border-b border-[#1a1a1a] flex-shrink-0 sticky top-0 z-40">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image src="/primex-logo-dark.webp" alt="PrimeX" width={28} height={28} className="rounded-lg" />
        <span className="font-black text-base text-[#D4AF37] tracking-tight">PrimeX</span>
      </Link>
      <div className="flex items-center gap-1.5 bg-[#22c55e]/5 border border-[#22c55e]/20 px-2.5 py-1 rounded-lg">
        <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
        <span className="text-[10px] font-bold text-[#22c55e]">LIVE</span>
      </div>
    </header>
  )
}

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-[#1a1a1a]">
      <div className="flex items-stretch h-16">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-150',
                active ? 'text-[#D4AF37]' : 'text-[#555]'
              )}
            >
              <item.icon className={cn('w-5 h-5', active && 'drop-shadow-[0_0_6px_#D4AF37]')} />
              <span className={cn('text-[9px] font-semibold tracking-wide', active ? 'text-[#D4AF37]' : 'text-[#444]')}>
                {item.label}
              </span>
              {item.href === '/signals' && (
                <span className="absolute top-2 w-1 h-1 bg-[#22c55e] rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
