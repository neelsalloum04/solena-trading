declare global {
  interface Window {
    fbq: (action: string, event: string, params?: Record<string, unknown>) => void
  }
}

export function fbq(action: string, event: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq(action, event, params)
  }
}
