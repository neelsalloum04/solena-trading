'use client'
import { cn } from '@/lib/utils'
import type { ImpactLevel, InfoItem, NewsCategory } from '@/app/api/info-minute/route'
import {
  AlertTriangle,
  Bell,
  BellOff,
  Calendar,
  ChevronRight,
  Clock,
  ExternalLink,
  Newspaper,
  RefreshCw,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

// ── constants ──────────────────────────────────────────────────────────────────

const FILTERS: { key: NewsCategory | 'all'; label: string }[] = [
  { key: 'all',      label: 'Tout' },
  { key: 'forex',    label: 'Forex' },
  { key: 'crypto',   label: 'Crypto' },
  { key: 'actions',  label: 'Actions' },
  { key: 'indices',  label: 'Indices' },
  { key: 'matieres', label: 'Matières' },
  { key: 'economie', label: 'Économie' },
]

const IMPACT_CONFIG: Record<ImpactLevel, { label: string; dot: string; badge: string; text: string }> = {
  high:   { label: 'Élevé',  dot: 'bg-[#ef4444]', badge: 'bg-[#ef4444]/10 border-[#ef4444]/30', text: 'text-[#ef4444]' },
  medium: { label: 'Moyen',  dot: 'bg-[#f97316]', badge: 'bg-[#f97316]/10 border-[#f97316]/30', text: 'text-[#f97316]' },
  low:    { label: 'Faible', dot: 'bg-[#22c55e]', badge: 'bg-[#22c55e]/10 border-[#22c55e]/30', text: 'text-[#22c55e]' },
}

const CATEGORY_CONFIG: Record<NewsCategory, { label: string; color: string }> = {
  forex:    { label: 'Forex',    color: 'text-[#38bdf8]' },
  crypto:   { label: 'Crypto',   color: 'text-[#D4AF37]' },
  actions:  { label: 'Actions',  color: 'text-[#818cf8]' },
  indices:  { label: 'Indices',  color: 'text-[#a78bfa]' },
  matieres: { label: 'Matières', color: 'text-[#f97316]' },
  economie: { label: 'Économie', color: 'text-[#22c55e]' },
}

// ── helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return `il y a ${Math.floor(diff / 86400)} j`
}

function countdown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'Publié'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 24) return `dans ${Math.floor(h / 24)} j`
  if (h > 0) return `dans ${h}h${String(m).padStart(2, '0')}`
  return `dans ${m} min`
}

// ── sub-components ─────────────────────────────────────────────────────────────

function ImpactBadge({ impact }: { impact: ImpactLevel }) {
  const cfg = IMPACT_CONFIG[impact]
  return (
    <span className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border', cfg.badge, cfg.text)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  )
}

function NewsCard({ item }: { item: InfoItem }) {
  const [expanded, setExpanded] = useState(false)
  const catCfg = CATEGORY_CONFIG[item.category]

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4 hover:border-[#252525] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* meta row */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={cn('text-[10px] font-bold uppercase tracking-wide', catCfg.color)}>{catCfg.label}</span>
            <span className="text-[#333]">·</span>
            <ImpactBadge impact={item.impact} />
            <span className="text-[#333]">·</span>
            <span className="text-[10px] text-[#444] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(item.publishedAt)}
            </span>
            <span className="text-[10px] text-[#333]">{item.source}</span>
          </div>
          {/* title */}
          <p className="text-sm font-semibold text-white leading-snug mb-1">{item.title}</p>
          {/* summary */}
          {item.summary && (
            <p className={cn('text-xs text-[#666] leading-relaxed transition-all', expanded ? '' : 'line-clamp-2')}>
              {item.summary}
            </p>
          )}
        </div>
        {item.url && item.url !== '#' && (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[#333] hover:text-[#D4AF37] transition-colors flex-shrink-0 mt-0.5">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      {item.summary && item.summary.length > 120 && (
        <button onClick={() => setExpanded(v => !v)} className="text-[10px] text-[#D4AF37] hover:underline mt-2 flex items-center gap-1">
          {expanded ? 'Réduire' : 'Lire la suite'} <ChevronRight className={cn('w-3 h-3 transition-transform', expanded && 'rotate-90')} />
        </button>
      )}
    </div>
  )
}

function EventCard({ item }: { item: InfoItem }) {
  const impactCfg = IMPACT_CONFIG[item.impact]
  const isUpcoming = item.scheduledAt ? new Date(item.scheduledAt).getTime() > Date.now() : false
  const cd = item.scheduledAt ? countdown(item.scheduledAt) : ''

  return (
    <div className={cn(
      'bg-[#0a0a0a] border rounded-2xl p-4 transition-colors',
      item.impact === 'high' ? 'border-[#ef4444]/20 hover:border-[#ef4444]/40' : 'border-[#1a1a1a] hover:border-[#252525]'
    )}>
      <div className="flex items-start gap-3">
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', item.impact === 'high' ? 'bg-[#ef4444]/10' : 'bg-[#f97316]/10')}>
          <Calendar className={cn('w-4 h-4', impactCfg.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {item.countryFlag && <span className="text-base">{item.countryFlag}</span>}
            <ImpactBadge impact={item.impact} />
            {isUpcoming && (
              <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> {cd}
              </span>
            )}
            {!isUpcoming && item.actual && (
              <span className="text-[10px] font-bold text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2 py-0.5 rounded-full">Publié</span>
            )}
          </div>
          <p className="text-sm font-semibold text-white leading-snug mb-2">{item.title}</p>
          {/* forecast / previous / actual row */}
          {(item.forecast || item.previous || item.actual) && (
            <div className="flex gap-4 text-[11px]">
              {item.forecast && <span className="text-[#555]">Prévu : <span className="text-[#888] font-medium">{item.forecast}</span></span>}
              {item.previous && <span className="text-[#555]">Précédent : <span className="text-[#888] font-medium">{item.previous}</span></span>}
              {item.actual   && <span className="text-[#555]">Actuel : <span className={cn('font-bold', item.actual > (item.forecast ?? '') ? 'text-[#22c55e]' : 'text-[#ef4444]')}>{item.actual}</span></span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── notification helpers ──────────────────────────────────────────────────────

function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [appNotif, setAppNotif] = useState(true)
  const [highOnly, setHighOnly] = useState(false)
  const [categories, setCategories] = useState<Set<NewsCategory>>(new Set(['forex', 'crypto', 'actions', 'indices', 'matieres', 'economie']))

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  const toggleCategory = (cat: NewsCategory) => {
    setCategories(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  return { permission, appNotif, setAppNotif, highOnly, setHighOnly, categories, toggleCategory, requestPermission }
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function InfoMinutePage() {
  const [items, setItems] = useState<InfoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<NewsCategory | 'all'>('all')
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [newCount, setNewCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notif = useNotifications()
  const prevIdsRef = useRef<Set<string>>(new Set())

  const fetchItems = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const res = await fetch('/api/info-minute', { cache: 'no-store' })
      if (!res.ok) throw new Error('fetch error')
      const data: InfoItem[] = await res.json()

      // Count new items
      const incoming = new Set(data.map(i => i.id))
      const fresh = data.filter(i => !prevIdsRef.current.has(i.id))
      if (prevIdsRef.current.size > 0 && fresh.length > 0) {
        setNewCount(fresh.length)
        // Browser notification for high-impact new items
        if (notif.permission === 'granted' && notif.appNotif) {
          fresh.filter(i => !notif.highOnly || i.impact === 'high').forEach(i => {
            if (notif.categories.has(i.category)) {
              new Notification(`PrimeX — ${CATEGORY_CONFIG[i.category].label}`, {
                body: i.title,
                icon: '/primex-logo-dark.webp',
              })
            }
          })
        }
      }
      prevIdsRef.current = incoming
      setItems(data)
      setLastUpdate(new Date())
    } catch {
      // keep existing data on error
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [notif.permission, notif.appNotif, notif.highOnly, notif.categories])

  // Initial load
  useEffect(() => { fetchItems() }, [])

  // Auto-refresh every 60s
  useEffect(() => {
    intervalRef.current = setInterval(() => fetchItems(true), 60_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchItems])

  const handleRefresh = () => {
    setNewCount(0)
    fetchItems()
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter)
  const newsItems = filtered.filter(i => i.type === 'news')
  const eventItems = items.filter(i => i.type === 'event') // events always shown unfiltered
  const highAlerts = eventItems.filter(i => i.impact === 'high' && i.scheduledAt && new Date(i.scheduledAt).getTime() > Date.now())

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Newspaper className="w-5 h-5 text-[#D4AF37]" />
            <h1 className="text-2xl font-black text-white">Info Minute</h1>
            <span className="flex items-center gap-1 bg-[#22c55e]/10 border border-[#22c55e]/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-[#22c55e]">LIVE</span>
            </span>
            {newCount > 0 && (
              <span className="text-[10px] font-bold text-white bg-[#ef4444] px-2 py-0.5 rounded-full animate-pulse">
                +{newCount} nouveau{newCount > 1 ? 'x' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-[#555]">
            Actualités et événements susceptibles d'influencer les marchés · Mise à jour toutes les 60s
            {lastUpdate && <span className="ml-2 text-[#333]">· Dernière MAJ {timeAgo(lastUpdate.toISOString())}</span>}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] text-[#555] hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-colors disabled:opacity-40"
            title="Actualiser"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </button>
          <button
            onClick={() => setShowNotifPanel(v => !v)}
            className={cn('p-2 rounded-xl border transition-colors', showNotifPanel ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]' : 'bg-[#0a0a0a] border-[#1a1a1a] text-[#555] hover:text-[#D4AF37] hover:border-[#D4AF37]/30')}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Notification panel ── */}
      {showNotifPanel && (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-sm font-bold text-white">Paramètres de notifications</h2>
          </div>

          {/* browser permission */}
          <div className="flex items-center justify-between py-3 border-b border-[#111]">
            <div>
              <p className="text-sm font-medium text-white">Notifications navigateur</p>
              <p className="text-xs text-[#555] mt-0.5">
                {notif.permission === 'granted' ? 'Autorisées' : notif.permission === 'denied' ? 'Bloquées (modifiez dans les paramètres du navigateur)' : 'Non activées'}
              </p>
            </div>
            {notif.permission !== 'granted' && notif.permission !== 'denied' && (
              <button onClick={notif.requestPermission} className="text-xs bg-[#D4AF37] text-[#080808] font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
                Activer
              </button>
            )}
            {notif.permission === 'granted' && <span className="text-xs text-[#22c55e] font-bold">✓ Actif</span>}
            {notif.permission === 'denied' && <BellOff className="w-4 h-4 text-[#ef4444]" />}
          </div>

          {/* in-app */}
          <div className="flex items-center justify-between py-3 border-b border-[#111]">
            <div>
              <p className="text-sm font-medium text-white">Notifications dans l'app</p>
              <p className="text-xs text-[#555] mt-0.5">Badge sur les nouvelles actualités</p>
            </div>
            <Toggle value={notif.appNotif} onChange={notif.setAppNotif} />
          </div>

          {/* high only */}
          <div className="flex items-center justify-between py-3 border-b border-[#111]">
            <div>
              <p className="text-sm font-medium text-white">Impact élevé uniquement</p>
              <p className="text-xs text-[#555] mt-0.5">Ne notifier que les événements majeurs</p>
            </div>
            <Toggle value={notif.highOnly} onChange={notif.setHighOnly} />
          </div>

          {/* categories */}
          <div>
            <p className="text-xs font-bold text-[#555] uppercase tracking-wider mb-3">Catégories à suivre</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CATEGORY_CONFIG) as [NewsCategory, { label: string; color: string }][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => notif.toggleCategory(key)}
                  className={cn(
                    'text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all',
                    notif.categories.has(key)
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
                      : 'bg-[#0f0f0f] border-[#1a1a1a] text-[#444]'
                  )}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── High-impact upcoming alerts ── */}
      {highAlerts.length > 0 && (
        <div className="bg-[#1a0a0a] border border-[#ef4444]/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
            <h2 className="text-sm font-bold text-white">Événements majeurs à venir</h2>
          </div>
          <div className="space-y-2">
            {highAlerts.map(item => <EventCard key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setNewCount(0) }}
            className={cn(
              'text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all',
              filter === f.key
                ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
                : 'bg-[#0a0a0a] border-[#1a1a1a] text-[#555] hover:text-[#888]'
            )}
          >
            {f.label}
            {f.key === 'all' && items.length > 0 && (
              <span className="ml-1.5 text-[9px] text-[#444]">{items.filter(i => i.type === 'news').length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── News feed (main) ── */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Fil d'actualités</h2>
          </div>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl animate-pulse" />
            ))
          ) : newsItems.length === 0 ? (
            <div className="text-center py-16 text-[#444] text-sm">Aucune actualité pour ce filtre.</div>
          ) : (
            newsItems.map(item => <NewsCard key={item.id} item={item} />)
          )}
        </div>

        {/* ── Calendar sidebar ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Calendrier</h2>
          </div>

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl animate-pulse" />
            ))
          ) : (
            eventItems.map(item => <EventCard key={item.id} item={item} />)
          )}
        </div>
      </div>
    </div>
  )
}

// ── Toggle component ──────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        'w-11 h-6 rounded-full transition-all duration-200 relative flex-shrink-0',
        value ? 'bg-[#D4AF37]' : 'bg-[#222]'
      )}
    >
      <span
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200"
        style={{ left: value ? '22px' : '2px' }}
      />
    </button>
  )
}
