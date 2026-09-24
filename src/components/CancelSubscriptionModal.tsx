import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useUsage } from '../context/UsageContext'

interface CancelSubscriptionModalProps {
  onClose: () => void
}

function formatPeriodEnd(unix: number | null) {
  if (!unix) return 'the end of your billing period'
  return new Date(unix * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function CancelSubscriptionModal({ onClose }: CancelSubscriptionModalProps) {
  const { cancelAtPeriodEnd, currentPeriodEnd, refreshUsage } = useUsage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [scheduled, setScheduled] = useState(cancelAtPeriodEnd)
  const [periodEnd, setPeriodEnd] = useState(currentPeriodEnd)

  useEffect(() => {
    setScheduled(cancelAtPeriodEnd)
    setPeriodEnd(currentPeriodEnd)
  }, [cancelAtPeriodEnd, currentPeriodEnd])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, loading])

  async function callBilling(action: 'cancel' | 'resume') {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action }),
        },
      )

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error ?? `Request failed (${res.status})`)
      }

      setScheduled(Boolean(body.cancelAtPeriodEnd))
      setPeriodEnd(typeof body.currentPeriodEnd === 'number' ? body.currentPeriodEnd : periodEnd)
      setConfirming(false)
      refreshUsage()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const endLabel = formatPeriodEnd(periodEnd)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1c1d2e] border border-slate-200 dark:border-white/[0.08] shadow-2xl shadow-black/20 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-green-400 via-green-500 to-blue-600" />

        <div className="p-8">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-green-500/10 border border-blue-200 dark:border-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
          </div>

          <div className="text-center mb-7">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {scheduled ? 'Cancellation scheduled' : confirming ? 'Cancel Pro?' : 'Manage Pro'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {scheduled
                ? `Your Pro access continues until ${endLabel}. After that you will return to the Free plan.`
                : confirming
                ? `You will keep Pro until ${endLabel}. You can resume anytime before then.`
                : `You are on Pro. Billing renews on ${endLabel}.`}
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3">
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {scheduled ? (
              <button
                onClick={() => callBilling('resume')}
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-blue-600 px-6 py-3 text-sm font-bold text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/25"
              >
                {loading ? 'Updating...' : 'Keep Pro'}
              </button>
            ) : confirming ? (
              <button
                onClick={() => callBilling('cancel')}
                disabled={loading}
                className="w-full rounded-xl bg-red-500 px-6 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/25"
              >
                {loading ? 'Cancelling...' : 'Confirm cancellation'}
              </button>
            ) : (
              <button
                onClick={() => { setConfirming(true); setError(null) }}
                disabled={loading}
                className="w-full rounded-xl bg-red-500 px-6 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                Cancel subscription
              </button>
            )}

            <button
              onClick={confirming && !scheduled ? () => setConfirming(false) : onClose}
              disabled={loading}
              className="w-full rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.1] disabled:opacity-50 transition-all"
            >
              {confirming && !scheduled ? 'Go back' : 'Close'}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.07] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.12] disabled:opacity-50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
