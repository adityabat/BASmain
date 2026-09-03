import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

const ACCEPTED_TYPES = {
  'text/plain': ['.txt'],
  'application/pdf': ['.pdf'],
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.csv'],
}

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void
  disabled?: boolean
}

export function DropZone({ onFilesAdded, disabled }: DropZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onFilesAdded(accepted)
    },
    [onFilesAdded]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    disabled,
    multiple: true,
  })

  return (
    <div
      {...getRootProps()}
      className={`
        relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed
        px-8 py-12 transition-all duration-200 cursor-pointer select-none
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${isDragReject
          ? 'border-red-400 bg-red-50 dark:bg-red-500/10'
          : isDragActive
          ? 'border-green-400 bg-blue-50 dark:bg-green-500/10 scale-[1.01]'
          : 'border-slate-300 dark:border-white/[0.1] bg-white dark:bg-white/[0.02] hover:border-green-400 dark:hover:border-green-500/40 hover:bg-blue-50/40 dark:hover:bg-green-500/5'
        }
      `}
    >
      <input {...getInputProps()} />

      <div className={`rounded-xl p-4 border transition-colors duration-200 ${
        isDragActive && !isDragReject
          ? 'bg-blue-100 dark:bg-green-500/15 border-blue-200 dark:border-green-500/30'
          : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08]'
      }`}>
        <svg
          className={`w-9 h-9 transition-colors duration-200 ${
            isDragActive && !isDragReject ? 'text-green-500 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
      </div>

      <div className="text-center">
        {isDragReject ? (
          <p className="text-red-500 dark:text-red-400 font-semibold text-sm">Only .txt, .pdf, and .csv files are accepted</p>
        ) : isDragActive ? (
          <p className="text-blue-600 dark:text-green-400 font-semibold text-base">Drop your files here</p>
        ) : (
          <>
            <p className="text-slate-700 dark:text-slate-300 font-semibold text-base">Drag & drop files here</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
              or <span className="text-green-500 dark:text-green-400 font-medium">browse to select</span>
            </p>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        {['.txt', '.pdf', '.csv'].map((ext) => (
          <span
            key={ext}
            className="rounded-full border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.04] px-3 py-0.5 text-xs font-medium text-slate-500 uppercase tracking-wide"
          >
            {ext}
          </span>
        ))}
      </div>
    </div>
  )
}
