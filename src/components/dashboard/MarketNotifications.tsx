'use client'

import { cn } from '@/lib/utils'
import { Bell, BellOff, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface Notification {
  id: string
  title: string
  message: string
  time: Date
  type: 'alert' | 'news' | 'signal' | 'system'
  read: boolean
  impact?: 'high' | 'medium' | 'low'
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: 'Bitcoin franchit 108 000$',
    message: 'BTC/USD atteint un nouveau sommet — hausse de +1.7% en 24h',
    time: new Date(Date.now() - 10 * 60 * 1000),
    type: 'alert',
    read: false,
    impact: 'high',
  },
  {
    id: 'n2',
    title: 'Calendrier économique',
    message: 'NFP américain publié dans 2 heures — impact élevé anticipé',
    time: new Date(Date.now() - 30 * 60 * 1000),
    type: 'news',
    read: false,
    impact: 'high',
  },
  {
    id: 'n3',
    title: 'Signal EUR/USD',
    message: 'Opportunité SELL détectée sur EUR/USD — résistance à 1.0870',
    time: new Date(Date.now() - 45 * 60 * 1000),
    type: 'signal',
    read: false,
    impact: 'medium',
  },
  {
    id: 'n4',
    title: 'Marché actions ouvert',
    message: 'NYSE et NASDAQ ont ouvert — S&P 500 en hausse de +0.36%',
    time: new Date(Date.now() - 2 * 3600 * 1000),
    type: 'system',
    read: true,
    impact: 'low',
  },
]

const TYPE_CONFIG = {
  alert: { color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10 border-[#ef4444]/20', icon: '🚨' },
  news: { color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10 border-[#D4AF37]/20', icon: '📰' },
  signal: { color: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10 border-[#22c55e]/20', icon: '📡' },
  system: { color: 'text-[#818cf8]', bg: 'bg-[#818cf8]/10 border-[#818cf8]/20', icon: '⚙️' },
}

function timeAgo(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}j`
}

export function MarketNotifications() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS)
  const [enabled, setEnabled] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  // Fermer en cliquant à l'extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function deleteNotification(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bouton cloche */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'relative p-2 rounded-xl transition-colors',
          open
            ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25'
            : 'text-[#555] hover:text-[#F2EDD7] hover:bg-[#141414] border border-transparent'
        )}
        title="Notifications"
      >
        {enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        {unreadCount > 0 && enabled && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-[#ef4444] text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className={cn(
          'absolute right-0 top-12 w-80 sm:w-96 z-50',
          'bg-[#0e0e0e] border border-[#222] rounded-2xl shadow-2xl overflow-hidden',
        )}>
          {/* En-tête panel */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm font-bold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 px-1.5 py-0.5 rounded-lg">
                  {unreadCount} nouvelles
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Toggle activé/désactivé */}
              <button
                onClick={() => setEnabled(e => !e)}
                className={cn(
                  'p-1.5 rounded-lg text-[11px] font-semibold transition-colors',
                  enabled
                    ? 'text-[#22c55e] hover:bg-[#22c55e]/10'
                    : 'text-[#555] hover:bg-[#1a1a1a]'
                )}
                title={enabled ? 'Désactiver les notifications' : 'Activer les notifications'}
              >
                {enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-[#D4AF37] hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-[#141414]"
                >
                  Tout lire
                </button>
              )}
            </div>
          </div>

          {/* Liste notifications */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-[#444] text-sm">
                Aucune notification
              </div>
            ) : (
              notifications.map(notif => {
                const config = TYPE_CONFIG[notif.type]
                return (
                  <div
                    key={notif.id}
                    onClick={() => markRead(notif.id)}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 border-b border-[#111] cursor-pointer transition-colors',
                      notif.read ? 'opacity-50 hover:opacity-70' : 'hover:bg-[#141414]'
                    )}
                  >
                    {/* Indicateur non-lu */}
                    <div className="flex-shrink-0 mt-1">
                      {!notif.read ? (
                        <span className="w-2 h-2 bg-[#D4AF37] rounded-full block" />
                      ) : (
                        <span className="w-2 h-2 rounded-full block" />
                      )}
                    </div>

                    {/* Icône type */}
                    <div className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base border',
                      config.bg
                    )}>
                      {config.icon}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{notif.title}</p>
                      <p className="text-[11px] text-[#666] leading-snug mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-[#444] mt-1">{timeAgo(notif.time)}</p>
                    </div>

                    {/* Supprimer */}
                    <button
                      onClick={e => { e.stopPropagation(); deleteNotification(notif.id) }}
                      className="flex-shrink-0 p-1 text-[#333] hover:text-[#ef4444] transition-colors rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Pied de page */}
          <div className="px-4 py-2.5 border-t border-[#1a1a1a] flex items-center justify-between">
            <span className="text-[10px] text-[#444]">
              Alertes {enabled ? 'activées' : 'désactivées'}
            </span>
            <button
              onClick={() => setNotifications([])}
              className="text-[10px] text-[#444] hover:text-[#ef4444] transition-colors"
            >
              Tout effacer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
