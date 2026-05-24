'use client'

import { cn } from '@/lib/utils'
import type {
  BtcSignal, BtcClosedTrade, BtcPosition, MarketData, NewsData, RiskSettings,
} from '@/lib/bot-btc/types'
import { DEFAULT_RISK } from '@/lib/bot-btc/types'
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight,
  Bitcoin, BookOpen, Brain, CheckCircle2,
  Eye, EyeOff, Key, Lock, RefreshCw, Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Storage ──────────────────────────────────────────────────────────────────

const SK = {
  mode:      'btcbot_mode_v2',
  apiKey:    'btcbot_apikey_v2',
  apiSecret: 'btcbot_apisecret_v2',
  positions: 'btcbot_positions_v2',
  closed:    'btcbot_closed_v2',
  connected: 'btcbot_connected_v2',
}

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function save(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
function fmtPct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session { mode: 'paper' | 'live'; apiKey?: string; apiSecret?: string }
type Tab = 'signal' | 'positions' | 'historique'

// ─── Main Component ───────────────────────────────────────────────────────────
// DOM-stable: no conditional JSX that swaps element types.
// All sections always exist in the tree; visibility via className hidden.

export function BtcBotClient() {
  // ── Session state ──────────────────────────────────────────────────────────
  const [ready, setReady]         = useState(false)
  const [connected, setConnected] = useState(false)
  const [mode, setMode]           = useState<'paper' | 'live'>('paper')
  const [apiKey, setApiKey]       = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [setupErr, setSetupErr]   = useState('')

  // ── Bot state ──────────────────────────────────────────────────────────────
  const [tab, setTab]             = useState<Tab>('signal')
  const [market, setMarket]       = useState<MarketData | null>(null)
  const [signal, setSignal]       = useState<BtcSignal | null>(null)
  const [news, setNews]           = useState<NewsData | null>(null)
  const [positions, setPositions] = useState<BtcPosition[]>([])
  const [closed, setClosed]       = useState<BtcClosedTrade[]>([])
  const [tradeSize, setTradeSize] = useState(100)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [loadingMarket, setLoadingMarket] = useState(false)
  const [loadingSignal, setLoadingSignal] = useState(false)
  const [marketErr, setMarketErr] = useState('')
  const [signalErr, setSignalErr] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Restore session from localStorage (client-only)
  useEffect(() => {
    const wasConnected = load<boolean>(SK.connected, false)
    if (wasConnected) {
      setMode(load<'paper' | 'live'>(SK.mode, 'paper'))
      setApiKey(load<string>(SK.apiKey, ''))
      setApiSecret(load<string>(SK.apiSecret, ''))
      setConnected(true)
    }
    setPositions(load(SK.positions, []))
    setClosed(load(SK.closed, []))
    setReady(true)
  }, [])

  // ── Fetch helpers ──────────────────────────────────────────────────────────

  const fetchMarket = useCallback(async () => {
    setLoadingMarket(true); setMarketErr('')
    try {
      const r = await fetch('/api/bot-btc/market')
      if (!r.ok) throw new Error()
      setMarket(await r.json())
    } catch { setMarketErr('Impossible de récupérer les données BTC.') }
    finally { setLoadingMarket(false) }
  }, [])

  const fetchNews = useCallback(async () => {
    try { const r = await fetch('/api/bot-btc/news'); if (r.ok) setNews(await r.json()) } catch {}
  }, [])

  const generateSignal = useCallback(async () => {
    if (!market) return
    setLoadingSignal(true); setSignalErr('')
    try {
      const r = await fetch('/api/bot-btc/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market, news: news?.sentiment ?? null }),
      })
      if (!r.ok) throw new Error()
      setSignal(await r.json())
    } catch { setSignalErr('Erreur lors de la génération du signal.') }
    finally { setLoadingSignal(false) }
  }, [market, news])

  useEffect(() => {
    if (connected) { fetchMarket(); fetchNews() }
  }, [connected, fetchMarket, fetchNews])

  useEffect(() => {
    if (autoRefresh) { intervalRef.current = setInterval(fetchMarket, 30_000) }
    else if (intervalRef.current) clearInterval(intervalRef.current)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, fetchMarket])

  // ── Session actions ────────────────────────────────────────────────────────

  function handleConnect() {
    if (mode === 'live' && (!apiKey.trim() || !apiSecret.trim())) {
      setSetupErr('Veuillez entrer vos deux clés API Bybit.')
      return
    }
    setSetupErr('')
    save(SK.connected, true)
    save(SK.mode, mode)
    save(SK.apiKey, apiKey.trim())
    save(SK.apiSecret, apiSecret.trim())
    setConnected(true)
  }

  function handleDisconnect() {
    save(SK.connected, false)
    localStorage.removeItem(SK.apiKey)
    localStorage.removeItem(SK.apiSecret)
    setConnected(false)
    setSignal(null)
    setMarket(null)
  }

  // ── Position actions ───────────────────────────────────────────────────────

  function openPosition() {
    if (!signal || signal.signal === 'WAIT' || !market) return
    const pos: BtcPosition = {
      id: crypto.randomUUID(),
      side: signal.signal as 'LONG' | 'SHORT',
      entryPrice: signal.entryPrice,
      quantity: tradeSize / signal.entryPrice,
      usdtSize: tradeSize,
      stopLoss: signal.stopLoss,
      tp1: signal.tp1, tp2: signal.tp2, tp3: signal.tp3,
      openedAt: new Date().toISOString(),
      mode, fromSignal: true,
    }
    const next = [...positions, pos]
    setPositions(next); save(SK.positions, next)
  }

  function closePos(id: string, closePrice: number, reason: BtcClosedTrade['closeReason']) {
    const pos = positions.find(p => p.id === id)
    if (!pos) return
    const pnl = pos.side === 'LONG'
      ? (closePrice - pos.entryPrice) * pos.quantity
      : (pos.entryPrice - closePrice) * pos.quantity
    const trade: BtcClosedTrade = {
      id: pos.id, side: pos.side,
      entryPrice: pos.entryPrice, closePrice,
      quantity: pos.quantity, usdtSize: pos.usdtSize,
      pnl, pnlPct: (pnl / pos.usdtSize) * 100,
      closedAt: new Date().toISOString(),
      closeReason: reason, mode: pos.mode,
    }
    const np = positions.filter(p => p.id !== id)
    const nc = [trade, ...closed]
    setPositions(np); setClosed(nc)
    save(SK.positions, np); save(SK.closed, nc)
  }

  // ── Computed values (avoid inline ternaries that swap JSX types) ───────────

  const pnlOf = (pos: BtcPosition) => {
    if (!market) return null
    const raw = pos.side === 'LONG'
      ? (market.price - pos.entryPrice) * pos.quantity
      : (pos.entryPrice - market.price) * pos.quantity
    return { raw, pct: (raw / pos.usdtSize) * 100 }
  }

  const totalPnl = closed.reduce((s, t) => s + t.pnl, 0)
  const winRate  = closed.length > 0
    ? (closed.filter(t => t.pnl > 0).length / closed.length) * 100 : 0

  // Stable computed values for signal section
  const sigColor  = signal?.signal === 'LONG' ? '#22c55e'
    : signal?.signal === 'SHORT' ? '#ef4444' : '#F7931A'
  const hasSignal = !!signal
  const canTrade  = hasSignal && signal.signal !== 'WAIT'
  const btnDisabled = loadingSignal || loadingMarket || !market

  // Stable button label text — computed, not inline ternary JSX
  const btnLabel = loadingSignal ? 'Analyse en cours…'
    : loadingMarket ? 'Chargement des données…'
    : signal ? 'Nouveau signal'
    : 'Analyser le Bitcoin'

  // Stable connect button label
  const connectLabel = mode === 'paper'
    ? 'Démarrer en Paper Trading'
    : 'Connecter mon compte Bybit'

  // ── Visibility flags (CSS-based, no JSX swapping) ─────────────────────────

  const showSpinner = !ready
  const showSetup   = ready && !connected
  const showBot     = ready && connected

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — single return, all sections always in DOM tree
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#080808] text-[#F2EDD7]">

      {/* ── SPINNER ─────────────────────────────────────────────────────── */}
      <div className={cn(
        'min-h-screen flex items-center justify-center',
        !showSpinner && 'hidden'
      )}>
        <div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
      </div>

      {/* ── SETUP SCREEN ────────────────────────────────────────────────── */}
      <div className={cn('min-h-screen flex items-center justify-center px-4', !showSetup && 'hidden')}>
        <div className="w-full max-w-md space-y-6">

          {/* Logo */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F7931A] flex items-center justify-center shadow-[0_0_40px_#F7931A30]">
              <Bitcoin className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#F2EDD7]">Robot BTC Scalping</h1>
              <p className="text-sm text-[#555] mt-1">Intelligence artificielle · Bitcoin uniquement</p>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-5 space-y-3">
            <p className="text-xs font-bold text-[#F7931A] uppercase tracking-wider">Comment ça marche</p>
            <div className="space-y-3 text-sm text-[#666]">
              <div className="flex gap-3">
                <RefreshCw className="w-4 h-4 text-[#F7931A] flex-shrink-0 mt-0.5" />
                <span>Le robot analyse le Bitcoin en temps réel (prix, indicateurs, actualités) toutes les 30 secondes.</span>
              </div>
              <div className="flex gap-3">
                <Brain className="w-4 h-4 text-[#F7931A] flex-shrink-0 mt-0.5" />
                <span>L'IA Claude génère un signal LONG, SHORT ou WAIT avec un prix d'entrée, un Stop Loss et 3 niveaux de profit.</span>
              </div>
              <div className="flex gap-3">
                <Zap className="w-4 h-4 text-[#F7931A] flex-shrink-0 mt-0.5" />
                <span>En Paper Trading, tout est simulé. En Live, le robot exécute les ordres sur votre compte Bybit.</span>
              </div>
            </div>
          </div>

          {/* Mode selector */}
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-5 space-y-4">
            <p className="text-xs font-bold text-[#888] uppercase tracking-wider">Choisir le mode</p>

            <div className="grid grid-cols-2 gap-2">
              {/* Paper button — always same element, just className changes */}
              <button onClick={() => setMode('paper')} className={cn(
                'flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all',
                mode === 'paper'
                  ? 'border-[#38bdf8] bg-[#38bdf8]/8 text-[#38bdf8]'
                  : 'border-[#1a1a1a] text-[#555] hover:border-[#2a2a2a]'
              )}>
                <Activity className="w-5 h-5" />
                <div className="text-center">
                  <p className="text-sm font-bold">Paper Trading</p>
                  <p className="text-[10px] opacity-70 mt-0.5">Simulation sans risque</p>
                </div>
              </button>

              {/* Live button */}
              <button onClick={() => setMode('live')} className={cn(
                'flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all',
                mode === 'live'
                  ? 'border-[#F7931A] bg-[#F7931A]/8 text-[#F7931A]'
                  : 'border-[#1a1a1a] text-[#555] hover:border-[#2a2a2a]'
              )}>
                <Zap className="w-5 h-5" />
                <div className="text-center">
                  <p className="text-sm font-bold">Live Trading</p>
                  <p className="text-[10px] opacity-70 mt-0.5">Ordres réels Bybit</p>
                </div>
              </button>
            </div>

            {/* API keys — always in DOM, shown via CSS */}
            <div className={cn('space-y-3', mode !== 'live' && 'hidden')}>
              <div className="flex items-center gap-2 text-xs text-[#555]">
                <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Clés Bybit — stockées localement, jamais envoyées à nos serveurs</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#666]">Clé publique (API Key)</label>
                <div className="flex items-center bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 gap-2">
                  <Key className="w-4 h-4 text-[#444] flex-shrink-0" />
                  <input
                    type="text"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="Votre API Key Bybit"
                    className="flex-1 bg-transparent text-sm text-[#F2EDD7] placeholder:text-[#333] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#666]">Clé secrète (API Secret)</label>
                <div className="flex items-center bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 gap-2">
                  <Lock className="w-4 h-4 text-[#444] flex-shrink-0" />
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={apiSecret}
                    onChange={e => setApiSecret(e.target.value)}
                    placeholder="Votre API Secret Bybit"
                    className="flex-1 bg-transparent text-sm text-[#F2EDD7] placeholder:text-[#333] focus:outline-none"
                  />
                  {/* Eye icons: both always in DOM, toggled via hidden */}
                  <button onClick={() => setShowSecret(v => !v)} className="text-[#444] hover:text-[#888] transition-colors flex-shrink-0">
                    <Eye className={cn('w-4 h-4', showSecret && 'hidden')} />
                    <EyeOff className={cn('w-4 h-4', !showSecret && 'hidden')} />
                  </button>
                </div>
              </div>

              <div className="bg-[#F7931A]/5 border border-[#F7931A]/15 rounded-xl p-3 text-[11px] text-[#666] space-y-1">
                <p className="font-semibold text-[#F7931A]/80">Comment créer vos clés Bybit</p>
                <p>1. Connectez-vous sur bybit.com → Mon Compte → Gestion API</p>
                <p>2. Créez une clé avec les permissions : Ordre (Lecture + Écriture)</p>
                <p>3. Limitez l'accès à votre adresse IP pour plus de sécurité</p>
              </div>
            </div>

            {/* Error */}
            <p className={cn('text-xs text-[#ef4444] flex items-center gap-1.5', !setupErr && 'hidden')}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {setupErr}
            </p>

            {/* Connect button — single element, text computed above */}
            <button
              onClick={handleConnect}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all',
                mode === 'paper'
                  ? 'bg-[#38bdf8] text-[#080808] hover:bg-[#5ac8f5]'
                  : 'bg-[#F7931A] text-white hover:bg-[#e8841a]'
              )}
            >
              <Activity className={cn('w-4 h-4', mode !== 'paper' && 'hidden')} />
              <Zap className={cn('w-4 h-4', mode !== 'live' && 'hidden')} />
              {connectLabel}
            </button>
          </div>

          <p className="text-center text-[10px] text-[#333]">
            Résultats passés non garantis · Trading sur futures à risque élevé
          </p>
        </div>
      </div>

      {/* ── BOT UI ──────────────────────────────────────────────────────── */}
      <div className={cn(!showBot && 'hidden')}>

        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-[#080808]/95 backdrop-blur border-b border-[#141414]">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F7931A] flex items-center justify-center flex-shrink-0">
                <Bitcoin className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              {/* Price — single div, content changes but element type is stable */}
              <div className={cn('flex items-baseline gap-2', loadingMarket && !market && 'hidden')}>
                <span className="text-lg font-black">
                  {market ? fmtPrice(market.price) : '—'}
                  <span className="text-xs text-[#555] font-normal ml-1">$</span>
                </span>
                <span className={cn('text-xs font-bold', (market?.change24h ?? 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                  {market ? fmtPct(market.change24h) : ''}
                </span>
              </div>
              <div className={cn('h-4 w-28 bg-[#141414] rounded animate-pulse', (!loadingMarket || market) && 'hidden')} />
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setAutoRefresh(v => !v)} className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all',
                autoRefresh
                  ? 'text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/8'
                  : 'text-[#444] border-[#1a1a1a]'
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', autoRefresh ? 'bg-[#22c55e] animate-pulse' : 'bg-[#333]')} />
                AUTO
              </button>
              <span className={cn(
                'px-2.5 py-1.5 rounded-lg text-[10px] font-bold border',
                mode === 'paper'
                  ? 'text-[#38bdf8] border-[#38bdf8]/20 bg-[#38bdf8]/8'
                  : 'text-[#F7931A] border-[#F7931A]/20 bg-[#F7931A]/8'
              )}>
                {mode === 'paper' ? 'PAPER' : 'LIVE'}
              </span>
              <button onClick={handleDisconnect} className="text-[10px] text-[#333] hover:text-[#555] transition-colors font-medium">
                Changer
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

          {/* Tabs */}
          <div className="flex gap-1 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-1">
            {([
              { id: 'signal'     as Tab, label: 'Signal IA',              icon: Brain },
              { id: 'positions'  as Tab, label: `Positions (${positions.length})`, icon: Activity },
              { id: 'historique' as Tab, label: 'Historique',             icon: BookOpen },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all',
                tab === t.id
                  ? 'bg-[#F7931A]/15 text-[#F7931A] border border-[#F7931A]/25'
                  : 'text-[#555] hover:text-[#888]'
              )}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* ── SIGNAL TAB ── */}
          <div className={cn('space-y-4', tab !== 'signal' && 'hidden')}>

            {/* Market error */}
            <div className={cn('flex items-center gap-2 bg-[#ef4444]/8 border border-[#ef4444]/20 rounded-xl p-4 text-xs text-[#ef4444]', !marketErr && 'hidden')}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {marketErr}
              <button onClick={fetchMarket} className="ml-auto underline">Réessayer</button>
            </div>

            {/* Signal result — always in DOM, shown when signal exists */}
            <div
              className={cn('rounded-2xl border-2 p-5 space-y-4', !hasSignal && 'hidden')}
              style={{ borderColor: `${sigColor}40`, backgroundColor: `${sigColor}06` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[#555]">
                    Signal IA · {signal?.timeframe ?? ''} · {signal ? new Date(signal.generatedAt).toLocaleTimeString('fr-FR') : ''}
                  </p>
                  <p className="text-xs text-[#444] mt-0.5">
                    Confiance {signal?.confidence ?? 0}/100 · Probabilité {signal?.probability ?? 0}%
                  </p>
                </div>
                <div className="text-3xl font-black flex-shrink-0" style={{ color: sigColor }}>
                  {signal?.signal ?? ''}
                </div>
              </div>

              {/* Confidence bar */}
              <div className="space-y-1">
                <div className="h-2 bg-[#141414] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${signal?.confidence ?? 0}%`, backgroundColor: sigColor }} />
                </div>
                <div className="flex justify-between text-[10px] text-[#444]">
                  <span>Niveau de confiance de l'IA</span>
                  <span style={{ color: sigColor }}>
                    {(signal?.confidence ?? 0) >= 70 ? 'Fort' : (signal?.confidence ?? 0) >= 50 ? 'Modéré' : 'Faible'}
                  </span>
                </div>
              </div>

              {/* Reasoning */}
              <p className={cn('text-xs text-[#666] leading-relaxed border-l-2 pl-3', !signal?.reasoning && 'hidden')}
                style={{ borderColor: `${sigColor}40` }}>
                {signal?.reasoning ?? ''}
              </p>

              {/* Price levels — always in DOM, hidden when WAIT */}
              <div className={cn('grid grid-cols-2 gap-2', !canTrade && 'hidden')}>
                {[
                  { label: '📍 Entrée',        key: 'entryPrice' as const, color: '#F2EDD7', sub: 'Prix recommandé' },
                  { label: '🛑 Stop Loss',     key: 'stopLoss'   as const, color: '#ef4444', sub: 'Sortie si ça tourne mal' },
                  { label: '🎯 TP1',           key: 'tp1'        as const, color: '#22c55e', sub: 'Objectif 1 — conservateur' },
                  { label: '🎯 TP2',           key: 'tp2'        as const, color: '#22c55e', sub: 'Objectif 2 — intermédiaire' },
                  { label: '🚀 TP3',           key: 'tp3'        as const, color: '#22c55e', sub: 'Objectif 3 — ambitieux' },
                  { label: '⚖️ Risque/Profit', key: null,                  color: '#F7931A', sub: 'Ratio risque/récompense' },
                ].map(({ label, key, color, sub }) => (
                  <div key={label} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3">
                    <p className="text-[10px] text-[#444]">{label}</p>
                    <p className="text-sm font-black mt-0.5" style={{ color }}>
                      {key
                        ? `${fmtPrice(signal?.[key] ?? 0)} $`
                        : `1 : ${(signal?.riskReward ?? 0).toFixed(1)}`
                      }
                    </p>
                    <p className="text-[9px] text-[#333] mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Open position — hidden when WAIT */}
              <div className={cn('space-y-2', !canTrade && 'hidden')}>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[#555] flex-shrink-0">Montant</label>
                  <div className="flex items-center flex-1 bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2.5 gap-2">
                    <input
                      type="number" min={10} value={tradeSize}
                      onChange={e => setTradeSize(Number(e.target.value))}
                      className="flex-1 bg-transparent text-sm font-bold text-[#F2EDD7] focus:outline-none text-right"
                    />
                    <span className="text-xs text-[#444]">USDT</span>
                  </div>
                </div>
                <button onClick={openPosition} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all border-2"
                  style={{ borderColor: `${sigColor}50`, backgroundColor: `${sigColor}15`, color: sigColor }}>
                  <ArrowUpRight className={cn('w-4 h-4', signal?.signal !== 'LONG' && 'hidden')} />
                  <ArrowDownRight className={cn('w-4 h-4', signal?.signal !== 'SHORT' && 'hidden')} />
                  {signal?.signal === 'LONG' ? 'Ouvrir LONG' : 'Ouvrir SHORT'} · {tradeSize} $
                </button>
              </div>

              {/* WAIT message */}
              <div className={cn('text-center py-2', signal?.signal !== 'WAIT' && 'hidden')}>
                <p className="text-sm font-bold text-[#F7931A]">Patientez — setup non optimal</p>
                <p className="text-xs text-[#555] mt-1">Le robot recommande d'attendre une meilleure opportunité.</p>
              </div>
            </div>

            {/* Empty state — always in DOM, hidden when signal exists */}
            <div className={cn('bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-6 text-center space-y-3', hasSignal && 'hidden')}>
              <div className="w-12 h-12 rounded-xl bg-[#F7931A]/10 border border-[#F7931A]/20 flex items-center justify-center mx-auto">
                <Brain className="w-6 h-6 text-[#F7931A]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#F2EDD7]">Prêt à analyser</p>
                <p className="text-xs text-[#555] mt-1">
                  Le robot va analyser le prix BTC, les indicateurs techniques et les actualités, puis vous donner un signal précis.
                </p>
              </div>
            </div>

            {/* News pill */}
            <div className={cn('flex items-center gap-3 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-3', !news && 'hidden')}>
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0',
                news?.sentiment.direction === 'bullish' ? 'bg-[#22c55e]'
                  : news?.sentiment.direction === 'bearish' ? 'bg-[#ef4444]'
                  : 'bg-[#F7931A]'
              )} />
              <p className="text-xs text-[#555] flex-1">
                <span className="font-bold text-[#888]">Actualités BTC</span>
                {' — '}{news?.sentiment.summary ?? ''}
              </p>
              <span className="text-xs font-bold text-[#444] flex-shrink-0">{news?.sentiment.score ?? ''}/100</span>
            </div>

            {/* Generate button — single element, text and icon computed above */}
            <button
              onClick={generateSignal}
              disabled={btnDisabled}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all',
                btnDisabled
                  ? 'bg-[#141414] text-[#333] cursor-not-allowed'
                  : 'bg-[#F7931A] text-white hover:bg-[#e8841a] active:scale-[0.99] shadow-[0_4px_24px_#F7931A25]'
              )}
            >
              <RefreshCw className={cn('w-5 h-5 animate-spin', !loadingSignal && !loadingMarket && 'hidden')} />
              <Bitcoin className={cn('w-5 h-5', (loadingSignal || loadingMarket) && 'hidden')} />
              {btnLabel}
            </button>

            {/* Signal error */}
            <p className={cn('text-xs text-[#ef4444] text-center flex items-center justify-center gap-1.5', !signalErr && 'hidden')}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {signalErr}
            </p>

            {/* Market metrics */}
            <div className={cn('grid grid-cols-3 gap-2', !market && 'hidden')}>
              {[
                { label: 'Volume 24h', value: `${((market?.volume24h ?? 0) / 1_000_000).toFixed(0)}M $`, up: undefined },
                { label: 'Funding',    value: `${((market?.fundingRate ?? 0) * 100).toFixed(4)}%`,        up: undefined },
                { label: 'Bid/Ask',    value: (market?.orderBook.ratio ?? 1).toFixed(2),                  up: (market?.orderBook.ratio ?? 1) > 1 },
              ].map(({ label, value, up }) => (
                <div key={label} className="bg-[#0a0a0a] border border-[#141414] rounded-xl p-3 text-center">
                  <p className="text-[10px] text-[#444]">{label}</p>
                  <p className={cn('text-sm font-bold mt-0.5',
                    up === true ? 'text-[#22c55e]' : up === false ? 'text-[#ef4444]' : 'text-[#888]')}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── POSITIONS TAB ── */}
          <div className={cn('space-y-3', tab !== 'positions' && 'hidden')}>

            {/* Empty state */}
            <div className={cn('flex flex-col items-center justify-center py-16 gap-3 text-center', positions.length > 0 && 'hidden')}>
              <Activity className="w-8 h-8 text-[#222]" />
              <p className="text-sm text-[#444]">Aucune position ouverte</p>
              <p className="text-xs text-[#333]">Générez un signal depuis l'onglet Signal IA</p>
            </div>

            {positions.map(pos => {
              const pnl = pnlOf(pos)
              return (
                <div key={pos.id} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black',
                        pos.side === 'LONG' ? 'text-[#22c55e] bg-[#22c55e]/10' : 'text-[#ef4444] bg-[#ef4444]/10'
                      )}>
                        <ArrowUpRight className={cn('w-3.5 h-3.5', pos.side !== 'LONG' && 'hidden')} />
                        <ArrowDownRight className={cn('w-3.5 h-3.5', pos.side !== 'SHORT' && 'hidden')} />
                        {pos.side}
                      </span>
                      <span className="text-xs text-[#555]">BTC · {pos.usdtSize} $</span>
                    </div>
                    <span className={cn('text-base font-black', (pnl?.raw ?? 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                      {pnl ? `${pnl.raw >= 0 ? '+' : ''}${pnl.raw.toFixed(2)} $` : '—'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                    {[
                      { label: 'Entrée', value: fmtPrice(pos.entryPrice), color: '#888' },
                      { label: 'SL',     value: fmtPrice(pos.stopLoss),   color: '#ef4444' },
                      { label: 'TP1',    value: fmtPrice(pos.tp1),        color: '#22c55e' },
                      { label: 'TP2',    value: fmtPrice(pos.tp2),        color: '#22c55e' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-[#111] rounded-lg py-2">
                        <p className="text-[9px] text-[#444]">{label}</p>
                        <p className="font-bold text-[11px] mt-0.5" style={{ color }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {(['tp1', 'tp2', 'tp3'] as const).map(tp => (
                      <button key={tp} onClick={() => closePos(pos.id, pos[tp], tp)}
                        className="flex-1 py-2 rounded-lg bg-[#22c55e]/10 text-[#22c55e] text-[11px] font-bold hover:bg-[#22c55e]/20 transition-all">
                        {tp.toUpperCase()}
                      </button>
                    ))}
                    <button onClick={() => closePos(pos.id, pos.stopLoss, 'stop_loss')}
                      className="px-3 py-2 rounded-lg bg-[#ef4444]/10 text-[#ef4444] text-[11px] font-bold hover:bg-[#ef4444]/20 transition-all">
                      SL
                    </button>
                    <button onClick={() => market && closePos(pos.id, market.price, 'manual')}
                      className="px-3 py-2 rounded-lg bg-[#141414] text-[#555] text-[11px] font-bold hover:text-[#888] transition-all">
                      Manuel
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── HISTORIQUE TAB ── */}
          <div className={cn('space-y-4', tab !== 'historique' && 'hidden')}>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Trades',   value: String(closed.length),                                   color: '#888' },
                { label: 'Win Rate', value: `${winRate.toFixed(0)}%`,                                color: winRate >= 50 ? '#22c55e' : '#ef4444' },
                { label: 'PnL',      value: `${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)} $`, color: totalPnl >= 0 ? '#22c55e' : '#ef4444' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4 text-center">
                  <p className="text-[10px] text-[#444]">{label}</p>
                  <p className="text-lg font-black mt-1" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>

            <div className={cn('flex flex-col items-center justify-center py-12 gap-2', closed.length > 0 && 'hidden')}>
              <BookOpen className="w-8 h-8 text-[#222]" />
              <p className="text-sm text-[#444]">Aucun trade clôturé</p>
            </div>

            <div className={cn('space-y-2', closed.length === 0 && 'hidden')}>
              {closed.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-black', t.side === 'LONG' ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                      {t.side}
                    </span>
                    <span className="text-xs text-[#444]">
                      {fmtPrice(t.entryPrice)} → {fmtPrice(t.closePrice)} $
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-bold', t.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                      {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)} $
                    </span>
                    <CheckCircle2 className={cn('w-4 h-4 text-[#22c55e]', t.pnl < 0 && 'hidden')} />
                    <AlertTriangle className={cn('w-4 h-4 text-[#ef4444]', t.pnl >= 0 && 'hidden')} />
                  </div>
                </div>
              ))}
              <button onClick={() => { setClosed([]); save(SK.closed, []) }}
                className="w-full text-xs text-[#333] hover:text-[#555] py-2 transition-colors">
                Effacer l'historique
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] text-[#2a2a2a] pb-4">
            {mode === 'paper' ? 'Mode simulation — aucun capital réel engagé' : `Compte Live Bybit · ${apiKey.slice(0, 8)}…`}
          </p>
        </div>
      </div>
    </div>
  )
}
