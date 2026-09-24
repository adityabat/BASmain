import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { FREE_UPLOAD_LIMIT, FREE_TRANSCRIPT_LIMIT } from '../context/UsageContext'

interface UpgradeModalProps {
  type: 'upload' | 'transcript'
  onClose: () => void
}

export function UpgradeModal({ type, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const label = type === 'upload' ? 'document uploads' : 'transcript extractions'
  const detail = type === 'upload'
    ? `You've used all ${FREE_UPLOAD_LIMIT} of your free document uploads.`
    : `You've used all ${FREE_TRANSCRIPT_LIMIT} of your free transcript extractions.`

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const checkoutUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`
      const res = await fetch(
        checkoutUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            successUrl: window.location.href + (window.location.href.includes('?') ? '&' : '?') + 'upgrade=success',
            cancelUrl: window.location.href,
          }),
        }
      )

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error ?? `Request failed (${res.status})`)
      }

      const { url } = body
      if (!url) throw new Error('No checkout URL returned')
      window.location.href = url
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1c1d2e] border border-slate-200 dark:border-white/[0.08] shadow-2xl shadow-black/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-green-400 via-green-500 to-blue-600" />

        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-green-500/10 border border-blue-200 dark:border-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="text-center mb-7">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Upgrade to Pro
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {detail}<br />
              Upgrade to Pro for <span className="font-semibold text-slate-700 dark:text-slate-300">unlimited {label}</span> and more.
            </p>
          </div>

          {/* Feature list */}
          <ul className="mb-7 space-y-2.5">
            {[
              'Unlimited document uploads',
              'Unlimited transcript extractions',
              'Priority processing',
              'Advanced AI features',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                <svg className="w-4 h-4 text-green-500 dark:text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3">
              <svg className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H2.645c-1.73 0-2.813-1.874-1.948-3.374L10.053 3.378c.866-1.5 3.032-1.5 3.898 0L21.948 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-green-500 to-blue-600 px-6 py-3 text-sm font-bold text-white hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Redirecting to checkout...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Upgrade to Pro
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.1] disabled:opacity-50 transition-all"
            >
              Maybe later
            </button>
          </div>
        </div>

        {/* Close button */}
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
