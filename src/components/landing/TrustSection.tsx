const pillars = [
  {
    title: 'Bank-grade Security',
    desc: 'Enterprise-grade infrastructure, encryption and access controls.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'Domain Grounded',
    desc: 'Uses your data, knowledge, processes and rules.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
  },
  {
    title: 'Controlled',
    desc: 'Permissions, guardrails, workflows and human oversight.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    title: 'Auditable',
    desc: 'Traceable decisions, actions and outcomes.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
]

export function TrustSection() {
  return (
    <section id="technology" className="scroll-mt-20 bg-[#eef6fb] dark:bg-[#0e1728]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16 grid grid-cols-1 lg:grid-cols-[0.9fr_2.2fr] gap-10 lg:gap-8 items-center">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-teal-600 uppercase">Enterprise-ready</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0c2348] dark:text-white">
            Secure. Controlled. Trusted.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#5b6e8c] dark:text-slate-400 leading-relaxed max-w-sm">
            Bank-grade security, domain knowledge and full control — because your data and decisions matter.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="flex flex-col items-start sm:items-center sm:text-center">
              <div className="w-14 h-14 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-300 flex items-center justify-center">
                {pillar.icon}
              </div>
              <h3 className="mt-4 text-sm font-bold text-[#0c2348] dark:text-white">{pillar.title}</h3>
              <p className="mt-1.5 text-xs sm:text-sm text-[#5b6e8c] dark:text-slate-400 leading-relaxed">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
