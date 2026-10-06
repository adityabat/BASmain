# Documentation status

| Item | Status |
|---|---|
| Architecture | Word: `docs/word/BAS_Agentic_Architecture.docx` |
| Design | Word: `docs/word/BAS_Agentic_Design.docx` |
| Code map | Word: `docs/word/BAS_Agentic_Code_Map.docx` |
| Combined download | `docs/word/BAS_Agentic_Architecture_Design_and_Code_Map.docx` |
| Technical contracts (markdown) | `docs/technical.md` |
| n8n workflow | Replaced by `supabase/functions/agent` (chat, upload, transcript) |

When you change webhook URLs, payload fields, or plan limits, update `architecture.md`, `code-map.md`, `technical.md`, and `design.md` in the same change.

**Current:** Chat, document upload, and YouTube transcripts call the Supabase `agent` Edge Function instead of n8n. Secrets required on that function: `OPENAI_API_KEY` and `RAPIDAPI_KEY`. The chat tab stays mounted and messages are stored per user in localStorage, so switching to Upload and back keeps the thread. Each assistant reply has a Word button that downloads `chat-response.docx`.
