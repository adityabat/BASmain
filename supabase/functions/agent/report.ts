import { isResponse, requireUser } from "./auth.ts"
import { json, asString } from "./http.ts"
import { completeChat, openAiConfigured } from "./openai.ts"

const PROMPTS: Record<string, string> = {
  executive: `Rewrite the conversation as an executive report in markdown.
Use only facts from the conversation. Do not add new claims.
Use these sections:
## Executive summary
## Key findings
## Implications
## Recommended actions
Keep it short. Prefer bullets for findings and actions.`,
  business: `Rewrite the conversation as a business report in markdown.
Use only facts from the conversation. Do not add new claims.
Use these sections:
## Purpose
## Situation
## Analysis
## Business impact
## Risks
## Next steps
Prefer short paragraphs and bullets.`,
}

export async function handleReport(req: Request, body: Record<string, unknown>) {
  const user = await requireUser(req)
  if (isResponse(user)) return user

  const reportType = asString(body.reportType, 20)
  const transcript = asString(body.transcript, 30000)
  const instructions = PROMPTS[reportType]
  if (!instructions) return json(400, { error: "Choose a report type." })
  if (!transcript) return json(400, { error: "There is no chat to convert." })
  if (!openAiConfigured()) {
    return json(503, { error: "Reports are not configured. Add OPENAI_API_KEY to the Supabase function secrets." })
  }

  const output = await completeChat(instructions, [{ role: "user", content: transcript }])
  if (!output) return json(502, { error: "The report came back empty." })
  return json(200, { output })
}
