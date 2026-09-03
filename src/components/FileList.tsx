import type { FileUploadItem } from '../types'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileTypeIcon({ type }: { type: string }) {
  if (type === 'application/pdf') {
    return (
      <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center shrink-0">
        <span className="text-red-600 dark:text-red-400 text-xs font-bold">PDF</span>
      </div>
    )
  }
  if (type === 'text/csv' || type === 'application/vnd.ms-excel') {
    return (
      <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
        <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">CSV</span>
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center shrink-0">
      <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">TXT</span>
    </div>
  )
}

function StatusBadge({ status }: { status: FileUploadItem['status'] }) {
  if (status === 'idle') return null
  if (status === 'uploading') {
    return (
      <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-green-400 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Uploading
      </span>
    )
  }
  if (status === 'success') {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Sent
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
      Failed
    </span>
  )
}

interface FileListProps {
  items: FileUploadItem[]
  onRemove: (id: string) => void
  onRetry: (id: string) => void
}

export function FileList({ items, onRemove, onRetry }: FileListProps) {
  if (items.length === 0) return null

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white dark:hover:bg-white/[0.05]"
        >
          <FileTypeIcon type={item.file.type} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.file.name}</p>
              <StatusBadge status={item.status} />
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">{formatBytes(item.file.size)}</p>

            {item.status === 'uploading' && (
              <div className="mt-2 w-full bg-slate-200 dark:bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            )}

            {item.status === 'error' && item.error && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1 truncate">{item.error}</p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {item.status === 'error' && (
              <button
                onClick={() => onRetry(item.id)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-blue-50 dark:hover:bg-green-500/10 transition-colors"
                title="Retry"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            {(item.status === 'idle' || item.status === 'error' || item.status === 'success') && (
              <button
                onClick={() => onRemove(item.id)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                title="Remove"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
