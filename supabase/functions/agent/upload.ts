import { assertOwner, isResponse, requireUser } from "./auth.ts"
import { json } from "./http.ts"
import { storeChunks } from "./ingest.ts"
import { openAiConfigured } from "./openai.ts"
import { chunkText, extractUploadText } from "./text.ts"

const MAX_BYTES = 8_000_000

export async function handleUpload(req: Request) {
  const user = await requireUser(req)
  if (isResponse(user)) return user
  if (!openAiConfigured()) {
    return json(503, { error: "Uploads are not configured. Add OPENAI_API_KEY to the Supabase function secrets." })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return json(400, { error: "Expected a file upload." })
  }

  const denied = assertOwner(user.id, String(form.get("userId") ?? ""))
  if (denied) return denied

  const file = form.get("data")
  if (!(file instanceof File)) return json(400, { error: "Choose a file to upload." })
  if (file.size > MAX_BYTES) return json(400, { error: "That file is larger than 8 MB." })

  const fileName = String(form.get("fileName") ?? file.name)
  const fileType = String(form.get("fileType") ?? file.type)
  const bytes = new Uint8Array(await file.arrayBuffer())

  let text = ""
  try {
    text = await extractUploadText(bytes, fileType, fileName)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not read that file."
    return json(400, { error: message })
  }

  const chunks = chunkText(text)
  if (chunks.length === 0) return json(400, { error: "No text found in that file." })

  const stored = await storeChunks(chunks, { userId: user.id, source: fileName })
  return json(200, { ok: true, fileName, chunks: stored })
}
