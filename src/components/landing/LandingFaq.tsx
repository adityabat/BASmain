import { useState } from 'react'

const faqs = [
  {
    q: 'What is BAS Agentic?',
    a: 'BAS Agentic is an AI-powered platform that helps businesses manage documents, extract insights from transcripts, and chat with an intelligent agent. It stands for Business Application Solution with Agentic AI.',
  },
  {
    q: 'How does pricing work?',
    a: 'Contact us for customised pricing based on your needs at sales@baseagentic.com or +61 432 592 014.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. All data is encrypted in transit and at rest. We use row-level security so only you can access your files and conversations. Your data is never shared with third parties.',
  },
  {
    q: 'What file types can I upload?',
    a: 'You can upload most common document formats including PDF, Word, text files, images, and more. The AI agent processes each file and extracts the relevant information automatically.',
  },
]

export function LandingFaq() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <section id="about" className="scroll-mt-20 bg-[#f6f8fc] dark:bg-[#070d1a]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20">
        <p className="text-xs font-semibold tracking-[0.16em] text-blue-600 uppercase">About</p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0c2348] dark:text-white">
          Your AI-powered digital employee
        </h2>
        <p className="mt-4 text-base text-[#5b6e8c] dark:text-slate-400 leading-relaxed">
          BAS Agentic — Business Application Solution with Agentic AI. We build digital employees for education, finance, tradies, and the way your organisation already works.
        </p>
      </div>

      <div id="faq" className="scroll-mt-20 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:pb-20">
        <h3 className="text-2xl font-extrabold tracking-tight text-[#0c2348] dark:text-white">Frequently asked questions</h3>
        <div className="mt-6 space-y-3">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121a2e] overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={openFaq === i}
              >
                <span className="text-sm font-semibold text-[#0c2348] dark:text-white">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-[#5b6e8c] dark:text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
