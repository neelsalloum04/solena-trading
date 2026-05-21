'use client'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn, generateMockSignals } from '@/lib/utils'
import type { TradingSignal } from '@/types'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  MessageSquare,
  Radio,
  TrendingDown,
  TrendingUp,
  Activity,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const STATS = [
  { label: 'Valeur du portefeuille', value: '$18 340', sub: '+15.3% ce mois', positive: true, icon: TrendingUp },
  { label: 'Profit total', value: '$8 340', sub: '+$1 240 ce mois', positive: true, icon: ArrowUpRight },
  { label: 'Taux de réussite', value: '73.2%', sub: '+2.1% vs mois dernier', positive: true, icon: Activity },
  { label: 'Drawdown max', value: '-8.4%', sub: 'Zone sûre', positive: false, icon: TrendingDown },
]

function SignalMini({ signal }: { signal: TradingSignal }) {
  const isBuy = signal.type === 'BUY'
  return (
    <div className={cn(
      'flex items-center justify-between p-3 rounded-xl border transition-all duration-200 hover:border-opacity-50',
      isBuy ? 'border-solena-success/20 bg-solena-success/5' : 'border-solena-danger/20 bg-solena-danger/5'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', isBuy ? 'bg-solena-success/10' : 'bg-solena-danger/10')}>
          {isBuy ? <ArrowUpRight className="w-4 h-4 text-solena-success" /> : <ArrowDownRight className="w-4 h-4 text-solena-danger" />}
        </div>
        <div>
          <span className="font-bold text-solena-text font-mono text-sm">{signal.pair}</span>
          <p className="text-[10px] text-solena-text-muted capitalize">{signal.market}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={isBuy ? 'buy' : 'sell'}>{signal.type}</Badge>
        <span className="text-sm font-bold text-solena-success">{signal.potential_gain}</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [signals, setSignals] = useState<TradingSignal[]>([])
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    setSignals(generateMockSignals().slice(0, 4))
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-solena-text">Bonjour, Trader 👋</h1>
          <p className="text-sm text-solena-text-muted mt-0.5">
            {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' · '}
            <span className="font-mono text-solena-primary">{time.toLocaleTimeString('fr-FR', { hour12: false })}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-solena-success/5 border border-solena-success/20 px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 bg-solena-success rounded-full animate-pulse" />
          <span className="text-xs font-bold text-solena-success">Marchés ouverts</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', stat.positive ? 'bg-solena-success/10' : 'bg-solena-danger/10')}>
                <stat.icon className={cn('w-4 h-4', stat.positive ? 'text-solena-success' : 'text-solena-danger')} />
              </div>
              <span className={cn('text-xs font-bold px-2 py-1 rounded-lg', stat.positive ? 'bg-solena-success/10 text-solena-success' : 'bg-solena-danger/10 text-solena-danger')}>
                {stat.positive ? '↑' : '↓'}
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-solena-text">{stat.value}</p>
            <p className="text-xs text-solena-text-muted mt-1">{stat.label}</p>
            <p className={cn('text-xs font-medium mt-1', stat.positive ? 'text-solena-success' : 'text-solena-danger')}>{stat.sub}</p>
          </Card>
        ))}
      </div>

      {/* 3 main actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/chat">
          <Card glow className="p-5 cursor-pointer hover:border-solena-primary/30 transition-all duration-200 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-solena-primary to-solena-secondary flex items-center justify-center shadow-solena mb-4">
              <MessageSquare className="w-5 h-5 text-solena-bg" />
            </div>
            <h2 className="font-bold text-solena-text mb-1">Chat IA</h2>
            <p className="text-sm text-solena-text-muted leading-relaxed mb-3">Pose une question ou envoie un graphique pour une analyse complète avec entrée, SL et TP.</p>
            <div className="flex items-center gap-1 text-xs text-solena-primary font-semibold group-hover:gap-2 transition-all">
              Ouvrir le chat <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>
        </Link>

        <Link href="/signals">
          <Card glow className="p-5 cursor-pointer hover:border-solena-success/30 transition-all duration-200 group">
            <div className="w-11 h-11 rounded-xl bg-solena-success/10 border border-solena-success/20 flex items-center justify-center mb-4">
              <Radio className="w-5 h-5 text-solena-success" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-solena-text">Signaux live</h2>
              <span className="w-1.5 h-1.5 bg-solena-success rounded-full animate-pulse" />
            </div>
            <p className="text-sm text-solena-text-muted leading-relaxed mb-3">Opportunités de trading en temps réel sur tous les marchés : crypto, forex, indices.</p>
            <div className="flex items-center gap-1 text-xs text-solena-success font-semibold group-hover:gap-2 transition-all">
              Voir les signaux <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>
        </Link>

        <Link href="/bot">
          <Card glow className="p-5 cursor-pointer hover:border-solena-secondary/30 transition-all duration-200 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-solena-secondary/20 to-purple-600/20 border border-solena-secondary/20 flex items-center justify-center mb-4">
              <Bot className="w-5 h-5 text-solena-secondary" />
            </div>
            <h2 className="font-bold text-solena-text mb-1">Robot de trading</h2>
            <p className="text-sm text-solena-text-muted leading-relaxed mb-3">Trading automatique 24h/24. Connecte Binance, Alpaca, Bybit et lance le bot en un clic.</p>
            <div className="flex items-center gap-1 text-xs text-solena-secondary font-semibold group-hover:gap-2 transition-all">
              Configurer le bot <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Live signals preview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-solena-primary" />
            <h2 className="font-semibold text-solena-text">Derniers signaux</h2>
            <div className="flex items-center gap-1.5 bg-solena-success/5 border border-solena-success/15 px-2 py-0.5 rounded-lg">
              <span className="w-1.5 h-1.5 bg-solena-success rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-solena-success">LIVE</span>
            </div>
          </div>
          <Link href="/signals" className="text-xs text-solena-primary hover:underline flex items-center gap-1 font-medium">
            Voir tous les signaux <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {signals.map(s => <SignalMini key={s.id} signal={s} />)}
        </div>
      </Card>
    </div>
  )
}
