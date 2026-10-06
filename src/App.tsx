import { useState, useCallback } from 'react'
import { DropZone } from './components/DropZone'
import { FileList } from './components/FileList'
import { UploadHistory } from './components/UploadHistory'
import { ChatWidget } from './components/ChatWidget'
import { TranscriptExtractor } from './components/TranscriptExtractor'
import { UpgradeModal } from './components/UpgradeModal'
import { CancelSubscriptionModal } from './components/CancelSubscriptionModal'
import { AuthPage } from './pages/AuthPage'
import { LandingPage } from './pages/LandingPage'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import { useUsage } from './context/UsageContext'
import { uploadFileToWebhook } from './uploadService'
import { supabase } from './supabase'
import type { FileUploadItem } from './types'

type Tab = 'chat' | 'transcripts' | 'upload' | 'history'

function generateId() {
  return Math.random().toString(36).slice(2)
}

export default function App() {
  const { session, loading, signOut, passwordRecovery } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const {
    plan,
    uploadCount,
    transcriptCount,
    uploadLimit,
    transcriptLimit,
    isUploadLimitReached,
    isTranscriptLimitReached,
    cancelAtPeriodEnd,
    refreshUsage,
  } = useUsage()
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [items, setItems] = useState<FileUploadItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [historyTick, setHistoryTick] = useState(0)
  const [upgradeModal, setUpgradeModal] = useState<'upload' | 'transcript' | null>(null)
  const [showManagePlan, setShowManagePlan] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')

  const updateItem = useCallback((id: string, patch: Partial<FileUploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }, [])

  const handleFilesAdded = useCallback((files: File[]) => {
    if (isUploadLimitReached) {
      setUpgradeModal('upload')
      return
    }
    const newItems: FileUploadItem[] = files.map((file) => ({
      id: generateId(),
      file,
      status: 'idle',
      progress: 0,
    }))
    setItems((prev) => [...prev, ...newItems])
  }, [isUploadLimitReached])

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }, [])

  async function uploadItem(item: FileUploadItem) {
    updateItem(item.id, { status: 'uploading', progress: 0, error: undefined })
    let status: 'success' | 'error' = 'success'
    let webhookResponse: string | undefined
    let errorMessage: string | undefined

    try {
      const response = await uploadFileToWebhook(item.file, (percent) => {
        updateItem(item.id, { progress: percent })
      }, session!.user.id)
      webhookResponse = response
      updateItem(item.id, { status: 'success', progress: 100, webhookResponse: response })
    } catch (err: unknown) {
      status = 'error'
      errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Upload failed. Please try again.'
      updateItem(item.id, { status: 'error', error: errorMessage })
    }

    await supabase.from('upload_history').insert({
      file_name: item.file.name,
      file_type: item.file.type || 'text/plain',
      file_size: item.file.size,
      status,
      webhook_response: webhookResponse ?? errorMessage ?? null,
      user_id: session!.user.id,
    })
  }

  async function handleUploadAll() {
    if (isUploadLimitReached) {
      setUpgradeModal('upload')
      return
    }
    const pending = items.filter((it) => it.status === 'idle' || it.status === 'error')
    if (pending.length === 0) return
    setIsUploading(true)
    await Promise.all(pending.map(uploadItem))
    setIsUploading(false)
    setHistoryTick((t) => t + 1)
    refreshUsage()
  }

  const handleRetry = useCallback(async (id: string) => {
    if (isUploadLimitReached) {
      setUpgradeModal('upload')
      return
    }
    const item = items.find((it) => it.id === id)
    if (!item) return
    setIsUploading(true)
    await uploadItem(item)
    setIsUploading(false)
    setHistoryTick((t) => t + 1)
    refreshUsage()
  }, [items, isUploadLimitReached])

  const pendingCount = items.filter((it) => it.status === 'idle' || it.status === 'error').length
  const allDone = items.length > 0 && items.every((it) => it.status === 'success')

  const username = session?.user.email?.split('@')[0] ?? ''

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'chat',
      label: 'Chat',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      id: 'transcripts',
      label: 'Transcripts',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.8 5 12 5 12 5s-4.8 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.2.9C6.8 19 12 19 12 19s4.8 0 7-.1c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM9.8 14.5V9l5.4 2.8-5.4 2.7z" />
        </svg>
      ),
    },
    {
      id: 'upload',
      label: 'Upload',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'History',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6fb] dark:bg-[#0f1017] flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      </div>
    )
  }

  if (!session) {
    if (showAuth) {
      return <AuthPage initialMode={authMode} onBack={() => setShowAuth(false)} />
    }
    return (
      <LandingPage
        onGetStarted={() => { setAuthMode('signup'); setShowAuth(true) }}
        onSignIn={() => { setAuthMode('login'); setShowAuth(true) }}
      />
    )
  }

  if (passwordRecovery) return <AuthPage />

  return (
    <div className="min-h-screen bg-[#f5f6fb] dark:bg-[#0f1017]">

      {/* Top Nav */}
      <header className="sticky top-0 z-20 bg-white dark:bg-[#171828] border-b border-slate-200 dark:border-white/[0.06] shadow-sm dark:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md shadow-blue-500/20">
              <img src="/images/Icon_2.png" alt="BAS Agentic logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">BAS Agentic</span>
              <span className="hidden lg:inline text-xs text-slate-400 dark:text-slate-500 ml-2 font-normal">Agents for Business, Applications and Solutions.</span>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="hidden md:flex items-center gap-8">
            <div className="text-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Documents Usage</p>
              <p className={`text-sm font-bold leading-tight ${
                isUploadLimitReached
                  ? 'text-red-500 dark:text-red-400'
                  : Number.isFinite(uploadLimit) && uploadCount >= uploadLimit - 1 && plan === 'free'
                  ? 'text-green-500 dark:text-green-400'
                  : 'text-slate-900 dark:text-white'
              }`}>
                {uploadCount} / {Number.isFinite(uploadLimit) ? uploadLimit : '∞'}
              </p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-white/[0.08]" />
            <div className="text-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Transcripts Usage</p>
              <p className={`text-sm font-bold leading-tight ${
                isTranscriptLimitReached
                  ? 'text-red-500 dark:text-red-400'
                  : Number.isFinite(transcriptLimit) && transcriptCount >= transcriptLimit - 1 && plan === 'free'
                  ? 'text-green-500 dark:text-green-400'
                  : 'text-slate-900 dark:text-white'
              }`}>
                {transcriptCount} / {Number.isFinite(transcriptLimit) ? transcriptLimit : '∞'}
              </p>
            </div>
          </div>

          {/* Right: User + Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
              <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">{username}</span>
            </div>

            {plan === 'pro' ? (
              <button
                type="button"
                onClick={() => setShowManagePlan(true)}
                title="Manage subscription"
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-green-400 to-blue-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm hover:opacity-90"
              >
                &#9889; {cancelAtPeriodEnd ? 'Pro · Cancels' : 'Pro'}
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-white/[0.08] border border-slate-200 dark:border-white/[0.1] px-2.5 py-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Free
              </span>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.07] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.12] transition-all"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-lg bg-red-500 hover:bg-red-600 active:bg-red-700 px-3 py-1.5 text-sm font-semibold text-white transition-all shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* Tab Bar */}
      <div className="sticky top-[60px] z-10 bg-white dark:bg-[#171828] border-b border-slate-200 dark:border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 py-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        <div hidden={activeTab !== 'chat'}>
          <ChatWidget key={session.user.id} userId={session.user.id} visible={activeTab === 'chat'} />
        </div>

        {activeTab === 'transcripts' && (
          <TranscriptExtractor
            userId={session.user.id}
            isLimitReached={isTranscriptLimitReached}
            onLimitReached={() => setUpgradeModal('transcript')}
            onTranscriptAdded={() => {
              setHistoryTick((t) => t + 1)
              refreshUsage()
            }}
          />
        )}

        {activeTab === 'upload' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#171828] p-6">
              <DropZone onFilesAdded={handleFilesAdded} disabled={isUploading} />

              {items.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {items.length} {items.length === 1 ? 'file' : 'files'} selected
                    </p>
                    {allDone && (
                      <button
                        onClick={() => setItems((p) => p.filter((it) => it.status !== 'success'))}
                        className="text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <FileList items={items} onRemove={handleRemove} onRetry={handleRetry} />
                </div>
              )}

              {pendingCount > 0 && (
                <button
                  onClick={handleUploadAll}
                  disabled={isUploading}
                  className="mt-5 w-full rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-green-500/20 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      Upload {pendingCount} {pendingCount === 1 ? 'file' : 'files'}
                    </>
                  )}
                </button>
              )}

              {allDone && items.length > 0 && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-3">
                  <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">All files sent successfully!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <UploadHistory key={session.user.id} refreshTrigger={historyTick} userId={session.user.id} />
        )}

      </main>

      {upgradeModal && (
        <UpgradeModal type={upgradeModal} onClose={() => setUpgradeModal(null)} />
      )}
      {showManagePlan && (
        <CancelSubscriptionModal onClose={() => setShowManagePlan(false)} />
      )}
    </div>
  )
}
