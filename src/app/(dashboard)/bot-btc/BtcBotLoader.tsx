'use client'

import dynamic from 'next/dynamic'

// dynamic avec ssr:false doit être dans un Client Component
const BtcBotClient = dynamic(
  () => import('./BtcBotClient').then(m => m.BtcBotClient),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
)

export function BtcBotLoader() {
  return <BtcBotClient />
}
