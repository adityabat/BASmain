import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { postAgentJson } from '../agentApi'
import { downloadChatResponse, downloadReport } from '../chatDocument'
import { readStoredMessages, writeStoredMessages, type StoredMessage } from '../chatStorage'

function getSessionId(): string {
  const stored = localStorage.getItem('chat_session_id')
  if (stored) return stored
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const id = Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  localStorage.setItem('chat_session_id', id)
  return id
}

type Message = StoredMessage

interface ChatWidgetProps {
  userId: string
  visible: boolean
}

export function ChatWidget({ userId, visible }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>(() => readStoredMessages(userId))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saveErrorId, setSaveErrorId] = useState<string | null>(null)
  const [reportKind, setReportKind] = useState<'chat' | 'executive' | 'business' | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)
  const [sessionId] = useState<string>(getSessionId)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    writeStoredMessages(userId, messages)
  }, [messages, userId])

  useEffect(() => {
    if (!visible) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, visible])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const data = await postAgentJson({ action: 'chat', chatInput: text, sessionId, userId })
      const payload = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
      const reply = [payload?.output, payload?.message, payload?.text, payload?.response]
        .find((value): value is string => typeof value === 'string')
        ?? JSON.stringify(payload)

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: reply }])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', text: `Error: ${message}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const canReport = messages.some((item) => item.role === 'assistant') && !reportKind

  function transcriptOfChat() {
    return messages.map((item) => `## ${item.role === 'user' ? 'You' : 'Assistant'}\n${item.text}`).join('\n\n')
  }

  async function createReport(kind: 'chat' | 'executive' | 'business') {
    if (!canReport) return
    setReportKind(kind)
    setReportError(null)
    const transcript = transcriptOfChat()
    try {
      if (kind === 'chat') {
        await downloadReport('Chat Report', transcript, 'chat-report.docx')
        return
      }
      const data = await postAgentJson({ action: 'report', reportType: kind, transcript })
      const payload = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
      const text = typeof payload?.output === 'string' ? payload.output : ''
      if (!text) throw new Error('The report came back empty.')
      const title = kind === 'executive' ? 'Executive Report' : 'Business Report'
      await downloadReport(title, text, `${kind}-report.docx`)
    } catch (err: unknown) {
      setReportError(err instanceof Error ? err.message : 'Could not create that report.')
    } finally {
      setReportKind(null)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#171828] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-green-500/10 border border-blue-200 dark:border-green-500/20 flex items-center justify-center shrink-0">
          <svg className="w-[18px] h-[18px] text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">Chat Assistant</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight mt-0.5">Ask questions about your workflow</p>
        </div>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto scrollbar-thin px-5 py-4 flex flex-col gap-3 bg-slate-50 dark:bg-[#0f1017]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-slate-400 dark:text-slate-500">How can I help you today?</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words ${
                msg.role === 'user'
                  ? 'bg-green-500 text-white rounded-br-sm'
                  : 'bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 rounded-bl-sm shadow-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <p className="font-bold text-base mb-1">{children}</p>,
                    h2: ({ children }) => <p className="font-bold mb-1">{children}</p>,
                    h3: ({ children }) => <p className="font-semibold mb-0.5">{children}</p>,
                    p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
                    li: ({ children }) => <li>{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    code: ({ children }) => <code className="bg-slate-100 dark:bg-white/[0.08] rounded px-1 text-xs font-mono text-blue-600 dark:text-blue-300">{children}</code>,
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>
            {msg.role === 'assistant' && (
              <button
                type="button"
                disabled={savingId === msg.id}
                onClick={() => {
                  const question = [...messages.slice(0, index)].reverse().find((item) => item.role === 'user')?.text
                  setSavingId(msg.id)
                  setSaveErrorId(null)
                  downloadChatResponse(question, msg.text)
                    .then(() => setSaveErrorId((current) => (current === msg.id ? null : current)))
                    .catch(() => setSaveErrorId(msg.id))
                    .finally(() => setSavingId((current) => (current === msg.id ? null : current)))
                }}
                className="mt-1 ml-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 disabled:opacity-50"
              >
                {savingId === msg.id ? 'Saving…' : saveErrorId === msg.id ? 'Try Word again' : 'Word'}
              </button>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-white/[0.06] bg-white dark:bg-[#171828]">
        <div className="flex items-end gap-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.04] px-3 py-2 focus-within:border-green-400 dark:focus-within:border-green-500/40 focus-within:bg-white dark:focus-within:bg-white/[0.06] focus-within:ring-2 focus-within:ring-green-400/20 dark:focus-within:ring-green-500/10 transition-all">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1 resize-none bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none max-h-28 disabled:opacity-50"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="shrink-0 w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-green-500/20"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1.5 text-center">
          Enter to send &middot; Shift+Enter for new line
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {([
            ['chat', 'Chat Report'],
            ['executive', 'Executive Report'],
            ['business', 'Business Report'],
          ] as const).map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              disabled={!canReport}
              onClick={() => createReport(kind)}
              className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.04] px-2 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-green-400 dark:hover:border-green-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {reportKind === kind ? 'Preparing…' : label}
            </button>
          ))}
        </div>
        {reportError && (
          <p className="mt-1.5 text-center text-[11px] text-red-500">{reportError}</p>
        )}
      </div>
    </div>
  )
}
