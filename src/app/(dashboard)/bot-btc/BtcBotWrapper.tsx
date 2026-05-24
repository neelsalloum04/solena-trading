'use client'
import dynamic from 'next/dynamic'

function Spinner() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

const BtcBotClientDynamic = dynamic(
  () => import('./BtcBotClient').then(m => ({ default: m.BtcBotClient })),
  { ssr: false, loading: Spinner }
)

export function BtcBotWrapper() {
  return <BtcBotClientDynamic />
}
