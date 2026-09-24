type LandingFooterProps = {
  onGetStarted: () => void
  onSignIn: () => void
}

export function LandingFooter({ onGetStarted, onSignIn }: LandingFooterProps) {
  return (
    <footer className="bg-[#071433] text-white">
      <div className="relative overflow-hidden">
        <svg className="pointer-events-none absolute inset-y-0 right-0 h-full w-[58%]" viewBox="0 0 800 220" preserveAspectRatio="none" aria-hidden="true">
          <path d="M80 70 C 180 20, 280 130, 420 70 S 620 10, 800 60 L 800 150 C 640 100, 500 180, 340 120 S 140 170, 40 110 Z" fill="#0b3f86" opacity="0.7" />
          <path d="M160 100 C 280 50, 380 160, 520 100 S 700 40, 800 90 L 800 170 C 680 130, 540 190, 400 140 S 220 180, 120 130 Z" fill="#1565c0" opacity="0.55" />
        </svg>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-blue-500/30">
              <img src="/images/Icon_2.png" alt="BAS Agentic logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-lg tracking-tight">BAS Agentic</span>
          </div>
          <div className="hidden lg:block w-px h-12 bg-white/20" />
          <div className="flex-1">
            <p className="text-lg sm:text-xl font-bold">Ready to build your digital workforce?</p>
            <p className="mt-1 text-sm text-blue-100/80">Let’s create intelligent AI employees for your business.</p>
          </div>
          <a
            href="#get-started"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/80 bg-white/5 hover:bg-white hover:text-[#0e1c4a] px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            Get in Touch
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
          <div>
            <p className="text-blue-100/80 leading-relaxed">
              Business Application Solution with Agentic AI.
            </p>
            <p className="mt-3">
              <a href="mailto:sales@baseagentic.com" className="text-blue-100 hover:text-white">sales@baseagentic.com</a>
            </p>
            <p className="mt-1">
              <a href="tel:+61432592014" className="text-blue-100 hover:text-white">+61 432 592 014</a>
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <a href="#features" className="text-blue-100 hover:text-white">Solutions</a>
            <a href="#products" className="text-blue-100 hover:text-white">Digital Employees</a>
            <a href="#technology" className="text-blue-100 hover:text-white">Technology</a>
            <a href="#faq" className="text-blue-100 hover:text-white">FAQ</a>
          </div>
          <div className="flex flex-col gap-2">
            <a href="#get-started" className="text-blue-100 hover:text-white">Book an appointment</a>
            <button type="button" onClick={onGetStarted} className="text-left text-blue-100 hover:text-white">Create Account</button>
            <button type="button" onClick={onSignIn} className="text-left text-blue-100 hover:text-white">Sign In</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-blue-100/60">
          <p>&copy; {new Date().getFullYear()} BAS Agentic. All rights reserved.</p>
          <p>Business Application Solution with Agentic AI</p>
        </div>
      </div>
    </footer>
  )
}
