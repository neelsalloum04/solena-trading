'use client'
import { PLANS } from '@/lib/stripe/client'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useState } from 'react'

export function PlansGrid() {
  const [yearly, setYearly] = useState(false)

  return (
    <div className="space-y-10">

      {/* ── Billing tabs ── */}
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex bg-[#0c0c0c] border border-[#1e1e1e] rounded-2xl p-1 gap-1">
          <button
            onClick={() => setYearly(false)}
            className={cn(
              'px-6 py-2.5 rounded-xl text-sm font-semibold transition-all',
              !yearly ? 'bg-white text-[#080808] shadow' : 'text-[#555] hover:text-[#999]'
            )}
          >
            Mensuel
          </button>
          <button
            onClick={() => setYearly(true)}
            className={cn(
              'px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2',
              yearly ? 'bg-[#D4AF37] text-[#080808] shadow' : 'text-[#555] hover:text-[#999]'
            )}
          >
            Annuel
            <span className={cn(
              'text-[9px] font-black px-1.5 py-0.5 rounded-full',
              yearly ? 'bg-[#00000020] text-[#080808]' : 'bg-[#22c55e]/15 text-[#22c55e]'
            )}>
              −409€
            </span>
          </button>
        </div>
        <p className={cn('text-[11px] text-[#444] transition-opacity', yearly ? 'opacity-100' : 'opacity-0')}>
          Facturé en une fois · Économie directe sur l&apos;année
        </p>
      </div>

      {/* ── Plans ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Object.values(PLANS).map((p) => {
          const price     = yearly ? p.yearlyMonthly : String(p.monthlyPrice)
          const sublabel  = yearly ? `${p.yearlyTotal} € / an` : `ou ${p.yearlyMonthly} €/mois en annuel`

          return (
            <div
              key={p.plan}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6 transition-all',
                p.highlighted
                  ? 'bg-[#141414] border-[#D4AF37]/40 shadow-2xl shadow-[#D4AF37]/5'
                  : 'bg-[#0c0c0c] border-[#1c1c1c]'
              )}
            >
              {/* Badge */}
              {p.badge ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span
                    className="text-[#080808] text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap uppercase tracking-wider"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.badge}
                  </span>
                </div>
              ) : (
                <div className="h-0" />
              )}

              {/* Name */}
              <p className="text-[11px] font-black uppercase tracking-widest mb-3 mt-1" style={{ color: p.color }}>
                {p.name}
              </p>

              {/* Price block — DOM stable, seules les valeurs changent */}
              <div className="mb-4">
                <div className="flex items-end gap-1 leading-none mb-1">
                  <span className="text-[2.6rem] font-black text-white leading-none">{price}</span>
                  <span className="text-[#444] text-sm pb-1">€/mois</span>
                </div>
                <p className="text-[11px] text-[#3a3a3a]">{sublabel}</p>
                <p className={cn(
                  'text-[10px] font-semibold mt-1 transition-opacity',
                  yearly ? 'text-[#22c55e] opacity-100' : 'opacity-0'
                )}>
                  Économie de {p.yearlyDiscount} € / an
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-[#191919] mb-5" />

              {/* Features */}
              <ul className="space-y-3 flex-1 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px] text-[#666] leading-snug">
                    <span
                      className="w-4 h-4 flex-shrink-0 mt-0.5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${p.color}18` }}
                    >
                      <Check className="w-2.5 h-2.5" style={{ color: p.color }} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/register"
                className={cn(
                  'flex items-center justify-center gap-1.5 w-full py-3 rounded-xl text-sm font-bold transition-all',
                  p.highlighted
                    ? 'bg-[#D4AF37] text-[#080808] hover:brightness-110'
                    : 'border border-[#242424] text-[#ccc] hover:text-white hover:border-[#383838] hover:bg-[#111]'
                )}
              >
                Commencer <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
