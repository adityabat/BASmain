const EMBEDDING_MODEL = "text-embedding-3-small"
const CHAT_MODEL = "gpt-4o-mini"

function apiKey(): string {
  return Deno.env.get("OPENAI_API_KEY") ?? ""
}

export function openAiConfigured(): boolean {
  return apiKey().length > 0
}

async function openAi(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`https://api.openai.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (payload as { error?: { message?: string } }).error?.message
    throw new Error(message || `OpenAI request failed (${res.status})`)
  }
  return payload
}

export async function embedTexts(inputs: string[]): Promise<number[][]> {
  const vectors: number[][] = []
  for (let i = 0; i < inputs.length; i += 16) {
    const batch = inputs.slice(i, i + 16)
    const payload = await openAi("embeddings", {
      model: EMBEDDING_MODEL,
      dimensions: 1536,
      input: batch,
    }) as { data?: { embedding: number[]; index: number }[] }
    const ordered = [...(payload.data ?? [])].sort((a, b) => a.index - b.index)
    for (const row of ordered) vectors.push(row.embedding)
  }
  return vectors
}

export interface ChatTurn {
  role: "user" | "assistant"
  content: string
}

export async function completeChat(system: string, turns: ChatTurn[]): Promise<string> {
  const payload = await openAi("chat/completions", {
    model: CHAT_MODEL,
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      ...turns.map((turn) => ({ role: turn.role, content: turn.content })),
    ],
  }) as { choices?: { message?: { content?: string } }[] }
  return payload.choices?.[0]?.message?.content?.trim() ?? ""
}
