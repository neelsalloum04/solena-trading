'use client'
import { cn } from '@/lib/utils'
import { ChevronDown, ExternalLink, HelpCircle, Mail, MessageSquare, Shield } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const FAQ: { q: string; a: string; category: string }[] = [
  // Abonnements
  {
    category: 'Abonnements',
    q: 'Comment fonctionne la facturation ?',
    a: 'La facturation est mensuelle et se renouvelle automatiquement à la date anniversaire de votre abonnement. Vous recevez une confirmation par email avant chaque renouvellement.',
  },
  {
    category: 'Abonnements',
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui, vous pouvez annuler votre abonnement à tout moment depuis Paramètres → Abonnement. L\'annulation prend effet à la fin de la période en cours. Vous conservez l\'accès jusqu\'à cette date.',
  },
  {
    category: 'Abonnements',
    q: 'Puis-je changer de forfait en cours de mois ?',
    a: 'Oui. Un upgrade est effectif immédiatement avec facturation au prorata. Un downgrade prend effet au prochain cycle de facturation.',
  },
  {
    category: 'Abonnements',
    q: 'Acceptez-vous des remboursements ?',
    a: 'Les abonnements ne sont généralement pas remboursables pour les périodes partielles. En cas de problème technique avéré de notre côté, contactez notre support pour une solution au cas par cas.',
  },
  // Analyse IA
  {
    category: 'Analyse IA',
    q: 'Quels types de graphiques puis-je analyser ?',
    a: 'PrimeX accepte les captures d\'écran de graphiques depuis TradingView, MT4, MT5, Binance, Bybit, cTrader et toute autre plateforme. L\'image doit clairement montrer les chandeliers, le cours et idéalement des niveaux de support/résistance.',
  },
  {
    category: 'Analyse IA',
    q: 'Combien d\'analyses puis-je effectuer ?',
    a: 'Starter : 3 analyses/jour. Pro : 50 analyses/jour. Prime : illimité. Les quotas se réinitialisent chaque jour à minuit (UTC).',
  },
  {
    category: 'Analyse IA',
    q: 'L\'IA peut-elle se tromper dans ses analyses ?',
    a: 'Oui, absolument. Les analyses IA sont fournies à titre informatif et éducatif uniquement. Elles ne constituent pas des conseils financiers. Effectuez toujours votre propre analyse avant de prendre une décision.',
  },
  // Signaux
  {
    category: 'Signaux',
    q: 'D\'où proviennent les signaux ?',
    a: 'Les signaux sont générés par notre moteur IA qui analyse en temps réel plusieurs indicateurs techniques (RSI, MACD, Bollinger, volume, niveaux clés) sur plusieurs marchés. Ils sont mis à jour toutes les 5 minutes.',
  },
  {
    category: 'Signaux',
    q: 'Les signaux sont-ils fiables à 100% ?',
    a: 'Non. Aucun signal ne garantit un résultat. Le taux de confiance indiqué reflète la conviction algorithmique, pas une probabilité de succès garantie. Utilisez les signaux comme un outil d\'aide à la décision, pas comme une instruction d\'achat.',
  },
  // Bot
  {
    category: 'Bot de trading',
    q: 'Le bot utilise-t-il de vrais fonds ?',
    a: 'Le mode Paper Trading simule des transactions avec des prix réels mais sans fonds réels — idéal pour tester. Le mode Live exécute de vraies ordres sur votre compte Binance. Ce mode n\'est disponible qu\'avec une clé API Binance et le forfait Prime.',
  },
  {
    category: 'Bot de trading',
    q: 'Comment connecter Binance en toute sécurité ?',
    a: 'Créez une clé API dédiée dans Binance avec uniquement les permissions « Spot Trading ». N\'activez jamais le retrait dans les permissions. Utilisez des restrictions IP pour plus de sécurité.',
  },
  // Technique
  {
    category: 'Technique',
    q: 'L\'application fonctionne-t-elle sur mobile ?',
    a: 'Oui, PrimeX est entièrement responsive et optimisée pour mobile, tablette et desktop. Une application native (iOS/Android) est prévue prochainement.',
  },
  {
    category: 'Technique',
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Oui. Toutes les communications sont chiffrées via TLS. Les clés API broker sont stockées de manière sécurisée. PrimeX ne stocke jamais vos données bancaires (gérées par Stripe). Consultez notre Politique de Confidentialité pour les détails.',
  },
]

const CATEGORIES = ['Tous', ...Array.from(new Set(FAQ.map(f => f.category)))]

export default function SupportPage() {
  const [open, setOpen] = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState('Tous')
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const filtered = FAQ.filter(f => activeCategory === 'Tous' || f.category === activeCategory)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Centre d&apos;aide</h1>
        <p className="text-sm text-[#555]">Trouvez des réponses à vos questions ou contactez notre équipe.</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: <MessageSquare className="w-5 h-5" />, title: 'Chat IA', desc: 'Posez vos questions au chat', href: '/chat', color: 'text-[#818cf8]', bg: 'bg-[#818cf8]/10', border: 'border-[#818cf8]/20' },
          { icon: <Shield className="w-5 h-5" />, title: 'Politique de confidentialité', desc: 'Vos données & RGPD', href: '/legal/privacy', color: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10', border: 'border-[#22c55e]/20' },
          { icon: <ExternalLink className="w-5 h-5" />, title: 'CGU', desc: 'Conditions d\'utilisation', href: '/legal/cgu', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10', border: 'border-[#D4AF37]/20' },
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

      {/* FAQ */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Questions fréquentes</h2>
        </div>

        {/* Category filter */}
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

      {/* Contact form */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Mail className="w-4 h-4 text-[#D4AF37]" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Contacter le support</h2>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-5 h-5 text-[#22c55e]" />
            </div>
            <p className="text-white font-bold mb-1">Message envoyé !</p>
            <p className="text-[#555] text-sm">Nous vous répondrons sous 24h à l&apos;adresse indiquée.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#555] mb-1.5 block">Votre nom</label>
                <input
                  required
                  value={contactForm.name}
                  onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Jean Dupont"
                  className="w-full bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#D4AF37]/40 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-[#555] mb-1.5 block">Email</label>
                <input
                  required
                  type="email"
                  value={contactForm.email}
                  onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="jean@email.com"
                  className="w-full bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#D4AF37]/40 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#555] mb-1.5 block">Sujet</label>
              <select
                required
                value={contactForm.subject}
                onChange={e => setContactForm(p => ({ ...p, subject: e.target.value }))}
                className="w-full bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40 transition-colors"
              >
                <option value="">Sélectionnez un sujet</option>
                <option value="billing">Facturation / Abonnement</option>
                <option value="technical">Problème technique</option>
                <option value="analysis">Analyse IA / Signaux</option>
                <option value="bot">Bot de trading</option>
                <option value="account">Compte utilisateur</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#555] mb-1.5 block">Message</label>
              <textarea
                required
                rows={5}
                value={contactForm.message}
                onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                placeholder="Décrivez votre problème ou question en détail…"
                className="w-full bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#D4AF37]/40 transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#D4AF37] text-[#080808] font-bold text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              <Mail className="w-4 h-4" />
              Envoyer le message
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-[#111] flex flex-wrap gap-4 text-xs text-[#444]">
          <span>Email direct : <a href="mailto:support@primex.ai" className="text-[#D4AF37] hover:underline">support@primex.ai</a></span>
          <span>Temps de réponse moyen : <span className="text-[#888]">&lt; 24h</span></span>
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
