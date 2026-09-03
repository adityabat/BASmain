import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { FREE_UPLOAD_LIMIT, FREE_TRANSCRIPT_LIMIT } from '../context/UsageContext'

type LandingPageProps = {
  onGetStarted: () => void
  onSignIn: () => void
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const { theme, toggleTheme } = useTheme()
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7797/ingest/816c7850-d38c-4b2f-8aca-97d300bda943',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3a94c5'},body:JSON.stringify({sessionId:'3a94c5',runId:'free-limit-5',hypothesisId:'B',location:'LandingPage.tsx:mount',message:'landing free plan copy',data:{freeUploadConst:FREE_UPLOAD_LIMIT,freeTranscriptConst:FREE_TRANSCRIPT_LIMIT,uploadFeature:`${FREE_UPLOAD_LIMIT} document uploads / month`},timestamp:Date.now()})}).catch(()=>{});
  }, [])
  // #endregion

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      ),
      title: 'AI Chat Assistant',
      desc: 'Talk to an intelligent agent that understands your business context and helps you get answers fast.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      ),
      title: 'Smart Document Upload',
      desc: 'Upload files securely to your private workspace. Drag, drop, and let your agent process them automatically.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.8 5 12 5 12 5s-4.8 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.2.9C6.8 19 12 19 12 19s4.8 0 7-.1c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM9.8 14.5V9l5.4 2.8-5.4 2.7z" />
        </svg>
      ),
      title: 'Transcript Extraction',
      desc: 'Pull key insights from video and audio transcripts. Search, summarize, and organize content in seconds.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Full History Tracking',
      desc: 'Every upload, chat, and transcript is saved. Review past activity anytime and pick up where you left off.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12.75L11.25 15 15 9.75m-3-7.038A11.969 11.969 0 013.5 6c0 5.59 4.06 10.243 9.372 10.93a11.985 11.985 0 01-2.096.214 8.25 8.25 0 01-2.68-.555 7.5 7.5 0 00-2.706-.435c-.68 0-1.34.073-1.973.213A11.953 11.953 0 0112 2.25z" />
        </svg>
      ),
      title: 'Bank-Grade Security',
      desc: 'Your data is encrypted at rest and in transit. Row-level security ensures only you can access your files.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      title: 'Scalable Usage Plans',
      desc: 'Start free and upgrade when you need more. Pro unlocks unlimited documents and transcripts for power users.',
    },
  ]

  const steps = [
    {
      num: '01',
      title: 'Create your account',
      desc: 'Sign up in seconds with just your email. No credit card required to get started.',
    },
    {
      num: '02',
      title: 'Upload or chat',
      desc: 'Drag and drop documents, start a chat with your AI agent, or paste a transcript to extract insights.',
    },
    {
      num: '03',
      title: 'Get intelligent results',
      desc: 'Your agent processes everything instantly and gives you answers, summaries, and organized content.',
    },
  ]

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      desc: 'Perfect for trying out the platform',
      features: [`${FREE_UPLOAD_LIMIT} document uploads / month`, `${FREE_TRANSCRIPT_LIMIT} transcript extractions / month`, 'AI chat assistant', 'Full history tracking', 'Email support'],
      cta: 'Get Started Free',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'per month',
      desc: 'For professionals and growing teams',
      features: ['Unlimited document uploads', 'Unlimited transcript extractions', 'Priority AI chat assistant', 'Advanced history & search', 'Priority support', 'Early access to new features'],
      cta: 'Upgrade to Pro',
      highlighted: true,
    },
  ]

  const faqs = [
    {
      q: 'What is BAS Agentic?',
      a: 'BAS Agentic is an AI-powered platform that helps businesses manage documents, extract insights from transcripts, and chat with an intelligent agent. It stands for Business, Applications, and Solutions — the three areas our agent helps you streamline.',
    },
    {
      q: 'How does the free plan work?',
      a: `The free plan gives you ${FREE_UPLOAD_LIMIT} document uploads and ${FREE_TRANSCRIPT_LIMIT} transcript extractions per month, plus unlimited access to the AI chat assistant. No credit card is required, and you can upgrade to Pro at any time.`,
    },
    {
      q: 'Is my data secure?',
      a: 'Yes. All data is encrypted in transit and at rest. We use row-level security so only you can access your files and conversations. Your data is never shared with third parties.',
    },
    {
      q: 'Can I cancel my Pro subscription anytime?',
      a: 'Absolutely. You can cancel your Pro subscription at any time from your account. You will keep Pro access until the end of your billing period, then automatically revert to the free plan.',
    },
    {
      q: 'What file types can I upload?',
      a: 'You can upload most common document formats including PDF, Word, text files, images, and more. The AI agent processes each file and extracts the relevant information automatically.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#f5f6fb] dark:bg-[#0f1017] text-slate-900 dark:text-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0f1017]/80 backdrop-blur-lg border-b border-slate-200 dark:border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20">
              <img src="/images/Icon_2.png" alt="BAS Agentic logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-lg tracking-tight">BAS Agentic</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-green-500 dark:hover:text-green-400 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-green-500 dark:hover:text-green-400 transition-colors">How it Works</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-green-500 dark:hover:text-green-400 transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-green-500 dark:hover:text-green-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/[0.07] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.12] transition-all"
              aria-label="Toggle theme"
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
            <button
              onClick={onSignIn}
              className="hidden sm:inline-flex text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-green-500 dark:hover:text-green-400 transition-colors px-4 py-2"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="text-sm font-semibold text-white bg-green-500 hover:bg-blue-600 active:bg-blue-700 px-5 py-2.5 rounded-xl shadow-lg shadow-green-500/25 transition-all"
            >
              Get Started
            </button>
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/[0.07] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-600 dark:text-slate-300"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5'} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0f1017] px-4 py-4 flex flex-col gap-3">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 dark:text-slate-300 py-1">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 dark:text-slate-300 py-1">How it Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 dark:text-slate-300 py-1">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 dark:text-slate-300 py-1">FAQ</a>
            <button onClick={onSignIn} className="text-sm font-semibold text-slate-700 dark:text-slate-200 text-left py-1">Sign In</button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-green-500/10 blur-[120px]" />
          <div className="absolute -bottom-40 -right-20 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/20 px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-blue-600 dark:text-green-400">AI agents for modern businesses</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Your intelligent{' '}
            <span className="bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent">business agent</span>{' '}
            companion
          </h1>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            BAS Agentic brings together AI chat, smart document uploads, and transcript extraction into one seamless workspace. Work faster, find answers quicker, and let your agent handle the heavy lifting.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 hover:bg-blue-600 active:bg-blue-700 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-green-500/25 transition-all"
            >
              Get Started Free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-white/[0.07] border border-slate-200 dark:border-white/[0.1] hover:border-slate-300 dark:hover:border-white/[0.2] px-7 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 transition-all"
            >
              See How It Works
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-500">No credit card required. Free plan includes {FREE_UPLOAD_LIMIT} uploads and {FREE_TRANSCRIPT_LIMIT} transcripts per month.</p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#171828]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { stat: '4-in-1', label: 'AI tools in one place' },
            { stat: '256-bit', label: 'Encryption at rest' },
            { stat: '< 2s', label: 'Average response time' },
            { stat: '24/7', label: 'Always available' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent">{s.stat}</p>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-green-500 dark:text-green-400 uppercase tracking-wide mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything you need in one workspace</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Four powerful tools working together so you can focus on what matters.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl bg-white dark:bg-[#171828] border border-slate-200 dark:border-white/[0.07] p-7 hover:border-green-500/30 dark:hover:border-green-500/30 hover:shadow-xl hover:shadow-green-500/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 dark:text-green-400 mb-5 group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white dark:bg-[#171828] border-y border-slate-200 dark:border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-green-500 dark:text-green-400 uppercase tracking-wide mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Get started in three simple steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-px border-t-2 border-dashed border-slate-200 dark:border-white/[0.1]" />
                )}
                <div className="relative flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-green-500/30 mb-5">
                    {s.num}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 hover:bg-blue-600 active:bg-blue-700 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-green-500/25 transition-all"
            >
              Start Now — It's Free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-green-500 dark:text-green-400 uppercase tracking-wide mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Simple, transparent pricing</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Start for free. Upgrade when you need more.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-8 border transition-all ${
                p.highlighted
                  ? 'bg-white dark:bg-[#171828] border-green-500 shadow-2xl shadow-green-500/10 md:scale-105'
                  : 'bg-white dark:bg-[#171828] border-slate-200 dark:border-white/[0.07]'
              }`}
            >
              {p.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-green-400 to-blue-600 px-4 py-1 text-xs font-bold text-white shadow-lg">
                    &#9889; Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-xl font-bold">{p.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{p.desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">/ {p.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm">
                    <svg className="w-5 h-5 text-green-500 dark:text-green-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300">{feat}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={onGetStarted}
                className={`mt-8 w-full rounded-xl py-3 text-sm font-semibold transition-all ${
                  p.highlighted
                    ? 'bg-green-500 hover:bg-blue-600 text-white shadow-lg shadow-green-500/25'
                    : 'bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.1]'
                }`}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 to-blue-600 p-10 sm:p-16 text-center">
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white blur-2xl" />
          </div>
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Ready to put your AI agent to work?</h2>
            <p className="mt-4 text-lg text-blue-50 max-w-xl mx-auto">Join BAS Agentic today and get instant access to AI chat, document uploads, and transcript extraction.</p>
            <button
              onClick={onGetStarted}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-blue-50 px-8 py-4 text-base font-bold text-blue-600 shadow-xl transition-all"
            >
              Get Started Free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <p className="mt-4 text-sm text-blue-100">No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white dark:bg-[#171828] border-y border-slate-200 dark:border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-green-500 dark:text-green-400 uppercase tracking-wide mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Frequently asked questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-slate-200 dark:border-white/[0.07] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md shadow-blue-500/20">
                <img src="/images/Icon_2.png" alt="BAS Agentic logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-base">BAS Agentic</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              Agents for Business, Applications, and Solutions. Your intelligent companion for document management, transcript extraction, and AI-powered chat.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-4 text-slate-900 dark:text-white">Product</h4>
            <ul className="space-y-2.5">
              <li><a href="#features" className="text-sm text-slate-600 dark:text-slate-400 hover:text-green-500 dark:hover:text-green-400 transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-sm text-slate-600 dark:text-slate-400 hover:text-green-500 dark:hover:text-green-400 transition-colors">Pricing</a></li>
              <li><a href="#how-it-works" className="text-sm text-slate-600 dark:text-slate-400 hover:text-green-500 dark:hover:text-green-400 transition-colors">How it Works</a></li>
              <li><a href="#faq" className="text-sm text-slate-600 dark:text-slate-400 hover:text-green-500 dark:hover:text-green-400 transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-4 text-slate-900 dark:text-white">Get Started</h4>
            <ul className="space-y-2.5">
              <li><button onClick={onGetStarted} className="text-sm text-slate-600 dark:text-slate-400 hover:text-green-500 dark:hover:text-green-400 transition-colors">Create Account</button></li>
              <li><button onClick={onSignIn} className="text-sm text-slate-600 dark:text-slate-400 hover:text-green-500 dark:hover:text-green-400 transition-colors">Sign In</button></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-slate-200 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-500">&copy; {new Date().getFullYear()} BAS Agentic. All rights reserved.</p>
          <p className="text-sm text-slate-500 dark:text-slate-500">Agents for Business, Applications and Solutions.</p>
        </div>
      </footer>
    </div>
  )
}
