import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page introuvable — PrimeX',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-[#D4AF37] font-black text-7xl mb-6 leading-none">404</p>
        <h1 className="text-xl font-bold text-[#F2EDD7] mb-3">Page introuvable</h1>
        <p className="text-[#555] text-sm mb-8 leading-relaxed">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-[#D4AF37] text-[#080808] text-sm font-bold rounded-lg hover:bg-[#c9a430] transition-colors"
          >
            Tableau de bord
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 bg-transparent border border-[#222] text-[#888] text-sm font-medium rounded-lg hover:border-[#333] hover:text-[#F2EDD7] transition-colors"
          >
            Accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
