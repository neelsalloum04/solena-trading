'use client'
import { cn } from '@/lib/utils'
import { ChevronDown, ExternalLink, HelpCircle, Mail, MessageSquare, Send, Shield } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const FAQ: { q: string; a: string; category: string }[] = [
  {
    category: 'Abonnements',
    q: 'Comment fonctionne la facturation ?',
    a: 'La facturation est mensuelle et se renouvelle automatiquement à la date anniversaire de votre abonnement. Vous recevez une confirmation par email avant chaque renouvellement.',
  },
  {
    category: 'Abonnements',
    q: 'Puis-je annuler à tout moment ?',
    a: "Oui, vous pouvez annuler votre abonnement à tout moment depuis Paramètres → Abonnement. L'annulation prend effet à la fin de la période en cours. Vous conservez l'accès jusqu'à cette date.",
  },
  {
    category: 'Abonnements',
    q: 'Puis-je changer de forfait en cours de mois ?',
    a: 'Oui. Un upgrade est effectif immédiatement avec facturation au prorata. Un downgrade prend effet au prochain cycle de facturation.',
  },
  {
    category: 'Abonnements',
    q: 'Acceptez-vous des remboursements ?',
    a: "Les abonnements ne sont généralement pas remboursables pour les périodes partielles. En cas de problème technique avéré de notre côté, contactez notre support pour une solution au cas par cas.",
  },
  {
    category: 'Analyse IA',
    q: 'Quels types de graphiques puis-je analyser ?',
    a: "PrimeX accepte les captures d'écran de graphiques depuis TradingView, MT4, MT5, Binance, Bybit, cTrader et toute autre plateforme. L'image doit clairement montrer les chandeliers, le cours et idéalement des niveaux de support/résistance.",
  },
  {
    category: 'Analyse IA',
    q: 'Combien d\'analyses puis-je effectuer ?',
    a: "Starter : 3 analyses/jour. Pro : 50 analyses/jour. Prime : illimité. Les quotas se réinitialisent chaque jour à minuit (UTC).",
  },
  {
    category: 'Analyse IA',
    q: "L'IA peut-elle se tromper dans ses analyses ?",
    a: "Oui, absolument. Les analyses IA sont fournies à titre informatif et éducatif uniquement. Elles ne constituent pas des conseils financiers. Effectuez toujours votre propre analyse avant de prendre une décision.",
  },
  {
    category: 'Signaux',
    q: "D'où proviennent les signaux ?",
    a: "Les signaux sont générés par notre moteur IA qui analyse en temps réel plusieurs indicateurs techniques (RSI, MACD, Bollinger, volume, niveaux clés) sur plusieurs marchés. Ils sont mis à jour toutes les 5 minutes.",
  },
  {
    category: 'Signaux',
    q: 'Les signaux sont-ils fiables à 100% ?',
    a: "Non. Aucun signal ne garantit un résultat. Le taux de confiance indiqué reflète la conviction algorithmique, pas une probabilité de succès garantie. Utilisez les signaux comme un outil d'aide à la décision, pas comme une instruction d'achat.",
  },
  {
    category: 'Bot de trading',
    q: 'Le bot utilise-t-il de vrais fonds ?',
    a: "Le mode Paper Trading simule des transactions avec des prix réels mais sans fonds réels — idéal pour tester. Le mode Live exécute de vraies ordres sur votre compte Binance. Ce mode n'est disponible qu'avec une clé API Binance et le forfait Prime.",
  },
  {
    category: 'Bot de trading',
    q: 'Comment connecter Binance en toute sécurité ?',
    a: "Créez une clé API dédiée dans Binance avec uniquement les permissions « Spot Trading ». N'activez jamais le retrait dans les permissions. Utilisez des restrictions IP pour plus de sécurité.",
  },
  {
    category: 'Technique',
    q: "L'application fonctionne-t-elle sur mobile ?",
    a: "Oui, PrimeX est entièrement responsive et optimisée pour mobile, tablette et desktop.",
  },
  {
    category: 'Technique',
    q: 'Mes données sont-elles sécurisées ?',
    a: "Oui. Toutes les communications sont chiffrées via TLS. Les clés API broker sont stockées de manière sécurisée. PrimeX ne stocke jamais vos données bancaires (gérées par Stripe). Consultez notre Politique de Confidentialité pour les détails.",
  },
]

const CATEGORIES = ['Tous', ...Array.from(new Set(FAQ.map(f => f.category)))]

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

const WELCOME: ChatMsg = {
  role: 'assistant',
  content: 'Bonjour ! Je suis l\'assistant PrimeX. Comment puis-je vous aider ? (abonnement, analyse IA, signaux, bot…)',
}

const QUICK_QUESTIONS = [
  'Comment annuler mon abonnement ?',
  'Quelle est la différence entre les forfaits ?',
  'Comment connecter Binance ?',
  'Je n\'arrive pas à me connecter',
]

export default function SupportPage() {
  const [open, setOpen] = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState('Tous')

  // Chatbot state
  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const filtered = FAQ.filter(f => activeCategory === 'Tous' || f.category === activeCategory)

  useEffect(() => {
    const el = messagesContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg: ChatMsg = { role: 'user', content: msg }
    const next = [...messages, userMsg]
    setMessages(next)
    setLoading(true)

    try {
      const res = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: next.slice(0, -1).filter(m => m.role !== 'assistant' || m !== WELCOME),
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || data.error || 'Désolé, une erreur est survenue.',
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Service temporairement indisponible. Contactez contact@ecomstartprofits.com',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Centre d&apos;aide</h1>
        <p className="text-sm text-[#555]">Trouvez des réponses à vos questions ou discutez avec notre assistant.</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: <MessageSquare className="w-5 h-5" />, title: 'Chat IA', desc: 'Posez vos questions au chat', href: '/chat', color: 'text-[#818cf8]', bg: 'bg-[#818cf8]/10', border: 'border-[#818cf8]/20' },
          { icon: <Shield className="w-5 h-5" />, title: 'Politique de confidentialité', desc: 'Vos données & RGPD', href: '/legal/privacy', color: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10', border: 'border-[#22c55e]/20' },
          { icon: <ExternalLink className="w-5 h-5" />, title: 'CGU', desc: "Conditions d'utilisation", href: '/legal/cgu', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10', border: 'border-[#D4AF37]/20' },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <div className={cn('flex items-center gap-3 p-4 rounded-2xl border', link.bg, link.border, 'hover:brightness-125 transition-all cursor-pointer')}>
              <div className={link.color}>{link.icon}</div>
              <div>
                <p className={cn('text-xs font-bold', link.color)}>{link.title}</p>
                <p className="text-[11px] text-[#555]">{link.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Support Chatbot */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#111]">
          <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Assistant PrimeX</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full" />
              <span className="text-[11px] text-[#22c55e]">En ligne</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="h-72 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                m.role === 'user'
                  ? 'bg-[#D4AF37] text-[#080808] font-medium rounded-br-sm'
                  : 'bg-[#141414] border border-[#1a1a1a] text-[#ccc] rounded-bl-sm'
              )}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#141414] border border-[#1a1a1a] rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#444] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#444] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#444] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick questions (only show at start) */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-[11px] text-[#888] border border-[#1a1a1a] px-3 py-1.5 rounded-xl hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition-colors bg-[#0f0f0f]"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 border-t border-[#111] pt-3">
          <form
            onSubmit={e => { e.preventDefault(); sendMessage() }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Posez votre question…"
              disabled={loading}
              className="flex-1 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#D4AF37]/40 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-[#D4AF37] text-[#080808] px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-[#444] mt-2 text-center">
            Pour un problème complexe, écrivez-nous à{' '}
            <a href="mailto:contact@ecomstartprofits.com" className="text-[#D4AF37] hover:underline">
              contact@ecomstartprofits.com
            </a>
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Questions fréquentes</h2>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all',
                activeCategory === cat
                  ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
                  : 'bg-[#0a0a0a] border-[#1a1a1a] text-[#555] hover:text-[#888]'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((item, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#0f0f0f] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-bold text-[#444] border border-[#222] px-2 py-0.5 rounded-md uppercase tracking-wide">{item.category}</span>
                  <span className="text-sm font-medium text-white">{item.q}</span>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-[#444] flex-shrink-0 transition-transform ml-3', open === i && 'rotate-180')} />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-[#777] leading-relaxed border-t border-[#111] pt-4">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact direct */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Contact direct</p>
            <p className="text-xs text-[#555] mt-0.5">Pour toute demande urgente ou problème de compte</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <a href="mailto:contact@ecomstartprofits.com" className="text-[#D4AF37] hover:underline font-medium">
            contact@ecomstartprofits.com
          </a>
          <span className="text-[#444]">Réponse sous 24h</span>
        </div>
      </div>

      {/* Legal links */}
      <div className="flex flex-wrap gap-4 text-xs text-[#444] pt-2">
        <Link href="/legal/cgu" className="hover:text-[#D4AF37] transition-colors">Conditions d&apos;utilisation</Link>
        <Link href="/legal/privacy" className="hover:text-[#D4AF37] transition-colors">Politique de confidentialité</Link>
        <Link href="/legal/mentions" className="hover:text-[#D4AF37] transition-colors">Mentions légales</Link>
      </div>
    </div>
  )
}
