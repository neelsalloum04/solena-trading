'use client'

import { cn } from '@/lib/utils'
import type { BtcSignal, MarketData, NewsData, BtcPosition, BtcClosedTrade, RiskSettings } from '@/lib/bot-btc/types'
import { DEFAULT_RISK } from '@/lib/bot-btc/types'
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight,
  BarChart2, Bitcoin, BookOpen, Brain,
  ChevronDown, ChevronUp, Clock, Database, Newspaper, RefreshCw,
  Settings, Shield, TrendingDown, TrendingUp, Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Local storage ────────────────────────────────────────────────────────────

const SK = {
  positions:    'btc_bot_positions_v1',
  closed:       'btc_bot_closed_v1',
  risk:         'btc_bot_risk_v1',
  mode:         'btc_bot_mode_v1',
}

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function save(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtUsd(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' $'
}

function fmtPct(n: number, sign = true) {
  return `${sign && n > 0 ? '+' : ''}${n.toFixed(2)}%`
}

function scoreColor(s: number) {
  if (s >= 70) return 'text-[#22c55e]'
  if (s >= 50) return 'text-[#F7931A]'
  return 'text-[#ef4444]'
}

function signalColor(sig: BtcSignal['signal'] | undefined) {
  if (sig === 'LONG')  return 'text-[#22c55e]'
  if (sig === 'SHORT') return 'text-[#ef4444]'
  return 'text-[#F7931A]'
}

function signalBg(sig: BtcSignal['signal'] | undefined) {
  if (sig === 'LONG')  return 'bg-[#22c55e]/10 border-[#22c55e]/30'
  if (sig === 'SHORT') return 'bg-[#ef4444]/10 border-[#ef4444]/30'
  return 'bg-[#F7931A]/10 border-[#F7931A]/30'
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, description }: { label: string; value: number; description: string }) {
  const color = value >= 70 ? '#22c55e' : value >= 50 ? '#F7931A' : '#ef4444'
  const mention = value >= 70 ? 'Favorable' : value >= 50 ? 'Neutre' : 'Défavorable'
  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-[#888]">{label}</span>
          <p className="text-[10px] text-[#444] leading-snug">{description}</p>
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
          <span style={{ color }} className="text-sm font-black">{value}</span>
          <span style={{ color }} className="text-[9px] font-semibold">{mention}</span>
        </div>
      </div>
      <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(!compact)

  const steps = [
    {
      n: '1',
      title: 'Données temps réel',
      icon: Database,
      color: '#38bdf8',
      desc: 'Le robot récupère toutes les 30 secondes le prix BTC, le carnet d\'ordres, le funding rate et les bougies sur 5 timeframes (1m, 3m, 5m, 15m, 1h) via les APIs Binance et Bybit.',
    },
    {
      n: '2',
      title: 'Calcul des indicateurs',
      icon: BarChart2,
      color: '#a78bfa',
      desc: 'Pour chaque timeframe, le robot calcule automatiquement : RSI (survente/surachat), MACD (momentum), EMA 20/50/200 (tendance), VWAP (prix moyen pondéré par volume), ATR (volatilité), et détecte les niveaux de support et résistance.',
    },
    {
      n: '3',
      title: 'Analyse par l\'IA Claude',
      icon: Brain,
      color: '#F7931A',
      desc: 'Toutes les données sont envoyées à Claude AI (Anthropic). L\'IA note 6 dimensions sur 100 : technique, fondamental, liquidité, momentum, volatilité et actualités. Elle génère ensuite un signal LONG, SHORT ou WAIT avec un niveau de confiance.',
    },
    {
      n: '4',
      title: 'Signal + gestion des positions',
      icon: Zap,
      color: '#22c55e',
      desc: 'Le signal inclut un prix d\'entrée, un Stop Loss (perte max si le trade part dans le mauvais sens) et 3 niveaux de prise de profit (TP1 conservateur, TP2 intermédiaire, TP3 ambitieux). Vous pouvez ouvrir une position en paper (simulation) ou live.',
    },
  ]

  return (
    <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl overflow-hidden">
      {compact && (
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-[#111] transition-colors"
        >
          <span className="text-xs font-bold text-[#888] uppercase tracking-wider">Comment fonctionne le robot ?</span>
          {open ? <ChevronUp className="w-4 h-4 text-[#555]" /> : <ChevronDown className="w-4 h-4 text-[#555]" />}
        </button>
      )}

      {(!compact || open) && (
        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map(s => (
            <div key={s.n} className="flex gap-3">
              <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${s.color}18`, border: `1px solid ${s.color}30` }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <span className="text-[10px] font-black" style={{ color: `${s.color}60` }}>0{s.n}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#D4D4D4] mb-0.5">{s.title}</p>
                <p className="text-[11px] text-[#555] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Signal Legend ────────────────────────────────────────────────────────────

function SignalLegend() {
  return (
    <div className="grid grid-cols-3 gap-2 text-xs">
      {[
        { sig: 'LONG',  color: '#22c55e', desc: 'Le robot pense que le prix va monter. Vous achetez du BTC et vendez quand le prix monte.' },
        { sig: 'SHORT', color: '#ef4444', desc: 'Le robot pense que le prix va baisser. Vous vendez du BTC à découvert et rachetez moins cher.' },
        { sig: 'WAIT',  color: '#F7931A', desc: 'Setup non optimal. Le robot recommande de ne pas trader et d\'attendre une meilleure opportunité.' },
      ].map(({ sig, color, desc }) => (
        <div key={sig} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-3 space-y-1.5">
          <span className="font-black text-sm" style={{ color }}>{sig}</span>
          <p className="text-[10px] text-[#555] leading-snug">{desc}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Indicator Pill ───────────────────────────────────────────────────────────

function Pill({ label, value, up }: { label: string; value: string; up?: boolean }) {
  const color = up === undefined ? '#888' : up ? '#22c55e' : '#ef4444'
  return (
    <div className="flex flex-col items-center bg-[#111] border border-[#1a1a1a] rounded-lg px-3 py-2 min-w-[80px]">
      <span className="text-[10px] text-[#555] uppercase tracking-wide">{label}</span>
      <span className="text-sm font-bold mt-0.5" style={{ color }}>{value}</span>
    </div>
  )
}

// ─── BTC Range Bar ────────────────────────────────────────────────────────────

function RangeBar({ low, high, current }: { low: number; high: number; current: number }) {
  const pct = high > low ? Math.min(100, Math.max(0, ((current - low) / (high - low)) * 100)) : 50
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] text-[#555]">
        <span>Low {fmtUsd(low)}</span>
        <span>High {fmtUsd(high)}</span>
      </div>
      <div className="relative h-1.5 bg-[#1a1a1a] rounded-full">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#ef4444]/40 to-[#22c55e]/40" style={{ width: '100%' }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#080808] bg-[#F7931A] shadow-[0_0_8px_#F7931A]"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>
      <p className="text-center text-[10px] text-[#555]">{pct.toFixed(0)}% du range 24h</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = 'signal' | 'analyse' | 'positions' | 'historique' | 'parametres'

export function BtcBotClient() {
  const [tab, setTab]               = useState<Tab>('signal')
  const [market, setMarket]         = useState<MarketData | null>(null)
  const [signal, setSignal]         = useState<BtcSignal | null>(null)
  const [news, setNews]             = useState<NewsData | null>(null)
  const [positions, setPositions]   = useState<BtcPosition[]>([])
  const [closed, setClosed]         = useState<BtcClosedTrade[]>([])
  const [risk, setRisk]             = useState<RiskSettings>(DEFAULT_RISK)
  const [mode, setMode]             = useState<'paper' | 'live'>('paper')

  const [loadingMarket, setLoadingMarket] = useState(false)
  const [loadingSignal, setLoadingSignal] = useState(false)
  const [loadingNews, setLoadingNews]     = useState(false)
  const [marketError, setMarketError]     = useState<string | null>(null)
  const [signalError, setSignalError]     = useState<string | null>(null)

  const [tradeSize, setTradeSize]     = useState(100)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setPositions(load(SK.positions, []))
    setClosed(load(SK.closed, []))
    setRisk(load(SK.risk, DEFAULT_RISK))
    setMode(load(SK.mode, 'paper'))
  }, [])

  const fetchMarket = useCallback(async () => {
    setLoadingMarket(true)
    setMarketError(null)
    try {
      const res = await fetch('/api/bot-btc/market')
      if (!res.ok) throw new Error('Erreur réseau')
      setMarket(await res.json())
    } catch (e: unknown) {
      setMarketError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoadingMarket(false)
    }
  }, [])

  const fetchNews = useCallback(async () => {
    setLoadingNews(true)
    try {
      const res = await fetch('/api/bot-btc/news')
      if (!res.ok) return
      setNews(await res.json())
    } finally {
      setLoadingNews(false)
    }
  }, [])

  const generateSignal = useCallback(async () => {
    if (!market) return
    setLoadingSignal(true)
    setSignalError(null)
    try {
      const res = await fetch('/api/bot-btc/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market, news: news?.sentiment ?? null }),
      })
      if (!res.ok) throw new Error('Erreur génération signal')
      setSignal(await res.json())
    } catch (e: unknown) {
      setSignalError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoadingSignal(false)
    }
  }, [market, news])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchMarket, 30_000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, fetchMarket])

  useEffect(() => {
    fetchMarket()
    fetchNews()
  }, [fetchMarket, fetchNews])

  function openPosition() {
    if (!signal || signal.signal === 'WAIT') return
    const pos: BtcPosition = {
      id:         crypto.randomUUID(),
      side:       signal.signal as 'LONG' | 'SHORT',
      entryPrice: signal.entryPrice,
      quantity:   tradeSize / signal.entryPrice,
      usdtSize:   tradeSize,
      stopLoss:   signal.stopLoss,
      tp1:        signal.tp1,
      tp2:        signal.tp2,
      tp3:        signal.tp3,
      openedAt:   new Date().toISOString(),
      mode,
      fromSignal: true,
    }
    const next = [...positions, pos]
    setPositions(next)
    save(SK.positions, next)
  }

  function closePosition(id: string, closePrice: number, reason: BtcClosedTrade['closeReason']) {
    const pos = positions.find(p => p.id === id)
    if (!pos) return
    const pnlRaw = pos.side === 'LONG'
      ? (closePrice - pos.entryPrice) * pos.quantity
      : (pos.entryPrice - closePrice) * pos.quantity
    const trade: BtcClosedTrade = {
      id:          pos.id,
      side:        pos.side,
      entryPrice:  pos.entryPrice,
      closePrice,
      quantity:    pos.quantity,
      usdtSize:    pos.usdtSize,
      pnl:         pnlRaw,
      pnlPct:      (pnlRaw / pos.usdtSize) * 100,
      closedAt:    new Date().toISOString(),
      closeReason: reason,
      mode:        pos.mode,
    }
    const nextPos    = positions.filter(p => p.id !== id)
    const nextClosed = [trade, ...closed]
    setPositions(nextPos)
    setClosed(nextClosed)
    save(SK.positions, nextPos)
    save(SK.closed, nextClosed)
  }

  function calcPnl(pos: BtcPosition) {
    if (!market) return null
    const raw = pos.side === 'LONG'
      ? (market.price - pos.entryPrice) * pos.quantity
      : (pos.entryPrice - market.price) * pos.quantity
    return { raw, pct: (raw / pos.usdtSize) * 100 }
  }

  const totalPnl   = closed.reduce((s, t) => s + t.pnl, 0)
  const winCount   = closed.filter(t => t.pnl > 0).length
  const winRate    = closed.length > 0 ? (winCount / closed.length) * 100 : 0
  const ind5m      = market?.indicators['5m']
  const ind1h      = market?.indicators['1h']

  const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
    { id: 'signal',     label: 'Signal IA',   icon: Brain },
    { id: 'analyse',    label: 'Analyse',     icon: BarChart2 },
    { id: 'positions',  label: 'Positions',   icon: Activity },
    { id: 'historique', label: 'Historique',  icon: BookOpen },
    { id: 'parametres', label: 'Paramètres',  icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-[#080808] text-[#F2EDD7]">

      {/* ── HERO BTC ───────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-[#1a1a1a]">
        {/* Glow background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#F7931A]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-6">

          {/* Top row: identity + controls */}
          <div className="flex items-start justify-between gap-4 flex-wrap">

            {/* BTC Identity */}
            <div className="flex items-center gap-4">
              {/* Big BTC logo */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-[#F7931A] flex items-center justify-center shadow-[0_0_24px_#F7931A40]">
                  <Bitcoin className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                {/* LIVE dot */}
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-[#080808] rounded-full">
                  <span className="w-2.5 h-2.5 bg-[#22c55e] rounded-full animate-pulse shadow-[0_0_6px_#22c55e]" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-2xl font-black tracking-tight text-[#F2EDD7]">Bitcoin</h1>
                  <span className="text-xs font-black text-[#F7931A] bg-[#F7931A]/10 border border-[#F7931A]/30 px-2 py-0.5 rounded-lg">
                    BTC/USDT
                  </span>
                  <span className="text-[10px] font-bold text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2 py-0.5 rounded-lg tracking-wider">
                    LIVE
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-[#555]">Perpetual Futures · Scalping IA</p>
                  <span className="text-[10px] text-[#F7931A]/70 bg-[#F7931A]/5 border border-[#F7931A]/15 px-2 py-0.5 rounded-full font-semibold">
                    ₿ EXCLUSIF BITCOIN
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { fetchMarket(); fetchNews() }}
                disabled={loadingMarket}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#111] border border-[#2a2a2a] hover:border-[#F7931A]/30 text-xs text-[#888] hover:text-[#F2EDD7] transition-all"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', loadingMarket && 'animate-spin')} />
                Actualiser
              </button>
              <button
                onClick={() => setAutoRefresh(v => !v)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs transition-all',
                  autoRefresh
                    ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]'
                    : 'bg-[#111] border-[#2a2a2a] text-[#888] hover:text-[#F2EDD7]'
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', autoRefresh ? 'bg-[#22c55e] animate-pulse' : 'bg-[#333]')} />
                Auto 30s
              </button>
              <div className="flex rounded-xl overflow-hidden border border-[#2a2a2a]">
                {(['paper', 'live'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); save(SK.mode, m) }}
                    className={cn(
                      'px-3 py-2 text-xs font-bold transition-all',
                      mode === m
                        ? m === 'paper'
                          ? 'bg-[#38bdf8]/15 text-[#38bdf8]'
                          : 'bg-[#ef4444]/15 text-[#ef4444]'
                        : 'bg-[#111] text-[#444] hover:text-[#888]'
                    )}
                  >
                    {m === 'paper' ? '📋 Paper' : '⚡ Live'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Price row */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Current price */}
            <div className="space-y-1">
              {market ? (
                <>
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-black tracking-tight text-[#F2EDD7]">
                      {market.price.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      <span className="text-xl text-[#555] font-normal ml-1">$</span>
                    </span>
                    <div className={cn(
                      'flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold mb-1',
                      market.change24h >= 0
                        ? 'text-[#22c55e] bg-[#22c55e]/10'
                        : 'text-[#ef4444] bg-[#ef4444]/10'
                    )}>
                      {market.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {fmtPct(market.change24h)}
                    </div>
                  </div>
                  <p className="text-xs text-[#444]">
                    Mis à jour {new Date(market.updatedAt).toLocaleTimeString('fr-FR')}
                  </p>
                </>
              ) : (
                <div className="h-10 w-56 bg-[#141414] rounded-xl animate-pulse" />
              )}
            </div>

            {/* 24h range */}
            <div className="self-end">
              {market ? (
                <RangeBar low={market.low24h} high={market.high24h} current={market.price} />
              ) : (
                <div className="h-12 bg-[#141414] rounded-xl animate-pulse" />
              )}
            </div>
          </div>

          {/* Market metrics strip */}
          <div className="mt-4 flex flex-wrap gap-3">
            {market ? [
              { label: 'Volume 24h',     value: `${(market.volume24h / 1_000_000).toFixed(0)}M $` },
              { label: 'Funding Rate',   value: `${(market.fundingRate * 100).toFixed(4)}%`,
                up: Math.abs(market.fundingRate) < 0.0005 },
              { label: 'Open Interest',  value: `${(market.openInterest / 1_000_000_000).toFixed(2)}B $` },
              { label: 'Bid/Ask Ratio',  value: market.orderBook.ratio.toFixed(2),
                up: market.orderBook.ratio > 1 },
              { label: 'Trend 1h',       value: ind1h?.trend ?? '—',
                up: ind1h?.trend === 'bullish' ? true : ind1h?.trend === 'bearish' ? false : undefined },
              { label: 'RSI 5m',         value: ind5m ? `${ind5m.rsi.toFixed(1)}` : '—',
                up: ind5m ? ind5m.rsi > 50 : undefined },
            ].map(({ label, value, up }) => (
              <div key={label} className="flex items-center gap-2 bg-[#111] border border-[#1a1a1a] rounded-lg px-3 py-1.5">
                <span className="text-[10px] text-[#444] uppercase tracking-wide">{label}</span>
                <span className={cn(
                  'text-xs font-bold',
                  up === true ? 'text-[#22c55e]' : up === false ? 'text-[#ef4444]' : 'text-[#888]'
                )}>{value}</span>
              </div>
            )) : (
              <div className="h-8 w-full bg-[#111] rounded-lg animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* ── PERFORMANCE BAR ─────────────────────────────────────────────────── */}
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Positions ouvertes', value: String(positions.length), icon: Activity, color: '#F7931A' },
            { label: 'PnL Total',
              value: `${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)} $`,
              icon: totalPnl >= 0 ? TrendingUp : TrendingDown,
              color: totalPnl >= 0 ? '#22c55e' : '#ef4444' },
            { label: 'Win Rate',
              value: `${winRate.toFixed(0)}%`,
              icon: Zap,
              color: winRate >= 50 ? '#22c55e' : '#ef4444' },
            { label: 'Trades clôturés',
              value: String(closed.length),
              icon: BookOpen,
              color: '#888' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-[10px] text-[#444] uppercase tracking-wide">{label}</p>
                <p className="text-sm font-bold" style={{ color }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── TABS ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all',
                tab === t.id
                  ? 'bg-[#F7931A]/15 text-[#F7931A] border border-[#F7931A]/25'
                  : 'text-[#555] hover:text-[#888]'
              )}
            >
              <t.icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── SIGNAL TAB ───────────────────────────────────────────────────── */}
        {tab === 'signal' && (
          <div className="space-y-5">

            {/* Explanation — always visible, collapsible once a signal is generated */}
            {!signal
              ? <HowItWorks compact={false} />
              : <HowItWorks compact={true} />
            }

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Signal card */}
            <div className="space-y-4">
              <div className={cn('rounded-2xl border p-6 space-y-5', signal ? signalBg(signal.signal) : 'bg-[#0f0f0f] border-[#1a1a1a]')}>

                {/* Card header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F7931A]/15 border border-[#F7931A]/25 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-[#F7931A]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#F2EDD7]">Analyse Claude AI</p>
                      <p className="text-[10px] text-[#555]">BTC/USDT · Multi-timeframes · Temps réel</p>
                    </div>
                  </div>
                  {signal && (
                    <div className={cn(
                      'px-4 py-2 rounded-xl border-2 font-black text-xl tracking-wide',
                      signalBg(signal.signal), signalColor(signal.signal)
                    )}>
                      {signal.signal}
                    </div>
                  )}
                </div>

                {/* Generate */}
                <button
                  onClick={generateSignal}
                  disabled={loadingSignal || !market}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all',
                    loadingSignal || !market
                      ? 'bg-[#141414] text-[#444] cursor-not-allowed'
                      : 'bg-[#F7931A] text-white hover:bg-[#e8841a] active:scale-[0.98] shadow-[0_4px_20px_#F7931A30]'
                  )}
                >
                  {loadingSignal ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" />Analyse Bitcoin en cours...</>
                  ) : (
                    <><Bitcoin className="w-4 h-4" />Analyser BTC et Générer Signal</>
                  )}
                </button>

                {signalError && (
                  <p className="text-xs text-[#ef4444] flex items-center gap-1.5 bg-[#ef4444]/5 border border-[#ef4444]/20 rounded-lg p-3">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{signalError}
                  </p>
                )}

                {/* Signal details */}
                {signal && signal.signal !== 'WAIT' && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Entrée',    value: fmtUsd(signal.entryPrice), color: '#F2EDD7' },
                        { label: 'Stop Loss', value: fmtUsd(signal.stopLoss),   color: '#ef4444' },
                        { label: 'TP 1',      value: fmtUsd(signal.tp1),        color: '#22c55e' },
                        { label: 'TP 2',      value: fmtUsd(signal.tp2),        color: '#22c55e' },
                        { label: 'TP 3',      value: fmtUsd(signal.tp3),        color: '#22c55e' },
                        { label: 'R/R',       value: `1:${signal.riskReward.toFixed(2)}`, color: '#F7931A' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-[#0a0a0a]/80 border border-[#1a1a1a] rounded-xl px-3 py-2.5">
                          <p className="text-[10px] text-[#555] uppercase tracking-wide">{label}</p>
                          <p className="text-sm font-bold mt-0.5" style={{ color }}>{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Confiance', value: `${signal.confidence}%`, score: signal.confidence },
                        { label: 'Probabilité', value: `${signal.probability}%`, score: signal.probability },
                      ].map(({ label, value, score }) => (
                        <div key={label} className="bg-[#0a0a0a]/80 border border-[#1a1a1a] rounded-xl p-3">
                          <p className="text-[10px] text-[#555] uppercase">{label}</p>
                          <p className={cn('text-2xl font-black', scoreColor(score))}>{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Open position */}
                    <div className="flex gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          value={tradeSize}
                          onChange={e => setTradeSize(Number(e.target.value))}
                          min={10}
                          className="w-28 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-3 py-3 text-sm text-center text-[#F2EDD7] focus:outline-none focus:border-[#F7931A]/50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#555]">$</span>
                      </div>
                      <button
                        onClick={openPosition}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all border',
                          signal.signal === 'LONG'
                            ? 'bg-[#22c55e]/15 border-[#22c55e]/40 text-[#22c55e] hover:bg-[#22c55e]/25'
                            : 'bg-[#ef4444]/15 border-[#ef4444]/40 text-[#ef4444] hover:bg-[#ef4444]/25'
                        )}
                      >
                        {signal.signal === 'LONG'
                          ? <><ArrowUpRight className="w-4 h-4" />LONG BTC · {tradeSize} $</>
                          : <><ArrowDownRight className="w-4 h-4" />SHORT BTC · {tradeSize} $</>
                        }
                      </button>
                    </div>
                  </>
                )}

                {signal?.signal === 'WAIT' && (
                  <div className="flex items-start gap-3 bg-[#F7931A]/5 border border-[#F7931A]/15 rounded-xl p-4">
                    <Clock className="w-5 h-5 text-[#F7931A] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-[#F7931A]">Attente recommandée</p>
                      <p className="text-xs text-[#666] mt-0.5">Le setup BTC n'est pas optimal — patience avant d'entrer en position.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reasoning */}
              {signal?.reasoning && (
                <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-[#F7931A] uppercase tracking-wider flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5" /> Raisonnement IA
                  </h3>
                  <p className="text-sm text-[#888] leading-relaxed">{signal.reasoning}</p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="bg-[#22c55e]/5 border border-[#22c55e]/15 rounded-lg p-3">
                      <p className="text-[10px] text-[#22c55e] uppercase font-bold mb-1">✓ Signal valide si</p>
                      <p className="text-xs text-[#666]">{signal.validConditions}</p>
                    </div>
                    <div className="bg-[#ef4444]/5 border border-[#ef4444]/15 rounded-lg p-3">
                      <p className="text-[10px] text-[#ef4444] uppercase font-bold mb-1">✗ Signal invalide si</p>
                      <p className="text-xs text-[#666]">{signal.invalidConditions}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#333]">
                    Généré le {new Date(signal.generatedAt).toLocaleString('fr-FR')} · Timeframe {signal.timeframe}
                  </p>
                </div>
              )}
            </div>

            {/* Right column: scores + news */}
            <div className="space-y-4">

              {signal && (
                <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-[#F2EDD7] flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-[#F7931A]" />
                    Scores d'analyse BTC
                    <span className="text-[10px] text-[#444] font-normal ml-1">— 0 = mauvais · 100 = excellent</span>
                  </h3>
                  <ScoreBar label="Technique" value={signal.scores.technical}
                    description="Qualité du setup sur les indicateurs : RSI, MACD, croisements EMA, position par rapport au VWAP." />
                  <ScoreBar label="Fondamental" value={signal.scores.fundamental}
                    description="Biais macro-crypto : funding rate (positions longues vs courtes), open interest, sentiment de marché." />
                  <ScoreBar label="Liquidité" value={signal.scores.liquidity}
                    description="Profondeur du carnet d'ordres. Un ratio bid/ask élevé = plus d'acheteurs que de vendeurs = pression haussière." />
                  <ScoreBar label="Momentum" value={signal.scores.momentum}
                    description="Force et direction du mouvement actuel du prix. Un momentum fort confirme la tendance." />
                  <ScoreBar label="Volatilité" value={signal.scores.volatility}
                    description="L'ATR mesure l'amplitude moyenne des bougies. Une bonne volatilité permet d'atteindre les TP sans être stoppé." />
                  <ScoreBar label="Actualités" value={signal.scores.news}
                    description="Sentiment des actualités Bitcoin récentes analysé par l'IA. Un événement majeur peut invalider un signal technique." />
                  <div className="pt-3 border-t border-[#1a1a1a] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#666]">Score de confiance global</span>
                      <p className="text-[10px] text-[#444]">Moyenne pondérée des 6 scores — &gt;70 recommandé pour trader</p>
                    </div>
                    <span className={cn('text-2xl font-black', scoreColor(signal.confidence))}>
                      {signal.confidence}<span className="text-sm font-normal text-[#555]">/100</span>
                    </span>
                  </div>
                </div>
              )}

              {!signal && (
                <div className="space-y-3">
                  <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5">
                    <p className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Que signifient les signaux ?</p>
                    <SignalLegend />
                  </div>
                  <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 space-y-2">
                    <p className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2">À quoi servent les niveaux de prix ?</p>
                    {[
                      { label: 'Stop Loss (SL)', color: '#ef4444', desc: 'Prix auquel le trade est fermé automatiquement pour limiter la perte si le marché va contre vous.' },
                      { label: 'TP1 — Prise de profit 1', color: '#22c55e', desc: 'Premier objectif de prix, conservateur. Idéal pour sécuriser rapidement une partie du gain.' },
                      { label: 'TP2 — Prise de profit 2', color: '#22c55e', desc: 'Objectif intermédiaire. Bon équilibre entre gain et probabilité d\'atteinte.' },
                      { label: 'TP3 — Prise de profit 3', color: '#22c55e', desc: 'Objectif ambitieux. Plus difficile à atteindre, mais potentiel de gain maximal.' },
                    ].map(({ label, color, desc }) => (
                      <div key={label} className="flex gap-2.5 text-xs">
                        <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: color }} />
                        <div>
                          <span className="font-bold" style={{ color }}>{label}</span>
                          <span className="text-[#555] ml-1.5">{desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* News sentiment */}
              {news && (
                <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#F2EDD7] flex items-center gap-2">
                      <Newspaper className="w-4 h-4 text-[#F7931A]" />
                      Actualités Bitcoin
                    </h3>
                    {loadingNews && <RefreshCw className="w-3.5 h-3.5 text-[#555] animate-spin" />}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'px-3 py-1 rounded-lg text-xs font-bold border',
                      news.sentiment.direction === 'bullish'
                        ? 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/30'
                        : news.sentiment.direction === 'bearish'
                        ? 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'
                        : 'text-[#F7931A] bg-[#F7931A]/10 border-[#F7931A]/30'
                    )}>
                      {news.sentiment.direction.toUpperCase()}
                    </div>
                    <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${news.sentiment.score}%`,
                          backgroundColor: news.sentiment.score > 60 ? '#22c55e'
                            : news.sentiment.score < 40 ? '#ef4444' : '#F7931A'
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-[#F2EDD7]">{news.sentiment.score}/100</span>
                  </div>

                  <p className="text-xs text-[#777] leading-relaxed">{news.sentiment.summary}</p>
                  {news.sentiment.keyEvent && (
                    <p className="text-xs text-[#F7931A] bg-[#F7931A]/5 border border-[#F7931A]/15 rounded-lg p-2.5">
                      Événement clé · {news.sentiment.keyEvent}
                    </p>
                  )}
                  <div className="space-y-1 pt-1">
                    {news.articles.slice(0, 4).map((a, i) => (
                      <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-start gap-2 group hover:bg-[#141414] rounded-lg p-1.5 -mx-1.5 transition-colors">
                        <span className="text-[#555] text-[10px] mt-0.5 flex-shrink-0">[{a.source}]</span>
                        <span className="text-xs text-[#666] group-hover:text-[#888] line-clamp-1">{a.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        )}

        {/* ── ANALYSE TAB ──────────────────────────────────────────────────── */}
        {tab === 'analyse' && (
          <div className="space-y-4">
            {/* Explanation */}
            <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl p-5">
              <p className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Que montrent ces indicateurs ?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {[
                  { label: 'RSI', desc: 'Entre 0 et 100. En dessous de 30 = survente (rebond probable). Au-dessus de 70 = surachat (correction probable). 50 = neutre.' },
                  { label: 'MACD', desc: 'Indique si le momentum est haussier (▲) ou baissier (▼). Un croisement = changement de tendance imminent.' },
                  { label: 'EMA 20 / 50 / 200', desc: 'Moyennes mobiles exponentielles. Si prix > EMA20 > EMA50 > EMA200 = tendance haussière forte.' },
                  { label: 'VWAP', desc: 'Prix moyen pondéré par le volume. Si le prix est au-dessus du VWAP, les acheteurs dominent.' },
                  { label: 'ATR', desc: 'Amplitude moyenne des bougies en dollars. Utilisé pour calibrer le Stop Loss et les TP.' },
                  { label: 'Vol Ratio', desc: 'Volume acheteur / volume vendeur sur les 20 dernières bougies. > 1 = pression acheteuse.' },
                ].map(({ label, desc }) => (
                  <div key={label} className="bg-[#111] border border-[#1a1a1a] rounded-lg p-3">
                    <p className="font-bold text-[#D4D4D4] mb-1">{label}</p>
                    <p className="text-[#555] leading-snug">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {marketError && (
              <div className="flex items-center gap-2 text-[#ef4444] bg-[#ef4444]/5 border border-[#ef4444]/20 rounded-xl p-4 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />{marketError}
              </div>
            )}
            {market ? (
              <>
                {(['1m', '3m', '5m', '15m', '1h'] as const).map(tf => {
                  const i = market.indicators[tf]
                  const trendColor = i.trend === 'bullish' ? '#22c55e' : i.trend === 'bearish' ? '#ef4444' : '#F7931A'
                  return (
                    <div key={tf} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#F7931A]/10 border border-[#F7931A]/20 flex items-center justify-center">
                            <span className="text-xs font-black text-[#F7931A]">{tf}</span>
                          </div>
                          <span className="text-xs text-[#555]">BTC/USDT</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold border"
                          style={{ color: trendColor, backgroundColor: `${trendColor}15`, borderColor: `${trendColor}30` }}>
                          {i.trend}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Pill label="RSI"       value={i.rsi.toFixed(1)}       up={i.rsi > 50} />
                        <Pill label="MACD"      value={i.macd.histogram > 0 ? '▲' : '▼'} up={i.macd.bullish} />
                        <Pill label="EMA 20"    value={i.ema20.toFixed(0)} />
                        <Pill label="EMA 50"    value={i.ema50.toFixed(0)} />
                        <Pill label="EMA 200"   value={i.ema200.toFixed(0)} />
                        <Pill label="VWAP"      value={i.vwap.toFixed(0)}      up={i.priceVsVwap > 0} />
                        <Pill label="ATR"       value={i.atr.toFixed(0)} />
                        <Pill label="Vol Ratio" value={i.volumeRatio.toFixed(2)} up={i.volumeRatio > 1} />
                        <Pill label="Momentum"  value={i.momentum.toFixed(0)}  up={i.momentum > 50} />
                      </div>
                      {(i.support.length > 0 || i.resistance.length > 0) && (
                        <div className="mt-3 pt-3 border-t border-[#141414] flex flex-wrap gap-4 text-xs">
                          {i.support.length > 0 && (
                            <span className="text-[#555]">
                              Supports : <span className="text-[#22c55e]">{i.support.join(' · ')}</span>
                            </span>
                          )}
                          {i.resistance.length > 0 && (
                            <span className="text-[#555]">
                              Résistances : <span className="text-[#ef4444]">{i.resistance.join(' · ')}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="flex items-center justify-center h-48 gap-3">
                <RefreshCw className="w-5 h-5 text-[#F7931A] animate-spin" />
                <span className="text-sm text-[#555]">Chargement données BTC…</span>
              </div>
            )}
          </div>
        )}

        {/* ── POSITIONS TAB ────────────────────────────────────────────────── */}
        {tab === 'positions' && (
          <div className="space-y-4">
            {positions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#F7931A]/8 border border-[#F7931A]/15 flex items-center justify-center">
                  <Bitcoin className="w-8 h-8 text-[#F7931A]/40" />
                </div>
                <div className="text-center">
                  <p className="text-[#555] font-medium">Aucune position BTC ouverte</p>
                  <p className="text-xs text-[#333] mt-1">Générez un signal et ouvrez une position depuis l'onglet Signal IA</p>
                </div>
              </div>
            ) : (
              positions.map(pos => {
                const pnl = calcPnl(pos)
                return (
                  <div key={pos.id} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black border',
                          pos.side === 'LONG'
                            ? 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/30'
                            : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'
                        )}>
                          {pos.side === 'LONG' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          {pos.side}
                        </span>
                        <div className="flex items-center gap-1.5 bg-[#111] border border-[#1a1a1a] rounded-lg px-2.5 py-1">
                          <Bitcoin className="w-3.5 h-3.5 text-[#F7931A]" />
                          <span className="text-xs font-bold text-[#F2EDD7]">BTC/USDT</span>
                        </div>
                        <span className="text-[10px] text-[#555] bg-[#141414] border border-[#2a2a2a] px-2 py-0.5 rounded">{pos.mode}</span>
                      </div>
                      {pnl && (
                        <span className={cn('text-xl font-black', pnl.raw >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                          {pnl.raw >= 0 ? '+' : ''}{pnl.raw.toFixed(2)} $
                          <span className="text-sm ml-1 opacity-70">({fmtPct(pnl.pct)})</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                      {[
                        { label: 'Entrée',   value: fmtUsd(pos.entryPrice), color: undefined },
                        { label: 'SL',       value: fmtUsd(pos.stopLoss),   color: '#ef4444' },
                        { label: 'TP 1',     value: fmtUsd(pos.tp1),        color: '#22c55e' },
                        { label: 'TP 2',     value: fmtUsd(pos.tp2),        color: '#22c55e' },
                        { label: 'TP 3',     value: fmtUsd(pos.tp3),        color: '#22c55e' },
                        { label: 'Taille',   value: `${pos.usdtSize} $`,    color: '#F7931A' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-[#141414] border border-[#1a1a1a] rounded-lg px-3 py-2">
                          <p className="text-[10px] text-[#555]">{label}</p>
                          <p className="text-xs font-bold mt-0.5" style={{ color: color ?? '#F2EDD7' }}>{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {(['tp1', 'tp2', 'tp3'] as const).map(tp => (
                        <button key={tp}
                          onClick={() => closePosition(pos.id, pos[tp], tp)}
                          className="px-3 py-2 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e] text-xs font-bold hover:bg-[#22c55e]/20 transition-all">
                          Clôturer {tp.toUpperCase()}
                        </button>
                      ))}
                      <button
                        onClick={() => closePosition(pos.id, pos.stopLoss, 'stop_loss')}
                        className="px-3 py-2 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/25 text-[#ef4444] text-xs font-bold hover:bg-[#ef4444]/20 transition-all">
                        Stop Loss
                      </button>
                      <button
                        onClick={() => market && closePosition(pos.id, market.price, 'manual')}
                        className="px-3 py-2 rounded-xl bg-[#111] border border-[#2a2a2a] text-[#888] text-xs font-bold hover:text-[#F2EDD7] transition-all">
                        Manuel · {market ? fmtUsd(market.price) : '…'}
                      </button>
                    </div>

                    <p className="text-[10px] text-[#333] mt-3">
                      Ouvert le {new Date(pos.openedAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── HISTORIQUE TAB ───────────────────────────────────────────────── */}
        {tab === 'historique' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Trades totaux',  value: String(closed.length),                             color: '#888' },
                { label: 'Gagnants',       value: String(winCount),                                  color: '#22c55e' },
                { label: 'Win Rate',       value: `${winRate.toFixed(0)}%`,                          color: winRate >= 50 ? '#22c55e' : '#ef4444' },
                { label: 'PnL Total BTC',  value: `${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)} $`, color: totalPnl >= 0 ? '#22c55e' : '#ef4444' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Bitcoin className="w-3 h-3" style={{ color }} />
                    <p className="text-[10px] text-[#555] uppercase tracking-wide">{label}</p>
                  </div>
                  <p className="text-xl font-black" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>

            {closed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <BookOpen className="w-8 h-8 text-[#333]" />
                <p className="text-[#555] text-sm">Aucun trade Bitcoin clôturé</p>
              </div>
            ) : (
              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1a1a1a] text-[#555] text-[10px] uppercase tracking-wider">
                      {['Direction', 'Entrée', 'Sortie', 'Taille', 'PnL', 'Raison', 'Date'].map(h => (
                        <th key={h} className="px-4 py-3 text-right first:text-left last:hidden md:last:table-cell">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {closed.map(t => (
                      <tr key={t.id} className="border-b border-[#111] hover:bg-[#141414] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Bitcoin className="w-3 h-3 text-[#F7931A]" />
                            <span className={cn('px-2 py-0.5 rounded text-xs font-black',
                              t.side === 'LONG' ? 'text-[#22c55e] bg-[#22c55e]/10' : 'text-[#ef4444] bg-[#ef4444]/10')}>
                              {t.side}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-[#888] text-xs">{fmtUsd(t.entryPrice)}</td>
                        <td className="px-4 py-3 text-right text-[#888] text-xs">{fmtUsd(t.closePrice)}</td>
                        <td className="px-4 py-3 text-right text-[#888] text-xs">{t.usdtSize} $</td>
                        <td className={cn('px-4 py-3 text-right font-bold text-sm',
                          t.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                          {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)} $
                        </td>
                        <td className="px-4 py-3 text-right text-[#555] text-xs hidden sm:table-cell">{t.closeReason}</td>
                        <td className="px-4 py-3 text-right text-[#444] text-xs hidden md:table-cell">
                          {new Date(t.closedAt).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {closed.length > 0 && (
              <button
                onClick={() => { setClosed([]); save(SK.closed, []) }}
                className="text-xs text-[#ef4444]/50 hover:text-[#ef4444] transition-colors">
                Effacer l'historique
              </button>
            )}
          </div>
        )}

        {/* ── PARAMÈTRES TAB ───────────────────────────────────────────────── */}
        {tab === 'parametres' && (
          <div className="max-w-lg space-y-4">

            {/* Explanation */}
            <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl p-5 space-y-3">
              <p className="text-xs font-bold text-[#888] uppercase tracking-wider">À quoi servent ces paramètres ?</p>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Risque max par trade', desc: 'Pourcentage de votre capital risqué sur chaque trade. 1% recommandé — perdre 10 trades d\'affilée ne représente que 10% du capital.' },
                  { label: 'Perte journalière max', desc: 'Le bot s\'arrête automatiquement si vous atteignez ce montant de perte dans la journée. Protège contre les mauvaises séries.' },
                  { label: 'Perte hebdomadaire max', desc: 'Même principe sur la semaine. Permet de se préserver psychologiquement et financièrement.' },
                  { label: 'Confiance min signal', desc: 'Filtre de qualité : le bot ne propose de trader que si le score de confiance IA dépasse ce seuil. 70+ recommandé.' },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F7931A] mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-[#888]">{label} — </span>
                      <span className="text-[#555]">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 space-y-5">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#F7931A]" />
                <h3 className="font-bold text-[#F2EDD7]">Gestion du risque BTC</h3>
              </div>
              {[
                { key: 'maxRiskPct',      label: 'Risque max par trade (%)',        min: 0.1, max: 5,    step: 0.1 },
                { key: 'dailyLossLimit',  label: 'Perte journalière max ($)',       min: 10,  max: 1000, step: 10 },
                { key: 'weeklyLossLimit', label: 'Perte hebdo max ($)',             min: 50,  max: 5000, step: 50 },
                { key: 'maxPositions',    label: 'Positions BTC max simultanées',   min: 1,   max: 5,    step: 1 },
                { key: 'minConfidence',   label: 'Confiance min signal (%)',        min: 50,  max: 95,   step: 5 },
                { key: 'stopAfterLosses', label: 'Stop après N pertes consécutives', min: 1,  max: 10,   step: 1 },
              ].map(({ key, label, min, max, step }) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#888]">{label}</span>
                    <span className="text-[#F7931A] font-bold">{risk[key as keyof RiskSettings]}</span>
                  </div>
                  <input
                    type="range" min={min} max={max} step={step}
                    value={risk[key as keyof RiskSettings]}
                    onChange={e => {
                      const next = { ...risk, [key]: parseFloat(e.target.value) }
                      setRisk(next)
                      save(SK.risk, next)
                    }}
                    className="w-full accent-[#F7931A]"
                  />
                </div>
              ))}
            </div>

            <div className="bg-[#F7931A]/5 border border-[#F7931A]/15 rounded-xl p-4 flex items-start gap-3">
              <Bitcoin className="w-5 h-5 text-[#F7931A] flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 text-[#666]">
                <p className="font-bold text-[#F7931A] text-sm">Robot exclusif Bitcoin</p>
                <p>Ce robot analyse et trade <strong className="text-[#888]">uniquement BTC/USDT</strong> sur les futures perpétuels.</p>
                <p>Mode actuel : <span className={cn('font-bold', mode === 'paper' ? 'text-[#38bdf8]' : 'text-[#ef4444]')}>
                  {mode === 'paper' ? 'Paper Trading (simulation)' : 'Live Trading (ordres réels)'}
                </span></p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
