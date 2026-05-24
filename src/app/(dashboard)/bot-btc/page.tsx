import type { Metadata } from 'next'
import { BtcBotWrapper } from './BtcBotWrapper'

export const metadata: Metadata = {
  title: 'Robot BTC Scalping IA | PrimeX',
  description: 'Robot de trading intelligent spécialisé Bitcoin — analyse en temps réel, signaux IA, gestion des positions.',
}

export default function BotBtcPage() {
  return <BtcBotWrapper />
}
