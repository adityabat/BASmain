import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabase'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  passwordRecovery: boolean
  signOut: () => Promise<void>
  clearPasswordRecovery: () => void
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  passwordRecovery: false,
  signOut: async () => {},
  clearPasswordRecovery: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  useEffect(() => {
    // Detect password-recovery flow from the URL immediately. Supabase may
    // deliver the recovery token in the hash (implicit flow) or the query
    // string (PKCE flow), so check both.
    const url = window.location.href
    if (url.includes('type=recovery') || url.includes('type=password_recovery')) {
      setPasswordRecovery(true)
    }

    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      setSession(initial)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  function clearPasswordRecovery() {
    setPasswordRecovery(false)
  }

  return (
    <AuthContext.Provider value={{ session, loading, passwordRecovery, signOut, clearPasswordRecovery }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
