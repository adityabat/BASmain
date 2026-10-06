function service() {
  const url = Deno.env.get("SUPABASE_URL") ?? ""
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  return { url, key }
}

function headers(extra?: Record<string, string>) {
  const { key } = service()
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  }
}

async function rest(path: string, init?: RequestInit): Promise<Response> {
  const { url } = service()
  return await fetch(`${url}/rest/v1/${path}`, init)
}

export async function matchDocuments(userId: string, embedding: number[], matchCount = 4) {
  const res = await rest("rpc/match_documents", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      query_embedding: `[${embedding.join(",")}]`,
      match_count: matchCount,
      filter: { userId },
    }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Document search failed (${res.status}): ${detail.slice(0, 180)}`)
  }
  return await res.json() as { content: string; metadata: Record<string, unknown>; similarity: number }[]
}

export async function insertDocuments(
  chunks: string[],
  vectors: number[][],
  metadata: Record<string, string>,
) {
  const rows = chunks.map((content, index) => ({
    content,
    metadata,
    embedding: `[${vectors[index].join(",")}]`,
  }))
  const res = await rest("documents", {
    method: "POST",
    headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify(rows),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Could not store documents (${res.status}): ${detail.slice(0, 180)}`)
  }
}

interface HistoryRow {
  message: { type?: string; content?: unknown; data?: { content?: unknown } }
}

function messageText(content: unknown): string {
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (typeof part === "string") return part
      if (part && typeof part === "object" && "text" in part) return String((part as { text: unknown }).text ?? "")
      return ""
    }).join("")
  }
  return ""
}

export async function loadChatTurns(sessionId: string): Promise<{ role: "user" | "assistant"; content: string }[]> {
  const query = `n8n_chat_histories?session_id=eq.${encodeURIComponent(sessionId)}&select=message&order=id.desc&limit=16`
  const res = await rest(query, { headers: headers() })
  if (!res.ok) return []
  const rows = await res.json() as HistoryRow[]
  const turns: { role: "user" | "assistant"; content: string }[] = []
  for (const row of rows.reverse()) {
    const type = row.message?.type
    const content = messageText(row.message?.content ?? row.message?.data?.content)
    if (!content) continue
    if (type === "human") turns.push({ role: "user", content })
    if (type === "ai") turns.push({ role: "assistant", content })
  }
  return turns
}

export async function saveChatTurn(sessionId: string, type: "human" | "ai", content: string) {
  const res = await rest("n8n_chat_histories", {
    method: "POST",
    headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify({ session_id: sessionId, message: { type, content } }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Could not save chat memory (${res.status}): ${detail.slice(0, 180)}`)
  }
}

export async function upsertTranscript(userId: string, videoUrl: string, transcript: string) {
  const filter = `user_id=eq.${encodeURIComponent(userId)}&video_url=eq.${encodeURIComponent(videoUrl)}&select=id&limit=1`
  const existing = await rest(`transcripts?${filter}`, { headers: headers() })
  if (!existing.ok) {
    throw new Error(`Could not look up the transcript (${existing.status})`)
  }
  const rows = await existing.json() as { id: string }[]
  if (rows[0]?.id) {
    const updated = await rest(`transcripts?id=eq.${rows[0].id}`, {
      method: "PATCH",
      headers: headers({ Prefer: "return=minimal" }),
      body: JSON.stringify({ transcript }),
    })
    if (!updated.ok) throw new Error(`Could not update the transcript (${updated.status})`)
    return
  }

  const created = await rest("transcripts", {
    method: "POST",
    headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify({ user_id: userId, video_url: videoUrl, transcript }),
  })
  if (!created.ok) throw new Error(`Could not save the transcript (${created.status})`)
}
