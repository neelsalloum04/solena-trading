'use client'
import { cn } from '@/lib/utils'
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BellOff,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Coin {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
}

interface PortfolioEntry {
  id: string
  coin_id: string
  coin_symbol: string
  coin_name: string
  coin_image: string
  quantity: number
  avg_buy_price: number
}

interface PriceAlert {
  id: string
  coin_id: string
  coin_symbol: string
  coin_name: string
  target_price: number
  direction: 'above' | 'below'
  active: boolean
  triggered_at: string | null
  created_at: string
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtUSD(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`
  if (abs >= 1000) return `${sign}$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (abs >= 1) return `${sign}$${abs.toFixed(2)}`
  return `${sign}$${abs.toFixed(4)}`
}

function fmtPct(n: number) {
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [tab, setTab] = useState<'portfolio' | 'alerts'>('portfolio')
  const [coins, setCoins] = useState<Coin[]>([])
  const [holdings, setHoldings] = useState<PortfolioEntry[]>([])
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(true)

  // Add holding form
  const [showAddH, setShowAddH] = useState(false)
  const [hCoin, setHCoin] = useState('')
  const [hQty, setHQty] = useState('')
  const [hPrice, setHPrice] = useState('')
  const [hSaving, setHSaving] = useState(false)
  const [hError, setHError] = useState('')

  // Add alert form
  const [showAddA, setShowAddA] = useState(false)
  const [aCoin, setACoin] = useState('')
  const [aPrice, setAPrice] = useState('')
  const [aDir, setADir] = useState<'above' | 'below'>('above')
  const [aSaving, setASaving] = useState(false)
  const [aError, setAError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [p, h, a] = await Promise.all([
          fetch('/api/crypto-prices'),
          fetch('/api/portfolio'),
          fetch('/api/alerts'),
        ])
        const pd = await p.json()
        const hd = await h.json()
        const ad = await a.json()
        setCoins(pd.coins ?? [])
        setHoldings(Array.isArray(hd) ? hd : [])
        setAlerts(Array.isArray(ad) ? ad : [])
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  // ── Portfolio stats ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    let totalValue = 0
    let totalInvested = 0
    for (const h of holdings) {
      const coin = coins.find(c => c.id === h.coin_id)
      const price = coin?.current_price ?? h.avg_buy_price
      totalValue += h.quantity * price
      totalInvested += h.quantity * h.avg_buy_price
    }
    const pnl = totalValue - totalInvested
    const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0
    return { totalValue, totalInvested, pnl, pnlPct }
  }, [holdings, coins])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleAddHolding = async () => {
    setHError('')
    if (!hCoin || !hQty || !hPrice) { setHError('Remplis tous les champs.'); return }
    const coin = coins.find(c => c.id === hCoin)
    if (!coin) return
    setHSaving(true)
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coin_id: coin.id,
          coin_symbol: coin.symbol.toUpperCase(),
          coin_name: coin.name,
          coin_image: coin.image,
          quantity: Number(hQty),
          avg_buy_price: Number(hPrice),
        }),
      })
      if (res.ok) {
        const entry = await res.json()
        setHoldings(prev => [...prev, entry])
        setHCoin(''); setHQty(''); setHPrice('')
        setShowAddH(false)
      } else {
        const err = await res.json()
        setHError(err.error ?? 'Erreur')
      }
    } catch { setHError('Erreur réseau') }
    setHSaving(false)
  }

  const handleDeleteHolding = async (id: string) => {
    setHoldings(prev => prev.filter(h => h.id !== id))
    await fetch(`/api/portfolio?id=${id}`, { method: 'DELETE' })
  }

  const handleAddAlert = async () => {
    setAError('')
    if (!aCoin || !aPrice) { setAError('Remplis tous les champs.'); return }
    const coin = coins.find(c => c.id === aCoin)
    if (!coin) return
    setASaving(true)
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coin_id: coin.id,
          coin_symbol: coin.symbol.toUpperCase(),
          coin_name: coin.name,
          target_price: Number(aPrice),
          direction: aDir,
        }),
      })
      if (res.ok) {
        const alert = await res.json()
        setAlerts(prev => [alert, ...prev])
        setACoin(''); setAPrice(''); setADir('above')
        setShowAddA(false)
      } else {
        const err = await res.json()
        setAError(err.error ?? 'Erreur')
      }
    } catch { setAError('Erreur réseau') }
    setASaving(false)
  }

  const handleDeleteAlert = async (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
    await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' })
  }

  const activeAlerts = alerts.filter(a => a.active)
  const triggeredAlerts = alerts.filter(a => !a.active)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-white">Portfolio & Alertes</h1>
        <p className="text-xs text-[#444] mt-0.5">Suivez vos positions et créez des alertes de prix</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#1a1a1a]">
        {([
          { id: 'portfolio', label: 'Portefeuille', icon: Wallet },
          { id: 'alerts',    label: 'Alertes de prix', icon: Bell, badge: activeAlerts.length },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-[#555] hover:text-[#888]'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {'badge' in t && t.badge > 0 && (
              <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
        </div>
      ) : tab === 'portfolio' ? (
        <>
          {/* ── Stats cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: 'Valeur totale',
                value: fmtUSD(stats.totalValue),
                icon: <Wallet className="w-4 h-4" />,
                color: 'text-[#D4AF37]',
                bg: 'bg-[#D4AF37]/5',
                border: 'border-[#D4AF37]/20',
              },
              {
                label: 'Investi',
                value: fmtUSD(stats.totalInvested),
                icon: <TrendingUp className="w-4 h-4" />,
                color: 'text-[#38bdf8]',
                bg: 'bg-[#38bdf8]/5',
                border: 'border-[#38bdf8]/20',
              },
              {
                label: 'P&L',
                value: fmtUSD(stats.pnl),
                icon: stats.pnl >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />,
                color: stats.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]',
                bg: stats.pnl >= 0 ? 'bg-[#22c55e]/5' : 'bg-[#ef4444]/5',
                border: stats.pnl >= 0 ? 'border-[#22c55e]/20' : 'border-[#ef4444]/20',
              },
              {
                label: 'Rendement',
                value: holdings.length > 0 ? fmtPct(stats.pnlPct) : '—',
                icon: stats.pnlPct >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
                color: stats.pnlPct >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]',
                bg: stats.pnlPct >= 0 ? 'bg-[#22c55e]/5' : 'bg-[#ef4444]/5',
                border: stats.pnlPct >= 0 ? 'border-[#22c55e]/20' : 'border-[#ef4444]/20',
              },
            ].map(card => (
              <div key={card.label} className={cn('rounded-2xl border p-4', card.bg, card.border)}>
                <div className={cn('flex items-center gap-1.5 mb-2', card.color)}>
                  {card.icon}
                  <span className="text-[10px] font-bold uppercase tracking-wider">{card.label}</span>
                </div>
                <p className={cn('text-xl font-black font-mono', card.color)}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* ── Holdings list ── */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
              <span className="text-sm font-bold text-white">Positions ({holdings.length})</span>
              <button
                onClick={() => { setShowAddH(v => !v); setHError('') }}
                className="flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                {showAddH ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAddH ? 'Annuler' : 'Ajouter'}
              </button>
            </div>

            {/* Add holding form */}
            {showAddH && (
              <div className="px-5 py-4 border-b border-[#1a1a1a] bg-[#0d0d0d]">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <select
                    value={hCoin}
                    onChange={e => setHCoin(e.target.value)}
                    className="bg-[#111] border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                  >
                    <option value="">Sélectionner une crypto</option>
                    {coins.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.symbol.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Quantité (ex: 0.5)"
                    value={hQty}
                    onChange={e => setHQty(e.target.value)}
                    className="bg-[#111] border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#D4AF37]/50"
                  />
                  <input
                    type="number"
                    placeholder="Prix d'achat moyen ($)"
                    value={hPrice}
                    onChange={e => setHPrice(e.target.value)}
                    className="bg-[#111] border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#D4AF37]/50"
                  />
                </div>
                {hError && <p className="text-xs text-[#ef4444] mb-2">{hError}</p>}
                <button
                  onClick={handleAddHolding}
                  disabled={hSaving}
                  className="flex items-center gap-2 bg-[#D4AF37] text-[#080808] font-bold text-sm px-4 py-2 rounded-xl hover:bg-[#c9a227] transition-colors disabled:opacity-50"
                >
                  {hSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Ajouter la position
                </button>
              </div>
            )}

            {holdings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Wallet className="w-10 h-10 text-[#222] mb-3" />
                <p className="text-sm text-[#444] font-medium">Aucune position</p>
                <p className="text-xs text-[#333] mt-1">Ajoutez vos cryptos pour suivre votre P&L en temps réel</p>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-2 border-b border-[#111]">
                  {['Actif', 'Quantité', 'Prix moyen', 'Prix actuel', 'P&L', ''].map(h => (
                    <span key={h} className="text-[10px] font-bold text-[#444] uppercase tracking-wider">{h}</span>
                  ))}
                </div>
                {holdings.map(h => {
                  const coin = coins.find(c => c.id === h.coin_id)
                  const currentPrice = coin?.current_price ?? h.avg_buy_price
                  const currentValue = h.quantity * currentPrice
                  const invested = h.quantity * h.avg_buy_price
                  const pnl = currentValue - invested
                  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0
                  const positive = pnl >= 0
                  return (
                    <div
                      key={h.id}
                      className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-4 border-b border-[#0f0f0f] last:border-0 hover:bg-[#0d0d0d] transition-colors items-center"
                    >
                      <div className="flex items-center gap-3">
                        {h.coin_image ? (
                          <img src={h.coin_image} alt={h.coin_name} className="w-8 h-8 rounded-full flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-bold text-white">{h.coin_name}</p>
                          <p className="text-[10px] text-[#555] uppercase">{h.coin_symbol}</p>
                        </div>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-sm text-white font-mono">{h.quantity}</p>
                        <p className="text-[10px] text-[#444]">{fmtUSD(currentValue)}</p>
                      </div>
                      <p className="hidden md:block text-sm text-[#888] font-mono">{fmtUSD(h.avg_buy_price)}</p>
                      <p className="hidden md:block text-sm text-white font-mono">{fmtUSD(currentPrice)}</p>
                      <div className="hidden md:block">
                        <p className={cn('text-sm font-bold font-mono', positive ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                          {fmtUSD(pnl)}
                        </p>
                        <p className={cn('text-[10px] font-bold', positive ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                          {fmtPct(pnlPct)}
                        </p>
                      </div>
                      {/* Mobile P&L */}
                      <div className="flex items-center gap-3 md:hidden">
                        <div className="text-right">
                          <p className={cn('text-sm font-bold', positive ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                            {fmtUSD(pnl)}
                          </p>
                          <p className={cn('text-[10px]', positive ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                            {fmtPct(pnlPct)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteHolding(h.id)}
                          className="p-1.5 rounded-lg text-[#333] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteHolding(h.id)}
                        className="hidden md:flex p-1.5 rounded-lg text-[#333] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </>
      ) : (
        <>
          {/* ── Alerts tab ── */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
              <div>
                <span className="text-sm font-bold text-white">Alertes actives ({activeAlerts.length})</span>
                <p className="text-[10px] text-[#444] mt-0.5">Vous recevrez un email dès que le prix atteint votre cible</p>
              </div>
              <button
                onClick={() => { setShowAddA(v => !v); setAError('') }}
                className="flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                {showAddA ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAddA ? 'Annuler' : 'Nouvelle alerte'}
              </button>
            </div>

            {/* Add alert form */}
            {showAddA && (
              <div className="px-5 py-4 border-b border-[#1a1a1a] bg-[#0d0d0d]">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <select
                    value={aCoin}
                    onChange={e => setACoin(e.target.value)}
                    className="bg-[#111] border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                  >
                    <option value="">Sélectionner une crypto</option>
                    {coins.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.symbol.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  <select
                    value={aDir}
                    onChange={e => setADir(e.target.value as 'above' | 'below')}
                    className="bg-[#111] border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                  >
                    <option value="above">Passe au-dessus de</option>
                    <option value="below">Passe en-dessous de</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Prix cible ($)"
                    value={aPrice}
                    onChange={e => setAPrice(e.target.value)}
                    className="bg-[#111] border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#D4AF37]/50"
                  />
                </div>
                {aError && <p className="text-xs text-[#ef4444] mb-2">{aError}</p>}
                <button
                  onClick={handleAddAlert}
                  disabled={aSaving}
                  className="flex items-center gap-2 bg-[#D4AF37] text-[#080808] font-bold text-sm px-4 py-2 rounded-xl hover:bg-[#c9a227] transition-colors disabled:opacity-50"
                >
                  {aSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                  Créer l'alerte
                </button>
                <p className="text-[10px] text-[#444] mt-2">Plan Gratuit / Starter : max 3 alertes actives. Plan Pro+ : illimité.</p>
              </div>
            )}

            {activeAlerts.length === 0 && !showAddA ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <BellOff className="w-10 h-10 text-[#222] mb-3" />
                <p className="text-sm text-[#444] font-medium">Aucune alerte active</p>
                <p className="text-xs text-[#333] mt-1">Créez une alerte pour être notifié par email</p>
              </div>
            ) : (
              activeAlerts.map(alert => {
                const coin = coins.find(c => c.id === alert.coin_id)
                const currentPrice = coin?.current_price
                const isClose = currentPrice
                  ? Math.abs(currentPrice - alert.target_price) / alert.target_price < 0.05
                  : false
                return (
                  <div
                    key={alert.id}
                    className="flex items-center gap-4 px-5 py-4 border-b border-[#0f0f0f] last:border-0 hover:bg-[#0d0d0d] transition-colors"
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                      alert.direction === 'above' ? 'bg-[#22c55e]/10' : 'bg-[#ef4444]/10'
                    )}>
                      {alert.direction === 'above'
                        ? <ArrowUpRight className="w-4 h-4 text-[#22c55e]" />
                        : <ArrowDownRight className="w-4 h-4 text-[#ef4444]" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{alert.coin_symbol}</span>
                        <span className="text-xs text-[#555]">
                          {alert.direction === 'above' ? 'passe au-dessus de' : 'passe en-dessous de'}
                        </span>
                        <span className="text-sm font-bold text-[#D4AF37] font-mono">
                          ${Number(alert.target_price).toLocaleString('en-US')}
                        </span>
                        {isClose && (
                          <span className="text-[9px] font-bold text-[#f97316] bg-[#f97316]/10 px-1.5 py-0.5 rounded">PROCHE</span>
                        )}
                      </div>
                      {currentPrice && (
                        <p className="text-[10px] text-[#444] mt-0.5">
                          Prix actuel : <span className="text-[#888]">${currentPrice.toLocaleString('en-US')}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-1 rounded-lg">
                        <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
                        Actif
                      </span>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="p-1.5 rounded-lg text-[#333] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* ── Triggered alerts history ── */}
          {triggeredAlerts.length > 0 && (
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1a1a1a]">
                <span className="text-sm font-bold text-[#555]">Historique ({triggeredAlerts.length})</span>
              </div>
              {triggeredAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-[#0f0f0f] last:border-0 opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[#888]">{alert.coin_symbol}</span>
                      <span className="text-xs text-[#444]">
                        {alert.direction === 'above' ? '>' : '<'}
                      </span>
                      <span className="text-sm font-mono text-[#888]">
                        ${Number(alert.target_price).toLocaleString('en-US')}
                      </span>
                    </div>
                    {alert.triggered_at && (
                      <p className="text-[10px] text-[#333] mt-0.5">Déclenché le {fmtDate(alert.triggered_at)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="p-1.5 rounded-lg text-[#222] hover:text-[#555] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
