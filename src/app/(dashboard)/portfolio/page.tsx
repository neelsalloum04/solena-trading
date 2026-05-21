'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Download,
  Filter,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const monthlyPnl = [
  { month: 'Jan', pnl: 840, trades: 12 },
  { month: 'Feb', pnl: -210, trades: 8 },
  { month: 'Mar', pnl: 1240, trades: 15 },
  { month: 'Apr', pnl: 680, trades: 11 },
  { month: 'May', pnl: -140, trades: 9 },
  { month: 'Jun', pnl: 1890, trades: 18 },
  { month: 'Jul', pnl: 2340, trades: 21 },
  { month: 'Aug', pnl: 1100, trades: 14 },
  { month: 'Sep', pnl: -380, trades: 10 },
  { month: 'Oct', pnl: 2800, trades: 24 },
  { month: 'Nov', pnl: 1640, trades: 16 },
  { month: 'Dec', pnl: 3100, trades: 28 },
]

const allocation = [
  { name: 'Crypto', value: 40, color: '#f59e0b' },
  { name: 'Forex', value: 30, color: '#00e5b4' },
  { name: 'Indices', value: 20, color: '#6366f1' },
  { name: 'Commodities', value: 10, color: '#ef4444' },
]

const trades = [
  { id: 1, pair: 'BTC/USDT', type: 'BUY', entry: 64200, exit: 67450, qty: 0.5, pnl: 1625, pnlPct: 5.06, duration: '4h 23m', date: 'Dec 15', status: 'closed' },
  { id: 2, pair: 'EUR/USD', type: 'SELL', entry: 1.0876, exit: 1.0842, qty: 10000, pnl: 34, pnlPct: 0.31, duration: '1h 12m', date: 'Dec 14', status: 'closed' },
  { id: 3, pair: 'XAU/USD', type: 'BUY', entry: 2612, exit: 2654, qty: 2, pnl: 84, pnlPct: 1.61, duration: '8h 44m', date: 'Dec 14', status: 'closed' },
  { id: 4, pair: 'ETH/USDT', type: 'BUY', entry: 3180, exit: null, qty: 3, pnl: 183, pnlPct: 1.92, duration: 'Open', date: 'Dec 15', status: 'open' },
  { id: 5, pair: 'GBP/USD', type: 'SELL', entry: 1.2678, exit: 1.2701, qty: 5000, pnl: -12, pnlPct: -0.18, duration: '45m', date: 'Dec 13', status: 'closed' },
  { id: 6, pair: 'SPX500', type: 'BUY', entry: 5782, exit: 5876, qty: 1, pnl: 94, pnlPct: 1.63, duration: '2d', date: 'Dec 12', status: 'closed' },
]

export default function PortfolioPage() {
  const totalPnl = monthlyPnl.reduce((a, m) => a + m.pnl, 0)
  const winMonths = monthlyPnl.filter(m => m.pnl > 0).length

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-solena-text">Portfolio</h1>
          <p className="text-sm text-solena-text-muted mt-0.5">Complete trading performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">
            <Calendar className="w-3.5 h-3.5" /> 2024 · All Time
          </Button>
          <Button variant="secondary" size="sm">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Value', value: formatCurrency(18340), icon: Wallet, color: 'text-solena-primary', bg: 'bg-solena-primary/10', sub: '+$8,340 profit' },
          { label: 'Realized P&L', value: formatCurrency(totalPnl), icon: TrendingUp, color: 'text-solena-success', bg: 'bg-solena-success/10', sub: `${winMonths}/12 profitable months` },
          { label: 'Unrealized P&L', value: formatCurrency(183), icon: BarChart3, color: 'text-solena-accent', bg: 'bg-solena-accent/10', sub: '1 open position' },
          { label: 'Total Trades', value: '148', icon: ArrowUpRight, color: 'text-solena-secondary', bg: 'bg-solena-secondary/10', sub: '108W / 40L (73.2%)' },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', s.bg)}>
                <s.icon className={cn('w-4 h-4', s.color)} />
              </div>
              <p className="text-xs text-solena-text-muted">{s.label}</p>
            </div>
            <p className="text-xl font-bold font-mono text-solena-text">{s.value}</p>
            <p className="text-xs text-solena-text-secondary mt-1">{s.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Monthly P&L Chart */}
        <Card className="xl:col-span-2 p-6">
          <h2 className="font-semibold text-solena-text mb-5">Monthly P&L — 2024</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyPnl}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#111120', border: '1px solid #1a1a2e', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={(v: number) => [`$${v}`, 'P&L']}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {monthlyPnl.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? '#00e5b4' : '#ef4444'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Portfolio Allocation */}
        <Card className="p-6">
          <h2 className="font-semibold text-solena-text mb-5">Market Allocation</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={allocation} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" stroke="none">
                {allocation.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#111120', border: '1px solid #1a1a2e', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={(v: number) => [`${v}%`, 'Allocation']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {allocation.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-solena-text-muted">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-solena-text">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Trade History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-solena-text">Trade History</h2>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm"><Filter className="w-3.5 h-3.5" /> Filter</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-solena-border">
                {['Pair', 'Type', 'Entry', 'Exit', 'Qty', 'P&L', 'Duration', 'Date', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-solena-text-muted pb-3 px-2 first:pl-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-solena-border/50">
              {trades.map((trade) => (
                <tr key={trade.id} className="hover:bg-solena-bg/50 transition-colors">
                  <td className="py-3 px-2 pl-0 font-mono font-semibold text-sm text-solena-text">{trade.pair}</td>
                  <td className="py-3 px-2"><Badge variant={trade.type === 'BUY' ? 'buy' : 'sell'}>{trade.type}</Badge></td>
                  <td className="py-3 px-2 font-mono text-sm text-solena-text-secondary">{trade.entry}</td>
                  <td className="py-3 px-2 font-mono text-sm text-solena-text-secondary">{trade.exit ?? '—'}</td>
                  <td className="py-3 px-2 text-sm text-solena-text-secondary">{trade.qty}</td>
                  <td className="py-3 px-2">
                    <div className={cn('text-sm font-bold', trade.pnl >= 0 ? 'text-solena-success' : 'text-solena-danger')}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl}
                      <span className="text-xs ml-1">({trade.pnl >= 0 ? '+' : ''}{trade.pnlPct}%)</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-xs text-solena-text-muted">{trade.duration}</td>
                  <td className="py-3 px-2 text-xs text-solena-text-muted">{trade.date}</td>
                  <td className="py-3 px-2">
                    <Badge variant={trade.status === 'open' ? 'active' : 'neutral'}>{trade.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
