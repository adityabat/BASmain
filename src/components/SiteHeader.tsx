import { useState, type ReactNode } from 'react'
import { useTheme } from '../context/ThemeContext'
import { workflowProducts } from '../data/products'

type SiteHeaderProps = {
  activeProductId?: string | null
  onSelectProduct: (id: string) => void
  onGoHome: (hash?: string) => void
  onSignIn: () => void
}

const linkClass =
  'text-sm font-medium text-[#243656] hover:text-[#0e1c4a] dark:text-slate-300 dark:hover:text-white transition-colors'

export function SiteHeader({ activeProductId, onSelectProduct, onGoHome, onSignIn }: SiteHeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const onHome = !activeProductId

  function go(hash?: string) {
    setMobileMenuOpen(false)
    onGoHome(hash)
  }

  function selectProduct(id: string) {
    setMobileMenuOpen(false)
    onSelectProduct(id)
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#070d1a]/90 backdrop-blur-lg border-b border-slate-200/80 dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <button type="button" onClick={() => go()} className="flex items-center gap-2.5 min-w-0 text-left shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 shrink-0">
            <img src="/images/Icon_2.png" alt="BAS Agentic logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-lg tracking-tight truncate text-[#0e1c4a] dark:text-white">BAS Agentic</span>
        </button>

        <nav className="hidden xl:flex items-center gap-7 h-full">
          <button
            type="button"
            onClick={() => go()}
            className={`h-full inline-flex items-center border-b-2 text-sm font-semibold transition-colors ${
              onHome
                ? 'border-[#12315c] text-[#12315c] dark:border-white dark:text-white'
                : 'border-transparent text-[#243656] dark:text-slate-300 hover:text-[#0e1c4a]'
            }`}
          >
            Home
          </button>
          <NavMenu label="Digital Employees" active={Boolean(activeProductId)}>
            {workflowProducts.map((product) => (
              <MenuItem
                key={product.id}
                title={product.title}
                detail={product.category}
                selected={activeProductId === product.id}
                onClick={() => selectProduct(product.id)}
              />
            ))}
          </NavMenu>
          <button type="button" onClick={() => go('#features')} className={linkClass}>
            Solutions
          </button>
          <NavMenu label="Industries">
            {workflowProducts.map((product) => (
              <MenuItem
                key={product.id}
                title={product.industry}
                detail={product.title}
                selected={activeProductId === product.id}
                onClick={() => selectProduct(product.id)}
              />
            ))}
          </NavMenu>
          <button type="button" onClick={() => go('#technology')} className={linkClass}>
            Technology
          </button>
          <button type="button" onClick={() => go('#about')} className={linkClass}>
            About
          </button>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/[0.07] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.12] transition-all"
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
            className="hidden sm:inline-flex text-sm font-semibold text-[#243656] dark:text-slate-200 hover:text-[#0e1c4a] dark:hover:text-white transition-colors px-3 py-2"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => go('#get-started')}
            className="whitespace-nowrap text-sm font-semibold text-white bg-[#0e1c4a] hover:bg-[#16306b] active:bg-[#0a1433] px-3.5 sm:px-5 py-2.5 rounded-full shadow-md shadow-slate-900/10 transition-all"
          >
            Contact Us
          </button>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="xl:hidden w-9 h-9 rounded-full bg-slate-100 dark:bg-white/[0.07] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-[#243656] dark:text-slate-200"
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5'} />
            </svg>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#070d1a] px-4 py-4 flex flex-col gap-1">
          <MobileLink label="Home" onClick={() => go()} />
          <p className="pt-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Digital Employees</p>
          {workflowProducts.map((product) => (
            <button key={product.id} type="button" onClick={() => selectProduct(product.id)} className="text-sm text-[#243656] dark:text-slate-300 py-1.5 text-left pl-3">
              {product.title}
            </button>
          ))}
          <MobileLink label="Solutions" onClick={() => go('#features')} />
          <p className="pt-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Industries</p>
          {workflowProducts.map((product) => (
            <button key={`ind-${product.id}`} type="button" onClick={() => selectProduct(product.id)} className="text-sm text-[#243656] dark:text-slate-300 py-1.5 text-left pl-3">
              {product.industry}
            </button>
          ))}
          <MobileLink label="Technology" onClick={() => go('#technology')} />
          <MobileLink label="About" onClick={() => go('#about')} />
          <button onClick={onSignIn} className="text-sm font-semibold text-[#0e1c4a] dark:text-white text-left py-2">
            Sign In
          </button>
        </div>
      )}
    </header>
  )
}

function NavMenu({ label, active, children }: { label: string; active?: boolean; children: ReactNode }) {
  return (
    <div className="relative group h-full flex items-center">
      <button
        type="button"
        className={`inline-flex items-center gap-1 ${linkClass} ${active ? 'text-[#12315c] dark:text-white font-semibold' : ''}`}
        aria-haspopup="true"
      >
        {label}
        <svg className="w-3.5 h-3.5 opacity-70 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div className="absolute left-0 top-full pt-2 z-50 hidden group-hover:block group-focus-within:block">
        <div className="w-72 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#12182a] shadow-xl shadow-slate-900/10 py-2">
          {children}
        </div>
      </div>
    </div>
  )
}

function MenuItem({
  title,
  detail,
  selected,
  onClick,
}: {
  title: string
  detail: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.05] ${
        selected ? 'bg-slate-50 dark:bg-white/[0.05]' : ''
      }`}
    >
      <span className="block text-sm font-semibold text-[#0e1c4a] dark:text-white">{title}</span>
      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{detail}</span>
    </button>
  )
}

function MobileLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-sm font-medium text-[#243656] dark:text-slate-200 py-2 text-left">
      {label}
    </button>
  )
}
