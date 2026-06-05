declare global {
  interface Window {
    fbq: (action: string, event: string, params?: Record<string, unknown>) => void
  }
}

export function fbq(action: string, event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return

  if (typeof window.fbq === 'function') {
    window.fbq(action, event, params)
    return
  }

  // Pixel pas encore chargé — on réessaie toutes les 100ms pendant 5s
  const start = Date.now()
  const interval = setInterval(() => {
    if (typeof window.fbq === 'function') {
      clearInterval(interval)
      window.fbq(action, event, params)
    } else if (Date.now() - start > 5000) {
      clearInterval(interval)
    }
  }, 100)
}
