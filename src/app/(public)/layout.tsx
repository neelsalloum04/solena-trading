import Link from 'next/link'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080808]">
      <header className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-black text-[#D4AF37] text-lg tracking-tight">PrimeX</Link>
          <div className="flex items-center gap-4">
            <Link href="/plans" className="text-xs text-[#D4AF37] font-medium hover:underline">
              Tarifs
            </Link>
            <Link href="/dashboard" className="text-xs text-[#555] hover:text-[#F2EDD7] transition-colors">
              Retour à l&apos;app →
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-12">
        {children}
      </main>
      <footer className="border-t border-[#1a1a1a] mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-wrap gap-4 text-[10px] text-[#444]">
          <Link href="/legal/cgu" className="hover:text-[#666]">CGU</Link>
          <Link href="/legal/privacy" className="hover:text-[#666]">Confidentialité</Link>
          <Link href="/legal/mentions" className="hover:text-[#666]">Mentions légales</Link>
          <Link href="/legal/cgv" className="hover:text-[#666]">CGV</Link>
          <span className="ml-auto">© {new Date().getFullYear()} PrimeX — Tous droits réservés</span>
        </div>
      </footer>
    </div>
  )
}
