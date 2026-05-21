import { TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RiskBannerProps {
  variant?: 'compact' | 'full'
  className?: string
}

export function RiskBanner({ variant = 'full', className }: RiskBannerProps) {
  if (variant === 'compact') {
    return (
      <p className={cn('text-center text-[10px] text-[#555] leading-relaxed', className)}>
        ⚠ Contenu éducatif uniquement — pas un conseil en investissement. Le trading comporte un risque de perte en capital.
      </p>
    )
  }

  return (
    <div className={cn(
      'flex items-start gap-3 bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-xl p-3.5',
      className
    )}>
      <TriangleAlert className="w-3.5 h-3.5 text-[#D4AF37]/70 flex-shrink-0 mt-0.5" />
      <p className="text-[11px] text-[#666] leading-relaxed">
        <span className="font-semibold text-[#D4AF37]/80">Avertissement :</span> Cet outil est éducatif et d'aide à la décision. Il ne constitue pas un conseil en investissement. Toute idée de trade présentée peut être erronée — les marchés financiers comportent un risque de perte en capital, potentiellement totale. Ne tradez jamais plus que ce que vous pouvez vous permettre de perdre.
      </p>
    </div>
  )
}
