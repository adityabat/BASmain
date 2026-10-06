import { assertOwner, isResponse, requireUser } from "./auth.ts"
import { upsertTranscript } from "./db.ts"
import { json, asString } from "./http.ts"
import { storeChunks } from "./ingest.ts"
import { openAiConfigured } from "./openai.ts"
import { chunkText } from "./text.ts"

function transcriptText(payload: Record<string, unknown>): string {
  const value = payload.transcript
  if (typeof value === "string") return value.trim()
  if (!Array.isArray(value)) return ""
  return value.map((part) => {
    if (typeof part === "string") return part
    if (part && typeof part === "object" && "text" in part) return String((part as { text: unknown }).text ?? "")
    return ""
  }).join(" ").replace(/\s+/g, " ").trim()
}

export async function handleTranscript(req: Request, body: Record<string, unknown>) {
  const user = await requireUser(req)
  if (isResponse(user)) return user
  const videoUrl = asString(body.videoUrl, 500)
  const denied = assertOwner(user.id, asString(body.userId, 80))
  if (denied) return denied
  if (!videoUrl) return json(400, { error: "Enter a YouTube URL." })

  const rapidKey = Deno.env.get("RAPIDAPI_KEY") ?? ""
  if (!rapidKey) {
    return json(503, { error: "Transcripts are not configured. Add RAPIDAPI_KEY to the Supabase function secrets." })
  }

  const endpoint = new URL("https://youtube-transcript3.p.rapidapi.com/api/transcript-with-url")
  endpoint.searchParams.set("url", videoUrl)
  endpoint.searchParams.set("flat_text", "true")
  endpoint.searchParams.set("lang", "en")

  const fetched = await fetch(endpoint, {
    headers: {
      "x-rapidapi-host": "youtube-transcript3.p.rapidapi.com",
      "x-rapidapi-key": rapidKey,
    },
  })
  const payload = await fetched.json().catch(() => ({})) as Record<string, unknown>
  if (!fetched.ok || payload.success === false) {
    return json(502, { error: "Could not fetch that transcript." })
  }

  const transcript = transcriptText(payload)
  if (!transcript) return json(502, { error: "That video did not return a transcript." })

  await upsertTranscript(user.id, videoUrl, transcript)

  if (openAiConfigured()) {
    const chunks = chunkText(transcript)
    if (chunks.length) {
      await storeChunks(chunks, { userId: user.id, source: videoUrl })
    }
  }

  return json(200, { pageContent: transcript, text: transcript })
}
