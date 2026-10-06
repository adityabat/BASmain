# BAS Agentic — Design Document and Change Playbook

Product design, integration design, and **step-by-step procedures** to change n8n workflows, YouTube transcript retrieval, or OpenAI.

---

## 1. Product design

### 1.1 Problem

Operators need one workspace to (1) ask an agent about their documents, (2) pull text from YouTube, and (3) ingest files — with a free cap and a paid Pro tier.

### 1.2 Personas

- **Free user:** tries chat, a few PDFs/CSVs, a few transcripts.
- **Pro user:** unlimited ingest/transcripts; can schedule cancellation at period end.
- **Operator / you:** edits n8n graphs and Stripe without shipping a new mobile app (web only).

### 1.3 Information architecture

Unauthenticated: landing → login/signup.

Authenticated primary nav (tabs, not routes):

| Tab | Job to be done |
|---|---|
| Chat | Conversational Q&A (OpenAI via n8n) |
| Transcripts | Paste YouTube URL → readable text |
| Upload | Queue files → n8n ingest |
| History | Recent **uploads** only |

Chrome: usage meters (documents / transcripts), plan pill, theme, logout.

### 1.4 UX principles (as implemented)

- Dark-first theme with light toggle.
- Green primary actions, blue active tab.
- Limit hit → modal, not a silent failure.
- Transcript and upload wait up to 60s with a spinner.
- Chat is non-streaming; typing indicator only.
- Assistant messages render markdown; user messages are plain text.

### 1.5 Non-goals (current)

- No in-app n8n editor.
- No direct OpenAI or YouTube SDK in the browser.
- No transcript list in History.
- No server-side enforcement of free limits (UI only).

---

## 2. Integration design

### 2.1 Why n8n sits in the middle

n8n owns secrets and long-running graph logic (transcript crawl, chunking, embeddings, agents). The SPA stays a thin client: POST webhook, show result, log to Supabase.

```
[SPA] --JSON/FormData--> [n8n Webhook]
                            |-- YouTube transcript API
                            |-- OpenAI Chat / Embeddings
                            |-- Supabase Postgres (service role)
                            `-- Respond to Webhook --> [SPA]
[SPA] --JWT--> [Supabase]  (auth, history, plans)
[SPA] --JWT--> [Edge Fn] --> [Stripe]
```

### 2.2 Designed request field names

Do not rename these in n8n without a frontend change:

| Workflow | Required inbound fields |
|---|---|
| Chat | `chatInput`, `sessionId`, `userId` |
| Fetch transcript | `videoUrl`, `userId` |
| Upload | binary `data` + `fileName`, `fileType`, `fileSize`, `userId`, `session` |

### 2.3 Designed response shapes

| Workflow | Frontend adapter |
|---|---|
| Chat | `output` preferred |
| Transcript | `pageContent` preferred (LangChain Document) |
| Upload | any JSON (stored as text) |

### 2.4 Failure design

| Layer | Behaviour |
|---|---|
| Invalid YouTube URL | Client error, no webhook call |
| n8n timeout / 5xx | UI error; history row `status=error` for transcript/upload |
| Chat HTTP error | Assistant error bubble; no DB row |
| Stripe failure | Modal error; stay on page |

---

## 3. Agent function (replaces the n8n graphs)

Chat, upload, and transcript now run in `supabase/functions/agent`. The notes below describe the behaviour that function preserves. Model and prompt changes belong in that function, not in n8n.

### 3.1 Chat (`/webhook/Chat`) — OpenAI

Suggested nodes:

1. **Webhook** (POST, path `Chat`, response mode: last node / webhook response)
2. **Set / Edit Fields** — map `chatInput`, `sessionId`, `userId`
3. Optional **Supabase** `user_plans` lookup — reject free-plan abuse
4. **Postgres Chat Memory** — table `n8n_chat_histories`, session key `{{userId}}:{{sessionId}}`
5. Optional **Embeddings + Supabase Vector Store** — `match_documents`
6. **OpenAI Chat Model** — model name, temperature, system prompt
7. **Agent / Basic LLM Chain**
8. **Respond to Webhook** — body `{ "output": "<string>" }`

**To change the OpenAI model:** edit node 6 only if the response remains `{ output: string }`.

### 3.2 YouTube transcript (`/webhook/fetch`)

Suggested nodes:

1. **Webhook** POST path `fetch`
2. Validate `videoUrl`
3. **YouTube** transcript node **or** HTTP Request to a transcript API (e.g. community node `youtube-transcript`, RapidAPI, or official captions)
4. Optional **OpenAI** — clean timestamps / summarize (only if the SPA should show the model output rather than raw captions)
5. **Respond to Webhook** — `{ "pageContent": "<full text>" }` **or** an array of `{ pageContent }`
6. Optional **Supabase** insert into `public.transcripts` (SPA already writes `transcript_history`)

If you add summarization, keep a `pageContent` (or `text`) string so `parseTranscript` does not dump raw JSON.

### 3.3 Upload (`/webhook/upload`)

Suggested nodes:

1. **Webhook** POST path `upload` (multipart)
2. Extract binary `data`
3. **Extract from File** / PDF / CSV
4. Split text
5. **OpenAI Embeddings**
6. **Supabase** insert `documents` (`content`, `metadata` including `userId`, `embedding`)
7. Respond `{ "ok": true, "chunks": n }`

---

## 4. Playbook: change an n8n workflow (no API vendor change)

Use this when you only change prompts, models, or node order.

1. Open [n8n Cloud](https://m-objectsai.app.n8n.cloud) → the workflow whose production URL matches the constant in code (`Chat`, `fetch`, or `upload`).
2. Duplicate the workflow or save a version so you can roll back.
3. Use **Test URL** while editing. Do not point production SPA at the test URL unless you temporarily patch the constant.
4. Keep the **Webhook path** (`Chat`, `fetch`, `upload`) unless you will also change the SPA (section 5).
5. Keep inbound JSON/FormData field names (section 2.2).
6. Keep outbound fields the adapters already read (section 2.3).
7. Pin OpenAI credentials on the node; never paste keys into Function nodes that might log body.
8. Execute once with n8n’s sample payload:
   - Chat: `{ "chatInput": "ping", "sessionId": "test", "userId": "<your uuid>" }`
   - Fetch: `{ "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "userId": "<uuid>" }`
   - Upload: attach a small `.txt` as `data`
9. Confirm the webhook response JSON in n8n’s output panel.
10. Activate the workflow. Production URL only works when **Active**.
11. In the SPA (`npm run dev`), run the matching tab and watch Network:
    - Chat: 200 + assistant markdown
    - Transcripts: parsed text, new `transcript_history` row
    - Upload: 100% + `upload_history` success
12. If RAG broke, in Supabase SQL: `select count(*) from documents;` and try `match_documents` with a known embedding.

**Rollback:** deactivate the new workflow, re-activate the previous copy, restore the old production path.

---

## 5. Playbook: change the webhook URL or path

SPA constants today:

```
src/components/ChatWidget.tsx          CHAT_WEBHOOK_URL
src/components/TranscriptExtractor.tsx TRANSCRIPT_WEBHOOK
src/uploadService.ts                   WEBHOOK_URL
```

Steps:

1. In n8n, set the new Webhook path or migrate to another instance.
2. Copy the **Production** URL (not Test).
3. Replace the matching constant. Prefer introducing env vars:

```ts
const TRANSCRIPT_WEBHOOK = import.meta.env.VITE_N8N_FETCH_URL
```

4. Add the same values to hosting (Netlify/Vercel/etc.) `VITE_*` settings. Rebuild; Vite inlines env at build time.
5. CORS: n8n Cloud webhooks typically allow browser POST. If you self-host n8n, enable CORS for the SPA origin.
6. Smoke-test all three tabs; unused tabs still have old URLs if you only changed one file.

---

## 6. Playbook: change the YouTube transcript provider

The browser never calls YouTube. Change **n8n node 3** in workflow `fetch`.

### 6.1 Swap node, keep response shape (preferred)

1. Identify current node (YouTube Transcript, HTTP Request, Code).
2. Add the new node (new API, yt-dlp sidecar, RapidAPI, etc.).
3. Map `videoUrl` into the new node’s video id. If the API wants an id only, extract `v=` or the `youtu.be` slug in a Code node.
4. Normalize output to `{ pageContent: string }` or `[{ pageContent: string }, …]`.
5. Test with:
   - Standard watch URL
   - `youtu.be` short URL
   - Video with no captions (should 4xx; SPA shows error and writes `transcript_history` error)
   - Very long video (may exceed 60s axios timeout — raise timeout in `TranscriptExtractor` and n8n)
6. Do **not** change `TranscriptExtractor.tsx` if `pageContent` / `text` still arrive.

### 6.2 New response JSON (requires SPA change)

If the new API returns `{ "transcript": "…" }` only:

1. Either add n8n **Set** node `pageContent = {{ $json.transcript }}`, **or**
2. Extend `parseTranscript` in `TranscriptExtractor.tsx`:

```ts
if (typeof o.transcript === 'string' && o.transcript.trim()) return o.transcript.trim()
```

3. Manually run Extract and confirm History/usage increment.

### 6.3 Call YouTube from a Supabase Edge Function instead of n8n

1. Create `supabase/functions/youtube-transcript` that accepts JWT, checks `user_plans` / counts, calls the transcript API with a **server** secret.
2. Point `TRANSCRIPT_WEBHOOK` at `https://tpxouggkkyljrmmhdlbr.supabase.co/functions/v1/youtube-transcript`.
3. Deactivate n8n `fetch` when cutover is done.
4. Keep the same request body `{ userId, videoUrl }` to minimize UI diff.

This is the right move if you need to hide the webhook and enforce quotas server-side.

---

## 7. Playbook: change OpenAI model or provider

OpenAI is **only** inside n8n. No React OpenAI client to update.

### 7.1 Same provider, new model (e.g. GPT-4.1 → GPT-5 family)

1. Open Chat workflow → OpenAI Chat Model node → change model id.
2. If you use embeddings on upload, open Upload workflow → Embeddings node.
3. **Embedding dimension:** if the vector size changes, you must:
   - create a new `documents` embedding column or table
   - re-ingest files (old vectors are incompatible)
   - update `match_documents` to the new column
4. Adjust context window / max tokens if replies truncate.
5. Test Chat with a question that requires a previously uploaded doc (RAG) and one that does not.

### 7.2 Azure OpenAI / OpenAI-compatible base URL

1. Create a new n8n credential (Azure OpenAI or OpenAI with custom base URL).
2. Attach it to Chat Model and Embeddings nodes.
3. Confirm the node still returns a string the Agent writes to `output`.
4. No SPA change if the webhook JSON is unchanged.

### 7.3 Replace OpenAI with another vendor in n8n

1. Drop in Anthropic / Google / local LLM nodes.
2. Keep the Agent’s final string mapped to webhook `{ output }`.
3. Revisit system prompt; tool-calling JSON may differ.
4. Update product copy (“AI chat”) only if you must disclose the vendor.

### 7.4 Call OpenAI from the SPA (not recommended)

Would expose keys or force a new Edge Function proxy. If you do it:

1. Add Edge Function `chat` with user JWT + OpenAI secret.
2. Replace `CHAT_WEBHOOK_URL` with that function URL.
3. Reimplement memory (`n8n_chat_histories` or a new table).
4. Retire n8n Chat workflow.

---

## 8. Playbook: change both API and n8n together (checklist)

Work **n8n first** (test URL), **then** SPA, then production webhook.

- [ ] Write the new request/response examples in this file (section 2).
- [ ] Implement n8n Test webhook; capture a real response body.
- [ ] Update parser / payload in exactly one of: `ChatWidget.tsx`, `TranscriptExtractor.tsx`, `uploadService.ts`.
- [ ] If new env vars, rebuild the static host.
- [ ] Verify Chat, Transcripts, Upload, History, upgrade modal (unchanged).
- [ ] Switch n8n to Production URL / activate.
- [ ] Flip SPA constants from test to production.
- [ ] Deactivate obsolete workflows so old URLs 404.
- [ ] Confirm Stripe flows still unused by this change.

---

## 9. Playbook: add authentication to n8n webhooks

Current design: public HTTPS POSTs with only `userId` in the body (spoofable).

Recommended design:

1. Generate a long random `N8N_WEBHOOK_SECRET`.
2. In n8n Webhook node, Header Auth or an IF node: `X-Webhook-Secret` equals the secret.
3. In the three SPA callers, send that header from `import.meta.env.VITE_N8N_WEBHOOK_SECRET`.
   - Note: a Vite `VITE_*` secret is **visible in the browser bundle**. This only stops casual URL scraping, not a determined client.
4. For real security, **proxy through a Supabase Edge Function** that verifies JWT, checks plan limits, then server-side `fetch`es n8n with a secret that never ships to the client.

---

## 10. Playbook: change plan limits or monthly windows

1. Edit `FREE_UPLOAD_LIMIT` / `FREE_TRANSCRIPT_LIMIT` in `UsageContext.tsx`.
2. Update `LandingPage.tsx` and `UpgradeModal.tsx` copy (they import the same constants — good).
3. If you need **per calendar month**, change `fetchUsage` queries:

```ts
.gte('created_at', startOfUtcMonthIso)
```

4. Mirror the same check in n8n or an Edge proxy (section 9.4) or limits remain cosmetic.
5. Align the outdated “3 uploads” comment in `create_user_plans` migration only if you rewrite docs; do not edit old applied migrations in place on production.

---

## 11. Playbook: Stripe / billing (not n8n, often confused)

| Change | Where |
|---|---|
| Price | Stripe Dashboard + `STRIPE_PRICE_ID` or `PRO_PRICE_DATA` in `stripe-checkout` |
| Success redirect | `UpgradeModal` `successUrl` |
| Cancel at period end | `stripe-cancel` + `CancelSubscriptionModal` |
| Grant/revoke Pro | `stripe-webhook` writes `user_plans` |

Changing OpenAI or YouTube does not require Stripe changes.

---

## 12. Testing matrix after any integration change

| # | Action | Expect |
|---|---|---|
| 1 | Chat hello | Markdown reply, no console CORS error |
| 2 | Chat follow-up | Memory via `sessionId` |
| 3 | Transcript valid URL | Text + `transcript_history` success |
| 4 | Transcript bad URL | Client validation, no network |
| 5 | Transcript no captions | Error row in `transcript_history` |
| 6 | Upload txt/pdf/csv | Success + history table |
| 7 | Free user at limit | Upgrade modal, no webhook |
| 8 | Pro user | No modal |
| 9 | Logout / login | Same user history |

---

## 13. Design decisions log

| Decision | Rationale |
|---|---|
| n8n owns YouTube + OpenAI | Secrets and multi-step graphs stay off the client |
| SPA writes history | Works even if n8n DB insert fails; usage meters stay in-app |
| Hardcoded webhook URLs | Fast bootstrap; replace with env before multi-environment deploy |
| No React Router | Four tabs, one authenticated shell |
| Chat unlimited on free | Monetize ingest/transcripts first |
