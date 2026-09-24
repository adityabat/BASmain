import { workflowProducts, type AgenticProduct, type ProductTone } from '../../data/products'

type DigitalEmployeesProps = {
  onSelect: (id: string) => void
}

const toneClass: Record<ProductTone, { card: string; icon: string; link: string }> = {
  blue: {
    card: 'from-white to-blue-50/90 border-blue-100/80 dark:from-[#121a2e] dark:to-[#152038] dark:border-white/10',
    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
    link: 'text-blue-600 dark:text-blue-300',
  },
  emerald: {
    card: 'from-white to-emerald-50/90 border-emerald-100/80 dark:from-[#121a2e] dark:to-[#13241f] dark:border-white/10',
    icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    link: 'text-emerald-600 dark:text-emerald-300',
  },
  violet: {
    card: 'from-white to-violet-50/90 border-violet-100/80 dark:from-[#121a2e] dark:to-[#1c1730] dark:border-white/10',
    icon: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    link: 'text-violet-600 dark:text-violet-300',
  },
}

export function DigitalEmployees({ onSelect }: DigitalEmployeesProps) {
  return (
    <section id="products" className="scroll-mt-20 bg-white dark:bg-[#0b1220] border-y border-slate-100 dark:border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 lg:gap-6 items-stretch">
          <div className="lg:pr-4 flex flex-col justify-center">
            <p className="text-xs font-semibold tracking-[0.16em] text-blue-600 uppercase">Our digital employees</p>
            <h2 className="mt-3 text-3xl sm:text-[2rem] font-extrabold tracking-tight leading-tight text-[#0c2348] dark:text-white">
              Purpose-built AI agents for real-world outcomes.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#5b6e8c] dark:text-slate-400 leading-relaxed">
              Choose from our growing library of digital employees or create a custom one for your business.
            </p>
          </div>

          {workflowProducts.map((product) => (
            <EmployeeCard key={product.id} product={product} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </section>
  )
}

function EmployeeCard({ product, onSelect }: { product: AgenticProduct; onSelect: (id: string) => void }) {
  const tone = toneClass[product.tone]
  return (
    <button
      id={product.id}
      type="button"
      onClick={() => onSelect(product.id)}
      className={`scroll-mt-24 text-left rounded-3xl bg-gradient-to-b border p-6 sm:p-7 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all ${tone.card}`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tone.icon}`}>
        <ProductIcon id={product.id} />
      </div>
      <h3 className="mt-5 text-lg font-bold text-[#0c2348] dark:text-white">{product.title}</h3>
      <p className={`mt-1 text-[11px] font-semibold tracking-[0.14em] uppercase ${tone.link}`}>{product.category}</p>
      <p className="mt-3 text-sm text-[#5b6e8c] dark:text-slate-400 leading-relaxed">{product.desc}</p>
      <span className={`mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ${tone.link}`}>
        Learn more
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </span>
    </button>
  )
}

function ProductIcon({ id }: { id: string }) {
  if (id === 'agents-edu') {
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    )
  }
  if (id === 'agents-tax') {
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
