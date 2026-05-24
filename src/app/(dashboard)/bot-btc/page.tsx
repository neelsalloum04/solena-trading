import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

export const metadata: Metadata = {
  title: 'Robot BTC Scalping IA | PrimeX',
  description: 'Robot de trading intelligent spécialisé Bitcoin — analyse en temps réel, signaux IA, gestion des positions.',
}

// SSR désactivé — le composant utilise localStorage et a des états conditionnels
// qui causent un mismatch hydratation → erreur insertBefore
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

export default function BotBtcPage() {
  return <BtcBotClient />
}
