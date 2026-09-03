import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

const CHAT_WEBHOOK_URL = 'https://m-objectsai.app.n8n.cloud/webhook/Chat'

function getSessionId(): string {
  const stored = localStorage.getItem('chat_session_id')
  if (stored) return stored
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const id = Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  localStorage.setItem('chat_session_id', id)
  return id
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

interface ChatWidgetProps {
  userId: string
}

export function ChatWidget({ userId }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState<string>(getSessionId)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatInput: text, sessionId, userId }),
      })

      if (!response.ok) throw new Error(`Request failed (${response.status})`)

      const data = await response.json()
      const payload = Array.isArray(data) ? data[0] : data
      const reply: string =
        payload?.output ?? payload?.message ?? payload?.text ?? payload?.response ?? JSON.stringify(payload)

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

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
      </div>
    </div>
  )
}
