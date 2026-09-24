import { FormEvent, useState } from 'react'
import { supabase } from '../supabase'

export function AppointmentForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorText, setErrorText] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    setErrorText('')

    const { error } = await supabase.functions.invoke('send-enquiry', {
      body: {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim(),
        company: company.trim(),
      },
    })

    if (error) {
      setStatus('error')
      setErrorText('We could not send your enquiry. Please email sales@baseagentic.com or call +61 432 592 014.')
      return
    }

    setStatus('sent')
    setName('')
    setEmail('')
    setPhone('')
    setMessage('')
  }

  const fieldClass =
    'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0e1c4a] focus:ring-2 focus:ring-[#0e1c4a]/15'

  return (
    <form onSubmit={handleSubmit} className="relative rounded-2xl bg-white p-6 sm:p-8 shadow-xl">
      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="appointment-company">Company</label>
        <input
          id="appointment-company"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="appointment-name" className="block text-sm font-medium text-slate-800">
          Name
        </label>
        <input
          id="appointment-name"
          name="name"
          type="text"
          required
          maxLength={200}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="appointment-email" className="block text-sm font-medium text-slate-800">
          Email
        </label>
        <input
          id="appointment-email"
          name="email"
          type="email"
          required
          maxLength={320}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="appointment-phone" className="block text-sm font-medium text-slate-800">
          Phone
        </label>
        <input
          id="appointment-phone"
          name="phone"
          type="tel"
          required
          maxLength={50}
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="appointment-message" className="block text-sm font-medium text-slate-800">
          Message
        </label>
        <textarea
          id="appointment-message"
          name="message"
          required
          rows={5}
          maxLength={4000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${fieldClass} resize-y min-h-[8rem]`}
        />
      </div>

      <div className="mt-4 min-h-[1.25rem]" aria-live="polite">
        {status === 'sent' && (
          <p className="text-sm font-medium text-green-600">Thank you. We will reply to arrange a time.</p>
        )}
        {status === 'error' && <p className="text-sm font-medium text-red-600">{errorText}</p>}
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-4 w-full rounded-full bg-[#0e1c4a] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-[#16306b] disabled:cursor-not-allowed disabled:opacity-70 transition-all"
      >
        {status === 'sending' ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  )
}
