# BAS Agentic — Code Map

This is a file-level map of the Git repository. Use it to find **YouTube transcript**, **n8n**, and **OpenAI** touchpoints before editing.

---

## Direct answers

### Where is the YouTube Transcript API coded?

**Not in this repo as a YouTube API client.**

The SPA only:

1. Validates a YouTube URL (`youtube.com/watch?v=` or `youtu.be/`)
2. `POST`s `{ userId, videoUrl }` to the n8n webhook
3. Parses whatever n8n returns (`pageContent`, `text`, JSON array, or concatenated JSON objects)

| What | Path |
|---|---|
| Client + parser | `src/components/TranscriptExtractor.tsx` |
| Tab wiring + usage limit | `src/App.tsx` (tab `transcripts`) |
| Row type | `src/types.ts` → `TranscriptRecord` |
| Persistence | `transcript_history` via `supabase.from('transcript_history').insert(...)` |
| Schema | `supabase/migrations/20260702012457_create_transcript_history.sql` |
| Duplicate older migration | `supabase/migrations/20260625051628_create_transcript_history.sql` |
| Separate n8n-oriented table (not used by SPA) | `public.transcripts` RLS in `supabase/migrations/20260702032251_fix_security_issues.sql` |

**Actual YouTube caption download** lives in the n8n workflow whose production URL is:

`https://m-objectsai.app.n8n.cloud/webhook/fetch`

Open that workflow in [n8n Cloud](https://m-objectsai.app.n8n.cloud). Typical nodes: Webhook → YouTube Transcript / HTTP Request → (optional OpenAI) → Respond to Webhook.

---

### Where are n8n calls?

All three are **hardcoded webhook constants** (not env vars):

| Constant | File | HTTP |
|---|---|---|
| `CHAT_WEBHOOK_URL` | `src/components/ChatWidget.tsx` line 4 | `fetch` POST JSON |
| `TRANSCRIPT_WEBHOOK` | `src/components/TranscriptExtractor.tsx` line 5 | `axios.post` JSON |
| `WEBHOOK_URL` | `src/uploadService.ts` line 3 | `axios.post` `FormData` |

Host: `m-objectsai.app.n8n.cloud`.

There is **no** n8n workflow export under `supabase/` or `src/`.

---

### Where are OpenAI API calls?

**Nowhere in this codebase.** `package.json` has no `openai` dependency. Edge Functions call Stripe only.

OpenAI is invoked **inside n8n** (Chat Model / embeddings / summarization nodes) using credentials stored in n8n, not Vite.

Inference from this repo (n8n likely uses OpenAI because):

- Chat webhook returns an assistant `output` string rendered as markdown
- Postgres function `match_documents(query_embedding vector, …)` is a RAG similarity search
- Security migration comment: n8n uses **service_role** against `n8n_chat_histories`

To change the model: edit the n8n workflow, not React.

---

## Repository tree (source only)

```
project/
├── index.html
├── package.json              # name: n8n-file-upload
├── vite.config.ts
├── src/
│   ├── main.tsx              # providers + App
│   ├── App.tsx               # routing-by-tab, upload orchestration
│   ├── supabase.ts           # createClient (URL + anon key hardcoded)
│   ├── uploadService.ts      # n8n /webhook/upload
│   ├── types.ts
│   ├── index.css
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── UsageContext.tsx  # free limits, plan, Stripe cancel flags
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   └── AuthPage.tsx
│   └── components/
│       ├── ChatWidget.tsx           # n8n Chat → OpenAI (remote)
│       ├── TranscriptExtractor.tsx  # n8n fetch → YouTube (remote)
│       ├── DropZone.tsx
│       ├── FileList.tsx
│       ├── UploadHistory.tsx
│       ├── UpgradeModal.tsx         # stripe-checkout
│       └── CancelSubscriptionModal.tsx  # stripe-cancel
├── supabase/
│   ├── config.toml           # project_id, JWT on checkout/cancel
│   ├── migrations/           # Postgres schema
│   └── functions/
│       ├── stripe-checkout/index.ts
│       ├── stripe-cancel/index.ts
│       └── stripe-webhook/index.ts
└── docs/                     # this documentation set
```

---

## File responsibilities

### Frontend entry and shell

| File | Responsibility | External I/O |
|---|---|---|
| `src/main.tsx` | Mount React, wrap providers | none |
| `src/App.tsx` | Auth gate, tabs, upload-all, usage UI | `upload_history` insert |
| `src/supabase.ts` | Singleton Supabase client | Auth + PostgREST |

### AI / n8n clients

| File | Responsibility | External I/O |
|---|---|---|
| `src/components/ChatWidget.tsx` | Chat UI, session id, markdown replies | n8n `/webhook/Chat` |
| `src/components/TranscriptExtractor.tsx` | URL form, parser, copy transcript | n8n `/webhook/fetch`; `transcript_history` |
| `src/uploadService.ts` | Multipart upload + progress | n8n `/webhook/upload` |

### Auth, usage, billing UI

| File | Responsibility | External I/O |
|---|---|---|
| `src/context/AuthContext.tsx` | Session, signOut, recovery flag | `supabase.auth` |
| `src/pages/AuthPage.tsx` | Login, signup, forgot, reset | `signInWithPassword`, `signUp`, `resetPasswordForEmail`, `updateUser` |
| `src/context/UsageContext.tsx` | Plan + counts + upgrade poll | `user_plans`, `upload_history`, `transcript_history`, `stripe_user_subscriptions` |
| `src/components/UpgradeModal.tsx` | Checkout redirect | Edge `stripe-checkout` |
| `src/components/CancelSubscriptionModal.tsx` | Cancel / resume Pro | Edge `stripe-cancel` |
| `src/pages/LandingPage.tsx` | Marketing, pricing copy | none |

### Upload UX (no n8n until App calls `uploadFileToWebhook`)

| File | Responsibility |
|---|---|
| `src/components/DropZone.tsx` | react-dropzone, `.txt` `.pdf` `.csv` |
| `src/components/FileList.tsx` | Per-file progress / retry |
| `src/components/UploadHistory.tsx` | Last 50 `upload_history` rows |
| `src/types.ts` | `FileUploadItem`, `UploadRecord`, `TranscriptRecord` |
| `src/context/ThemeContext.tsx` | light/dark class on `<html>` |

### Supabase Edge Functions (Stripe only)

| File | Responsibility |
|---|---|
| `supabase/functions/stripe-checkout/index.ts` | Authenticated Checkout Session |
| `supabase/functions/stripe-cancel/index.ts` | `cancel_at_period_end` toggle |
| `supabase/functions/stripe-webhook/index.ts` | Stripe events → DB + `user_plans` |

### Migrations (data model)

| Migration | Creates / changes |
|---|---|
| `20260616032753_create_upload_history.sql` | `upload_history` (originally public anon policies) |
| `20260618032046_…_add_user_id_to_upload_history.sql` | `user_id` + owner RLS |
| `20260622005333_enforce_user_id_not_null.sql` | `user_id` NOT NULL |
| `20260625051628_create_transcript_history.sql` | early `transcript_history` |
| `20260702012457_create_transcript_history.sql` | current `transcript_history` + RLS |
| `20260702005650` / `20260702012510_create_user_plans.sql` | `user_plans` |
| `20260702023140_wandering_lake.sql` | Stripe tables + views (duplicate of next) |
| `20260702023224_solitary_mouse.sql` | Stripe tables + views |
| `20260702032251_fix_security_issues.sql` | RLS on `n8n_chat_histories`, `documents`, `transcripts`; `match_documents` |

Tables `documents`, `n8n_chat_histories`, and `transcripts` are **assumed created outside these files** (often by n8n Supabase node templates). The SPA never queries them.

---

## Symbol index (search this repo)

| Search term | Meaning |
|---|---|
| `TRANSCRIPT_WEBHOOK` | YouTube path into n8n |
| `CHAT_WEBHOOK_URL` | OpenAI chat path into n8n |
| `WEBHOOK_URL` | Upload path into n8n |
| `m-objectsai.app.n8n.cloud` | All n8n hosts |
| `parseTranscript` | n8n response adapter |
| `chatInput` | Chat request field n8n must read |
| `pageContent` | LangChain-style transcript chunk field |
| `match_documents` | RAG SQL used by n8n, not SPA |
| `FREE_TRANSCRIPT_LIMIT` | Client quota (3) |
| `VITE_SUPABASE_URL` | Used only for Stripe function URLs |

---

## What is *not* in Git

- n8n workflow JSON / credentials
- OpenAI API keys or model names
- YouTube API keys
- Stripe secret keys (Edge Function secrets)
- `.env` example for webhook URLs (they are inline constants)
