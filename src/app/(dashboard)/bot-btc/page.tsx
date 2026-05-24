import type { Metadata } from 'next'
import { BtcBotClient } from './BtcBotClient'

export const metadata: Metadata = {
  title: 'Robot BTC Scalping IA | PrimeX',
  description: 'Robot de trading intelligent spécialisé Bitcoin — analyse en temps réel, signaux IA, gestion des positions.',
}

export default function BotBtcPage() {
  return <BtcBotClient />
}
