'use client'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import React from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-solena-bg',
  {
    variants: {
      variant: {
        primary:   'bg-solena-primary text-solena-bg hover:bg-solena-primary-dark shadow-solena hover:shadow-solena-lg focus:ring-solena-primary/50',
        secondary: 'bg-transparent border border-solena-border text-solena-text hover:bg-solena-card hover:border-solena-border-light focus:ring-solena-border',
        ghost:     'bg-transparent text-solena-text-muted hover:text-solena-text hover:bg-solena-card focus:ring-solena-border',
        danger:    'bg-solena-danger/10 border border-solena-danger/20 text-solena-danger hover:bg-solena-danger/20 focus:ring-solena-danger/50',
        success:   'bg-solena-success/10 border border-solena-success/20 text-solena-success hover:bg-solena-success/20 focus:ring-solena-success/50',
        gradient:  'bg-gradient-to-r from-solena-primary to-solena-secondary text-white hover:opacity-90 focus:ring-solena-primary/50',
      },
      size: {
        sm:   'px-3 py-1.5 text-xs rounded-lg',
        md:   'px-5 py-2.5 text-sm rounded-xl',
        lg:   'px-7 py-3.5 text-base rounded-xl',
        xl:   'px-10 py-4 text-lg rounded-2xl',
        icon: 'p-2 rounded-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {/*
        Loader2 is ALWAYS in the DOM — never conditionally mounted.
        Visibility is controlled only via CSS classes (no insertBefore call).
        This prevents the React reconciler crash caused by browser extensions
        (LastPass, Grammarly…) injecting nodes that shift expected DOM positions.
      */}
      <Loader2
        aria-hidden="true"
        className={cn(
          'shrink-0 transition-all duration-200',
          loading
            ? 'w-4 h-4 animate-spin opacity-100 mr-2'
            : 'w-0 h-4 opacity-0 overflow-hidden mr-0'
        )}
      />
      {children}
    </button>
  )
)
Button.displayName = 'Button'
