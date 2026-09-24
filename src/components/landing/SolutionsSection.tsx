const features = [
  {
    title: 'AI Chat Assistant',
    desc: 'Talk to an intelligent agent that understands your business context and helps you get answers fast.',
    icon: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z',
  },
  {
    title: 'Smart Document Upload',
    desc: 'Upload files securely to your private workspace. Drag, drop, and let your agent process them automatically.',
    icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5',
  },
  {
    title: 'Transcript Extraction',
    desc: 'Pull key insights from video and audio transcripts. Search, summarize, and organize content in seconds.',
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  },
  {
    title: 'Full History Tracking',
    desc: 'Every upload, chat, and transcript is saved. Review past activity anytime and pick up where you left off.',
    icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Bank-Grade Security',
    desc: 'Your data is encrypted at rest and in transit. Row-level security ensures only you can access your files.',
    icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  },
  {
    title: 'Customised Usage Plans',
    desc: 'Contact us for customised pricing based on your needs. We scale documents, transcripts, and support to match how you work.',
    icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  },
]

const steps = [
  { num: '01', title: 'Create your account', desc: 'Sign up in seconds with just your email. No credit card required to get started.' },
  { num: '02', title: 'Upload or chat', desc: 'Drag and drop documents, start a chat with your AI agent, or paste a transcript to extract insights.' },
  { num: '03', title: 'Get intelligent results', desc: 'Your agent processes everything and gives you answers, summaries, and organized content.' },
]

export function SolutionsSection() {
  return (
    <section id="features" className="scroll-mt-20 bg-[#f6f8fc] dark:bg-[#070d1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.16em] text-blue-600 uppercase">Solutions</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0c2348] dark:text-white">
            One workspace for complex work
          </h2>
          <p className="mt-4 text-base text-[#5b6e8c] dark:text-slate-400 leading-relaxed">
            Chat, documents, transcripts, and history in a single controlled environment.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-3xl bg-white dark:bg-[#121a2e] border border-slate-200/80 dark:border-white/10 p-6 shadow-sm"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={feature.icon} />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-bold text-[#0c2348] dark:text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-[#5b6e8c] dark:text-slate-400 leading-relaxed">{feature.desc}</p>
            </article>
          ))}
        </div>

        <div id="how-it-works" className="scroll-mt-24 mt-16">
          <h3 className="text-2xl font-extrabold tracking-tight text-[#0c2348] dark:text-white">Get started in three steps</h3>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="rounded-3xl bg-white dark:bg-[#121a2e] border border-slate-200/80 dark:border-white/10 p-6">
                <p className="text-sm font-bold tracking-[0.14em] text-blue-600">{step.num}</p>
                <h4 className="mt-3 text-lg font-bold text-[#0c2348] dark:text-white">{step.title}</h4>
                <p className="mt-2 text-sm text-[#5b6e8c] dark:text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <a
            href="#get-started"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#0e1c4a] hover:bg-[#16306b] px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            Book an appointment
          </a>
        </div>
      </div>
    </section>
  )
}
