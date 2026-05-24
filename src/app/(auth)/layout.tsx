import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080808] flex">

      {/* Panel gauche */}
      <div className="hidden lg:flex flex-col w-[420px] flex-shrink-0 bg-[#0a0a0a] border-r border-[#1a1a1a] relative overflow-hidden">
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-grid opacity-100 pointer-events-none" />
        {/* Ambient */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#D4AF37]/4 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-14">
            <Image
              src="/primex-logo-dark.webp"
              alt="PrimeX"
              width={38}
              height={38}
              className="rounded-xl"
            />
            <span className="font-black text-xl text-[#D4AF37] tracking-tight">PrimeX</span>
            <span className="text-[10px] font-semibold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-1.5 py-0.5 rounded">IA</span>
          </Link>

          {/* Headline */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-[#F2EDD7] leading-snug mb-3">
              Tradez Comme un<br />
              <span className="text-[#D4AF37]">Hedge Fund</span>
            </h1>
            <p className="text-[#666] text-sm leading-relaxed mb-10">
              Signaux IA institutionnels, bots automatisés et<br />
              analyse de marché — tout en une plateforme.
            </p>

            <ul className="space-y-3 mb-12">
              {[
                '73%+ de taux de réussite sur les signaux IA',
                'Bot de trading automatisé 24h/24',
                'Forex, Crypto, Indices, Actions',
                'Sécurité et chiffrement niveau bancaire',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-[#888]">
                  <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            {/* Stats */}
            <div className="flex items-center gap-6 pt-8 border-t border-[#1a1a1a]">
              {[
                { v: '2,4 Md€+', l: 'Volume' },
                { v: '18 000+', l: 'Traders' },
                { v: '73.2%',   l: 'Win Rate' },
              ].map((s, i) => (
                <div key={s.l} className={i > 0 ? 'border-l border-[#1a1a1a] pl-6' : ''}>
                  <p className="text-lg font-bold text-[#D4AF37]">{s.v}</p>
                  <p className="text-[11px] text-[#555]">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Panel droit */}
      <div className="flex-1 flex items-center justify-center p-8">
        {children}
      </div>
    </div>
  )
}
