import { AppointmentForm } from '../AppointmentForm'

export function LandingContact() {
  return (
    <section id="get-started" className="scroll-mt-20 bg-white dark:bg-[#0b1220] border-y border-slate-100 dark:border-white/[0.06]">
      <span id="contact" className="block scroll-mt-20" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-blue-600 uppercase">Talk to us</p>
          <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0c2348] dark:text-white">
            Book an appointment
          </h2>
          <p className="mt-5 text-base sm:text-lg text-[#3d5278] dark:text-slate-300 leading-relaxed max-w-md">
            Tell us your name, how to reach you, and what you need. We will reply to arrange a time.
          </p>
          <p className="mt-6 text-sm text-[#5b6e8c] dark:text-slate-400">
            Contact us for customised pricing based on your needs.
          </p>
          <p className="mt-3 text-sm">
            <a href="mailto:sales@baseagentic.com" className="font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 underline underline-offset-2">
              sales@baseagentic.com
            </a>
          </p>
          <p className="mt-2 text-sm">
            <a href="tel:+61432592014" className="font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 underline underline-offset-2">
              +61 432 592 014
            </a>
          </p>
        </div>
        <AppointmentForm />
      </div>
      <p className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 text-xs text-slate-500">
        Enquiries are used only to reply about an appointment.
      </p>
    </section>
  )
}
