# BAS Agentic

Web workspace for AI chat, document upload, and YouTube transcript extraction. The UI is a Vite + React app; **OpenAI and YouTube APIs run inside n8n Cloud**, not in this repository.

## Docs (Word — download these)

Open or copy from `docs/word/`:

- [Architecture](docs/word/BAS_Agentic_Architecture.docx)
- [Design](docs/word/BAS_Agentic_Design.docx) — product design plus n8n / API change steps
- [Code map](docs/word/BAS_Agentic_Code_Map.docx) — YouTube transcript, n8n, OpenAI locations
- [All three in one file](docs/word/BAS_Agentic_Architecture_Design_and_Code_Map.docx)

Markdown copies remain under `docs/` for in-repo reading. Technical notes: [technical.md](docs/technical.md).

## Quick start

```bash
npm install
npm run dev
```

Requires a browser env var `VITE_SUPABASE_URL` for Stripe checkout/cancel. The Supabase JS client URL is currently set in `src/supabase.ts`.

## Stack

React 18, TypeScript, Tailwind, Supabase (Auth, Postgres, Edge Functions), Stripe, n8n Cloud (`m-objectsai.app.n8n.cloud`).
