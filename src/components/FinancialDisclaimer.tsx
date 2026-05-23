'use client'
import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'

interface FinancialDisclaimerProps {
  dismissible?: boolean
  compact?: boolean
}

const DISCLAIMER_TEXT =
  "Les informations fournies sur cette plateforme sont destinées exclusivement à des fins éducatives et informatives. Elles ne constituent en aucun cas un conseil en investissement, une recommandation financière ou une incitation à acheter ou vendre un actif. Le trading comporte des risques importants de perte en capital. Chaque utilisateur reste entièrement responsable de ses décisions financières et de ses investissements."

export function FinancialDisclaimer({ dismissible = false, compact = false }: FinancialDisclaimerProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  if (compact) {
    return (
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#1a1a1a]">
        <AlertTriangle className="w-3 h-3 text-[#D4AF37] flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-[#444] leading-relaxed">{DISCLAIMER_TEXT}</p>
        {dismissible && (
          <button onClick={() => setDismissed(true)} className="flex-shrink-0 text-[#333] hover:text-[#666]">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 px-4 py-4 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/20">
      <AlertTriangle className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-[11px] font-bold text-[#D4AF37] mb-1 uppercase tracking-wide">Avertissement financier</p>
        <p className="text-[11px] text-[#666] leading-relaxed">{DISCLAIMER_TEXT}</p>
      </div>
      {dismissible && (
        <button onClick={() => setDismissed(true)} className="flex-shrink-0 text-[#444] hover:text-[#666] transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
