import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

type Mode = 'login' | 'signup' | 'forgot' | 'reset'

type AuthPageProps = {
  initialMode?: Mode
  onBack?: () => void
}

export function AuthPage({ initialMode = 'login', onBack }: AuthPageProps) {
  const { theme, toggleTheme } = useTheme()
  const { passwordRecovery, clearPasswordRecovery } = useAuth()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [now, setNow] = useState(Date.now())

  const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))

  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [cooldownSeconds])

  const effectiveMode: Mode = passwordRecovery ? 'reset' : mode

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    if (effectiveMode === 'login') {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'Incorrect email or password.'
            : authError.message
        )
      }
    } else if (effectiveMode === 'signup') {
      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) {
        setError(
          authError.message.toLowerCase().includes('already registered')
            ? 'An account with this email already exists.'
            : authError.message
        )
      } else if (!data.session) {
        setError('Check your email and click the confirmation link before signing in.')
      }
    } else if (effectiveMode === 'forgot') {
      if (cooldownSeconds > 0) {
        setError(`Please wait ${cooldownSeconds}s before requesting another reset link.`)
        setLoading(false)
        return
      }
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })
      if (resetError) {
        setError(
          resetError.message.toLowerCase().includes('rate limit')
            ? 'Too many reset emails sent. Please wait a few minutes before trying again.'
            : resetError.message
        )
      } else {
        setSuccessMessage('Reset link sent. Check your email to continue.')
        setCooldownUntil(Date.now() + 60000)
      }
    } else if (effectiveMode === 'reset') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.')
        setLoading(false)
        return
      }
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccessMessage('Password updated. You can now sign in with your new password.')
        await supabase.auth.signOut()
        clearPasswordRecovery()
        setMode('login')
      }
    }

    setLoading(false)
  }

  function switchMode() {
    setMode((m) => (m === 'login' ? 'signup' : 'login'))
    setError(null)
    setSuccessMessage(null)
    setPassword('')
  }

  function showForgot() {
    setMode('forgot')
    setError(null)
    setSuccessMessage(null)
    setPassword('')
  }

  function backToLogin() {
    setMode('login')
    setError(null)
    setSuccessMessage(null)
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="relative min-h-screen bg-[#080912] dark:bg-[#080912] flex flex-col items-center justify-center px-4 overflow-hidden">

      {/* Decorative blurred blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-20 w-[400px] h-[400px] rounded-full bg-blue-700/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-green-500/5 blur-[80px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg bg-white/[0.07] border border-white/[0.1] flex items-center justify-center text-slate-400 hover:bg-white/[0.12] transition-all"
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
      </div>

      <div className="relative z-10 w-full max-w-sm">

        {/* Brand header */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20 mb-1">
            <img src="/images/Icon_2.png" alt="BAS Agentic logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BAS Agentic</h1>
          <p className="text-sm text-slate-400 text-center">Your intelligent business agent companion</p>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-4 text-sm text-slate-400 hover:text-green-400 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to home
          </button>
        )}

        {/* Card */}
        <div className="rounded-2xl bg-[#12131f] border border-white/[0.08] shadow-2xl shadow-black/40 p-7">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-white leading-tight">
              {effectiveMode === 'login' && 'Welcome Back'}
              {effectiveMode === 'signup' && 'Create Account'}
              {effectiveMode === 'forgot' && 'Reset Password'}
              {effectiveMode === 'reset' && 'Set New Password'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {effectiveMode === 'login' && 'Sign in to your account'}
              {effectiveMode === 'signup' && 'Get started for free'}
              {effectiveMode === 'forgot' && 'Enter your email and we’ll send you a reset link'}
              {effectiveMode === 'reset' && 'Choose a new password for your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-green-500/50 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-green-500/15 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            {(effectiveMode === 'login' || effectiveMode === 'signup' || effectiveMode === 'reset') && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5" htmlFor="password">
                  {effectiveMode === 'reset' ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={effectiveMode === 'login' ? 'current-password' : 'new-password'}
                    placeholder={effectiveMode === 'signup' || effectiveMode === 'reset' ? 'At least 6 characters' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-green-500/50 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-green-500/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (reset only) */}
            {effectiveMode === 'reset' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5" htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-green-500/50 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-green-500/15 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            {/* Success */}
            {successMessage && (
              <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
                <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-emerald-300">{successMessage}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || (effectiveMode === 'forgot' && cooldownSeconds > 0)}
              className="mt-1 w-full flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/25"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {effectiveMode === 'login' && 'Signing in...'}
                  {effectiveMode === 'signup' && 'Creating account...'}
                  {effectiveMode === 'forgot' && 'Sending link...'}
                  {effectiveMode === 'reset' && 'Updating...'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {effectiveMode === 'forgot' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    )}
                  </svg>
                  {effectiveMode === 'login' && 'Sign In'}
                  {effectiveMode === 'signup' && 'Create Account'}
                  {effectiveMode === 'forgot' && (cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : 'Send Reset Link')}
                  {effectiveMode === 'reset' && 'Update Password'}
                </>
              )}
            </button>
          </form>

          {/* Forgot password link (login only) */}
          {effectiveMode === 'login' && (
            <p className="mt-4 text-center text-sm">
              <button
                type="button"
                onClick={showForgot}
                className="font-medium text-slate-400 hover:text-green-400 transition-colors"
              >
                Forgot password?
              </button>
            </p>
          )}

          {/* Switch mode (login / signup only) */}
          {(effectiveMode === 'login' || effectiveMode === 'signup') && (
            <p className="mt-5 text-center text-sm text-slate-500">
              {effectiveMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={switchMode}
                className="font-medium text-green-400 hover:text-blue-300 transition-colors"
              >
                {effectiveMode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          )}

          {/* Back to login (forgot / reset only) */}
          {(effectiveMode === 'forgot' || effectiveMode === 'reset') && (
            <p className="mt-5 text-center text-sm text-slate-500">
              <button
                type="button"
                onClick={backToLogin}
                className="font-medium text-green-400 hover:text-blue-300 transition-colors"
              >
                &larr; Back to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
