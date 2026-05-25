'use client'
import { createClient } from '@/lib/supabase/client'
import { createContext, useContext, useEffect, useState } from 'react'

interface TokenCtx {
  tokenBalance: number
  tokenLimit: number
}

const TokenContext = createContext<TokenCtx>({ tokenBalance: 5000, tokenLimit: 5000 })

export function TokenProvider({
  userId,
  initialBalance,
  initialLimit,
  children,
}: {
  userId: string
  initialBalance: number
  initialLimit: number
  children: React.ReactNode
}) {
  const [tokenBalance, setTokenBalance] = useState(initialBalance)
  const [tokenLimit]                    = useState(initialLimit)

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`tokens-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload: { new: Record<string, unknown> }) => {
          const bal = payload.new?.token_balance
          if (typeof bal === 'number') setTokenBalance(bal)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return (
    <TokenContext.Provider value={{ tokenBalance, tokenLimit }}>
      {children}
    </TokenContext.Provider>
  )
}

export function useTokens() {
  return useContext(TokenContext)
}
