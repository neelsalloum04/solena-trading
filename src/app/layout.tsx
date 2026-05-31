import { CookieBanner } from '@/components/CookieBanner'
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
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

        {/* TikTok Pixel */}
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
            var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
            ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
              ttq.load('D8DNT8RC77UANKFS6080');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>

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
