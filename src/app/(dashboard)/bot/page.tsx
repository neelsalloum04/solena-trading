'use client'
import dynamic from 'next/dynamic'

// Disable SSR entirely for the bot page — it uses localStorage, confirm(), and
// complex conditional rendering that causes React hydration mismatches.
const BotClient = dynamic(() => import('./BotClient'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[#555] text-sm">Chargement du bot…</p>
      </div>
    </div>
  ),
})

export default function BotPage() {
  return <BotClient />
}
