import { useState } from 'react'
import { postAgentJson } from '../agentApi'
import { supabase } from '../supabase'

function isValidYouTubeUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?(youtube\.com\/watch\?.*v=|youtu\.be\/)[\w-]+/.test(url)
}

function parseTranscript(data: unknown): string {
  const pick = (obj: unknown): string | null => {
    if (!obj || typeof obj !== 'object') return null
    const o = obj as Record<string, unknown>
    if (typeof o.pageContent === 'string' && o.pageContent.trim()) return o.pageContent.trim()
    if (typeof o.text === 'string' && o.text.trim()) return o.text.trim()
    return null
  }

  if (typeof data === 'string') {
    const matches = [...data.matchAll(/\{[^{}]+\}/g)]
    const texts = matches
      .map((m) => { try { return pick(JSON.parse(m[0])) } catch { return null } })
      .filter(Boolean) as string[]
    if (texts.length) return texts.join(' ')
    return data
  }

  if (Array.isArray(data)) {
    const parts = data.map(pick).filter(Boolean) as string[]
    if (parts.length) return parts.join(' ')
  }

  const single = pick(data)
  if (single) return single

  return JSON.stringify(data, null, 2)
}

interface TranscriptExtractorProps {
  userId: string
  isLimitReached: boolean
  onLimitReached: () => void
  onTranscriptAdded?: () => void
}

export function TranscriptExtractor({ userId, isLimitReached, onLimitReached, onTranscriptAdded }: TranscriptExtractorProps) {
  const [videoUrl, setVideoUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [transcript, setTranscript] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleExtract() {
    if (isLimitReached) {
      onLimitReached()
      return
    }
    const trimmed = videoUrl.trim()
    if (!trimmed) return
    if (!isValidYouTubeUrl(trimmed)) {
      setStatus('error')
      setErrorMsg('Please enter a valid YouTube URL.')
      return
    }

    setStatus('loading')
    setTranscript(null)
    setErrorMsg(null)

    let resultStatus: 'success' | 'error' = 'success'
    let resultTranscript: string | null = null
    let resultError: string | null = null

    try {
      const data = await postAgentJson({ action: 'transcript', userId, videoUrl: trimmed })
      resultTranscript = parseTranscript(data)
      setTranscript(resultTranscript)
      setStatus('success')
    } catch (err: unknown) {
      resultStatus = 'error'
      if (err && typeof err === 'object' && 'message' in err) {
        resultError = (err as { message: string }).message
      } else {
        resultError = 'Failed to fetch transcript. Please try again.'
      }
      setErrorMsg(resultError)
      setStatus('error')
    }

    await supabase.from('transcript_history').insert({
      user_id: userId,
      video_url: trimmed,
      status: resultStatus,
      transcript: resultTranscript,
      error_message: resultError,
    })

    if (resultStatus === 'success') onTranscriptAdded?.()
  }

  function handleCopy() {
    if (transcript) navigator.clipboard.writeText(transcript)
  }

  function handleReset() {
    setVideoUrl('')
    setStatus('idle')
    setTranscript(null)
    setErrorMsg(null)
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#171828] p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center shrink-0">
          <svg className="w-[18px] h-[18px] text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.8 5 12 5 12 5s-4.8 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.2.9C6.8 19 12 19 12 19s4.8 0 7-.1c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM9.8 14.5V9l5.4 2.8-5.4 2.7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-tight">YouTube Transcript</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight mt-0.5">Extract transcript from any YouTube video</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => {
            setVideoUrl(e.target.value)
            if (status !== 'idle') handleReset()
            setVideoUrl(e.target.value)
          }}
          onKeyDown={(e) => e.key === 'Enter' && status !== 'loading' && handleExtract()}
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={status === 'loading'}
          className="flex-1 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.04] px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-400/20 dark:focus:ring-green-500/15 focus:border-green-400 dark:focus:border-green-500/40 focus:bg-white dark:focus:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />
        <button
          onClick={handleExtract}
          disabled={status === 'loading' || !videoUrl.trim()}
          className="shrink-0 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md shadow-green-500/20"
        >
          {status === 'loading' ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Fetching...
            </>
          ) : (
            'Extract'
          )}
        </button>
      </div>

      {status === 'error' && errorMsg && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3">
          <svg className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
        </div>
      )}

      {status === 'success' && transcript && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Transcript processed
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-green-500 dark:hover:text-green-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
              <button
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-[#0f1017] p-4 max-h-64 overflow-y-auto scrollbar-thin">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
              {transcript}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
