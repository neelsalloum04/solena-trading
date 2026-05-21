'use client'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Activity,
  BarChart3,
  Clock,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const winRateByMarket = [
  { market: 'Crypto', winRate: 76, trades: 48, pnl: 4240 },
  { market: 'Forex', winRate: 71, trades: 52, pnl: 2180 },
  { market: 'Indices', winRate: 78, trades: 28, pnl: 3120 },
  { market: 'Commodities', winRate: 67, trades: 20, pnl: 940 },
]

const hourlyActivity = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h.toString().padStart(2, '0')}:00`,
  trades: Math.floor(Math.random() * 8),
  winRate: Math.floor(60 + Math.random() * 30),
}))

const radarData = [
  { subject: 'Win Rate', value: 73 },
  { subject: 'Risk Mgmt', value: 85 },
  { subject: 'Consistency', value: 68 },
  { subject: 'Discipline', value: 79 },
  { subject: 'Timing', value: 71 },
  { subject: 'Position Sizing', value: 82 },
]

const drawdownData = [
  { date: 'Week 1', drawdown: -2.1 },
  { date: 'Week 2', drawdown: -4.3 },
  { date: 'Week 3', drawdown: -3.1 },
  { date: 'Week 4', drawdown: -8.4 },
  { date: 'Week 5', drawdown: -5.2 },
  { date: 'Week 6', drawdown: -6.8 },
  { date: 'Week 7', drawdown: -3.4 },
  { date: 'Week 8', drawdown: -2.8 },
]

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-solena-text">Advanced Analytics</h1>
        <p className="text-sm text-solena-text-muted mt-0.5">Deep insights into your trading performance</p>
      </div>

      {/* Performance Score */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Performance Score', value: '84/100', icon: Target, color: 'text-solena-primary', bg: 'bg-solena-primary/10', sub: 'Top 12% of traders' },
          { label: 'Profit Factor', value: '2.74', icon: TrendingUp, color: 'text-solena-success', bg: 'bg-solena-success/10', sub: 'Above 2.0 is excellent' },
          { label: 'Avg Hold Time', value: '4h 32m', icon: Clock, color: 'text-solena-accent', bg: 'bg-solena-accent/10', sub: 'Swing trading style' },
          { label: 'Sharpe Ratio', value: '2.1', icon: Activity, color: 'text-solena-secondary', bg: 'bg-solena-secondary/10', sub: 'Risk-adjusted returns' },
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

      <div className="grid xl:grid-cols-2 gap-6">
        {/* Win Rate by Market */}
        <Card className="p-6">
          <h2 className="font-semibold text-solena-text mb-5">Win Rate by Market</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={winRateByMarket}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
              <XAxis dataKey="market" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ background: '#111120', border: '1px solid #1a1a2e', borderRadius: '12px', color: '#e2e8f0' }} formatter={(v: number) => [`${v}%`, 'Win Rate']} />
              <Bar dataKey="winRate" radius={[4, 4, 0, 0]} fill="#00e5b4" fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Trading Radar */}
        <Card className="p-6">
          <h2 className="font-semibold text-solena-text mb-5">Trading Profile</h2>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1a1a2e" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar name="Score" dataKey="value" stroke="#00e5b4" fill="#00e5b4" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip contentStyle={{ background: '#111120', border: '1px solid #1a1a2e', borderRadius: '12px', color: '#e2e8f0' }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Drawdown Chart */}
        <Card className="p-6">
          <h2 className="font-semibold text-solena-text mb-5">Drawdown History</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={drawdownData} margin={{ top: 5 }}>
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ background: '#111120', border: '1px solid #1a1a2e', borderRadius: '12px', color: '#e2e8f0' }} formatter={(v: number) => [`${v}%`, 'Drawdown']} />
              <Line type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={2} dot={false} fill="url(#ddGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            <div className="text-center">
              <p className="text-lg font-bold text-solena-danger">-8.4%</p>
              <p className="text-xs text-solena-text-muted">Max Drawdown</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-solena-text">-3.8%</p>
              <p className="text-xs text-solena-text-muted">Avg Drawdown</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-solena-success">15 days</p>
              <p className="text-xs text-solena-text-muted">Recovery Time</p>
            </div>
          </div>
        </Card>

        {/* Hourly Trading Activity */}
        <Card className="p-6">
          <h2 className="font-semibold text-solena-text mb-5">Hourly Trading Activity</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourlyActivity.filter((_, i) => i % 2 === 0)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111120', border: '1px solid #1a1a2e', borderRadius: '12px', color: '#e2e8f0' }} />
              <Bar dataKey="trades" fill="#6366f1" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-solena-text-muted mt-3 text-center">Most active: London session (8AM-12PM UTC)</p>
        </Card>
      </div>
    </div>
  )
}
