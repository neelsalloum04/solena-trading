'use client'

import { cn } from '@/lib/utils'
import { Calendar, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface CalendarEvent {
  id: string
  time: string
  country: string
  countryFlag: string
  event: string
  forecast: string
  previous: string
  actual: string
  impact: 'high' | 'medium' | 'low'
}

type Tab = 'today' | 'week'

const IMPACT_CONFIG = {
  high: { label: 'Élevé', color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10 border-[#ef4444]/20', dot: '🔴' },
  medium: { label: 'Moyen', color: 'text-[#f97316]', bg: 'bg-[#f97316]/10 border-[#f97316]/20', dot: '🟠' },
  low: { label: 'Faible', color: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10 border-[#22c55e]/20', dot: '🟢' },
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch {
    return '—'
  }
}

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const today = new Date()
  return d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
}

function isPast(iso: string): boolean {
  return new Date(iso) < new Date()
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#0f0f0f] animate-pulse">
      <div className="h-3 bg-[#1a1a1a] rounded w-12 flex-shrink-0" />
      <div className="h-3 bg-[#1a1a1a] rounded w-8 flex-shrink-0" />
      <div className="h-3 bg-[#1a1a1a] rounded flex-1" />
      <div className="h-3 bg-[#1a1a1a] rounded w-12 flex-shrink-0 hidden sm:block" />
      <div className="h-3 bg-[#1a1a1a] rounded w-12 flex-shrink-0 hidden sm:block" />
      <div className="h-4 bg-[#1a1a1a] rounded w-14 flex-shrink-0" />
    </div>
  )
}

function EventRow({ event, showDate }: { event: CalendarEvent; showDate?: boolean }) {
  const impact = IMPACT_CONFIG[event.impact]
  const past = isPast(event.time)
  const hasActual = event.actual && event.actual !== ''

  const actualValue = event.actual || '—'
  const actualVsForecast =
    hasActual && event.forecast && event.forecast !== '—'
      ? parseFloat(event.actual) > parseFloat(event.forecast)
        ? 'better'
        : parseFloat(event.actual) < parseFloat(event.forecast)
          ? 'worse'
          : 'equal'
      : null

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 border-b border-[#080808] transition-colors',
      event.impact === 'high' ? 'hover:bg-[#ef4444]/3' : 'hover:bg-[#0f0f0f]',
      past && 'opacity-60',
    )}>
      {/* Heure */}
      <div className="flex-shrink-0 w-16 text-right">
        {showDate ? (
          <div>
            <p className="text-[10px] text-[#D4AF37] font-semibold">{formatDate(event.time)}</p>
            <p className="text-[11px] font-mono text-[#888]">{formatTime(event.time)}</p>
          </div>
        ) : (
          <p className="text-[11px] font-mono text-[#888]">{formatTime(event.time)}</p>
        )}
      </div>

      {/* Drapeau */}
      <div className="flex-shrink-0 w-6 text-center text-base" title={event.country}>
        {event.countryFlag}
      </div>

      {/* Événement */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-xs font-semibold truncate',
          event.impact === 'high' ? 'text-white' : 'text-[#ccc]'
        )}>
          {event.event}
        </p>
        <p className="text-[10px] text-[#444] truncate">{event.country}</p>
      </div>

      {/* Prévision */}
      <div className="flex-shrink-0 w-16 text-right hidden md:block">
        <p className="text-[10px] text-[#444]">Prévision</p>
        <p className="text-[11px] font-mono text-[#888]">{event.forecast || '—'}</p>
      </div>

      {/* Précédent */}
      <div className="flex-shrink-0 w-16 text-right hidden lg:block">
        <p className="text-[10px] text-[#444]">Précédent</p>
        <p className="text-[11px] font-mono text-[#888]">{event.previous || '—'}</p>
      </div>

      {/* Publié */}
      <div className="flex-shrink-0 w-16 text-right hidden sm:block">
        <p className="text-[10px] text-[#444]">Publié</p>
        <p className={cn(
          'text-[11px] font-mono font-bold',
          hasActual
            ? actualVsForecast === 'better' ? 'text-[#22c55e]'
              : actualVsForecast === 'worse' ? 'text-[#ef4444]'
                : 'text-[#888]'
            : 'text-[#333]'
        )}>
          {actualValue}
        </p>
      </div>

      {/* Impact badge */}
      <div className="flex-shrink-0">
        <span className={cn(
          'text-[10px] font-bold px-1.5 py-0.5 rounded-lg border flex items-center gap-0.5',
          impact.bg
        )}>
          {impact.dot} <span className="hidden sm:inline">{impact.label}</span>
        </span>
      </div>
    </div>
  )
}

export function EconomicCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('today')

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await fetch('/api/economic-calendar')
      const data = await res.json()
      setEvents(Array.isArray(data) ? data : [])
    } catch {
      // Silence
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCalendar()
    const iv = setInterval(fetchCalendar, 30 * 60 * 1000) // 30 min
    return () => clearInterval(iv)
  }, [fetchCalendar])

  const todayEvents = events.filter(e => isToday(e.time))
  const weekEvents = events.filter(e => !isToday(e.time))

  const displayEvents = tab === 'today' ? todayEvents : weekEvents
  const highImpactToday = todayEvents.filter(e => e.impact === 'high').length

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
      {/* En-tête */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#111]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Calendrier Économique</span>
          {highImpactToday > 0 && (
            <span className="text-[10px] font-bold text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 px-1.5 py-0.5 rounded-lg">
              🔴 {highImpactToday} haute importance
            </span>
          )}
        </div>
        <button
          onClick={fetchCalendar}
          className="p-1.5 text-[#444] hover:text-[#D4AF37] transition-colors rounded-lg hover:bg-[#141414]"
          title="Actualiser"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-b border-[#0f0f0f]">
        <button
          onClick={() => setTab('today')}
          className={cn(
            'text-[11px] font-semibold px-3 py-1 rounded-lg transition-colors',
            tab === 'today'
              ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25'
              : 'text-[#555] hover:text-[#F2EDD7] hover:bg-[#141414]'
          )}
        >
          Aujourd'hui
          {!loading && todayEvents.length > 0 && (
            <span className="ml-1.5 text-[9px] bg-[#D4AF37]/20 text-[#D4AF37] rounded px-1">
              {todayEvents.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('week')}
          className={cn(
            'text-[11px] font-semibold px-3 py-1 rounded-lg transition-colors',
            tab === 'week'
              ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25'
              : 'text-[#555] hover:text-[#F2EDD7] hover:bg-[#141414]'
          )}
        >
          Cette semaine
          {!loading && weekEvents.length > 0 && (
            <span className="ml-1.5 text-[9px] bg-[#1a1a1a] text-[#555] rounded px-1">
              {weekEvents.length}
            </span>
          )}
        </button>
      </div>

      {/* En-tête colonnes */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#0f0f0f]">
        <span className="text-[10px] text-[#333] w-16 text-right">Heure</span>
        <span className="text-[10px] text-[#333] w-6" />
        <span className="text-[10px] text-[#333] flex-1">Événement</span>
        <span className="text-[10px] text-[#333] w-16 text-right hidden md:block">Prévision</span>
        <span className="text-[10px] text-[#333] w-16 text-right hidden lg:block">Précédent</span>
        <span className="text-[10px] text-[#333] w-16 text-right hidden sm:block">Publié</span>
        <span className="text-[10px] text-[#333] w-14 text-right">Impact</span>
      </div>

      {/* Événements */}
      <div>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
        ) : displayEvents.length === 0 ? (
          <div className="py-10 text-center text-[#444] text-sm">
            {tab === 'today' ? 'Aucun événement prévu aujourd\'hui' : 'Aucun événement cette semaine'}
          </div>
        ) : (
          displayEvents.map(event => (
            <EventRow
              key={event.id}
              event={event}
              showDate={tab === 'week'}
            />
          ))
        )}
      </div>
    </div>
  )
}
