import { insertDocuments } from "./db.ts"
import { embedTexts } from "./openai.ts"

export async function storeChunks(chunks: string[], metadata: Record<string, string>) {
  if (chunks.length === 0) return 0
  const vectors = await embedTexts(chunks)
  await insertDocuments(chunks, vectors, metadata)
  return chunks.length
}
