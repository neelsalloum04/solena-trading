import { CookieBanner } from '@/components/CookieBanner'
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PrimeX IA :Trading Institutionnel Propulsé par l\'IA',
  description: 'Plateforme de trading IA avec signaux en temps réel, bots automatisés et analyse de marché de niveau institutionnel.',
  keywords: 'trading IA, signaux trading, trading automatisé, forex, crypto, analyse de marché',
  icons: {
    icon: '/primex-logo-dark.webp',
    apple: '/primex-logo-dark.webp',
  },
  openGraph: {
    title: 'PrimeX IA :Trading Institutionnel Propulsé par l\'IA',
    description: 'Tradez comme un hedge fund. Signaux IA, bots automatisés, analyse experte.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" translate="no" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning>
        {children}
        <CookieBanner />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#141414',
              color: '#F2EDD7',
              border: '1px solid #222',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#141414' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#141414' },
            },
          }}
        />
      </body>
    </html>
  )
}
