export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_78%_42%,rgba(147,197,253,0.45),transparent_46%),radial-gradient(ellipse_at_12%_80%,rgba(196,181,253,0.28),transparent_42%),linear-gradient(180deg,#f8fbff_0%,#f3f6fc_100%)] dark:bg-[radial-gradient(ellipse_at_78%_40%,rgba(37,99,235,0.22),transparent_46%),linear-gradient(180deg,#070d1a_0%,#0b1224_100%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-6 items-center">
        <div className="max-w-xl">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.16em] text-blue-600 uppercase">
            Building AI-powered digital employees
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-[3.35rem] font-extrabold tracking-tight leading-[1.08] text-[#0c2348] dark:text-white">
            Building AI-Powered Digital Employees
          </h1>
          <p className="mt-5 text-base sm:text-lg text-[#3d5278] dark:text-slate-300 leading-relaxed">
            We build intelligent AI employees that reason, make decisions and execute complex workflows—securely and at scale.
          </p>
          <p className="mt-4 text-sm sm:text-base text-[#5b6e8c] dark:text-slate-400 leading-relaxed">
            From education and finance to enterprise operations, BAS Agentic helps organisations automate complex work, not just conversations.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              href="#products"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0e1c4a] hover:bg-[#16306b] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition-colors"
            >
              Explore Our Digital Employees
              <ArrowIcon />
            </a>
            <a
              href="#get-started"
              className="inline-flex items-center justify-center rounded-full bg-white dark:bg-transparent border border-[#c5d2e4] dark:border-white/25 shadow-sm hover:border-[#0e1c4a]/30 px-6 py-3 text-sm font-semibold text-[#0e1c4a] dark:text-white transition-colors"
            >
              Talk to Us
            </a>
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="pointer-events-none absolute inset-8 rounded-full bg-sky-200/50 blur-3xl dark:bg-blue-500/20" />
          <img
            src="/images/hero-agent.png"
            alt="Digital employee that learns, analyses, decides, and executes"
            className="relative w-full max-w-[560px] h-auto select-none [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent),linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] [mask-composite:intersect] [-webkit-mask-composite:destination-in]"
          />
        </div>
      </div>
    </section>
  )
}

function ArrowIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  )
}
