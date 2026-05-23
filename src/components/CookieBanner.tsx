'use client'
import { cn } from '@/lib/utils'
import { Cookie, ExternalLink, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const COOKIE_KEY = 'primex_cookie_consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_KEY)
      if (!stored) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const save = (choice: 'accepted' | 'refused') => {
    try { localStorage.setItem(COOKIE_KEY, choice) } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-5',
      'flex items-end justify-center',
    )}>
      <div className="w-full max-w-3xl bg-[#0e0e0e] border border-[#2a2a2a] rounded-2xl shadow-2xl shadow-black/60 p-5 md:p-6">
        <div className="flex items-start gap-4">

          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Cookie className="w-5 h-5 text-[#D4AF37]" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white mb-1">
              Nous utilisons des cookies
            </p>
            <p className="text-xs text-[#666] leading-relaxed">
              PrimeX utilise des cookies essentiels au fonctionnement de la plateforme (authentification, session) et des cookies analytiques pour améliorer votre expérience. Aucune donnée n&apos;est vendue à des tiers.{' '}
              <Link href="/legal/privacy" className="text-[#D4AF37] hover:underline inline-flex items-center gap-0.5">
                Politique de confidentialité <ExternalLink className="w-3 h-3" />
              </Link>
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => save('accepted')}
                className="bg-[#D4AF37] text-[#080808] text-xs font-bold px-5 py-2 rounded-xl hover:opacity-90 transition-opacity"
              >
                Accepter tout
              </button>
              <button
                onClick={() => save('refused')}
                className="bg-[#141414] border border-[#2a2a2a] text-[#888] text-xs font-medium px-5 py-2 rounded-xl hover:text-white hover:border-[#444] transition-colors"
              >
                Continuer sans accepter
              </button>
              <Link href="/legal/privacy">
                <button className="text-[#555] text-xs px-3 py-2 hover:text-[#888] transition-colors">
                  En savoir plus
                </button>
              </Link>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={() => save('refused')}
            className="text-[#444] hover:text-[#888] transition-colors flex-shrink-0 p-1"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

        </div>
      </div>
    </div>
  )
}
