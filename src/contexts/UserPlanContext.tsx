'use client'
import { createContext, useContext } from 'react'
import { hasAccess, type PlanId } from '@/lib/plans'

interface UserPlanCtx {
  plan: PlanId
  isAdmin: boolean
  isPremium: boolean
  isPro: boolean
  isStarter: boolean
  canAccess: (required: PlanId) => boolean
}

const UserPlanContext = createContext<UserPlanCtx>({
  plan: 'free',
  isAdmin: false,
  isPremium: false,
  isPro: false,
  isStarter: false,
  canAccess: () => false,
})

export function UserPlanProvider({
  plan,
  children,
}: {
  plan: PlanId
  children: React.ReactNode
}) {
  const value: UserPlanCtx = {
    plan,
    isAdmin:   plan === 'admin',
    isPremium: hasAccess(plan, 'premium'),
    isPro:     hasAccess(plan, 'pro'),
    isStarter: hasAccess(plan, 'starter'),
    canAccess: (required) => hasAccess(plan, required),
  }
  return <UserPlanContext.Provider value={value}>{children}</UserPlanContext.Provider>
}

export function useUserPlan() {
  return useContext(UserPlanContext)
}
