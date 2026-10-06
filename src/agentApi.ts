import { supabase, supabaseAnonKey, supabaseUrl } from './supabase'

export const AGENT_URL = `${supabaseUrl}/functions/v1/agent`

export async function agentAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  return {
    Authorization: `Bearer ${session.access_token}`,
    apikey: supabaseAnonKey,
  }
}

export async function postAgentJson(body: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(AGENT_URL, {
    method: 'POST',
    headers: {
      ...(await agentAuthHeaders()),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
      ? data.error
      : `Request failed (${response.status})`
    throw new Error(message)
  }
  return data
}
