'use client'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error?.message)
  }, [error])

  // ChunkLoadError = navigateur a d'anciens bundles JS (après un déploiement Vercel)
  // → rechargement automatique pour récupérer les nouveaux chunks
  const isChunkError =
    error?.message?.includes('ChunkLoadError') ||
    error?.message?.includes('Loading chunk') ||
    error?.message?.includes('Loading CSS chunk') ||
    error?.name === 'ChunkLoadError'

  if (isChunkError) {
    if (typeof window !== 'undefined') window.location.reload()
    return null
  }

  return (
    <html lang="fr">
      <body style={{ background: '#080808', margin: 0, fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 380, padding: '32px 24px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 style={{ color: '#F2EDD7', fontWeight: 800, fontSize: 18, margin: '0 0 10px' }}>
            Une erreur s&apos;est produite
          </h2>
          <p style={{ color: '#555', fontSize: 13, lineHeight: 1.7, margin: '0 0 28px' }}>
            La page a rencontré un problème inattendu.
            Rafraîchis pour continuer, tes données sont sauvegardées.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#D4AF37', color: '#080808', border: 'none',
                borderRadius: 12, padding: '10px 22px',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              Rafraîchir la page
            </button>
            <button
              onClick={reset}
              style={{
                background: 'transparent', color: '#666',
                border: '1px solid #222', borderRadius: 12, padding: '10px 22px',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}
            >
              Réessayer
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
