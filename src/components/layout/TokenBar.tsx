'use client'
import { useTokens } from '@/contexts/TokenContext'

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return Math.round(n / 1_000) + 'k'
  return n.toString()
}

export function TokenBar() {
  const { tokenBalance, tokenLimit } = useTokens()
  const pct   = tokenLimit > 0 ? Math.min(100, (tokenBalance / tokenLimit) * 100) : 0
  const color = pct > 50 ? '#22c55e' : pct > 20 ? '#D4AF37' : '#ef4444'

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1a1a1a] bg-[#0a0a0a] flex-shrink-0">
      <span className="text-[10px] font-semibold text-[#444] whitespace-nowrap">
        Tokens restants
      </span>
      <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-bold tabular-nums whitespace-nowrap" style={{ color }}>
        {fmt(tokenBalance)} / {fmt(tokenLimit)}
      </span>
    </div>
  )
}
