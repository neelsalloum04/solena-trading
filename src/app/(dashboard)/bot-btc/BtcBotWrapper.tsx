'use client'
import dynamic from 'next/dynamic'

// Pas de loading prop : le serveur envoie rien, le client monte BtcBotClient
// directement dans un parent vide → zéro insertBefore sur nœud existant.
const BtcBotClientDynamic = dynamic(
  () => import('./BtcBotClient').then(m => ({ default: m.BtcBotClient })),
  { ssr: false }
)

export function BtcBotWrapper() {
  return <BtcBotClientDynamic />
}
