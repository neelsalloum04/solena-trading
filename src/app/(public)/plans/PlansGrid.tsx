'use client'
import { PLANS } from '@/lib/stripe/client'
import { CheckCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function PlansGrid() {
  const [yearly, setYearly] = useState(false)

  return (
    <div className="space-y-8">
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-sm font-semibold ${!yearly ? 'text-white' : 'text-[#555]'}`}>Mensuel</span>
        <button
          onClick={() => setYearly(v => !v)}
          className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? 'bg-[#D4AF37]' : 'bg-[#333]'}`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${yearly ? 'translate-x-7' : 'translate-x-1'}`}
          />
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${yearly ? 'text-white' : 'text-[#555]'}`}>Annuel</span>
          <span className="text-[10px] font-bold text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2 py-0.5 rounded-full">
            Économisez jusqu&apos;à 409€
          </span>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Object.values(PLANS).map((p) => (
          <div
            key={p.plan}
            className={`relative p-6 rounded-xl border flex flex-col transition-colors ${
              p.highlighted
                ? 'bg-[#141414] border-[#D4AF37]/50'
                : 'bg-[#0e0e0e] border-[#222]'
            }`}
            style={{ borderColor: p.highlighted ? undefined : `${p.color}22` }}
          >
            {p.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span
                  className="text-[#080808] text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap"
                  style={{ backgroundColor: p.color }}
                >
                  {p.badge}
                </span>
              </div>
            )}

            <div className="mb-5">
              <p className="font-bold text-[#F2EDD7] mb-3">{p.name}</p>

              {yearly ? (
                <>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-black" style={{ color: p.color }}>
                      {p.yearlyMonthly}€
                    </span>
                    <span className="text-[#555] mb-1 text-sm">/mois</span>
                  </div>
                  <p className="text-[11px] text-[#444]">
                    Facturé <span className="text-[#555] font-semibold">{p.yearlyTotal}€/an</span>
                  </p>
                  <p className="text-[10px] text-[#22c55e] mt-0.5">
                    Économisez {p.yearlyDiscount}€ vs mensuel
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-black" style={{ color: p.color }}>
                      {p.monthlyPrice}€
                    </span>
                    <span className="text-[#555] mb-1 text-sm">/mois</span>
                  </div>
                  <p className="text-[11px] text-[#444]">
                    ou <span className="text-[#22c55e] font-semibold">{p.yearlyMonthly}€/mois</span> en annuel
                  </p>
                </>
              )}
            </div>

            <ul className="space-y-2.5 mb-6 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-[#888]">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: p.color }} />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                p.highlighted
                  ? 'bg-[#D4AF37] text-[#080808] hover:bg-[#B8960C]'
                  : 'border border-[#333] text-[#F2EDD7] hover:border-[#D4AF37]/40 hover:text-[#D4AF37]'
              }`}
            >
              Commencer <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
