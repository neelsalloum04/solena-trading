'use client'
import { cn } from '@/lib/utils'
import { RiskBanner } from '@/components/ui/risk-banner'
import { TRADEABLE_PAIRS, resolvePairConfig } from '@/lib/broker/binance-shared'
import type { LiveSignal } from '@/lib/signal-engine'
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2,
  Clock, Eye, EyeOff, Key, Loader2, RefreshCw, Shield, SquareX,
  TrendingDown, TrendingUp, Unplug, Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Credentials { apiKey: string; apiSecret: string }
interface AccountInfo { usdtBalance: number; canTrade: boolean; permissions: string[] }

export interface PaperPosition {
  id: string
  pair: string
  binanceSymbol: string
  priceKey?: string       // pair string used as livePrices key; falls back to binanceSymbol for old positions
  side: 'LONG' | 'SHORT'
  entryPrice: number
  quantity: number
  usdtSize: number
  stopLoss: number
  takeProfit: number
  openedAt: string
  fromSignal?: boolean
}

export interface ClosedTrade extends PaperPosition {
  closePrice: number
  pnl: number
  pnlPct: number
  closedAt: string
  closeReason: 'manual' | 'stop_loss' | 'take_profit' | 'emergency'
}

interface RiskSettings {
  maxRiskPct: number
  dailyLossLimit: number
  maxPositions: number
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE = {
  creds:   'px_bot_creds_v1',
  account: 'px_bot_account_v1',
  open:    'px_bot_open_v1',
  closed:  'px_bot_closed_v1',
  risk:    'px_bot_risk_v1',
}

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

const DEFAULT_RISK: RiskSettings = { maxRiskPct: 2, dailyLossLimit: 100, maxPositions: 3 }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPriceKey(pos: PaperPosition): string {
  return pos.priceKey ?? pos.binanceSymbol
}

function fmtPrice(n: number): string {
  if (n > 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (n > 10)   return n.toFixed(2)
  if (n > 1)    return n.toFixed(4)
  return n.toFixed(6)
}

function pnlFromPrice(pos: PaperPosition, price: number): number {
  return pos.side === 'LONG'
    ? (price - pos.entryPrice) * pos.quantity
    : (pos.entryPrice - price) * pos.quantity
}

function todayISO()  { return new Date().toISOString().slice(0, 10) }
function dailyPnl(closed: ClosedTrade[]) {
  return closed.filter(t => t.closedAt.startsWith(todayISO())).reduce((s, t) => s + t.pnl, 0)
}

function fmt(n: number, d = 2)  { return n.toFixed(d) }
function fmtUSD(n: number)      { return `$${Math.abs(n).toFixed(2)}` }

// Parses Claude's price strings: "67,200", "67000–67500", "1.0850", "niveau 1.0820"
function parsePrice(s: string | null | undefined): number | null {
  if (!s) return null
  const clean = s.replace(/[,$€£\s]/g, '')
  const range = clean.match(/(\d+\.?\d*)[–\-](\d+\.?\d*)/)
  if (range) return (parseFloat(range[1]) + parseFloat(range[2])) / 2
  const single = clean.match(/\d+\.?\d*/)
  return single ? parseFloat(single[0]) : null
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}min`
  return `${Math.floor(s / 3600)}h`
}

// ─── PnlBadge ─────────────────────────────────────────────────────────────────

function PnlBadge({ pnl, pct }: { pnl: number; pct?: number }) {
  const pos = pnl >= 0
  return (
    <span className={cn('font-mono font-bold text-sm', pos ? 'text-solena-success' : 'text-solena-danger')}>
      {pos ? '+' : '-'}{fmtUSD(pnl)}{pct !== undefined ? ` (${pos ? '+' : ''}${pct.toFixed(2)}%)` : ''}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BotPage() {
  // Connection
  const [creds, setCreds]           = useState<Credentials>({ apiKey: '', apiSecret: '' })
  const [showSecret, setShowSecret] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected]   = useState(false)
  const [account, setAccount]       = useState<AccountInfo | null>(null)
  const [connError, setConnError]   = useState<string | null>(null)

  // Signal queue
  const [signals, setSignals]             = useState<LiveSignal[]>([])
  const [signalsLoading, setSignalsLoading] = useState(false)
  const [signalsAt, setSignalsAt]         = useState<string | null>(null)
  const [dismissed, setDismissed]         = useState<Set<string>>(new Set())
  const [executing, setExecuting]         = useState<string | null>(null) // signal id being executed

  // Paper positions
  const [openPositions, setOpenPositions] = useState<PaperPosition[]>([])
  const [closedTrades,  setClosedTrades]  = useState<ClosedTrade[]>([])
  const [livePrices,    setLivePrices]    = useState<Record<string, number>>({})
  const [priceLoading,  setPriceLoading]  = useState(false)

  // Manual form
  const [formPair,  setFormPair]  = useState('BTC/USDT')
  const [formSide,  setFormSide]  = useState<'LONG' | 'SHORT'>('LONG')
  const [formSize,  setFormSize]  = useState('')
  const [formSL,    setFormSL]    = useState('')
  const [formTP,    setFormTP]    = useState('')
  const [opening,   setOpening]   = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showManual, setShowManual] = useState(false)

  // Risk
  const [risk, setRisk]     = useState<RiskSettings>(DEFAULT_RISK)
  const [showRisk, setShowRisk] = useState(false)

  const [hydrated, setHydrated] = useState(false)
  const priceInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Hydrate ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const savedCreds   = load<Credentials>(STORAGE.creds,   { apiKey: '', apiSecret: '' })
    const savedAccount = load<AccountInfo | null>(STORAGE.account, null)
    const savedOpen    = load<PaperPosition[]>(STORAGE.open,   [])
    const savedClosed  = load<ClosedTrade[]>(STORAGE.closed,   [])
    const savedRisk    = load<RiskSettings>(STORAGE.risk,      DEFAULT_RISK)
    setCreds(savedCreds)
    if (savedAccount) { setAccount(savedAccount); setConnected(true) }
    setOpenPositions(savedOpen)
    setClosedTrades(savedClosed)
    setRisk(savedRisk)
    setHydrated(true)
  }, [])

  // ── Fetch signal queue ────────────────────────────────────────────────────

  const fetchSignals = useCallback(async () => {
    setSignalsLoading(true)
    try {
      const res = await fetch('/api/signals')
      const data = await res.json()
      const all: LiveSignal[] = data.signals ?? []
      // Only actionable (BUY/SELL) for the queue
      setSignals(all.filter(s => s.type !== 'WAIT'))
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

  // ── Live price refresh ────────────────────────────────────────────────────

  const fetchPrices = useCallback(async (positions: PaperPosition[]) => {
    const keys = [...new Set(positions.map(p => getPriceKey(p)))]
    if (!keys.length) return
    setPriceLoading(true)
    const updates: Record<string, number> = {}
    await Promise.all(keys.map(async (key) => {
      try {
        const r = await fetch(`/api/bot/price?pair=${encodeURIComponent(key)}`)
        if (r.ok) { const d = await r.json(); updates[key] = d.price }
      } catch {}
    }))
    setLivePrices(prev => ({ ...prev, ...updates }))
    setPriceLoading(false)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    fetchPrices(openPositions)
    priceInterval.current = setInterval(() => fetchPrices(openPositions), 10000)
    return () => { if (priceInterval.current) clearInterval(priceInterval.current) }
  }, [hydrated, openPositions, fetchPrices])

  // ── Auto SL/TP ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!Object.keys(livePrices).length) return
    const toClose: { pos: PaperPosition; reason: 'stop_loss' | 'take_profit'; price: number }[] = []
    for (const pos of openPositions) {
      const price = livePrices[getPriceKey(pos)]
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
    const closingIds = new Set(toClose.map(x => x.pos.id))
    setOpenPositions(prev => { const u = prev.filter(p => !closingIds.has(p.id)); save(STORAGE.open, u); return u })
    setClosedTrades(prev => {
      const newClosed: ClosedTrade[] = toClose.map(({ pos, reason, price }) => {
        const pnl = pnlFromPrice(pos, price)
        return { ...pos, closePrice: price, pnl, pnlPct: (pnl / pos.usdtSize) * 100, closedAt: new Date().toISOString(), closeReason: reason }
      })
      const u = [...newClosed, ...prev]; save(STORAGE.closed, u); return u
    })
  }, [livePrices, openPositions])

  // ── Connection ────────────────────────────────────────────────────────────

  const connect = async () => {
    setConnecting(true); setConnError(null)
    try {
      const res = await fetch('/api/bot/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: creds.apiKey.trim(), apiSecret: creds.apiSecret.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setConnError(data.error); return }
      const info: AccountInfo = { usdtBalance: data.usdtBalance, canTrade: data.canTrade, permissions: data.permissions }
      setAccount(info); setConnected(true)
      save(STORAGE.creds, creds); save(STORAGE.account, info)
    } catch { setConnError('Connexion impossible.') }
    finally { setConnecting(false) }
  }

  const disconnect = () => {
    setConnected(false); setAccount(null); setCreds({ apiKey: '', apiSecret: '' })
    localStorage.removeItem(STORAGE.creds); localStorage.removeItem(STORAGE.account)
  }

  // ── Execute signal as paper position ─────────────────────────────────────

  const executeSignal = async (signal: LiveSignal) => {
    const config = resolvePairConfig(signal.pair)
    if (!config) return

    const sl = parsePrice(signal.stopLoss)
    const tp = parsePrice(signal.tp1)
    if (!sl || !tp) {
      alert(`Impossible de parser SL/TP pour ${signal.pair}.\nSL: "${signal.stopLoss}" · TP: "${signal.tp1}"`)
      return
    }

    const balance = account?.usdtBalance ?? 200
    const usdtSize = parseFloat((balance * (risk.maxRiskPct / 100)).toFixed(2))

    const confirmed = confirm(
      `Exécuter ${signal.type === 'BUY' ? 'LONG' : 'SHORT'} ${signal.pair} en PAPER ?\n\n` +
      `Taille : $${usdtSize} (${risk.maxRiskPct}% du solde)\n` +
      `Stop Loss : ${sl}\nTake Profit : ${tp}\n\n` +
      `⚠ Simulation uniquement — aucun fonds réel engagé.`
    )
    if (!confirmed) return

    if (openPositions.length >= risk.maxPositions) {
      alert(`Limite de ${risk.maxPositions} positions simultanées atteinte.`)
      return
    }
    if (dailyPnl(closedTrades) <= -risk.dailyLossLimit) {
      alert(`Limite de perte journalière atteinte (${fmtUSD(risk.dailyLossLimit)}).`)
      return
    }

    setExecuting(signal.id)
    try {
      const priceRes = await fetch(`/api/bot/price?pair=${encodeURIComponent(signal.pair)}`)
      if (!priceRes.ok) throw new Error('Prix indisponible')
      const { price } = await priceRes.json()
      const side: 'LONG' | 'SHORT' = signal.type === 'BUY' ? 'LONG' : 'SHORT'

      // Validate SL/TP direction at current market price
      if (side === 'LONG'  && (sl >= price || tp <= price)) {
        alert(`Niveaux incohérents pour un LONG.\nPrix actuel: ${price}\nSL: ${sl} · TP: ${tp}\n\nUtilise le formulaire manuel.`)
        return
      }
      if (side === 'SHORT' && (sl <= price || tp >= price)) {
        alert(`Niveaux incohérents pour un SHORT.\nPrix actuel: ${price}\nSL: ${sl} · TP: ${tp}\n\nUtilise le formulaire manuel.`)
        return
      }

      const pos: PaperPosition = {
        id: `sig_${signal.id}_${Date.now()}`,
        pair: signal.pair,
        binanceSymbol: config.binanceSymbol ?? signal.pair,
        priceKey: signal.pair,
        side,
        entryPrice: price,
        quantity: usdtSize / price,
        usdtSize,
        stopLoss: sl,
        takeProfit: tp,
        openedAt: new Date().toISOString(),
        fromSignal: true,
      }

      setOpenPositions(prev => { const u = [pos, ...prev]; save(STORAGE.open, u); return u })
      setLivePrices(prev => ({ ...prev, [signal.pair]: price }))
      setDismissed(prev => new Set([...prev, signal.id]))
    } catch (e: any) {
      alert(`Erreur : ${e.message}`)
    } finally { setExecuting(null) }
  }

  // ── Manual position ───────────────────────────────────────────────────────

  const openManual = async () => {
    setFormError(null)
    const config = resolvePairConfig(formPair)
    if (!config) { setFormError('Paire non supportée.'); return }
    const usdtSize = parseFloat(formSize), sl = parseFloat(formSL), tp = parseFloat(formTP)
    if (isNaN(usdtSize) || usdtSize <= 0) { setFormError('Taille invalide.'); return }
    if (isNaN(sl) || sl <= 0)             { setFormError('Stop Loss invalide.'); return }
    if (isNaN(tp) || tp <= 0)             { setFormError('Take Profit invalide.'); return }
    if (openPositions.length >= risk.maxPositions) { setFormError(`Max ${risk.maxPositions} positions.`); return }
    if (dailyPnl(closedTrades) <= -risk.dailyLossLimit) { setFormError('Limite journalière atteinte.'); return }
    setOpening(true)
    try {
      const r = await fetch(`/api/bot/price?pair=${encodeURIComponent(formPair)}`)
      if (!r.ok) throw new Error('Prix indisponible')
      const { price } = await r.json()
      if (formSide === 'LONG'  && (sl >= price || tp <= price)) { setFormError('LONG : SL < prix < TP.'); return }
      if (formSide === 'SHORT' && (sl <= price || tp >= price)) { setFormError('SHORT : TP < prix < SL.'); return }
      const pairKey = formPair.toUpperCase()
      const pos: PaperPosition = {
        id: `manual_${Date.now()}`, pair: pairKey,
        binanceSymbol: config.binanceSymbol ?? pairKey,
        priceKey: pairKey,
        side: formSide, entryPrice: price, quantity: usdtSize / price,
        usdtSize, stopLoss: sl, takeProfit: tp, openedAt: new Date().toISOString(),
      }
      setOpenPositions(prev => { const u = [pos, ...prev]; save(STORAGE.open, u); return u })
      setLivePrices(prev => ({ ...prev, [pairKey]: price }))
      setFormSize(''); setFormSL(''); setFormTP('')
    } catch (e: any) { setFormError(e.message) }
    finally { setOpening(false) }
  }

  const closePosition = (pos: PaperPosition, reason: ClosedTrade['closeReason'] = 'manual') => {
    const price = livePrices[getPriceKey(pos)] ?? pos.entryPrice
    const pnl   = pnlFromPrice(pos, price)
    const closed: ClosedTrade = { ...pos, closePrice: price, pnl, pnlPct: (pnl / pos.usdtSize) * 100, closedAt: new Date().toISOString(), closeReason: reason }
    setOpenPositions(prev => { const u = prev.filter(p => p.id !== pos.id); save(STORAGE.open, u); return u })
    setClosedTrades(prev => { const u = [closed, ...prev]; save(STORAGE.closed, u); return u })
  }

  const emergencyStop = () => {
    if (!confirm('⚠ Fermer TOUTES les positions au prix actuel ?')) return
    openPositions.forEach(p => closePosition(p, 'emergency'))
  }

  const saveRisk = (next: RiskSettings) => { setRisk(next); save(STORAGE.risk, next) }

  // ── Computed ──────────────────────────────────────────────────────────────

  const openPnl      = openPositions.reduce((s, p) => s + pnlFromPrice(p, livePrices[getPriceKey(p)] ?? p.entryPrice), 0)
  const todayTotal   = dailyPnl(closedTrades) + openPnl
  const limitReached = todayTotal <= -risk.dailyLossLimit

  // Signals visible in queue (not dismissed)
  const queueSignals      = signals.filter(s => !dismissed.has(s.id))
  const executableSignals = queueSignals.filter(s => !!resolvePairConfig(s.pair))
  const nonExecutable     = queueSignals.filter(s => !resolvePairConfig(s.pair))

  if (!hydrated) return <div className="p-6 text-solena-text-muted text-sm">Chargement…</div>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">

      {/* Paper banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-solena-accent/10 border border-solena-accent/25">
        <Shield className="w-4 h-4 text-solena-accent flex-shrink-0" />
        <span className="text-xs font-bold text-solena-accent uppercase tracking-wide">Mode Paper Trading</span>
        <span className="text-xs text-solena-text-muted">— Aucun fonds réel engagé. Simulation au prix marché.</span>
      </div>

      {/* ── Signal Queue ─────────────────────────────────────────────── */}
      <div className="bg-solena-card border border-solena-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-solena-border">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-solena-primary" />
            <span className="text-sm font-bold text-solena-text">Signaux IA — En attente</span>
            {executableSignals.length > 0 && (
              <span className="text-[10px] font-bold bg-solena-primary/10 text-solena-primary border border-solena-primary/20 px-1.5 py-0.5 rounded-md">
                {executableSignals.length} exécutable{executableSignals.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {signalsAt && <span className="text-[10px] text-solena-text-muted">il y a {timeAgo(signalsAt)}</span>}
            <button onClick={fetchSignals} disabled={signalsLoading} className="p-1.5 hover:bg-solena-bg rounded-lg transition-colors text-solena-text-muted hover:text-solena-text">
              <RefreshCw className={cn('w-3.5 h-3.5', signalsLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        <div className="divide-y divide-solena-border">
          {signalsLoading && !signals.length ? (
            <div className="flex items-center gap-2 px-5 py-4 text-xs text-solena-text-muted">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Récupération des signaux…
            </div>
          ) : executableSignals.length === 0 && nonExecutable.length === 0 ? (
            <div className="px-5 py-6 text-center text-xs text-solena-text-muted">
              <Clock className="w-5 h-5 mx-auto mb-2 opacity-30" />
              Aucun signal BUY/SELL actif pour l'instant.
              <br />Les signaux se rafraîchissent toutes les 5 minutes.
            </div>
          ) : (
            <>
              {executableSignals.map(signal => {
                const isBuy = signal.type === 'BUY'
                const isExec = executing === signal.id
                const balance = account?.usdtBalance ?? 200
                const size = (balance * risk.maxRiskPct / 100).toFixed(2)
                return (
                  <div key={signal.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', isBuy ? 'bg-solena-success/10' : 'bg-solena-danger/10')}>
                          {isBuy ? <ArrowUpRight className="w-4 h-4 text-solena-success" /> : <ArrowDownRight className="w-4 h-4 text-solena-danger" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-solena-text text-sm">{signal.pair}</span>
                            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', isBuy ? 'text-solena-success border-solena-success/20 bg-solena-success/5' : 'text-solena-danger border-solena-danger/20 bg-solena-danger/5')}>
                              {isBuy ? 'LONG' : 'SHORT'}
                            </span>
                            <span className="text-[10px] text-solena-text-muted font-mono">{signal.confidence}%</span>
                          </div>
                          <p className="text-[11px] text-solena-text-muted mt-0.5 leading-relaxed max-w-xs line-clamp-1">{signal.justification}</p>
                        </div>
                      </div>
                      <button onClick={() => setDismissed(prev => new Set([...prev, signal.id]))} className="text-solena-text-muted hover:text-solena-danger p-1 rounded transition-colors flex-shrink-0" title="Ignorer">
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: 'Entrée', value: signal.entry ?? '—', color: 'text-solena-text' },
                        { label: 'Stop Loss', value: signal.stopLoss ?? '—', color: 'text-solena-danger' },
                        { label: 'TP1', value: signal.tp1 ?? '—', color: 'text-solena-success' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-solena-bg rounded-lg p-2 text-center">
                          <p className="text-[9px] text-solena-text-muted uppercase tracking-wide mb-0.5">{label}</p>
                          <p className={cn('text-xs font-mono font-bold', color)}>{value}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => executeSignal(signal)}
                      disabled={isExec || limitReached || openPositions.length >= risk.maxPositions}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border',
                        isBuy
                          ? 'bg-solena-success/10 border-solena-success/30 text-solena-success hover:bg-solena-success hover:text-white'
                          : 'bg-solena-danger/10 border-solena-danger/30 text-solena-danger hover:bg-solena-danger hover:text-white',
                        (isExec || limitReached || openPositions.length >= risk.maxPositions) && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      {isExec
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Ouverture…</>
                        : <>{isBuy ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            Exécuter en paper — ${size} ({risk.maxRiskPct}% du solde)</>
                      }
                    </button>
                  </div>
                )
              })}

              {nonExecutable.map(signal => (
                <div key={signal.id} className="flex items-center justify-between px-5 py-3 opacity-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-solena-text">{signal.pair}</span>
                    <span className="text-[9px] text-solena-text-muted border border-solena-border px-1.5 py-0.5 rounded">hors Binance spot</span>
                  </div>
                  <button onClick={() => setDismissed(prev => new Set([...prev, signal.id]))} className="text-solena-text-muted hover:text-solena-danger p-1 rounded transition-colors text-xs">✕</button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Connection ────────────────────────────────────────────────── */}
      <div className="bg-solena-card border border-solena-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🟡</span>
            <span className="font-bold text-solena-text">Binance</span>
            {connected && <span className="text-[10px] font-bold text-solena-success bg-solena-success/10 border border-solena-success/20 px-1.5 py-0.5 rounded-md">CONNECTÉ</span>}
          </div>
          {connected && <button onClick={disconnect} className="flex items-center gap-1.5 text-xs text-solena-text-muted hover:text-solena-danger transition-colors"><Unplug className="w-3.5 h-3.5" /> Déconnecter</button>}
        </div>

        {connected && account ? (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Balance USDT', value: `$${fmt(account.usdtBalance)}`, color: 'text-solena-text' },
              { label: 'P&L du jour', value: `${todayTotal >= 0 ? '+' : ''}${fmt(todayTotal)}$`, color: todayTotal >= 0 ? 'text-solena-success' : 'text-solena-danger' },
              { label: 'Positions', value: `${openPositions.length}/${risk.maxPositions}`, color: 'text-solena-text' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-solena-bg rounded-xl p-3.5 text-center">
                <p className="text-[10px] text-solena-text-muted uppercase tracking-wider mb-1">{label}</p>
                <p className={cn('font-mono font-bold text-lg', color)}>{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-solena-text-muted">Active uniquement la permission <strong className="text-solena-text">Lecture</strong> — le paper trading ne nécessite pas de droits de trading.</p>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-solena-text-muted" />
              <input value={creds.apiKey} onChange={e => setCreds(p => ({ ...p, apiKey: e.target.value }))} placeholder="Clé API Binance" className="w-full bg-solena-bg border border-solena-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-solena-text placeholder-solena-text-muted focus:outline-none focus:border-solena-primary/40 transition-colors" />
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-solena-text-muted" />
              <input type={showSecret ? 'text' : 'password'} value={creds.apiSecret} onChange={e => setCreds(p => ({ ...p, apiSecret: e.target.value }))} placeholder="Clé secrète" className="w-full bg-solena-bg border border-solena-border rounded-xl pl-9 pr-10 py-2.5 text-sm text-solena-text placeholder-solena-text-muted focus:outline-none focus:border-solena-primary/40 transition-colors" />
              <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-solena-text-muted hover:text-solena-text">
                {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {connError && <div className="flex items-center gap-2 text-xs text-solena-danger bg-solena-danger/5 border border-solena-danger/20 rounded-xl p-3"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{connError}</div>}
            <button onClick={connect} disabled={connecting || !creds.apiKey.trim() || !creds.apiSecret.trim()} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-solena-primary text-solena-bg text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all">
              {connecting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Test en cours…</> : <><CheckCircle2 className="w-3.5 h-3.5" />Tester la connexion</>}
            </button>
          </div>
        )}
      </div>

      {/* ── Risk settings ─────────────────────────────────────────────── */}
      <div className="bg-solena-card border border-solena-border rounded-2xl overflow-hidden">
        <button onClick={() => setShowRisk(!showRisk)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-solena-bg/50 transition-colors">
          <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-solena-primary" /><span className="text-sm font-semibold text-solena-text">Garde-fous de risque</span></div>
          <span className="text-xs text-solena-text-muted">Risque {risk.maxRiskPct}% · Limite {fmtUSD(risk.dailyLossLimit)}/j · {risk.maxPositions} pos. max</span>
        </button>
        {showRisk && (
          <div className="px-5 pb-5 space-y-4 border-t border-solena-border pt-4">
            {[
              { label: 'Risque max par trade (%)', key: 'maxRiskPct', min: 0.5, max: 10, step: 0.5 },
              { label: 'Limite de perte journalière ($)', key: 'dailyLossLimit', min: 10, max: 5000, step: 10 },
              { label: 'Positions simultanées max', key: 'maxPositions', min: 1, max: 10, step: 1 },
            ].map(({ label, key, min, max, step }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-solena-text-muted">{label}</label>
                  <span className="text-xs font-mono font-bold text-solena-text">{risk[key as keyof RiskSettings]}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={risk[key as keyof RiskSettings]}
                  onChange={e => saveRisk({ ...risk, [key]: parseFloat(e.target.value) })} className="w-full accent-solena-primary" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Manual form (collapsible) ──────────────────────────────────── */}
      <div className="bg-solena-card border border-solena-border rounded-2xl overflow-hidden">
        <button onClick={() => setShowManual(!showManual)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-solena-bg/50 transition-colors">
          <span className="text-sm font-semibold text-solena-text">Saisie manuelle</span>
          <span className="text-xs text-solena-text-muted">{showManual ? 'Fermer ▲' : 'Ouvrir une position manuellement ▼'}</span>
        </button>
        {showManual && (
          <div className="px-5 pb-5 border-t border-solena-border pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-solena-text-muted uppercase tracking-wider mb-1 block">Paire</label>
                <select value={formPair} onChange={e => setFormPair(e.target.value)} className="w-full bg-solena-bg border border-solena-border rounded-xl px-3 py-2.5 text-sm text-solena-text focus:outline-none focus:border-solena-primary/40">
                  {TRADEABLE_PAIRS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-solena-text-muted uppercase tracking-wider mb-1 block">Direction</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['LONG', 'SHORT'] as const).map(s => (
                    <button key={s} onClick={() => setFormSide(s)} className={cn('flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all border', formSide === s ? s === 'LONG' ? 'bg-solena-success/10 border-solena-success/30 text-solena-success' : 'bg-solena-danger/10 border-solena-danger/30 text-solena-danger' : 'bg-solena-bg border-solena-border text-solena-text-muted')}>
                      {s === 'LONG' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{s}
                    </button>
                  ))}
                </div>
              </div>
              {[{ label: 'Taille (USDT)', val: formSize, set: setFormSize, ph: 'ex: 100' }, { label: 'Stop Loss', val: formSL, set: setFormSL, ph: 'Prix SL' }, { label: 'Take Profit', val: formTP, set: setFormTP, ph: 'Prix TP' }].map(({ label, val, set, ph }) => (
                <div key={label} className={label === 'Take Profit' ? 'col-span-2' : ''}>
                  <label className="text-[10px] text-solena-text-muted uppercase tracking-wider mb-1 block">{label}</label>
                  <input type="number" value={val} onChange={e => set(e.target.value)} placeholder={ph} className="w-full bg-solena-bg border border-solena-border rounded-xl px-3 py-2.5 text-sm text-solena-text focus:outline-none focus:border-solena-primary/40" />
                </div>
              ))}
            </div>
            {formError && <div className="flex items-center gap-2 text-xs text-solena-danger bg-solena-danger/5 border border-solena-danger/20 rounded-xl p-3"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{formError}</div>}
            <button onClick={openManual} disabled={opening || limitReached || !formSize || !formSL || !formTP} className={cn('w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all', formSide === 'LONG' ? 'bg-solena-success/10 border border-solena-success/30 text-solena-success hover:bg-solena-success hover:text-white' : 'bg-solena-danger/10 border border-solena-danger/30 text-solena-danger hover:bg-solena-danger hover:text-white', (opening || limitReached) && 'opacity-40 cursor-not-allowed')}>
              {opening ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Ouverture…</> : <>{formSide === 'LONG' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}Ouvrir {formSide} {formPair} (PAPER)</>}
            </button>
          </div>
        )}
      </div>

      {/* ── Open positions ────────────────────────────────────────────── */}
      {openPositions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-solena-text-muted">
              Positions ouvertes · {openPositions.length}
              {priceLoading && <RefreshCw className="w-3 h-3 inline ml-2 animate-spin" />}
            </h2>
            <button onClick={emergencyStop} className="flex items-center gap-1.5 text-xs font-bold text-solena-danger border border-solena-danger/30 bg-solena-danger/5 hover:bg-solena-danger hover:text-white px-3 py-1.5 rounded-xl transition-all">
              <SquareX className="w-3.5 h-3.5" /> STOP D'URGENCE
            </button>
          </div>
          {openPositions.map(pos => {
            const price = livePrices[getPriceKey(pos)] ?? pos.entryPrice
            const pnl   = pnlFromPrice(pos, price)
            const pnlPct = (pnl / pos.usdtSize) * 100
            const isLong = pos.side === 'LONG'
            return (
              <div key={pos.id} className="bg-solena-card border border-solena-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center', isLong ? 'bg-solena-success/10' : 'bg-solena-danger/10')}>
                      {isLong ? <ArrowUpRight className="w-4 h-4 text-solena-success" /> : <ArrowDownRight className="w-4 h-4 text-solena-danger" />}
                    </span>
                    <span className="font-mono font-bold text-solena-text text-sm">{pos.pair}</span>
                    <span className={cn('text-[10px] font-bold', isLong ? 'text-solena-success' : 'text-solena-danger')}>{pos.side}</span>
                    {pos.fromSignal && <span className="text-[9px] text-solena-primary bg-solena-primary/10 border border-solena-primary/20 px-1.5 py-0.5 rounded">IA</span>}
                  </div>
                  <PnlBadge pnl={pnl} pct={pnlPct} />
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[{ label: 'Entrée', value: fmtPrice(pos.entryPrice), color: 'text-solena-text' }, { label: 'Actuel', value: fmtPrice(price), color: pnl >= 0 ? 'text-solena-success' : 'text-solena-danger' }, { label: 'Stop', value: fmtPrice(pos.stopLoss), color: 'text-solena-danger' }, { label: 'TP', value: fmtPrice(pos.takeProfit), color: 'text-solena-success' }].map(({ label, value, color }) => (
                    <div key={label} className="bg-solena-bg rounded-lg p-2 text-center">
                      <p className="text-[9px] text-solena-text-muted uppercase tracking-wide mb-0.5">{label}</p>
                      <p className={cn('text-xs font-mono font-bold', color)}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-solena-text-muted">
                  <span>Taille : ${fmt(pos.usdtSize)} · {fmt(pos.quantity, 4)} {pos.pair.split('/')[0]}</span>
                  <button onClick={() => closePosition(pos)} className="text-solena-text-muted hover:text-solena-danger border border-solena-border hover:border-solena-danger/30 px-2.5 py-1 rounded-lg transition-all">Fermer</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── History ───────────────────────────────────────────────────── */}
      {closedTrades.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-solena-text-muted">Historique · {closedTrades.length} trades</h2>
            <button onClick={() => { if (confirm('Effacer tout l\'historique ?')) { setClosedTrades([]); localStorage.removeItem(STORAGE.closed) } }} className="text-[10px] text-solena-text-muted hover:text-solena-danger transition-colors">Effacer</button>
          </div>
          {closedTrades.slice(0, 20).map(t => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3 bg-solena-card border border-solena-border rounded-xl">
              <span className={cn('w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0', t.side === 'LONG' ? 'bg-solena-success/10' : 'bg-solena-danger/10')}>
                {t.side === 'LONG' ? <ArrowUpRight className="w-3.5 h-3.5 text-solena-success" /> : <ArrowDownRight className="w-3.5 h-3.5 text-solena-danger" />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-solena-text text-xs">{t.pair}</span>
                  {t.fromSignal && <span className="text-[9px] text-solena-primary bg-solena-primary/10 border border-solena-primary/20 px-1 rounded">IA</span>}
                  <span className="text-[9px] text-solena-text-muted border border-solena-border px-1 rounded">
                    {t.closeReason === 'stop_loss' ? 'SL ✗' : t.closeReason === 'take_profit' ? 'TP ✓' : t.closeReason === 'emergency' ? 'STOP' : 'Manuel'}
                  </span>
                </div>
                <p className="text-[10px] text-solena-text-muted">{new Date(t.closedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</p>
              </div>
              <div className="text-right">
                <PnlBadge pnl={t.pnl} pct={t.pnlPct} />
                <p className="text-[10px] text-solena-text-muted mt-0.5">${fmt(t.usdtSize)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <RiskBanner />
    </div>
  )
}
