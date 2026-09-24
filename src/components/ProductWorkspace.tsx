import { AppointmentForm } from './AppointmentForm'
import type { AgenticProduct } from '../data/products'

type ProductWorkspaceProps = {
  product: AgenticProduct
  onGoHome: () => void
}

export function ProductWorkspace({ product, onGoHome }: ProductWorkspaceProps) {
  if (product.href) {
    return (
      <div className="flex-1 min-h-0 flex flex-col bg-white">
        <div className="px-4 sm:px-6 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-[#243656] truncate">{product.title}</p>
          <button
            type="button"
            onClick={onGoHome}
            className="shrink-0 text-sm font-semibold text-[#0e1c4a] hover:text-blue-700"
          >
            Back to home
          </button>
        </div>
        <iframe
          src={product.href}
          title={product.title}
          className="flex-1 w-full border-0 bg-white"
        />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f5f6fb] dark:bg-[#0f1017]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <button
          type="button"
          onClick={onGoHome}
          className="text-sm font-semibold text-[#0e1c4a] dark:text-blue-300 hover:text-blue-700 mb-8"
        >
          ← Back to home
        </button>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{product.title}</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mb-10">{product.desc}</p>
        <div id="get-started" className="rounded-3xl bg-[#0b1224] p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-blue-300 uppercase">Get started</p>
            <h2 className="mt-3 text-3xl font-bold text-white">Book an appointment</h2>
            <p className="mt-4 text-slate-300">Tell us your name, how to reach you, and what you need. We will reply to arrange a time.</p>
          </div>
          <AppointmentForm />
        </div>
      </div>
    </div>
  )
}
