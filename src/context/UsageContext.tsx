import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './AuthContext'

export const FREE_UPLOAD_LIMIT = 5
export const FREE_TRANSCRIPT_LIMIT = 3

/** This account is unlimited. Every other account, including new signups, stays on the free caps. */
const UNLIMITED_EMAIL = 'adityaba70@gmail.com'

function isUnlimitedAccount(email: string | undefined): boolean {
  return email?.toLowerCase() === UNLIMITED_EMAIL
}

export type Plan = 'free' | 'pro'

interface UsageContextValue {
  plan: Plan
  uploadCount: number
  transcriptCount: number
  uploadLimit: number
  transcriptLimit: number
  isUploadLimitReached: boolean
  isTranscriptLimitReached: boolean
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: number | null
  refreshUsage: () => void
}

const UsageContext = createContext<UsageContextValue>({
  plan: 'free',
  uploadCount: 0,
  transcriptCount: 0,
  uploadLimit: FREE_UPLOAD_LIMIT,
  transcriptLimit: FREE_TRANSCRIPT_LIMIT,
  isUploadLimitReached: false,
  isTranscriptLimitReached: false,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
  refreshUsage: () => {},
})

export function UsageProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const [plan, setPlan] = useState<Plan>('free')
  const [uploadCount, setUploadCount] = useState(0)
  const [transcriptCount, setTranscriptCount] = useState(0)
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false)
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<number | null>(null)

  const fetchUsage = useCallback(async (userId: string) => {
    const [planResult, uploadsResult, transcriptsResult, subResult] = await Promise.all([
      supabase
        .from('user_plans')
        .select('plan')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('upload_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('transcript_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('stripe_user_subscriptions')
        .select('cancel_at_period_end, current_period_end')
        .maybeSingle(),
    ])

    if (planResult.data) {
      setPlan(planResult.data.plan as Plan)
    } else {
      await supabase.from('user_plans').insert({ user_id: userId, plan: 'free' })
      setPlan('free')
    }

    setUploadCount(uploadsResult.count ?? 0)
    setTranscriptCount(transcriptsResult.count ?? 0)
    setCancelAtPeriodEnd(Boolean(subResult.data?.cancel_at_period_end))
    setCurrentPeriodEnd(subResult.data?.current_period_end ?? null)
  }, [])

  const refreshUsage = useCallback(() => {
    if (session?.user.id) fetchUsage(session.user.id)
  }, [session?.user.id, fetchUsage])

  useEffect(() => {
    if (!session?.user.id) {
      setPlan('free')
      setUploadCount(0)
      setTranscriptCount(0)
      setCancelAtPeriodEnd(false)
      setCurrentPeriodEnd(null)
      return
    }

    const userId = session.user.id
    const params = new URLSearchParams(window.location.search)

    if (params.get('upgrade') === 'success') {
      const clean = window.location.pathname + window.location.search.replace(/[?&]upgrade=success/, '').replace(/^&/, '?')
      window.history.replaceState(null, '', clean || window.location.pathname)

      let attempts = 0
      const poll = async () => {
        const { data } = await supabase
          .from('user_plans')
          .select('plan')
          .eq('user_id', userId)
          .maybeSingle()

        if (data?.plan === 'pro') {
          fetchUsage(userId)
        } else if (attempts < 8) {
          attempts++
          setTimeout(poll, 1000)
        } else {
          fetchUsage(userId)
        }
      }
      poll()
    } else {
      fetchUsage(userId)
    }
  }, [session?.user.id, fetchUsage])

  const unlimited = isUnlimitedAccount(session?.user.email)
  const uploadLimit = plan === 'pro' || unlimited ? Infinity : FREE_UPLOAD_LIMIT
  const transcriptLimit = plan === 'pro' || unlimited ? Infinity : FREE_TRANSCRIPT_LIMIT
  const isUploadLimitReached = !unlimited && plan === 'free' && uploadCount >= FREE_UPLOAD_LIMIT
  const isTranscriptLimitReached = !unlimited && plan === 'free' && transcriptCount >= FREE_TRANSCRIPT_LIMIT

  return (
    <UsageContext.Provider value={{
      plan,
      uploadCount,
      transcriptCount,
      uploadLimit,
      transcriptLimit,
      isUploadLimitReached,
      isTranscriptLimitReached,
      cancelAtPeriodEnd,
      currentPeriodEnd,
      refreshUsage,
    }}>
      {children}
    </UsageContext.Provider>
  )
}

export function useUsage() {
  return useContext(UsageContext)
}
