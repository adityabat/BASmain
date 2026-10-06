const CHUNK_SIZE = 1000
const CHUNK_OVERLAP = 200
const MAX_CHUNKS = 40

export function chunkText(input: string): string[] {
  const text = input.replace(/\s+/g, " ").trim()
  if (!text) return []
  if (text.length <= CHUNK_SIZE) return [text]

  const chunks: string[] = []
  let start = 0
  while (start < text.length && chunks.length < MAX_CHUNKS) {
    const end = Math.min(start + CHUNK_SIZE, text.length)
    chunks.push(text.slice(start, end))
    if (end === text.length) break
    start = end - CHUNK_OVERLAP
  }
  return chunks
}

function mimeOf(mime: string, fileName: string): string {
  const lower = fileName.toLowerCase()
  if (mime === "application/pdf" || lower.endsWith(".pdf")) return "pdf"
  if (mime === "text/csv" || lower.endsWith(".csv")) return "csv"
  if (mime === "text/plain" || lower.endsWith(".txt")) return "text"
  return ""
}

export async function extractUploadText(bytes: Uint8Array, mime: string, fileName: string): Promise<string> {
  const kind = mimeOf(mime, fileName)
  if (!kind) {
    throw new Error("Upload a PDF, CSV, or text file.")
  }
  if (kind === "pdf") {
    const { extractText, getDocumentProxy } = await import("npm:unpdf")
    const pdf = await getDocumentProxy(bytes)
    const result = await extractText(pdf, { mergePages: true })
    const text = Array.isArray(result.text) ? result.text.join("\n") : String(result.text ?? "")
    return text
  }
  return new TextDecoder().decode(bytes)
}
