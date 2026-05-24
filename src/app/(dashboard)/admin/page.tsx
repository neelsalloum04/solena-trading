'use client'
import { PlanGate } from '@/components/upgrade/PlanGate'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Activity,
  BarChart3,
  Bot,
  CreditCard,
  MessageSquare,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const growthData = [
  { date: 'Jan', users: 820, revenue: 12400 },
  { date: 'Feb', users: 1040, revenue: 15600 },
  { date: 'Mar', users: 1280, revenue: 19200 },
  { date: 'Apr', users: 1560, revenue: 23400 },
  { date: 'May', users: 1890, revenue: 28350 },
  { date: 'Jun', users: 2340, revenue: 35100 },
  { date: 'Jul', users: 2890, revenue: 43350 },
  { date: 'Aug', users: 3480, revenue: 52200 },
  { date: 'Sep', users: 4200, revenue: 63000 },
  { date: 'Oct', users: 5100, revenue: 76500 },
  { date: 'Nov', users: 6200, revenue: 93000 },
  { date: 'Dec', users: 7840, revenue: 117600 },
]

const recentUsers = [
  { name: 'Marcus Chen', email: 'marcus@example.com', plan: 'elite', joined: '2h ago', status: 'active' },
  { name: 'Sarah Williams', email: 'sarah@example.com', plan: 'pro', joined: '5h ago', status: 'active' },
  { name: 'Alex Dubois', email: 'alex@example.com', plan: 'pro', joined: '1d ago', status: 'active' },
  { name: 'Yuki Tanaka', email: 'yuki@example.com', plan: 'starter', joined: '1d ago', status: 'trial' },
  { name: 'Carlos Rodriguez', email: 'carlos@example.com', plan: 'elite', joined: '2d ago', status: 'active' },
]

function AdminContent() {
  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-solena-primary" />
            <h1 className="text-2xl font-bold text-solena-text">Admin Dashboard</h1>
          </div>
          <p className="text-sm text-solena-text-muted">Platform management and analytics</p>
        </div>
        <Button variant="secondary" size="sm">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: '18,247', change: '+842 this week', icon: Users, color: 'text-solena-primary', bg: 'bg-solena-primary/10' },
          { label: 'Monthly Revenue', value: '117 600 €', change: '+26.5% vs last month', icon: CreditCard, color: 'text-solena-success', bg: 'bg-solena-success/10' },
          { label: 'Active Bots', value: '3,241', change: '67.4% of Pro+ users', icon: Bot, color: 'text-solena-accent', bg: 'bg-solena-accent/10' },
          { label: 'Signals Generated', value: '148,432', change: '+12,400 this week', icon: Zap, color: 'text-solena-secondary', bg: 'bg-solena-secondary/10' },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', s.bg)}>
                <s.icon className={cn('w-4 h-4', s.color)} />
              </div>
              <p className="text-xs text-solena-text-muted">{s.label}</p>
            </div>
            <p className="text-xl font-bold font-mono text-solena-text">{s.value}</p>
            <p className="text-xs text-solena-success mt-1">{s.change}</p>
          </Card>
        ))}
      </div>

      {/* Growth Charts */}
      <div className="grid xl:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold text-solena-text mb-5">User Growth — 2024</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#111120', border: '1px solid #1a1a2e', borderRadius: '12px', color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} fill="url(#usersGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-solena-text mb-5">Revenue — 2024</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e5b4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00e5b4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k€`} />
              <Tooltip contentStyle={{ background: '#111120', border: '1px solid #1a1a2e', borderRadius: '12px', color: '#e2e8f0' }} formatter={(v: number) => [`${v.toLocaleString('fr-FR')} €`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#00e5b4" strokeWidth={2} fill="url(#revGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Plan Distribution */}
      <div className="grid xl:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold text-solena-text mb-5">Plan Distribution</h2>
          <div className="space-y-4">
            {[
              { plan: 'Elite', users: 2847, total: 18247, color: 'bg-solena-accent' },
              { plan: 'Pro', users: 6420, total: 18247, color: 'bg-solena-primary' },
              { plan: 'Starter', users: 8980, total: 18247, color: 'bg-solena-secondary/60' },
            ].map((item) => {
              const pct = Math.round((item.users / item.total) * 100)
              return (
                <div key={item.plan}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-solena-text">{item.plan}</span>
                    <span className="text-solena-text-muted">{item.users.toLocaleString()} users · {pct}%</span>
                  </div>
                  <div className="h-2 bg-solena-bg rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', item.color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-solena-text mb-5">System Health</h2>
          <div className="space-y-3">
            {[
              { label: 'AI Chat API', status: 'Operational', ok: true },
              { label: 'Signal Engine', status: 'Operational', ok: true },
              { label: 'Binance Integration', status: 'Operational', ok: true },
              { label: 'Alpaca Integration', status: 'Operational', ok: true },
              { label: 'Stripe Payments', status: 'Operational', ok: true },
              { label: 'Supabase Database', status: 'Operational', ok: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-solena-border last:border-0">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-solena-text-muted" />
                  <span className="text-sm text-solena-text">{item.label}</span>
                </div>
                <Badge variant={item.ok ? 'active' : 'sell'}>
                  {item.ok && <span className="w-1.5 h-1.5 bg-solena-primary rounded-full animate-pulse inline-block mr-1" />}
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Users */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-solena-text">Recent Signups</h2>
          <Button variant="ghost" size="sm">View All Users</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-solena-border">
                {['User', 'Email', 'Plan', 'Joined', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-solena-text-muted pb-3 px-2 first:pl-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-solena-border/50">
              {recentUsers.map((user) => (
                <tr key={user.email} className="hover:bg-solena-bg/50 transition-colors">
                  <td className="py-3 px-2 pl-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-solena-primary to-solena-secondary flex items-center justify-center text-xs font-bold text-solena-bg">
                        {user.name[0]}
                      </div>
                      <span className="text-sm font-medium text-solena-text">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-sm text-solena-text-muted">{user.email}</td>
                  <td className="py-3 px-2">
                    <Badge variant={user.plan === 'elite' ? 'warning' : user.plan === 'pro' ? 'active' : 'neutral'}>
                      {user.plan}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-xs text-solena-text-muted">{user.joined}</td>
                  <td className="py-3 px-2">
                    <Badge variant={user.status === 'active' ? 'buy' : 'neutral'}>{user.status}</Badge>
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

export default function AdminPage() {
  return (
    <PlanGate requiredPlan="admin">
      <AdminContent />
    </PlanGate>
  )
}
