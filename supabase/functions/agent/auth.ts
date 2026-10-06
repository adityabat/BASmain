import { json } from "./http.ts"

export async function requireUser(req: Request): Promise<{ id: string } | Response> {
  const auth = req.headers.get("Authorization") ?? ""
  if (!auth.toLowerCase().startsWith("bearer ")) {
    return json(401, { error: "Not authenticated" })
  }

  const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
    headers: {
      Authorization: auth,
      apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    },
  })
  if (!res.ok) return json(401, { error: "Not authenticated" })

  const user = await res.json() as { id?: string }
  if (!user.id) return json(401, { error: "Not authenticated" })
  return { id: user.id }
}

export function isResponse(value: { id: string } | Response): value is Response {
  return value instanceof Response
}

/** Body userId must match the signed-in user when the client sends one. */
export function assertOwner(userId: string, claimed: string): Response | null {
  if (claimed && claimed !== userId) {
    return json(403, { error: "That account cannot use this request." })
  }
  return null
}
