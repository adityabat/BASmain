import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tpxouggkkyljrmmhdlbr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRweG91Z2dra3lsanJtbWhkbGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTk0NzYsImV4cCI6MjA5NzEzNTQ3Nn0.3Vfek4qEYPTJ2bsabIbCB6SYloT0DP6Xr-Esp3nTQGA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    autoRefreshToken: true,
    persistSession: true,
  },
})
