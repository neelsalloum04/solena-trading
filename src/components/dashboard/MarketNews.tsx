'use client'

import { cn } from '@/lib/utils'
import { ExternalLink, Globe, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface NewsItem {
  id: string
  title: string
  summary: string
  publishedAt: string
  source: string
  impact: 'high' | 'medium' | 'low'
  category: 'forex' | 'crypto' | 'stocks' | 'macro' | 'general'
  url: string
}

type Category = 'all' | 'forex' | 'crypto' | 'stocks' | 'macro'

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'Tout',
  forex: 'Forex',
  crypto: 'Crypto',
  stocks: 'Actions',
  macro: 'Macro',
}

const IMPACT_CONFIG = {
  high: { label: 'Élevé', dot: '🔴', color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10 border-[#ef4444]/20' },
  medium: { label: 'Moyen', dot: '🟠', color: 'text-[#f97316]', bg: 'bg-[#f97316]/10 border-[#f97316]/20' },
  low: { label: 'Faible', dot: '🟢', color: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10 border-[#22c55e]/20' },
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  return `Il y a ${Math.floor(diff / 86400)}j`
}

function NewsSkeleton() {
  return (
    <div className="p-4 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="h-4 bg-[#1a1a1a] rounded w-3/4" />
        <div className="h-5 bg-[#1a1a1a] rounded w-16 flex-shrink-0" />
      </div>
      <div className="h-3 bg-[#1a1a1a] rounded w-full mb-1" />
      <div className="h-3 bg-[#1a1a1a] rounded w-2/3 mb-3" />
      <div className="flex items-center gap-2">
        <div className="h-3 bg-[#1a1a1a] rounded w-16" />
        <div className="h-3 bg-[#1a1a1a] rounded w-12" />
      </div>
    </div>
  )
}

function NewsCard({ item }: { item: NewsItem }) {
  const impact = IMPACT_CONFIG[item.impact]

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 hover:bg-[#0f0f0f] transition-colors border-b border-[#111] last:border-0 group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-[#D4AF37] transition-colors line-clamp-2">
          {item.title}
        </h3>
        <span className={cn(
          'flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border',
          impact.bg
        )}>
          {impact.dot} {impact.label}
        </span>
      </div>
      {item.summary && (
        <p className="text-xs text-[#555] leading-relaxed line-clamp-2 mb-2">
          {item.summary}
        </p>
      )}
      <div className="flex items-center gap-2 text-[10px] text-[#444]">
        <span className="font-semibold text-[#666]">{item.source}</span>
        <span>·</span>
        <span>{timeAgo(item.publishedAt)}</span>
        <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[#D4AF37]" />
      </div>
    </a>
  )
}

export function MarketNews() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/market-news')
      const data = await res.json()
      setNews(Array.isArray(data) ? data : [])
      setLastUpdated(new Date())
    } catch {
      // Silence les erreurs réseau
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNews()
    const iv = setInterval(fetchNews, 5 * 60 * 1000) // 5 minutes
    return () => clearInterval(iv)
  }, [fetchNews])

  const filtered = activeCategory === 'all'
    ? news
    : news.filter(n => n.category === activeCategory)

  const highImpactCount = news.filter(n => n.impact === 'high').length

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
      {/* En-tête */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#111]">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Actualités des Marchés</span>
          {highImpactCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 px-1.5 py-0.5 rounded-lg">
              🔴 {highImpactCount} impact élevé
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-[#444] hidden sm:block">
              Mis à jour · {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchNews}
            className="p-1.5 text-[#444] hover:text-[#D4AF37] transition-colors rounded-lg hover:bg-[#141414]"
            title="Actualiser"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filtres catégories */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-b border-[#0f0f0f] overflow-x-auto no-scrollbar">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'flex-shrink-0 text-[11px] font-semibold px-3 py-1 rounded-lg transition-colors',
              activeCategory === cat
                ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25'
                : 'text-[#555] hover:text-[#F2EDD7] hover:bg-[#141414]'
            )}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Liste news */}
      <div className="divide-y divide-[#0a0a0a]">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <NewsSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-[#444] text-sm">
            Aucune actualité disponible
          </div>
        ) : (
          filtered.slice(0, 8).map(item => (
            <NewsCard key={item.id} item={item} />
          ))
        )}
      </div>
    </div>
  )
}
