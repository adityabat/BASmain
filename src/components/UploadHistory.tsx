import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { UploadRecord } from '../types'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface UploadHistoryProps {
  refreshTrigger: number
  userId: string
}

export function UploadHistory({ refreshTrigger, userId }: UploadHistoryProps) {
  const [records, setRecords] = useState<UploadRecord[]>([])
  const [loading, setLoading] = useState(false)

  async function fetchHistory() {
    setLoading(true)
    const { data, error } = await supabase
      .from('upload_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) setRecords(data as UploadRecord[])
    setLoading(false)
  }

  useEffect(() => {
    fetchHistory()
  }, [refreshTrigger, userId])

  if (records.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <svg className="w-10 h-10 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg font-semibold text-slate-400 dark:text-slate-500">History</p>
        <p className="text-sm text-slate-400 dark:text-slate-600">Your conversation and upload history will appear here.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Upload History</h2>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-green-500 dark:hover:text-green-400 transition-colors disabled:opacity-40"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#171828] overflow-hidden shadow-sm dark:shadow-none">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wide">File</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wide">Size</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium max-w-[200px] truncate">{r.file_name}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-500 uppercase text-xs">{r.file_type.split('/').pop()}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-500">{formatBytes(r.file_size)}</td>
                  <td className="px-4 py-3">
                    {r.status === 'success' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                        Error
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 dark:text-slate-600 text-xs whitespace-nowrap">{formatDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
