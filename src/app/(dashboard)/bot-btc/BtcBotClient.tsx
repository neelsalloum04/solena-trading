'use client'

import { cn } from '@/lib/utils'
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight,
  Bitcoin, BookOpen, CheckCircle2, ChevronRight,
  Key, Lock, LogOut, RefreshCw, Settings, Shield,
  TrendingDown, TrendingUp, Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BotStatus {
  session:     { is_active: boolean; mode: 'paper' | 'live'; last_tick_at: string | null; consecutive_losses: number; suspended_until: string | null } | null
  credentials: { is_valid: boolean; api_key_preview: string; validated_at: string } | null
  paper:       { balance: number; initial_balance: number } | null
  risk:        { max_risk_pct: number; min_confidence: number; leverage: number; max_positions: number } | null
  positions:   Position[]
  logs:        Log[]
}

interface Stats {
  total:   { trades: number; pnl: number; winRate: number; profitFactor: number }
  daily:   { trades: number; pnl: number }
  weekly:  { trades: number; pnl: number }
  monthly: { trades: number; pnl: number }
}

interface Position {
  id: string; side: 'LONG' | 'SHORT'; mode: string
  entry_price: number; usdt_size: number; stop_loss: number
  tp1: number; tp2: number; tp3: number
  tp1_hit: boolean; tp2_hit: boolean; score: number
  opened_at: string
}

interface Trade {
  id: string; side: 'LONG' | 'SHORT'; mode: string
  entry_price: number; close_price: number; usdt_size: number
  pnl: number; pnl_pct: number; close_reason: string; closed_at: string
}

interface Log {
  id: string; level: string; message: string; created_at: string
}

type View = 'dashboard' | 'connect' | 'history' | 'settings'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
const fmtUsd = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)} $`
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`

// ─── Main Component ───────────────────────────────────────────────────────────

export function BtcBotClient() {
  const [view, setView]         = useState<View>('dashboard')
  const [status, setStatus]     = useState<BotStatus | null>(null)
  const [stats, setStats]       = useState<Stats | null>(null)
  const [trades, setTrades]     = useState<Trade[]>([])
  const [market, setMarket]     = useState<{ price: number; change24h: number } | null>(null)
  const [loading, setLoading]   = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError]       = useState('')

  // Connect form
  const [apiKey, setApiKey]     = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [connectMode, setConnectMode] = useState<'paper' | 'live'>('paper')
  const [connectErr, setConnectErr] = useState('')
  const [connectOk, setConnectOk]  = useState(false)

  // Settings form
  const [settings, setSettings] = useState({
    max_risk_pct: 1, min_confidence: 75, leverage: 5,
    max_positions: 1, max_daily_loss_pct: 5, max_consecutive_losses: 3,
  })

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Fetch data ────────────────────────────────────────────────────────────

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch('/api/trading/status')
      if (r.ok) setStatus(await r.json())
    } catch {}
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch('/api/trading/stats')
      if (r.ok) setStats(await r.json())
    } catch {}
  }, [])

  const fetchMarket = useCallback(async () => {
    try {
      const r = await fetch('/api/bot-btc/market')
      if (r.ok) {
        const d = await r.json()
        setMarket({ price: d.price, change24h: d.change24h })
      }
    } catch {}
  }, [])

  const fetchHistory = useCallback(async () => {
    try {
      const r = await fetch('/api/trading/history?limit=50')
      if (r.ok) {
        const d = await r.json()
        setTrades(d.trades ?? [])
      }
    } catch {}
  }, [])

  useEffect(() => {
    Promise.all([fetchStatus(), fetchStats(), fetchMarket()]).finally(() => setLoading(false))
    pollRef.current = setInterval(() => {
      fetchStatus(); fetchStats(); fetchMarket()
    }, 30_000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchStatus, fetchStats, fetchMarket])

  useEffect(() => {
    if (view === 'history') fetchHistory()
    if (view === 'settings' && status?.risk) {
      setSettings({
        max_risk_pct:          status.risk.max_risk_pct,
        min_confidence:        status.risk.min_confidence,
        leverage:              status.risk.leverage,
        max_positions:         status.risk.max_positions,
        max_daily_loss_pct:    5,
        max_consecutive_losses: 3,
      })
    }
  }, [view, fetchHistory, status?.risk])

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleConnect() {
    if (connectMode === 'live' && (!apiKey.trim() || !apiSecret.trim())) {
      setConnectErr('Clés API requises pour le mode Live')
      return
    }
    setActionLoading(true); setConnectErr('')
    try {
      const r = await fetch('/api/trading/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim() || 'paper',
          apiSecret: apiSecret.trim() || 'paper',
          mode: connectMode,
        }),
      })
      const d = await r.json()
      if (!r.ok) { setConnectErr(d.error ?? 'Erreur de connexion'); return }
      setConnectOk(true)
      await fetchStatus()
      setTimeout(() => { setConnectOk(false); setView('dashboard') }, 1500)
    } catch { setConnectErr('Erreur réseau') }
    finally { setActionLoading(false) }
  }

  async function handleActivate(mode: 'paper' | 'live') {
    setActionLoading(true); setError('')
    try {
      const r = await fetch('/api/trading/activate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error ?? 'Erreur'); return }
      await fetchStatus()
    } catch { setError('Erreur réseau') }
    finally { setActionLoading(false) }
  }

  async function handleDeactivate() {
    setActionLoading(true)
    try {
      await fetch('/api/trading/deactivate', { method: 'POST' })
      await fetchStatus()
    } finally { setActionLoading(false) }
  }

  async function handleSaveSettings() {
    setActionLoading(true)
    try {
      const r = await fetch('/api/trading/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (r.ok) { await fetchStatus(); setView('dashboard') }
    } finally { setActionLoading(false) }
  }

  // ── Manual tick (for users without Vercel Pro cron) ───────────────────────

  async function manualTick() {
    setActionLoading(true); setError('')
    try {
      const r = await fetch('/api/trading/tick-manual', { method: 'POST' })
      const d = await r.json()
      if (!r.ok) { setError(d.error ?? 'Erreur tick'); return }
      await Promise.all([fetchStatus(), fetchStats()])
    } catch { setError('Erreur réseau') }
    finally { setActionLoading(false) }
  }

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const sess   = status?.session
  const creds  = status?.credentials
  const paper  = status?.paper
  const isActive  = sess?.is_active ?? false
  const mode      = sess?.mode ?? 'paper'
  const isPaper   = mode === 'paper'
  const hasCredentials = creds?.is_valid

  // ── VIEWS ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#080808] text-[#F2EDD7] pb-20 md:pb-0">

      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-[#080808]/95 backdrop-blur border-b border-[#141414]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F7931A] flex items-center justify-center">
              <Bitcoin className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-black">BTC Scalper AI</p>
              {market && (
                <p className="text-[10px] text-[#555]">
                  {fmt(market.price)} $ <span className={market.change24h >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                    {fmtPct(market.change24h)}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Robot status pill */}
            <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border',
              isActive
                ? 'text-[#22c55e] border-[#22c55e]/25 bg-[#22c55e]/8'
                : 'text-[#444] border-[#222]')}>
              <span className={cn('w-1.5 h-1.5 rounded-full', isActive ? 'bg-[#22c55e] animate-pulse' : 'bg-[#333]')} />
              {isActive ? 'ACTIF' : 'INACTIF'}
            </div>
            <span className={cn('px-2 py-1 rounded-lg text-[10px] font-bold border',
              isPaper ? 'text-[#38bdf8] border-[#38bdf8]/20 bg-[#38bdf8]/8' : 'text-[#F7931A] border-[#F7931A]/20 bg-[#F7931A]/8')}>
              {isPaper ? 'PAPER' : 'LIVE'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ── CONNECT VIEW ──────────────────────────────────────────────── */}
        {view === 'connect' && (
          <div className="space-y-4">
            <button onClick={() => setView('dashboard')} className="text-xs text-[#555] hover:text-[#888] flex items-center gap-1">
              ← Retour
            </button>
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F7931A]/10 border border-[#F7931A]/20 flex items-center justify-center">
                  <Key className="w-5 h-5 text-[#F7931A]" />
                </div>
                <div>
                  <p className="font-bold text-sm">Configuration du robot</p>
                  <p className="text-xs text-[#555]">Choisissez le mode et connectez Bybit</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(['paper', 'live'] as const).map(m => (
                  <button key={m} onClick={() => setConnectMode(m)} className={cn(
                    'flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all',
                    connectMode === m
                      ? m === 'paper' ? 'border-[#38bdf8] bg-[#38bdf8]/8 text-[#38bdf8]' : 'border-[#F7931A] bg-[#F7931A]/8 text-[#F7931A]'
                      : 'border-[#1a1a1a] text-[#444]'
                  )}>
                    {m === 'paper' ? <Activity className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                    <div className="text-center">
                      <p className="text-sm font-bold">{m === 'paper' ? 'Paper Trading' : 'Live Trading'}</p>
                      <p className="text-[10px] opacity-60">{m === 'paper' ? 'Simulation · 10 000 $' : 'Ordres réels Bybit'}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className={connectMode !== 'live' ? 'hidden' : 'space-y-3'}>
                <div className="flex items-center gap-2 text-xs text-[#555]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Clés chiffrées AES-256 — jamais exposées côté client</span>
                </div>
                {[
                  { label: 'API Key', val: apiKey, set: setApiKey, type: 'text', icon: Key },
                  { label: 'API Secret', val: apiSecret, set: setApiSecret, type: showSecret ? 'text' : 'password', icon: Lock },
                ].map(({ label, val, set, type, icon: Icon }) => (
                  <div key={label} className="space-y-1">
                    <label className="text-xs text-[#555]">{label}</label>
                    <div className="flex items-center bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 gap-2">
                      <Icon className="w-4 h-4 text-[#444] flex-shrink-0" />
                      <input value={val} onChange={e => set(e.target.value)} type={type}
                        placeholder={`Votre ${label} Bybit`}
                        className="flex-1 bg-transparent text-sm text-[#F2EDD7] placeholder:text-[#333] focus:outline-none" />
                    </div>
                  </div>
                ))}
                <div className="bg-[#F7931A]/5 border border-[#F7931A]/15 rounded-xl p-3 text-[11px] text-[#555] space-y-1">
                  <p className="font-bold text-[#F7931A]/80">Créer vos clés API Bybit</p>
                  <p>bybit.com → Mon Compte → Gestion API → Créer une clé</p>
                  <p>Permissions requises : Lecture + Écriture sur Contrats</p>
                </div>
              </div>

              {connectErr && (
                <p className="text-xs text-[#ef4444] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />{connectErr}
                </p>
              )}
              {connectOk && (
                <p className="text-xs text-[#22c55e] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />Connexion réussie !
                </p>
              )}

              <button onClick={handleConnect} disabled={actionLoading} className={cn(
                'w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
                actionLoading ? 'bg-[#141414] text-[#333] cursor-not-allowed'
                  : connectMode === 'paper'
                  ? 'bg-[#38bdf8] text-[#080808] hover:bg-[#5ac8f5]'
                  : 'bg-[#F7931A] text-white hover:bg-[#e8841a]'
              )}>
                {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                {connectMode === 'paper' ? 'Démarrer en Paper Trading' : 'Connecter Bybit'}
              </button>
            </div>
          </div>
        )}

        {/* ── SETTINGS VIEW ─────────────────────────────────────────────── */}
        {view === 'settings' && (
          <div className="space-y-4">
            <button onClick={() => setView('dashboard')} className="text-xs text-[#555] hover:text-[#888] flex items-center gap-1">← Retour</button>
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-[#F7931A]" />
                <p className="font-bold text-sm">Paramètres de risque</p>
              </div>
              {([
                { key: 'max_risk_pct',          label: 'Risque max / trade (%)',       min: 0.1, max: 5,   step: 0.1 },
                { key: 'min_confidence',         label: 'Score minimum (0-100)',         min: 60,  max: 95,  step: 1 },
                { key: 'leverage',               label: 'Levier (x)',                    min: 1,   max: 20,  step: 1 },
                { key: 'max_positions',          label: 'Positions simultanées max',     min: 1,   max: 3,   step: 1 },
                { key: 'max_daily_loss_pct',     label: 'Perte journalière max (%)',     min: 1,   max: 20,  step: 0.5 },
                { key: 'max_consecutive_losses', label: 'Pertes consécutives max',       min: 1,   max: 10,  step: 1 },
              ] as const).map(({ key, label, min, max, step }) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#666]">{label}</span>
                    <span className="text-[#F7931A] font-bold">{settings[key]}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step}
                    value={settings[key]}
                    onChange={e => setSettings(s => ({ ...s, [key]: parseFloat(e.target.value) }))}
                    className="w-full accent-[#F7931A]" />
                </div>
              ))}
              <button onClick={handleSaveSettings} disabled={actionLoading} className={cn(
                'w-full py-3 rounded-xl font-bold text-sm transition-all',
                actionLoading ? 'bg-[#141414] text-[#333]' : 'bg-[#F7931A] text-white hover:bg-[#e8841a]'
              )}>
                Sauvegarder
              </button>
            </div>
          </div>
        )}

        {/* ── HISTORY VIEW ──────────────────────────────────────────────── */}
        {view === 'history' && (
          <div className="space-y-4">
            <button onClick={() => setView('dashboard')} className="text-xs text-[#555] hover:text-[#888] flex items-center gap-1">← Retour</button>
            {stats && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Trades', val: String(stats.total.trades), color: '#888' },
                  { label: 'Win Rate', val: `${stats.total.winRate.toFixed(0)}%`, color: stats.total.winRate >= 50 ? '#22c55e' : '#ef4444' },
                  { label: 'PnL Total', val: fmtUsd(stats.total.pnl), color: stats.total.pnl >= 0 ? '#22c55e' : '#ef4444' },
                  { label: 'Profit Factor', val: stats.total.profitFactor.toFixed(2), color: stats.total.profitFactor >= 1.5 ? '#22c55e' : '#F7931A' },
                  { label: 'Aujourd\'hui', val: fmtUsd(stats.daily.pnl), color: stats.daily.pnl >= 0 ? '#22c55e' : '#ef4444' },
                  { label: 'Ce mois', val: fmtUsd(stats.monthly.pnl), color: stats.monthly.pnl >= 0 ? '#22c55e' : '#ef4444' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-3 text-center">
                    <p className="text-[10px] text-[#444]">{label}</p>
                    <p className="text-sm font-black mt-0.5" style={{ color }}>{val}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {trades.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <BookOpen className="w-8 h-8 text-[#222]" />
                  <p className="text-sm text-[#444]">Aucun trade clôturé</p>
                </div>
              )}
              {trades.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-[#0f0f0f] border border-[#141414] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-black flex items-center gap-1',
                      t.side === 'LONG' ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                      {t.side === 'LONG' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {t.side}
                    </span>
                    <span className="text-[10px] text-[#444]">{fmt(t.entry_price)} → {fmt(t.close_price)} $</span>
                    <span className="text-[9px] text-[#333] px-1.5 py-0.5 bg-[#141414] rounded">{t.close_reason}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-sm font-bold', t.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                      {fmtUsd(t.pnl)}
                    </span>
                    {t.pnl >= 0 ? <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" /> : <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DASHBOARD VIEW ────────────────────────────────────────────── */}
        {view === 'dashboard' && (
          <div className="space-y-4">

            {error && (
              <div className="flex items-center gap-2 bg-[#ef4444]/8 border border-[#ef4444]/20 rounded-xl p-3 text-xs text-[#ef4444]">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            {/* PnL Stats */}
            {stats && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Aujourd\'hui', val: fmtUsd(stats.daily.pnl), pct: stats.daily.pnl, icon: TrendingUp },
                  { label: 'Cette semaine', val: fmtUsd(stats.weekly.pnl), pct: stats.weekly.pnl, icon: TrendingUp },
                  { label: 'Ce mois', val: fmtUsd(stats.monthly.pnl), pct: stats.monthly.pnl, icon: TrendingUp },
                  { label: 'Win Rate', val: `${stats.total.winRate.toFixed(0)}%`, pct: stats.total.winRate - 50, icon: Activity },
                ].map(({ label, val, pct, icon: Icon }) => (
                  <div key={label} className="bg-[#0f0f0f] border border-[#141414] rounded-xl p-4">
                    <p className="text-[10px] text-[#444]">{label}</p>
                    <p className={cn('text-lg font-black mt-1', pct >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>{val}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Capital */}
            {paper && (
              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#444]">Capital {isPaper ? 'virtuel' : 'disponible'}</p>
                  <p className="text-xl font-black mt-0.5">{fmt(paper.balance)} <span className="text-xs text-[#444] font-normal">$</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#444]">Performance totale</p>
                  <p className={cn('text-sm font-bold', paper.balance >= paper.initial_balance ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                    {fmtPct(((paper.balance - paper.initial_balance) / paper.initial_balance) * 100)}
                  </p>
                </div>
              </div>
            )}

            {/* Open Positions */}
            {(status?.positions ?? []).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#555] uppercase tracking-wider">Positions ouvertes</p>
                {(status?.positions ?? []).map(pos => (
                  <div key={pos.id} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={cn('flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg',
                        pos.side === 'LONG' ? 'text-[#22c55e] bg-[#22c55e]/10' : 'text-[#ef4444] bg-[#ef4444]/10')}>
                        {pos.side === 'LONG' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {pos.side} · {pos.usdt_size} $
                      </span>
                      <span className="text-xs text-[#555]">Score {pos.score}/100</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center">
                      {[
                        { l: 'Entrée', v: fmt(pos.entry_price), c: '#888' },
                        { l: 'SL', v: fmt(pos.stop_loss), c: '#ef4444' },
                        { l: 'TP1', v: fmt(pos.tp1), c: pos.tp1_hit ? '#22c55e' : '#555' },
                        { l: 'TP2', v: fmt(pos.tp2), c: pos.tp2_hit ? '#22c55e' : '#555' },
                      ].map(({ l, v, c }) => (
                        <div key={l} className="bg-[#111] rounded-lg py-1.5">
                          <p className="text-[9px] text-[#333]">{l}</p>
                          <p className="text-[11px] font-bold" style={{ color: c }}>{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Trades',         val: String(stats.total.trades) },
                  { label: 'Profit Factor',  val: stats.total.profitFactor.toFixed(2) },
                  { label: 'PnL Total',      val: fmtUsd(stats.total.pnl), color: stats.total.pnl >= 0 ? '#22c55e' : '#ef4444' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-[#0f0f0f] border border-[#141414] rounded-xl p-3 text-center">
                    <p className="text-[10px] text-[#444]">{label}</p>
                    <p className="text-base font-black mt-0.5" style={{ color: color ?? '#F2EDD7' }}>{val}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {!hasCredentials && (
                <button onClick={() => setView('connect')} className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-[#F7931A] text-white font-bold text-sm hover:bg-[#e8841a] transition-all">
                  <span className="flex items-center gap-2"><Key className="w-4 h-4" />Configurer le robot</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {hasCredentials && !isActive && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleActivate('paper')} disabled={actionLoading} className={cn(
                    'flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all',
                    actionLoading ? 'bg-[#141414] text-[#333]' : 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/25 hover:bg-[#38bdf8]/25'
                  )}>
                    <Activity className="w-4 h-4" />Paper
                  </button>
                  <button onClick={() => handleActivate('live')} disabled={actionLoading} className={cn(
                    'flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all',
                    actionLoading ? 'bg-[#141414] text-[#333]' : 'bg-[#F7931A]/15 text-[#F7931A] border border-[#F7931A]/25 hover:bg-[#F7931A]/25'
                  )}>
                    <Zap className="w-4 h-4" />Live
                  </button>
                </div>
              )}

              {hasCredentials && isActive && (
                <div className="space-y-2">
                  <button onClick={manualTick} disabled={actionLoading} className={cn(
                    'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all',
                    actionLoading
                      ? 'bg-[#141414] text-[#333] cursor-not-allowed'
                      : 'bg-[#F7931A] text-white hover:bg-[#e8841a]'
                  )}>
                    {actionLoading
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : <Zap className="w-4 h-4" />}
                    {actionLoading ? 'Analyse en cours...' : 'Lancer une analyse'}
                  </button>
                  <button onClick={handleDeactivate} disabled={actionLoading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 hover:bg-[#ef4444]/20 transition-all">
                    <LogOut className="w-4 h-4" />Désactiver le robot
                  </button>
                </div>
              )}
            </div>

            {/* Quick nav */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Configurer', icon: Key, view: 'connect' as View },
                { label: 'Historique', icon: BookOpen, view: 'history' as View },
                { label: 'Paramètres', icon: Settings, view: 'settings' as View },
              ].map(({ label, icon: Icon, view: v }) => (
                <button key={v} onClick={() => setView(v)} className="flex flex-col items-center gap-1.5 py-3 bg-[#0f0f0f] border border-[#141414] rounded-xl text-[#555] hover:text-[#888] hover:border-[#222] transition-all">
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-medium">{label}</span>
                </button>
              ))}
            </div>

            {/* Robot logs */}
            {(status?.logs ?? []).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#333] uppercase tracking-wider">Activité récente</p>
                <div className="bg-[#0a0a0a] border border-[#141414] rounded-xl p-3 space-y-1.5 max-h-48 overflow-y-auto">
                  {(status?.logs ?? []).map(log => (
                    <div key={log.id} className="flex items-start gap-2 text-[11px]">
                      <span className={cn('shrink-0 mt-0.5',
                        log.level === 'error' ? 'text-[#ef4444]'
                        : log.level === 'trade' ? 'text-[#22c55e]'
                        : log.level === 'signal' ? 'text-[#F7931A]'
                        : log.level === 'warn' ? 'text-[#eab308]'
                        : 'text-[#333]')}>●</span>
                      <span className="text-[#555] flex-1">{log.message}</span>
                      <span className="text-[#2a2a2a] shrink-0">
                        {new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security notice */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-[#141414] rounded-xl">
              <Shield className="w-3.5 h-3.5 text-[#333] flex-shrink-0" />
              <p className="text-[10px] text-[#2a2a2a]">
                Clés API chiffrées AES-256 · Jamais exposées · Résultats passés non garantis
              </p>
            </div>

            {/* Last tick info */}
            {sess?.last_tick_at && (
              <p className="text-center text-[10px] text-[#2a2a2a]">
                Dernier tick : {new Date(sess.last_tick_at).toLocaleTimeString('fr-FR')}
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
