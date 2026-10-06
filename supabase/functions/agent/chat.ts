import { assertOwner, isResponse, requireUser } from "./auth.ts"
import { loadChatTurns, matchDocuments, saveChatTurn } from "./db.ts"
import { json, asString } from "./http.ts"
import { completeChat, embedTexts, openAiConfigured } from "./openai.ts"

const SYSTEM = `You are a helpful assistant who helps answer questions based on documents in the knowledge base.

When answering questions:
- Use the retrieved document excerpts
- Provide accurate answers based on those excerpts
- If you cannot find relevant information, say "I don't have information about that in the available documents"
- Cite which documents you are referencing when possible
- Be concise and helpful

Do not make up information that isn't found in the retrieved documents.`

export async function handleChat(req: Request, body: Record<string, unknown>) {
  const user = await requireUser(req)
  if (isResponse(user)) return user
  const denied = assertOwner(user.id, asString(body.userId, 80))
  if (denied) return denied

  const chatInput = asString(body.chatInput, 4000)
  const sessionId = asString(body.sessionId, 255)
  if (!chatInput) return json(400, { error: "Type a message first." })
  if (!sessionId) return json(400, { error: "Missing chat session." })
  if (!openAiConfigured()) {
    return json(503, { error: "The assistant is not configured. Add OPENAI_API_KEY to the Supabase function secrets." })
  }

  const [history, queryVector] = await Promise.all([
    loadChatTurns(sessionId),
    embedTexts([chatInput]),
  ])
  const matches = await matchDocuments(user.id, queryVector[0], 4)
  const excerpts = matches.length
    ? matches.map((row, index) => {
      const source = typeof row.metadata?.source === "string" ? row.metadata.source : "document"
      return `[${index + 1}] ${source}\n${row.content}`
    }).join("\n\n")
    : "No documents were retrieved for this user."

  const reply = await completeChat(
    `${SYSTEM}\n\nRetrieved documents:\n${excerpts}`,
    [...history, { role: "user", content: chatInput }],
  )
  if (!reply) return json(502, { error: "The assistant returned an empty reply." })

  await saveChatTurn(sessionId, "human", chatInput)
  await saveChatTurn(sessionId, "ai", reply)
  return json(200, { output: reply })
}
