import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide border',
  {
    variants: {
      variant: {
        buy: 'bg-solena-success/10 text-solena-success border-solena-success/20',
        sell: 'bg-solena-danger/10 text-solena-danger border-solena-danger/20',
        neutral: 'bg-solena-text-muted/10 text-solena-text-muted border-solena-text-muted/20',
        active: 'bg-solena-primary/10 text-solena-primary border-solena-primary/20',
        warning: 'bg-solena-accent/10 text-solena-accent border-solena-accent/20',
        premium: 'bg-gradient-to-r from-solena-primary/20 to-solena-secondary/20 text-solena-primary border-solena-primary/20',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
)

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />
}
