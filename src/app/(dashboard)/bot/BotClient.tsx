'use client'
import { PlanGate } from '@/components/upgrade/PlanGate'
import { FinancialDisclaimer } from '@/components/FinancialDisclaimer'
import { cn } from '@/lib/utils'
import { TRADEABLE_PAIRS, resolvePairConfig } from '@/lib/broker/binance-shared'
import type { LiveSignal } from '@/lib/signal-engine'
import Image from 'next/image'
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight,
  CheckCircle2, Clock, Eye, EyeOff, Key, Loader2,
  RefreshCw, Shield, SquareX, TrendingDown, TrendingUp,
  Unplug, Zap, Bot, Play, FlaskConical,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'paper' | 'live'

interface Credentials { apiKey: string; apiSecret: string }
interface AccountInfo { usdtBalance: number; canTrade: boolean; permissions: string[] }

export interface PaperPosition {
  id: string; pair: string; binanceSymbol: string; priceKey?: string
  side: 'LONG' | 'SHORT'; entryPrice: number; quantity: number
  usdtSize: number; stopLoss: number; takeProfit: number
  openedAt: string; fromSignal?: boolean
}

export interface LivePosition {
  id: string; symbol: string; pair: string
  side: 'LONG'; entryPrice: number; quantity: number; usdtSize: number
  stopLoss: number; takeProfit: number; openedAt: string
  entryOrderId: string; orderListId?: number
  fromSignal?: boolean
}

export interface ClosedTrade {
  id: string; pair: string; side: 'LONG' | 'SHORT'
  entryPrice: number; closePrice: number; quantity: number; usdtSize: number
  pnl: number; pnlPct: number; closedAt: string
  closeReason: 'manual' | 'stop_loss' | 'take_profit' | 'emergency'
  mode: 'paper' | 'live'; fromSignal?: boolean
}

interface RiskSettings {
  maxRiskPct: number; dailyLossLimit: number; maxPositions: number; minConfidence: number
}

// ─── Bybit crypto pairs only ─────────────────────────────────────────────────

const LIVE_PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT']

// ─── Storage ──────────────────────────────────────────────────────────────────

const S = {
  creds:       'px_creds_v2',
  account:     'px_account_v2',
  paperOpen:   'px_paper_open_v2',
  paperClosed: 'px_paper_closed_v2',
  liveOpen:    'px_live_open_v2',
  liveClosed:  'px_live_closed_v2',
  risk:        'px_risk_v2',
  mode:        'px_mode_v2',
}

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function save(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

const DEFAULT_RISK: RiskSettings = {
  maxRiskPct: 1, dailyLossLimit: 50, maxPositions: 2, minConfidence: 80,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(n: number) {
  if (n > 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (n > 10)   return n.toFixed(2)
  if (n > 1)    return n.toFixed(4)
  return n.toFixed(6)
}
function fmt(n: number, d = 2) { return n.toFixed(d) }
function fmtUSD(n: number) { return `$${Math.abs(n).toFixed(2)}` }

function parsePrice(s: string | null | undefined): number | null {
  if (!s) return null
  const clean = s.replace(/[,$€£\s]/g, '')
  const range = clean.match(/(\d+\.?\d*)[–\-](\d+\.?\d*)/)
  if (range) return (parseFloat(range[1]) + parseFloat(range[2])) / 2
  const single = clean.match(/\d+\.?\d*/)
  return single ? parseFloat(single[0]) : null
}

function pnlFromPrice(entry: number, price: number, qty: number, side: 'LONG' | 'SHORT') {
  return side === 'LONG' ? (price - entry) * qty : (entry - price) * qty
}

function todayISO() { return new Date().toISOString().slice(0, 10) }
function dailyPnl(closed: ClosedTrade[]) {
  return closed.filter(t => t.closedAt.startsWith(todayISO())).reduce((s, t) => s + t.pnl, 0)
}
function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `${s}s`; if (s < 3600) return `${Math.floor(s / 60)}min`
  return `${Math.floor(s / 3600)}h`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PnlBadge({ pnl, pct }: { pnl: number; pct?: number }) {
  const pos = pnl >= 0
  return (
    <span className={cn('font-mono font-bold text-sm', pos ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
      {pos ? '+' : '-'}{fmtUSD(pnl)}{pct !== undefined ? ` (${pos ? '+' : ''}${pct.toFixed(2)}%)` : ''}
    </span>
  )
}

function StatBox({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[#0f0f0f] rounded-xl p-3.5 text-center border border-[#1a1a1a]">
      <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">{label}</p>
      <p className={cn('font-mono font-bold text-lg', color)}>{value}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function BotContent() {
  const [mode, setMode]             = useState<Mode>('paper')
  const [creds, setCreds]           = useState<Credentials>({ apiKey: '', apiSecret: '' })
  const [showSecret, setShowSecret] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected]   = useState(false)
  const [account, setAccount]       = useState<AccountInfo | null>(null)
  const [connError, setConnError]   = useState<string | null>(null)

  const [signals, setSignals]           = useState<LiveSignal[]>([])
  const [signalsLoading, setSignalsLoading] = useState(false)
  const [signalsAt, setSignalsAt]       = useState<string | null>(null)
  const [dismissed, setDismissed]       = useState<Set<string>>(new Set())
  const [executing, setExecuting]       = useState<string | null>(null)
  const [autoMode, setAutoMode]         = useState(false)

  const [paperOpen,   setPaperOpen]   = useState<PaperPosition[]>([])
  const [paperClosed, setPaperClosed] = useState<ClosedTrade[]>([])
  const [liveOpen,    setLiveOpen]    = useState<LivePosition[]>([])
  const [liveClosed,  setLiveClosed]  = useState<ClosedTrade[]>([])
  const [livePrices,  setLivePrices]  = useState<Record<string, number>>({})
  const [priceLoading, setPriceLoading] = useState(false)
  const [closingId,   setClosingId]   = useState<string | null>(null)

  const [risk, setRisk]         = useState<RiskSettings>(DEFAULT_RISK)
  const [showRisk, setShowRisk] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const priceRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Hydrate ───────────────────────────────────────────────────────────────

  useEffect(() => {
    setCreds(load(S.creds, { apiKey: '', apiSecret: '' }))
    const acc = load<AccountInfo | null>(S.account, null)
    if (acc) { setAccount(acc); setConnected(true) }
    setPaperOpen(load(S.paperOpen, []))
    setPaperClosed(load(S.paperClosed, []))
    setLiveOpen(load(S.liveOpen, []))
    setLiveClosed(load(S.liveClosed, []))
    setRisk(load(S.risk, DEFAULT_RISK))
    setMode(load(S.mode, 'paper'))
    setHydrated(true)
  }, [])

  // ── Signals ───────────────────────────────────────────────────────────────

  const fetchSignals = useCallback(async () => {
    setSignalsLoading(true)
    try {
      const res  = await fetch('/api/signals')
      const data = await res.json()
      setSignals((data.signals ?? []).filter((s: LiveSignal) => s.type !== 'WAIT'))
      setSignalsAt(data.generatedAt ?? new Date().toISOString())
    } catch {}
    finally { setSignalsLoading(false) }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    fetchSignals()
    const iv = setInterval(fetchSignals, 5 * 60 * 1000)
    return () => clearInterval(iv)
  }, [hydrated, fetchSignals])

  // ── Live prices ───────────────────────────────────────────────────────────

  const fetchPrices = useCallback(async () => {
    const pairs = [
      ...paperOpen.map(p => p.priceKey ?? p.binanceSymbol),
      ...liveOpen.map(p => p.symbol),
    ]
    const keys = [...new Set(pairs)]
    if (!keys.length) return
    setPriceLoading(true)
    const updates: Record<string, number> = {}
    await Promise.all(keys.map(async key => {
      try {
        const r = await fetch(`/api/bot/price?pair=${encodeURIComponent(key)}`)
        if (r.ok) { const d = await r.json(); updates[key] = d.price }
      } catch {}
    }))
    setLivePrices(prev => ({ ...prev, ...updates }))
    setPriceLoading(false)
  }, [paperOpen, liveOpen])

  useEffect(() => {
    if (!hydrated) return
    fetchPrices()
    priceRef.current = setInterval(fetchPrices, 10000)
    return () => { if (priceRef.current) clearInterval(priceRef.current) }
  }, [hydrated, fetchPrices])

  // ── Auto SL/TP paper ──────────────────────────────────────────────────────

  useEffect(() => {
    const toClose: { pos: PaperPosition; reason: ClosedTrade['closeReason']; price: number }[] = []
    for (const pos of paperOpen) {
      const price = livePrices[pos.priceKey ?? pos.binanceSymbol]
      if (!price) continue
      if (pos.side === 'LONG') {
        if (price <= pos.stopLoss)   toClose.push({ pos, reason: 'stop_loss',   price })
        if (price >= pos.takeProfit) toClose.push({ pos, reason: 'take_profit', price })
      } else {
        if (price >= pos.stopLoss)   toClose.push({ pos, reason: 'stop_loss',   price })
        if (price <= pos.takeProfit) toClose.push({ pos, reason: 'take_profit', price })
      }
    }
    if (!toClose.length) return
    const ids = new Set(toClose.map(x => x.pos.id))
    setPaperOpen(prev => { const u = prev.filter(p => !ids.has(p.id)); save(S.paperOpen, u); return u })
    setPaperClosed(prev => {
      const newClosed: ClosedTrade[] = toClose.map(({ pos, reason, price }) => {
        const pnl = pnlFromPrice(pos.entryPrice, price, pos.quantity, pos.side)
        return { id: pos.id, pair: pos.pair, side: pos.side, entryPrice: pos.entryPrice, closePrice: price, quantity: pos.quantity, usdtSize: pos.usdtSize, pnl, pnlPct: (pnl / pos.usdtSize) * 100, closedAt: new Date().toISOString(), closeReason: reason, mode: 'paper', fromSignal: pos.fromSignal }
      })
      const u = [...newClosed, ...prev]; save(S.paperClosed, u); return u
    })
  }, [livePrices, paperOpen])

  // ── Auto-execute paper ────────────────────────────────────────────────────

  useEffect(() => {
    if (!autoMode || mode !== 'paper') return
    const executableSignals = signals.filter(s =>
      !dismissed.has(s.id) &&
      s.confidence >= risk.minConfidence &&
      resolvePairConfig(s.pair) &&
      paperOpen.length < risk.maxPositions &&
      dailyPnl(paperClosed) > -risk.dailyLossLimit
    )
    if (!executableSignals.length) return
    const signal = executableSignals[0]
    executePaperSignal(signal)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signals, autoMode, mode])

  // ── Connection ────────────────────────────────────────────────────────────

  const connect = async () => {
    setConnecting(true); setConnError(null)
    try {
      const res  = await fetch('/api/bot/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: creds.apiKey.trim(), apiSecret: creds.apiSecret.trim() }) })
      const data = await res.json()
      if (!res.ok) { setConnError(data.error); return }
      const info: AccountInfo = { usdtBalance: data.usdtBalance, canTrade: data.canTrade, permissions: data.permissions }
      setAccount(info); setConnected(true)
      save(S.creds, creds); save(S.account, info)
    } catch { setConnError('Connexion impossible.') }
    finally { setConnecting(false) }
  }

  const disconnect = () => {
    setConnected(false); setAccount(null); setCreds({ apiKey: '', apiSecret: '' })
    localStorage.removeItem(S.creds); localStorage.removeItem(S.account)
  }

  const saveMode = (m: Mode) => { setMode(m); save(S.mode, m) }
  const saveRisk = (r: RiskSettings) => { setRisk(r); save(S.risk, r) }

  // ── Paper: execute signal ─────────────────────────────────────────────────

  const executePaperSignal = async (signal: LiveSignal, manual = false) => {
    const config = resolvePairConfig(signal.pair)
    if (!config) return
    const sl = parsePrice(signal.stopLoss)
    const tp = parsePrice(signal.tp1)
    if (!sl || !tp) return
    if (paperOpen.length >= risk.maxPositions) { if (manual) alert(`Max ${risk.maxPositions} positions.`); return }
    if (dailyPnl(paperClosed) <= -risk.dailyLossLimit) { if (manual) alert('Limite journalière atteinte.'); return }

    setExecuting(signal.id)
    try {
      const r = await fetch(`/api/bot/price?pair=${encodeURIComponent(signal.pair)}`)
      if (!r.ok) throw new Error('Prix indisponible')
      const { price } = await r.json()
      const side: 'LONG' | 'SHORT' = signal.type === 'BUY' ? 'LONG' : 'SHORT'
      if (side === 'LONG'  && (sl >= price || tp <= price)) { if (manual) alert(`Niveaux incohérents pour LONG. Prix: ${price}`); return }
      if (side === 'SHORT' && (sl <= price || tp >= price)) { if (manual) alert(`Niveaux incohérents pour SHORT. Prix: ${price}`); return }

      const balance  = account?.usdtBalance ?? 500
      const usdtSize = parseFloat((balance * risk.maxRiskPct / 100).toFixed(2))
      const pos: PaperPosition = {
        id: `sig_${signal.id}_${Date.now()}`, pair: signal.pair,
        binanceSymbol: config.binanceSymbol ?? signal.pair, priceKey: signal.pair,
        side, entryPrice: price, quantity: usdtSize / price, usdtSize,
        stopLoss: sl, takeProfit: tp, openedAt: new Date().toISOString(), fromSignal: true,
      }
      setPaperOpen(prev => { const u = [pos, ...prev]; save(S.paperOpen, u); return u })
      setLivePrices(prev => ({ ...prev, [signal.pair]: price }))
      setDismissed(prev => new Set([...prev, signal.id]))
    } catch (e: any) { if (manual) alert(e.message) }
    finally { setExecuting(null) }
  }

  const closePaperPosition = (pos: PaperPosition, reason: ClosedTrade['closeReason'] = 'manual') => {
    const price = livePrices[pos.priceKey ?? pos.binanceSymbol] ?? pos.entryPrice
    const pnl   = pnlFromPrice(pos.entryPrice, price, pos.quantity, pos.side)
    const closed: ClosedTrade = { id: pos.id, pair: pos.pair, side: pos.side, entryPrice: pos.entryPrice, closePrice: price, quantity: pos.quantity, usdtSize: pos.usdtSize, pnl, pnlPct: (pnl / pos.usdtSize) * 100, closedAt: new Date().toISOString(), closeReason: reason, mode: 'paper', fromSignal: pos.fromSignal }
    setPaperOpen(prev => { const u = prev.filter(p => p.id !== pos.id); save(S.paperOpen, u); return u })
    setPaperClosed(prev => { const u = [closed, ...prev]; save(S.paperClosed, u); return u })
  }

  const paperEmergencyStop = () => {
    if (!confirm('Fermer TOUTES les positions paper ?')) return
    paperOpen.forEach(p => closePaperPosition(p, 'emergency'))
  }

  // ── Live: execute signal ──────────────────────────────────────────────────

  const executeLiveSignal = async (signal: LiveSignal) => {
    if (!connected || !account) { alert("Connecte ton compte Bybit d'abord."); return }
    if (!account.canTrade) { alert("Ton compte Bybit n'a pas la permission de trader. Active la permission SPOT dans Bybit."); return }
    const sl = parsePrice(signal.stopLoss)
    const tp = parsePrice(signal.tp1)
    if (!sl || !tp || signal.type !== 'BUY') { alert('Seuls les signaux BUY sont supportés en mode Live (Spot).'); return }
    if (liveOpen.length >= risk.maxPositions) { alert(`Max ${risk.maxPositions} positions Live simultanées.`); return }

    const symbol   = LIVE_PAIRS.find(p => p.startsWith(signal.pair.split('/')[0]))?.replace('/', '') ?? ''
    if (!symbol) { alert(`Paire ${signal.pair} non supportée en Live.`); return }

    const usdtSize = parseFloat((account.usdtBalance * risk.maxRiskPct / 100).toFixed(2))
    if (usdtSize < 10) { alert('Solde insuffisant (minimum $10 par trade).'); return }

    const confirmed = confirm(
      `⚠ ORDRE RÉEL BYBIT ⚠\n\nAcheter ${signal.pair} avec $${usdtSize} USDT\nStop Loss : ${sl}\nTake Profit : ${tp}\n\nCet ordre utilise des FONDS RÉELS.\nConfirmer ?`
    )
    if (!confirmed) return

    setExecuting(signal.id)
    try {
      const res  = await fetch('/api/bot/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: creds.apiKey, apiSecret: creds.apiSecret, symbol, usdtAmount: usdtSize, tpPrice: tp, slPrice: sl }),
      })
      const data = await res.json()
      if (!res.ok) { alert(`Erreur: ${data.error}`); return }

      const pos: LivePosition = {
        id: `live_${Date.now()}`, symbol, pair: signal.pair,
        side: 'LONG', entryPrice: data.avgEntryPrice, quantity: data.executedQty,
        usdtSize, stopLoss: sl, takeProfit: tp, openedAt: new Date().toISOString(),
        entryOrderId: data.entryOrderId, fromSignal: true,
      }
      setLiveOpen(prev => { const u = [pos, ...prev]; save(S.liveOpen, u); return u })
      setDismissed(prev => new Set([...prev, signal.id]))
      // Refresh balance
      const accRes = await fetch('/api/bot/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: creds.apiKey, apiSecret: creds.apiSecret }) })
      const accData = await accRes.json()
      if (accRes.ok) { const info = { usdtBalance: accData.usdtBalance, canTrade: accData.canTrade, permissions: accData.permissions }; setAccount(info); save(S.account, info) }
    } catch (e: any) { alert(e.message) }
    finally { setExecuting(null) }
  }

  const closeLivePosition = async (pos: LivePosition) => {
    if (!confirm(`Fermer ${pos.pair} LONG ? Cela vend au prix marché actuel.`)) return
    setClosingId(pos.id)
    try {
      const res  = await fetch('/api/bot/order', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: creds.apiKey, apiSecret: creds.apiSecret, symbol: pos.symbol, quantity: pos.quantity }),
      })
      const data = await res.json()
      if (!res.ok) { alert(`Erreur: ${data.error}`); return }

      const pnl = (data.avgClosePrice - pos.entryPrice) * pos.quantity
      const closed: ClosedTrade = { id: pos.id, pair: pos.pair, side: 'LONG', entryPrice: pos.entryPrice, closePrice: data.avgClosePrice, quantity: pos.quantity, usdtSize: pos.usdtSize, pnl, pnlPct: (pnl / pos.usdtSize) * 100, closedAt: new Date().toISOString(), closeReason: 'manual', mode: 'live', fromSignal: pos.fromSignal }
      setLiveOpen(prev => { const u = prev.filter(p => p.id !== pos.id); save(S.liveOpen, u); return u })
      setLiveClosed(prev => { const u = [closed, ...prev]; save(S.liveClosed, u); return u })
      // Refresh balance
      const accRes = await fetch('/api/bot/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: creds.apiKey, apiSecret: creds.apiSecret }) })
      const accData = await accRes.json()
      if (accRes.ok) { setAccount({ usdtBalance: accData.usdtBalance, canTrade: accData.canTrade, permissions: accData.permissions }) }
    } catch (e: any) { alert(e.message) }
    finally { setClosingId(null) }
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  const paperPnl = paperOpen.reduce((s, p) => {
    const price = livePrices[p.priceKey ?? p.binanceSymbol] ?? p.entryPrice
    return s + pnlFromPrice(p.entryPrice, price, p.quantity, p.side)
  }, 0)
  const livePnl = liveOpen.reduce((s, p) => {
    const price = livePrices[p.symbol] ?? p.entryPrice
    return s + pnlFromPrice(p.entryPrice, price, p.quantity, 'LONG')
  }, 0)

  const paperDailyPnl  = dailyPnl(paperClosed) + paperPnl
  const liveDailyPnl   = dailyPnl(liveClosed) + livePnl
  const limitReached   = mode === 'paper' ? paperDailyPnl <= -risk.dailyLossLimit : liveDailyPnl <= -risk.dailyLossLimit

  const queueSignals = signals
    .filter(s => !dismissed.has(s.id))
    .filter(s => s.confidence >= risk.minConfidence)
    .filter(s => mode === 'live' ? s.type === 'BUY' : true)
    .filter(s => resolvePairConfig(s.pair))
    .filter(s => mode === 'live' ? LIVE_PAIRS.some(p => p.startsWith(s.pair.split('/')[0])) : true)

  if (!hydrated) return <div className="p-6 text-[#555] text-sm">Chargement…</div>

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">

      {/* ── Mode toggle ────────────────────────────────────────────── */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-1.5 flex gap-1.5">
        <button
          onClick={() => saveMode('paper')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all',
            mode === 'paper'
              ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]'
              : 'text-[#555] hover:text-[#888]'
          )}
        >
          <FlaskConical className="w-4 h-4" />
          Paper Trading
          <span className="text-[10px] font-medium opacity-70">— Simulation</span>
        </button>
        <button
          onClick={() => saveMode('live')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all',
            mode === 'live'
              ? 'bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e]'
              : 'text-[#555] hover:text-[#888]'
          )}
        >
          <Play className="w-4 h-4" />
          Live Bybit
          <span className="text-[10px] font-medium opacity-70">— Fonds réels</span>
        </button>
      </div>

      {/* ── Mode banners ───────────────────────────────────────────── */}
      {mode === 'paper' ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/20">
          <FlaskConical className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-[#D4AF37]">Mode Simulation</p>
            <p className="text-[11px] text-[#666]">Aucun fonds réel. Entraîne-toi librement avec les vrais prix du marché.</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
            <span className="text-[10px] text-[#555] font-semibold">AUTO</span>
            <div
              onClick={() => setAutoMode(!autoMode)}
              className={cn('w-10 h-5 rounded-full transition-colors relative cursor-pointer', autoMode ? 'bg-[#D4AF37]' : 'bg-[#222]')}
            >
              <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow', autoMode ? 'translate-x-5' : 'translate-x-0.5')} />
            </div>
          </label>
        </div>
      ) : (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#ef4444]/5 border border-[#ef4444]/30">
          <AlertTriangle className="w-4 h-4 text-[#ef4444] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#ef4444]">Mode Live — Fonds réels Bybit</p>
            <p className="text-[11px] text-[#666] mt-0.5">Ordres exécutés sur ton vrai compte. Clé API avec permission <strong className="text-[#888]">SPOT Trading</strong> requise. Les pertes sont réelles.</p>
          </div>
        </div>
      )}

      {/* ── Connexion Bybit ────────────────────────────────────────── */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
              <Image src="/bybit-logo.svg" alt="Bybit" width={32} height={32} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Bybit</p>
              <p className="text-[10px] text-[#555]">
                {mode === 'paper' ? 'Lecture seule (pour afficher le solde)' : 'Permission SPOT Trading requise'}
              </p>
            </div>
            {connected && (
              <span className="text-[10px] font-bold text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2 py-0.5 rounded-md">CONNECTÉ</span>
            )}
          </div>
          {connected && (
            <button onClick={disconnect} className="flex items-center gap-1.5 text-xs text-[#555] hover:text-[#ef4444] transition-colors">
              <Unplug className="w-3.5 h-3.5" /> Déconnecter
            </button>
          )}
        </div>

        {connected && account ? (
          <div className="grid grid-cols-3 gap-3">
            <StatBox label="Balance USDT" value={`$${fmt(account.usdtBalance)}`} />
            <StatBox
              label={mode === 'paper' ? 'P&L Paper (jour)' : 'P&L Live (jour)'}
              value={`${(mode === 'paper' ? paperDailyPnl : liveDailyPnl) >= 0 ? '+' : ''}${fmt(mode === 'paper' ? paperDailyPnl : liveDailyPnl)}$`}
              color={(mode === 'paper' ? paperDailyPnl : liveDailyPnl) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}
            />
            <StatBox
              label="Positions ouvertes"
              value={`${mode === 'paper' ? paperOpen.length : liveOpen.length}/${risk.maxPositions}`}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]" />
              <input
                value={creds.apiKey}
                onChange={e => setCreds(p => ({ ...p, apiKey: e.target.value }))}
                placeholder="Clé API Bybit"
                className="w-full bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#D4AF37]/40 transition-colors"
              />
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]" />
              <input
                type={showSecret ? 'text' : 'password'}
                value={creds.apiSecret}
                onChange={e => setCreds(p => ({ ...p, apiSecret: e.target.value }))}
                placeholder="Clé secrète"
                className="w-full bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#D4AF37]/40 transition-colors"
              />
              <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-white">
                {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {connError && (
              <div className="flex items-center gap-2 text-xs text-[#ef4444] bg-[#ef4444]/5 border border-[#ef4444]/20 rounded-xl p-3">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{connError}
              </div>
            )}
            <button
              onClick={connect}
              disabled={connecting || !creds.apiKey.trim() || !creds.apiSecret.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#D4AF37] text-[#080808] text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {connecting
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Connexion…</>
                : <><CheckCircle2 className="w-3.5 h-3.5" />Se connecter à Bybit</>
              }
            </button>
          </div>
        )}
      </div>

      {/* ── Garde-fous de risque ────────────────────────────────────── */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowRisk(!showRisk)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#0f0f0f] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-semibold text-white">Paramètres de risque</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#555]">
            <span className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg px-2 py-1">{risk.maxRiskPct}% / trade</span>
            <span className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg px-2 py-1">-${risk.dailyLossLimit}/j max</span>
            <span className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg px-2 py-1">{risk.minConfidence}% min</span>
          </div>
        </button>
        {showRisk && (
          <div className="px-5 pb-5 border-t border-[#111] pt-4 space-y-5">
            {[
              { label: 'Risque par trade (% du solde)', key: 'maxRiskPct',     min: 0.5, max: 5,    step: 0.5, suffix: '%'  },
              { label: 'Perte journalière maximum ($)', key: 'dailyLossLimit', min: 10,  max: 500,  step: 10,  suffix: '$'  },
              { label: 'Positions simultanées max',     key: 'maxPositions',   min: 1,   max: 5,    step: 1,   suffix: ''   },
              { label: 'Confiance minimale signal (%)', key: 'minConfidence',  min: 60,  max: 95,   step: 5,   suffix: '%'  },
            ].map(({ label, key, min, max, step, suffix }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-[#555]">{label}</label>
                  <span className="text-xs font-mono font-bold text-white">{risk[key as keyof RiskSettings]}{suffix}</span>
                </div>
                <input
                  type="range" min={min} max={max} step={step}
                  value={risk[key as keyof RiskSettings]}
                  onChange={e => saveRisk({ ...risk, [key]: parseFloat(e.target.value) })}
                  className="w-full accent-[#D4AF37]"
                />
              </div>
            ))}
            <div className="flex items-start gap-2 text-[11px] text-[#555] bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-3">
              <Shield className="w-3.5 h-3.5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
              Réglages conservateurs recommandés : 1% / trade · 50$ perte max · confiance 80%+
            </div>
          </div>
        )}
      </div>

      {/* ── File de signaux IA ─────────────────────────────────────── */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#111]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-bold text-white">Signaux IA</span>
            {queueSignals.length > 0 && (
              <span className="text-[10px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-1.5 py-0.5 rounded-md">
                {queueSignals.length}
              </span>
            )}
            {autoMode && mode === 'paper' && (
              <span className="text-[10px] font-bold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 px-1.5 py-0.5 rounded-md animate-pulse">
                AUTO
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {signalsAt && <span className="text-[10px] text-[#444]">il y a {timeAgo(signalsAt)}</span>}
            <button onClick={fetchSignals} disabled={signalsLoading} className="p-1.5 hover:bg-[#0f0f0f] rounded-lg text-[#444] hover:text-white transition-colors">
              <RefreshCw className={cn('w-3.5 h-3.5', signalsLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        <div className="divide-y divide-[#0f0f0f]">
          {signalsLoading && !signals.length ? (
            <div className="flex items-center gap-2 px-5 py-4 text-xs text-[#555]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement des signaux…
            </div>
          ) : queueSignals.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-[#444]">
              <Clock className="w-5 h-5 mx-auto mb-2 opacity-30" />
              Aucun signal ≥ {risk.minConfidence}% de confiance.
              <br />Actualisation automatique toutes les 5 minutes.
            </div>
          ) : (
            queueSignals.slice(0, 5).map(signal => {
              const isBuy   = signal.type === 'BUY'
              const isExec  = executing === signal.id
              const balance = account?.usdtBalance ?? 500
              const size    = (balance * risk.maxRiskPct / 100).toFixed(2)
              const isLiveOk = mode === 'live' && LIVE_PAIRS.some(p => p.startsWith(signal.pair.split('/')[0]))

              return (
                <div key={signal.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', isBuy ? 'bg-[#22c55e]/10' : 'bg-[#ef4444]/10')}>
                        {isBuy ? <ArrowUpRight className="w-5 h-5 text-[#22c55e]" /> : <ArrowDownRight className="w-5 h-5 text-[#ef4444]" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">{signal.pair}</span>
                          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', isBuy ? 'text-[#22c55e] border-[#22c55e]/20 bg-[#22c55e]/5' : 'text-[#ef4444] border-[#ef4444]/20 bg-[#ef4444]/5')}>
                            {isBuy ? 'LONG' : 'SHORT'}
                          </span>
                          <span className="text-[10px] text-[#555] font-mono bg-[#0f0f0f] border border-[#1a1a1a] px-1.5 py-0.5 rounded">{signal.confidence}%</span>
                        </div>
                        <p className="text-[11px] text-[#444] mt-0.5 line-clamp-1 max-w-xs">{signal.justification}</p>
                      </div>
                    </div>
                    <button onClick={() => setDismissed(prev => new Set([...prev, signal.id]))} className="text-[#333] hover:text-[#ef4444] p-1 transition-colors text-xs flex-shrink-0">✕</button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: 'Entrée',     value: signal.entry    ?? '—', color: 'text-white'      },
                      { label: 'Stop Loss',  value: signal.stopLoss ?? '—', color: 'text-[#ef4444]'  },
                      { label: 'Take Profit', value: signal.tp1     ?? '—', color: 'text-[#22c55e]'  },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-2 text-center">
                        <p className="text-[9px] text-[#444] uppercase tracking-wide mb-0.5">{label}</p>
                        <p className={cn('text-xs font-mono font-bold', color)}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {mode === 'paper' ? (
                    <button
                      onClick={() => executePaperSignal(signal, true)}
                      disabled={isExec || limitReached || paperOpen.length >= risk.maxPositions}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border',
                        isBuy
                          ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e] hover:text-white'
                          : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444] hover:text-white',
                        (isExec || limitReached || paperOpen.length >= risk.maxPositions) && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      {isExec ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Exécution…</> : <><Bot className="w-3.5 h-3.5" />Simuler · ${size}</>}
                    </button>
                  ) : (
                    <button
                      onClick={() => executeLiveSignal(signal)}
                      disabled={isExec || !connected || !isBuy || !isLiveOk || limitReached || liveOpen.length >= risk.maxPositions}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border',
                        isBuy && isLiveOk
                          ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e] hover:text-white'
                          : 'bg-[#1a1a1a] border-[#222] text-[#444] cursor-not-allowed',
                        (isExec || !connected || limitReached || liveOpen.length >= risk.maxPositions) && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      {isExec
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Ordre en cours…</>
                        : !isBuy
                        ? 'SHORT non disponible en Spot'
                        : !isLiveOk
                        ? 'Paire non disponible sur Bybit'
                        : !connected
                        ? "Connecte Bybit d'abord"
                        : <><Play className="w-3.5 h-3.5" />Acheter RÉEL · ${size}</>
                      }
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Positions ouvertes ─────────────────────────────────────── */}
      {mode === 'paper' && paperOpen.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#555]">
              Positions Paper · {paperOpen.length}
              {priceLoading && <RefreshCw className="w-3 h-3 inline ml-2 animate-spin" />}
            </h2>
            <button onClick={paperEmergencyStop} className="flex items-center gap-1.5 text-xs font-bold text-[#ef4444] border border-[#ef4444]/30 bg-[#ef4444]/5 hover:bg-[#ef4444] hover:text-white px-3 py-1.5 rounded-xl transition-all">
              <SquareX className="w-3.5 h-3.5" /> STOP D'URGENCE
            </button>
          </div>
          {paperOpen.map(pos => {
            const price  = livePrices[pos.priceKey ?? pos.binanceSymbol] ?? pos.entryPrice
            const pnl    = pnlFromPrice(pos.entryPrice, price, pos.quantity, pos.side)
            const pnlPct = (pnl / pos.usdtSize) * 100
            const isLong = pos.side === 'LONG'
            return (
              <div key={pos.id} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center', isLong ? 'bg-[#22c55e]/10' : 'bg-[#ef4444]/10')}>
                      {isLong ? <TrendingUp className="w-4 h-4 text-[#22c55e]" /> : <TrendingDown className="w-4 h-4 text-[#ef4444]" />}
                    </span>
                    <span className="font-mono font-bold text-white text-sm">{pos.pair}</span>
                    <span className={cn('text-[10px] font-bold', isLong ? 'text-[#22c55e]' : 'text-[#ef4444]')}>{pos.side}</span>
                    {pos.fromSignal && <span className="text-[9px] text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-1.5 py-0.5 rounded">IA</span>}
                  </div>
                  <PnlBadge pnl={pnl} pct={pnlPct} />
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { label: 'Entrée', value: fmtPrice(pos.entryPrice), color: 'text-white' },
                    { label: 'Actuel', value: fmtPrice(price), color: pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]' },
                    { label: 'Stop',   value: fmtPrice(pos.stopLoss),   color: 'text-[#ef4444]' },
                    { label: 'TP',     value: fmtPrice(pos.takeProfit), color: 'text-[#22c55e]' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-2 text-center">
                      <p className="text-[9px] text-[#444] uppercase tracking-wide mb-0.5">{label}</p>
                      <p className={cn('text-xs font-mono font-bold', color)}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-[#444]">
                  <span>Taille: ${fmt(pos.usdtSize)} · {fmt(pos.quantity, 4)} {pos.pair.split('/')[0]}</span>
                  <button onClick={() => closePaperPosition(pos)} className="text-[#555] hover:text-[#ef4444] border border-[#1a1a1a] hover:border-[#ef4444]/30 px-2.5 py-1 rounded-lg transition-all text-xs">Fermer</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {mode === 'live' && liveOpen.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#555]">
            Positions Live Bybit · {liveOpen.length}
            {priceLoading && <RefreshCw className="w-3 h-3 inline ml-2 animate-spin" />}
          </h2>
          {liveOpen.map(pos => {
            const price  = livePrices[pos.symbol] ?? pos.entryPrice
            const pnl    = pnlFromPrice(pos.entryPrice, price, pos.quantity, 'LONG')
            const pnlPct = (pnl / pos.usdtSize) * 100
            const isClosing = closingId === pos.id
            return (
              <div key={pos.id} className="bg-[#0a0a0a] border border-[#22c55e]/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#22c55e]/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-[#22c55e]" />
                    </span>
                    <span className="font-mono font-bold text-white text-sm">{pos.pair}</span>
                    <span className="text-[10px] font-bold text-[#22c55e]">LONG</span>
                    <span className="text-[9px] text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-1.5 py-0.5 rounded">RÉEL</span>
                    {pos.fromSignal && <span className="text-[9px] text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-1.5 py-0.5 rounded">IA</span>}
                  </div>
                  <PnlBadge pnl={pnl} pct={pnlPct} />
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { label: 'Entrée', value: fmtPrice(pos.entryPrice), color: 'text-white' },
                    { label: 'Actuel', value: fmtPrice(price), color: pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]' },
                    { label: 'Stop',   value: fmtPrice(pos.stopLoss),   color: 'text-[#ef4444]' },
                    { label: 'TP',     value: fmtPrice(pos.takeProfit), color: 'text-[#22c55e]' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-2 text-center">
                      <p className="text-[9px] text-[#444] uppercase tracking-wide mb-0.5">{label}</p>
                      <p className={cn('text-xs font-mono font-bold', color)}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-[#444]">
                  <span>Taille: ${fmt(pos.usdtSize)} · TP/SL Bybit actif</span>
                  <button
                    onClick={() => closeLivePosition(pos)}
                    disabled={isClosing}
                    className="flex items-center gap-1.5 text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444] hover:text-white px-2.5 py-1 rounded-lg transition-all text-xs disabled:opacity-50"
                  >
                    {isClosing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Fermer au marché
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Historique ─────────────────────────────────────────────── */}
      {(() => {
        const history = mode === 'paper' ? paperClosed : liveClosed
        if (!history.length) return null
        const totalPnl = history.reduce((s, t) => s + t.pnl, 0)
        const wins     = history.filter(t => t.pnl > 0).length
        const winRate  = Math.round((wins / history.length) * 100)
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#555]">
                Historique {mode === 'paper' ? 'Paper' : 'Live'} · {history.length} trades
              </h2>
              <button
                onClick={() => {
                  if (!confirm('Effacer l\'historique ?')) return
                  if (mode === 'paper') { setPaperClosed([]); localStorage.removeItem(S.paperClosed) }
                  else { setLiveClosed([]); localStorage.removeItem(S.liveClosed) }
                }}
                className="text-[10px] text-[#333] hover:text-[#ef4444] transition-colors"
              >Effacer</button>
            </div>
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="P&L total" value={`${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}$`} color={totalPnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'} />
              <StatBox label="Taux de réussite" value={`${winRate}%`} color={winRate >= 50 ? 'text-[#22c55e]' : 'text-[#ef4444]'} />
              <StatBox label="Trades" value={`${wins}W / ${history.length - wins}L`} />
            </div>
            {history.slice(0, 15).map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl">
                <span className={cn('w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0', t.side === 'LONG' ? 'bg-[#22c55e]/10' : 'bg-[#ef4444]/10')}>
                  {t.side === 'LONG' ? <TrendingUp className="w-3.5 h-3.5 text-[#22c55e]" /> : <TrendingDown className="w-3.5 h-3.5 text-[#ef4444]" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs">{t.pair}</span>
                    {t.fromSignal && <span className="text-[9px] text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-1 rounded">IA</span>}
                    <span className="text-[9px] text-[#444] border border-[#1a1a1a] px-1 rounded">
                      {t.closeReason === 'stop_loss' ? '🔴 SL' : t.closeReason === 'take_profit' ? '🟢 TP' : t.closeReason === 'emergency' ? '⚡ STOP' : '✋ Manuel'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#444]">{new Date(t.closedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                </div>
                <div className="text-right">
                  <PnlBadge pnl={t.pnl} pct={t.pnlPct} />
                  <p className="text-[10px] text-[#444] mt-0.5">${fmt(t.usdtSize)}</p>
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Risk disclaimer */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-[#0f0f0f] border border-[#1a1a1a]">
        <AlertTriangle className="w-3.5 h-3.5 text-[#555] flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-[#444] leading-relaxed">
          Le trading comporte un risque de perte en capital. Aucun robot ne garantit des profits. Les performances passées ne préjugent pas des résultats futurs. N&apos;investissez que ce que vous êtes prêt à perdre.
        </p>
      </div>
      <FinancialDisclaimer compact />
    </div>
  )
}

export default function BotClient() {
  return (
    <PlanGate requiredPlan="premium">
      <BotContent />
    </PlanGate>
  )
}
