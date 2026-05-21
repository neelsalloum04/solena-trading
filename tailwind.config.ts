import type { Config } from 'tailwindcss'

// PrimeX gold/dark palette — used everywhere
const GOLD   = '#D4AF37'
const GOLD_L = '#F0CC55'
const GOLD_D = '#B8960C'
const SILVER = '#9EAAB8'
const BG     = '#080808'
const SURF   = '#0e0e0e'
const CARD   = '#141414'
const HOVER  = '#1a1a1a'
const BORDER = '#222222'
const LINE   = '#2e2e2e'
const TEXT   = '#F2EDD7'
const MUTED  = '#888888'
const DIM    = '#555555'
const GREEN  = '#22c55e'
const RED    = '#ef4444'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // New px-* system (new pages)
        px: {
          bg: BG, surface: SURF, card: CARD, hover: HOVER,
          border: BORDER, line: LINE,
          gold: GOLD, 'gold-light': GOLD_L, 'gold-dark': GOLD_D,
          silver: SILVER,
          text: TEXT, muted: MUTED, dim: DIM,
          green: GREEN, red: RED,
        },
        // Legacy solena-* aliases (keep existing pages working)
        solena: {
          bg:              BG,
          'bg-secondary':  SURF,
          card:            CARD,
          'card-hover':    HOVER,
          border:          BORDER,
          'border-light':  LINE,
          primary:         GOLD,
          'primary-dark':  GOLD_D,
          'primary-glow':  `rgba(212,175,55,0.15)`,
          secondary:       SILVER,
          'secondary-glow':`rgba(158,170,184,0.12)`,
          accent:          GOLD_L,
          text:            TEXT,
          'text-muted':    DIM,
          'text-secondary':MUTED,
          success:         GREEN,
          danger:          RED,
          warning:         GOLD_L,
          'danger-glow':   `rgba(239,68,68,0.15)`,
          'success-glow':  `rgba(34,197,94,0.15)`,
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'solena':    `0 0 30px rgba(212,175,55,0.12), 0 0 60px rgba(212,175,55,0.06)`,
        'solena-lg': `0 0 60px rgba(212,175,55,0.2),  0 0 120px rgba(212,175,55,0.08)`,
        'card':      '0 2px 16px rgba(0,0,0,0.6)',
        'card-hover':'0 6px 32px rgba(0,0,0,0.7)',
        'inner-glow':'inset 0 1px 0 rgba(255,255,255,0.04)',
        'gold-sm':   `0 0 12px rgba(212,175,55,0.15)`,
        'gold':      `0 0 24px rgba(212,175,55,0.2)`,
        'gold-lg':   `0 0 48px rgba(212,175,55,0.25)`,
      },
      backgroundImage: {
        'solena-gradient': `linear-gradient(135deg, ${GOLD} 0%, ${SILVER} 100%)`,
        'card-gradient':   `linear-gradient(135deg, ${CARD} 0%, ${SURF} 100%)`,
        'glow-gradient':   `radial-gradient(ellipse at top, rgba(212,175,55,0.05) 0%, transparent 60%)`,
      },
      animation: {
        'ticker':     'ticker 35s linear infinite',
        'ping-slow':  'ping 2.5s cubic-bezier(0,0,0.2,1) infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-up':    'fadeUp 0.4s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'spin-slow':  'spin 2s linear infinite',
      },
      keyframes: {
        ticker:  { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        fadeUp:  { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateX(-10px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
