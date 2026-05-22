'use client'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-[#ef4444]" />
        </div>
        <h2 className="text-white font-bold text-lg mb-2">Une erreur s&apos;est produite</h2>
        <p className="text-[#555] text-sm mb-6 leading-relaxed">
          {error.message || 'Une erreur inattendue est survenue sur cette page.'}
        </p>
        <button
          onClick={reset}
          className="flex items-center gap-2 mx-auto bg-[#D4AF37] text-[#080808] font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    </div>
  )
}
