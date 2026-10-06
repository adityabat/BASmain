import { handleChat } from "./chat.ts"
import { corsHeaders, json } from "./http.ts"
import { handleReport } from "./report.ts"
import { handleTranscript } from "./transcript.ts"
import { handleUpload } from "./upload.ts"

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  if (req.method !== "POST") return json(405, { error: "Method not allowed" })

  try {
    const contentType = req.headers.get("content-type") ?? ""
    if (contentType.includes("multipart/form-data")) {
      return await handleUpload(req)
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return json(400, { error: "Invalid JSON" })
    }

    if (body.action === "transcript" || typeof body.videoUrl === "string") {
      return await handleTranscript(req, body)
    }
    if (body.action === "report") {
      return await handleReport(req, body)
    }
    return await handleChat(req, body)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong."
    console.error("agent", message)
    return json(500, { error: message })
  }
})
