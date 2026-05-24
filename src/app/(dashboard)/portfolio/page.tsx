'use client'
import { cn } from '@/lib/utils'
import { useEffect, useMemo, useState, useTransition } from 'react'

interface Coin { id: string; symbol: string; name: string; image: string; current_price: number }
interface PortfolioEntry { id: string; coin_id: string; coin_symbol: string; coin_name: string; coin_image: string; quantity: number; avg_buy_price: number }
interface PriceAlert { id: string; coin_id: string; coin_symbol: string; coin_name: string; target_price: number; direction: 'above' | 'below'; active: boolean; triggered_at: string | null; created_at: string }

function fmtUSD(n: number) {
  const abs = Math.abs(n), sign = n < 0 ? '-' : ''
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`
  if (abs >= 1000) return `${sign}$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (abs >= 1) return `${sign}$${abs.toFixed(2)}`
  return `${sign}$${abs.toFixed(4)}`
}
function fmtPct(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(2) + '%' }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) }

export default function PortfolioPage() {
  const [tab, setTab] = useState<'portfolio' | 'alerts'>('portfolio')
  const [coins, setCoins] = useState<Coin[]>([])
  const [holdings, setHoldings] = useState<PortfolioEntry[]>([])
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddH, setShowAddH] = useState(false)
  const [hCoin, setHCoin] = useState('')
  const [hQty, setHQty] = useState('')
  const [hPrice, setHPrice] = useState('')
  const [hSaving, setHSaving] = useState(false)
  const [hError, setHError] = useState('')
  const [showAddA, setShowAddA] = useState(false)
  const [aCoin, setACoin] = useState('')
  const [aPrice, setAPrice] = useState('')
  const [aDir, setADir] = useState<'above' | 'below'>('above')
  const [aSaving, setASaving] = useState(false)
  const [aError, setAError] = useState('')
  const [, startTransition] = useTransition()

  useEffect(() => {
    async function load() {
      try {
        const [p, h, a] = await Promise.all([fetch('/api/crypto-prices'), fetch('/api/portfolio'), fetch('/api/alerts')])
        const pd = await p.json(), hd = await h.json(), ad = await a.json()
        setCoins(pd.coins ?? [])
        setHoldings(Array.isArray(hd) ? hd : [])
        setAlerts(Array.isArray(ad) ? ad : [])
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const stats = useMemo(() => {
    let v = 0, i = 0
    for (const h of holdings) {
      const price = coins.find(c => c.id === h.coin_id)?.current_price ?? h.avg_buy_price
      v += h.quantity * price
      i += h.quantity * h.avg_buy_price
    }
    const pnl = v - i
    return { totalValue: v, totalInvested: i, pnl, pnlPct: i > 0 ? (pnl / i) * 100 : 0 }
  }, [holdings, coins])

  const activeAlerts = alerts.filter(a => a.active)
  const triggeredAlerts = alerts.filter(a => !a.active)

  async function handleAddHolding() {
    setHError('')
    if (!hCoin || !hQty || !hPrice) { setHError('Remplis tous les champs.'); return }
    const coin = coins.find(c => c.id === hCoin)
    if (!coin) return
    setHSaving(true)
    try {
      const res = await fetch('/api/portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coin_id: coin.id, coin_symbol: coin.symbol.toUpperCase(), coin_name: coin.name, coin_image: coin.image, quantity: Number(hQty), avg_buy_price: Number(hPrice) }) })
      if (res.ok) { const entry = await res.json(); setHoldings(prev => [...prev, entry]); setHCoin(''); setHQty(''); setHPrice(''); setShowAddH(false) }
      else { const e = await res.json(); setHError(e.error ?? 'Erreur') }
    } catch { setHError('Erreur réseau') }
    setHSaving(false)
  }

  async function handleAddAlert() {
    setAError('')
    if (!aCoin || !aPrice) { setAError('Remplis tous les champs.'); return }
    const coin = coins.find(c => c.id === aCoin)
    if (!coin) return
    setASaving(true)
    try {
      const res = await fetch('/api/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coin_id: coin.id, coin_symbol: coin.symbol.toUpperCase(), coin_name: coin.name, target_price: Number(aPrice), direction: aDir }) })
      if (res.ok) { const alert = await res.json(); setAlerts(prev => [alert, ...prev]); setACoin(''); setAPrice(''); setADir('above'); setShowAddA(false) }
      else { const e = await res.json(); setAError(e.error ?? 'Erreur') }
    } catch { setAError('Erreur réseau') }
    setASaving(false)
  }

  const pnlPos = stats.pnl >= 0
  const pctPos = stats.pnlPct >= 0

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-white">Portfolio &amp; Alertes</h1>
        <p className="text-xs text-[#444] mt-0.5">Suivez vos positions et créez des alertes de prix</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#1a1a1a]">
        <button type="button" onClick={() => startTransition(() => setTab('portfolio'))} className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors', tab === 'portfolio' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-[#555] hover:text-[#888]')}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" /></svg>
          Portefeuille
        </button>
        <button type="button" onClick={() => startTransition(() => setTab('alerts'))} className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors', tab === 'alerts' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-[#555] hover:text-[#888]')}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          Alertes
          {activeAlerts.length > 0 && <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeAlerts.length}</span>}
        </button>
      </div>

      {loading && <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" /></div>}

      {/* ── PORTFOLIO TAB ── */}
      <div className={cn('space-y-6', (loading || tab !== 'portfolio') && 'hidden')}>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border bg-[#D4AF37]/5 border-[#D4AF37]/20 p-4">
            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider mb-2">Valeur totale</p>
            <p className="text-xl font-black font-mono text-[#D4AF37]">{fmtUSD(stats.totalValue)}</p>
          </div>
          <div className="rounded-2xl border bg-[#38bdf8]/5 border-[#38bdf8]/20 p-4">
            <p className="text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider mb-2">Investi</p>
            <p className="text-xl font-black font-mono text-[#38bdf8]">{fmtUSD(stats.totalInvested)}</p>
          </div>
          <div className={cn('rounded-2xl border p-4', pnlPos ? 'bg-[#22c55e]/5 border-[#22c55e]/20' : 'bg-[#ef4444]/5 border-[#ef4444]/20')}>
            <p className={cn('text-[10px] font-bold uppercase tracking-wider mb-2', pnlPos ? 'text-[#22c55e]' : 'text-[#ef4444]')}>P&amp;L</p>
            <p className={cn('text-xl font-black font-mono', pnlPos ? 'text-[#22c55e]' : 'text-[#ef4444]')}>{fmtUSD(stats.pnl)}</p>
          </div>
          <div className={cn('rounded-2xl border p-4', pctPos ? 'bg-[#22c55e]/5 border-[#22c55e]/20' : 'bg-[#ef4444]/5 border-[#ef4444]/20')}>
            <p className={cn('text-[10px] font-bold uppercase tracking-wider mb-2', pctPos ? 'text-[#22c55e]' : 'text-[#ef4444]')}>Rendement</p>
            <p className={cn('text-xl font-black font-mono', pctPos ? 'text-[#22c55e]' : 'text-[#ef4444]')}>{holdings.length > 0 ? fmtPct(stats.pnlPct) : '—'}</p>
          </div>
        </div>

        {/* Holdings card */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
            <span className="text-sm font-bold text-white">Positions ({holdings.length})</span>
            <button type="button" onClick={() => startTransition(() => { setShowAddH(v => !v); setHError('') })} className="text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/10 px-3 py-1.5 rounded-lg transition-colors">
              {showAddH ? 'Annuler' : '+ Ajouter'}
            </button>
          </div>

          {/* Add form — always in DOM, shown via CSS */}
          <div className={cn('px-5 py-4 border-b border-[#1a1a1a] bg-[#0d0d0d]', !showAddH && 'hidden')}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <select value={hCoin} onChange={e => setHCoin(e.target.value)} className="bg-[#111] border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50">
                <option value="">Sélectionner une crypto</option>
                {coins.map(c => <option key={c.id} value={c.id}>{c.name} ({c.symbol.toUpperCase()})</option>)}
              </select>
              <input type="number" placeholder="Quantité (ex: 0.5)" value={hQty} onChange={e => setHQty(e.target.value)} className="bg-[#111] border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#D4AF37]/50" />
              <input type="number" placeholder="Prix d'achat ($)" value={hPrice} onChange={e => setHPrice(e.target.value)} className="bg-[#111] border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#D4AF37]/50" />
            </div>
            <div className={cn('text-xs text-[#ef4444] mb-2', !hError && 'hidden')}>{hError}</div>
            <button type="button" onClick={handleAddHolding} disabled={hSaving} className="bg-[#D4AF37] text-[#080808] font-bold text-sm px-4 py-2 rounded-xl hover:bg-[#c9a227] transition-colors disabled:opacity-50">
              {hSaving ? 'Ajout...' : 'Ajouter la position'}
            </button>
          </div>

          {/* Empty state — always in DOM */}
          <div className={cn('flex flex-col items-center justify-center py-16 text-center', holdings.length > 0 && 'hidden')}>
            <p className="text-sm text-[#444] font-medium">Aucune position</p>
            <p className="text-xs text-[#333] mt-1">Ajoutez vos cryptos pour suivre votre P&amp;L en temps réel</p>
          </div>

          {/* Holdings list */}
          {holdings.map(h => {
            const price = coins.find(c => c.id === h.coin_id)?.current_price ?? h.avg_buy_price
            const val = h.quantity * price
            const inv = h.quantity * h.avg_buy_price
            const pnl = val - inv
            const pnlPct = inv > 0 ? (pnl / inv) * 100 : 0
            const pos = pnl >= 0
            return (
              <div key={h.id} className="flex items-center gap-4 px-5 py-4 border-b border-[#0f0f0f] last:border-0 hover:bg-[#0d0d0d] transition-colors">
                {h.coin_image && <img src={h.coin_image} alt={h.coin_name} className="w-8 h-8 rounded-full flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{h.coin_name} <span className="text-[10px] text-[#555] uppercase font-normal">{h.coin_symbol}</span></p>
                  <p className="text-[10px] text-[#444]">{h.quantity} · moy. {fmtUSD(h.avg_buy_price)} · actuel {fmtUSD(price)}</p>
                </div>
                <div className="text-right">
                  <p className={cn('text-sm font-bold font-mono', pos ? 'text-[#22c55e]' : 'text-[#ef4444]')}>{fmtUSD(pnl)}</p>
                  <p className={cn('text-[10px] font-bold', pos ? 'text-[#22c55e]' : 'text-[#ef4444]')}>{fmtPct(pnlPct)}</p>
                </div>
                <button type="button" onClick={() => { setHoldings(prev => prev.filter(x => x.id !== h.id)); fetch(`/api/portfolio?id=${h.id}`, { method: 'DELETE' }) }} className="p-1.5 rounded-lg text-[#333] hover:text-[#ef4444] transition-colors flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── ALERTS TAB ── */}
      <div className={cn('space-y-6', (loading || tab !== 'alerts') && 'hidden')}>
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
            <div>
              <span className="text-sm font-bold text-white">Alertes actives ({activeAlerts.length})</span>
              <p className="text-[10px] text-[#444] mt-0.5">Email envoyé dès que le prix atteint votre cible</p>
            </div>
            <button type="button" onClick={() => startTransition(() => { setShowAddA(v => !v); setAError('') })} className="text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/10 px-3 py-1.5 rounded-lg transition-colors">
              {showAddA ? 'Annuler' : '+ Nouvelle alerte'}
            </button>
          </div>

          {/* Alert form — always in DOM */}
          <div className={cn('px-5 py-4 border-b border-[#1a1a1a] bg-[#0d0d0d]', !showAddA && 'hidden')}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <select value={aCoin} onChange={e => setACoin(e.target.value)} className="bg-[#111] border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50">
                <option value="">Sélectionner une crypto</option>
                {coins.map(c => <option key={c.id} value={c.id}>{c.name} ({c.symbol.toUpperCase()})</option>)}
              </select>
              <select value={aDir} onChange={e => setADir(e.target.value as 'above' | 'below')} className="bg-[#111] border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50">
                <option value="above">Passe au-dessus de</option>
                <option value="below">Passe en-dessous de</option>
              </select>
              <input type="number" placeholder="Prix cible ($)" value={aPrice} onChange={e => setAPrice(e.target.value)} className="bg-[#111] border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#D4AF37]/50" />
            </div>
            <div className={cn('text-xs text-[#ef4444] mb-2', !aError && 'hidden')}>{aError}</div>
            <button type="button" onClick={handleAddAlert} disabled={aSaving} className="bg-[#D4AF37] text-[#080808] font-bold text-sm px-4 py-2 rounded-xl hover:bg-[#c9a227] transition-colors disabled:opacity-50">
              {aSaving ? 'Création...' : "Créer l'alerte"}
            </button>
            <p className="text-[10px] text-[#444] mt-2">Plan Gratuit / Starter : 3 alertes max · Plan Pro+ : illimité</p>
          </div>

          {/* Empty state */}
          <div className={cn('flex flex-col items-center justify-center py-14 text-center', activeAlerts.length > 0 && 'hidden')}>
            <p className="text-sm text-[#444] font-medium">Aucune alerte active</p>
            <p className="text-xs text-[#333] mt-1">Créez une alerte pour être notifié par email</p>
          </div>

          {/* Active alerts */}
          {activeAlerts.map(alert => (
            <div key={alert.id} className="flex items-center gap-4 px-5 py-4 border-b border-[#0f0f0f] last:border-0 hover:bg-[#0d0d0d] transition-colors">
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black', alert.direction === 'above' ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#ef4444]/10 text-[#ef4444]')}>
                {alert.direction === 'above' ? '▲' : '▼'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">
                  {alert.coin_symbol} <span className="text-[#555] font-normal text-xs">{alert.direction === 'above' ? 'au-dessus de' : 'en-dessous de'}</span> <span className="text-[#D4AF37] font-mono">${Number(alert.target_price).toLocaleString('en-US')}</span>
                </p>
                <span className="text-[10px] font-bold text-[#22c55e]">● Actif</span>
              </div>
              <button type="button" onClick={() => { setAlerts(prev => prev.filter(a => a.id !== alert.id)); fetch(`/api/alerts?id=${alert.id}`, { method: 'DELETE' }) }} className="p-1.5 rounded-lg text-[#333] hover:text-[#ef4444] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>

        {/* History */}
        {triggeredAlerts.length > 0 && (
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1a1a1a]">
              <span className="text-sm font-bold text-[#555]">Historique ({triggeredAlerts.length})</span>
            </div>
            {triggeredAlerts.map(alert => (
              <div key={alert.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#0f0f0f] last:border-0 opacity-50">
                <span className="text-[#22c55e] text-sm">✓</span>
                <div className="flex-1">
                  <p className="text-sm text-[#888]">{alert.coin_symbol} {alert.direction === 'above' ? '>' : '<'} ${Number(alert.target_price).toLocaleString('en-US')}</p>
                  {alert.triggered_at && <p className="text-[10px] text-[#333]">Déclenché le {fmtDate(alert.triggered_at)}</p>}
                </div>
                <button type="button" onClick={() => { setAlerts(prev => prev.filter(a => a.id !== alert.id)); fetch(`/api/alerts?id=${alert.id}`, { method: 'DELETE' }) }} className="p-1.5 rounded-lg text-[#222] hover:text-[#555] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
