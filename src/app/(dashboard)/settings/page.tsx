'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PLANS } from '@/lib/stripe/client'
import { cn } from '@/lib/utils'
import {
  Bell,
  CheckCircle,
  ChevronRight,
  Crown,
  Globe,
  Key,
  Lock,
  Moon,
  Save,
  Shield,
  User,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const TABS = ['Profile', 'Subscription', 'Notifications', 'Security', 'API Keys']

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Profile')
  const [name, setName] = useState('John Trader')
  const [email, setEmail] = useState('trader@example.com')
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success('Settings saved successfully')
    }, 1000)
  }

  const handleUpgrade = async (plan: string) => {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-solena-text">Settings</h1>
        <p className="text-sm text-solena-text-muted mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-solena-card border border-solena-border rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab ? 'bg-solena-primary text-solena-bg' : 'text-solena-text-muted hover:text-solena-text'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'Profile' && (
        <Card className="p-6 space-y-5">
          <h2 className="font-semibold text-solena-text flex items-center gap-2">
            <User className="w-4 h-4 text-solena-primary" /> Profile Information
          </h2>
          <div className="flex items-center gap-5 pb-5 border-b border-solena-border">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-solena-primary to-solena-secondary flex items-center justify-center text-2xl font-bold text-solena-bg">
              J
            </div>
            <div>
              <p className="font-semibold text-solena-text">{name}</p>
              <p className="text-sm text-solena-text-muted">{email}</p>
              <Button variant="ghost" size="sm" className="mt-2 -ml-2">Change Avatar</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-solena-text-secondary mb-2 block">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-medium text-solena-text-secondary mb-2 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-medium text-solena-text-secondary mb-2 block">Timezone</label>
              <select className="input-field">
                {['UTC', 'UTC+1', 'UTC-5', 'UTC+8', 'UTC+9'].map(tz => (
                  <option key={tz} className="bg-solena-bg">{tz}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-solena-text-secondary mb-2 block">Currency</label>
              <select className="input-field">
                {['USD', 'EUR', 'GBP', 'JPY'].map(c => (
                  <option key={c} className="bg-solena-bg">{c}</option>
                ))}
              </select>
            </div>
          </div>
          <Button onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </Card>
      )}

      {/* Subscription Tab */}
      {activeTab === 'Subscription' && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-solena-accent/10 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-solena-accent" />
                </div>
                <div>
                  <p className="font-semibold text-solena-text">Current Plan: <span className="text-solena-primary">Starter</span></p>
                  <p className="text-sm text-solena-text-muted">Your trial expires in 14 days</p>
                </div>
              </div>
              <Badge variant="active">Active</Badge>
            </div>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            {Object.values(PLANS).map((plan) => (
              <Card key={plan.plan} className={cn('p-5', plan.highlighted && 'glow-border')}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-solena-text">{plan.name}</h3>
                  {plan.badge && <Badge variant={plan.highlighted ? 'active' : 'premium'}>{plan.badge}</Badge>}
                </div>
                <p className="text-2xl font-black text-solena-text mb-4">${plan.price}<span className="text-sm font-normal text-solena-text-muted">/mo</span></p>
                <ul className="space-y-2 mb-5">
                  {plan.features.slice(0, 4).map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-solena-text-secondary">
                      <CheckCircle className="w-3.5 h-3.5 text-solena-success flex-shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                  size="sm"
                  className="w-full"
                  onClick={() => handleUpgrade(plan.plan)}
                >
                  {plan.plan === 'starter' ? 'Current Plan' : 'Upgrade'} <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'Notifications' && (
        <Card className="p-6 space-y-5">
          <h2 className="font-semibold text-solena-text flex items-center gap-2">
            <Bell className="w-4 h-4 text-solena-primary" /> Notification Preferences
          </h2>
          {[
            { label: 'New Trading Signals', desc: 'Get notified when new AI signals are generated', enabled: true },
            { label: 'Trade Executed', desc: 'When your bot opens or closes a position', enabled: true },
            { label: 'Daily P&L Report', desc: 'Daily summary of your trading performance', enabled: false },
            { label: 'Market Alerts', desc: 'Important market events and volatility spikes', enabled: true },
            { label: 'Bot Status Changes', desc: 'When your bot is paused, errors, or resumed', enabled: true },
            { label: 'Weekly Performance', desc: 'Weekly trading summary and insights', enabled: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b border-solena-border last:border-0">
              <div>
                <p className="text-sm font-medium text-solena-text">{item.label}</p>
                <p className="text-xs text-solena-text-muted">{item.desc}</p>
              </div>
              <button className={cn(
                'w-11 h-6 rounded-full transition-all duration-200 relative',
                item.enabled ? 'bg-solena-primary' : 'bg-solena-border'
              )}>
                <span className={cn(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200',
                  item.enabled ? 'left-5.5' : 'left-0.5'
                )} style={{ left: item.enabled ? '22px' : '2px' }} />
              </button>
            </div>
          ))}
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'Security' && (
        <Card className="p-6 space-y-5">
          <h2 className="font-semibold text-solena-text flex items-center gap-2">
            <Shield className="w-4 h-4 text-solena-primary" /> Security Settings
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-solena-bg border border-solena-border rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-solena-text">Change Password</p>
                  <p className="text-xs text-solena-text-muted mt-0.5">Last changed 30 days ago</p>
                </div>
                <Button variant="secondary" size="sm"><Lock className="w-3.5 h-3.5" /> Change</Button>
              </div>
            </div>
            <div className="p-4 bg-solena-bg border border-solena-border rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-solena-text">Two-Factor Authentication</p>
                  <p className="text-xs text-solena-text-muted mt-0.5">Add an extra layer of security</p>
                </div>
                <Button variant="success" size="sm"><Shield className="w-3.5 h-3.5" /> Enable 2FA</Button>
              </div>
            </div>
            <div className="p-4 bg-solena-bg border border-solena-border rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-solena-text">Active Sessions</p>
                  <p className="text-xs text-solena-text-muted mt-0.5">2 active sessions</p>
                </div>
                <Button variant="ghost" size="sm">View Sessions</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* API Keys Tab */}
      {activeTab === 'API Keys' && (
        <Card className="p-6 space-y-5">
          <h2 className="font-semibold text-solena-text flex items-center gap-2">
            <Key className="w-4 h-4 text-solena-primary" /> API Keys
          </h2>
          <div className="bg-solena-primary/5 border border-solena-primary/10 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-solena-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-solena-text-secondary">Use API keys to integrate Solena AI with your own applications. Available on Elite plan.</p>
            </div>
          </div>
          <div className="p-4 bg-solena-bg border border-solena-border rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-solena-text">Generate API Key</p>
                <p className="text-xs text-solena-text-muted mt-0.5">Create a new API key for programmatic access</p>
              </div>
              <Button variant="primary" size="sm"><Key className="w-3.5 h-3.5" /> Generate</Button>
            </div>
          </div>
          <p className="text-xs text-solena-text-muted text-center">Upgrade to Elite to access the full Solena API</p>
        </Card>
      )}
    </div>
  )
}
