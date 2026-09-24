# BAS Agentic — Technical Specification

Stack, contracts, schema, and environment. Pair with [architecture.md](./architecture.md) and [design.md](./design.md).

---

## 1. Technology stack

| Layer | Choice |
|---|---|
| UI | React 18, TypeScript, Vite 5 |
| Styling | Tailwind CSS 3, dark mode via `class` on `documentElement` |
| HTTP | axios (upload + transcript), `fetch` (chat + Stripe) |
| Markdown | `react-markdown` in chat replies |
| Files | `react-dropzone` |
| Backend BaaS | Supabase (Auth PKCE, Postgres, Edge Functions) |
| Orchestration / AI | n8n Cloud (`m-objectsai.app.n8n.cloud`) |
| LLM | OpenAI (inside n8n only) |
| Transcripts | YouTube via n8n (inside n8n only) |
| Payments | Stripe Checkout subscriptions (AUD 29.00 fallback) |

Scripts (`package.json`): `dev` → Vite; `build` → `tsc && vite build`; `preview` → Vite preview.

---

## 2. Environment and configuration

### 2.1 Vite / browser

| Variable | Used by | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | `UpgradeModal`, `CancelSubscriptionModal` | Must match project URL. **Not** used by `src/supabase.ts`. |
| (missing) n8n URLs | hardcoded | Should be `VITE_N8N_CHAT_URL`, `VITE_N8N_FETCH_URL`, `VITE_N8N_UPLOAD_URL` when you externalize them |
| (missing) webhook secret | none | Send `X-Webhook-Secret` if n8n is locked down |

`src/supabase.ts` currently embeds:

- URL: `https://tpxouggkkyljrmmhdlbr.supabase.co`
- Anon JWT (publishable / `role: anon`) — acceptable for a public client, but should still be env-driven so staging/prod can differ.

### 2.2 Supabase Edge Function secrets

| Secret | Functions |
|---|---|
| `STRIPE_SECRET_KEY` | checkout, cancel, webhook |
| `STRIPE_WEBHOOK_SECRET` | webhook |
| `STRIPE_PRICE_ID` | checkout (optional; else inline `price_data`) |
| `SUPABASE_URL` | auto |
| `SUPABASE_ANON_KEY` | auto |
| `SUPABASE_SERVICE_ROLE_KEY` | auto |

`supabase/config.toml`: `verify_jwt = true` for `stripe-checkout` and `stripe-cancel`.

### 2.3 n8n credentials (not in Git)

Store in n8n credential manager:

- OpenAI API key (or Azure OpenAI / compatible base URL)
- YouTube / transcript HTTP credentials if required
- Supabase service role (for `documents`, `n8n_chat_histories`)

---

## 3. HTTP contracts (SPA ↔ n8n)

Keep these stable when you edit workflows. If you change a field name, update the corresponding TypeScript file in the same PR.

### 3.1 Chat — `POST /webhook/Chat`

**Request** (`ChatWidget.tsx`):

```json
{
  "chatInput": "user message",
  "sessionId": "24-char alphanumeric from localStorage chat_session_id",
  "userId": "<auth.users uuid>"
}
```

**Expected response:** JSON object or one-element array. First matching string wins:

`payload.output` → `payload.message` → `payload.text` → `payload.response` → `JSON.stringify(payload)`

**Timeouts / errors:** non-OK HTTP becomes an assistant bubble `Error: Request failed (status)`.

**n8n mapping tips:** Webhook node JSON body; LangChain agent `chatInput`; Postgres Chat Memory keyed by `sessionId` (and preferably `userId` so users cannot collide).

### 3.2 YouTube transcript — `POST /webhook/fetch`

**Request** (`TranscriptExtractor.tsx`):

```json
{
  "userId": "<auth.users uuid>",
  "videoUrl": "https://www.youtube.com/watch?v=…"
}
```

Headers: `Content-Type: application/json`. Timeout: **60 seconds**.

**URL validation (client):**

```
^https?:\/\/(www\.)?(youtube\.com\/watch\?.*v=|youtu\.be\/)[\w-]+
```

**Response parser `parseTranscript`:**

1. Object with non-empty `pageContent` or `text`
2. String that contains `{…}` JSON objects; join extracted `pageContent`/`text`
3. Array of such objects; join with spaces
4. Fallback `JSON.stringify(data, null, 2)`

This matches LangChain `Document` objects (`pageContent`) commonly returned by n8n YouTube transcript nodes.

**SPA persistence (independent of n8n DB writes):**

```ts
supabase.from('transcript_history').insert({
  user_id, video_url, status: 'success' | 'error',
  transcript, error_message
})
```

### 3.3 Upload — `POST /webhook/upload`

**Request** (`uploadService.ts`) `multipart/form-data`:

| Field | Value |
|---|---|
| `data` | file binary (`File`) |
| `fileName` | original name |
| `fileType` | MIME |
| `fileSize` | stringified bytes |
| `userId` | auth uuid |
| `session` | localStorage `upload_session_id` (24-char) |

Timeout 60s. Progress via axios `onUploadProgress` (caps at 99% until complete).

**Response:** any JSON; SPA stores `JSON.stringify(response.data)` in `upload_history.webhook_response`.

---

## 4. HTTP contracts (SPA ↔ Supabase functions)

### 4.1 `POST /functions/v1/stripe-checkout`

Headers: `Authorization: Bearer <access_token>`, `Content-Type: application/json`.

Body:

```json
{
  "successUrl": "<current URL>?upgrade=success",
  "cancelUrl": "<current URL>",
  "priceId": "optional"
}
```

Response `200`: `{ "url": "https://checkout.stripe.com/…", "priceSource": "…" }`.

Line item: `STRIPE_PRICE_ID` if active, else AUD 2900/month `price_data` named “BAS Agentic Pro”.

### 4.2 `POST /functions/v1/stripe-cancel`

Body: `{ "action": "cancel" | "resume" }`.

Response includes `cancelAtPeriodEnd`, `currentPeriodEnd`, `status`.

### 4.3 Stripe webhook events handled

- `checkout.session.completed` — upsert customer, insert order, upsert subscription, `user_plans.plan = pro`
- `customer.subscription.updated` — refresh subscription row
- `customer.subscription.deleted` — mark canceled, `user_plans.plan = free`

---

## 5. Data model

### 5.1 Tables the SPA uses

**`user_plans`**

| Column | Type | Notes |
|---|---|---|
| user_id | uuid PK → auth.users | |
| plan | text `free` \| `pro` | default `free` |
| created_at / updated_at | timestamptz | |

RLS: owner select/insert/update.

**`upload_history`**

| Column | Type |
|---|---|
| id | uuid PK |
| file_name, file_type | text |
| file_size | bigint |
| status | `success` \| `error` |
| webhook_response | text |
| created_at | timestamptz |
| user_id | uuid NOT NULL → auth.users |

**`transcript_history`**

| Column | Type |
|---|---|
| id | uuid PK |
| user_id | uuid NOT NULL |
| video_url | text |
| status | `success` \| `error` |
| transcript | text nullable |
| error_message | text nullable |
| created_at | timestamptz |

**Stripe (via webhook + views)**

- `stripe_customers` (user_id ↔ customer_id)
- `stripe_subscriptions`
- `stripe_orders`
- View `stripe_user_subscriptions` used by `UsageContext` for `cancel_at_period_end`, `current_period_end`

### 5.2 Tables n8n / RAG use (SPA does not query)

| Object | Role |
|---|---|
| `documents` | Chunks + `embedding vector`; authenticated SELECT all (shared KB) |
| `match_documents(query_embedding, match_count, filter)` | Cosine similarity (`<=>`) |
| `n8n_chat_histories` | LangChain/n8n memory; RLS on; n8n uses service_role |
| `public.transcripts` | User-scoped table; **not** the SPA history table |

If you change embedding dimensions (e.g. `text-embedding-3-small` 1536 vs another model), alter the `vector(n)` column **and** the n8n embeddings node together.

---

## 6. Plan limits

Defined in `src/context/UsageContext.tsx`:

| Plan | Uploads | Transcripts | Chat |
|---|---|---|---|
| free | 5 (`FREE_UPLOAD_LIMIT`) | 3 (`FREE_TRANSCRIPT_LIMIT`) | unlimited in UI |
| pro | Infinity | Infinity | unlimited |

Counts = **total historical rows**, not calendar-month windows, despite landing-page copy saying “per month”. Changing to monthly requires a `created_at` filter in `fetchUsage`.

`user_plans` migration comment still says “max 3 document uploads”; the live UI constant is **5**. Keep marketing, `UsageContext`, and n8n enforcement aligned when you change this.

---

## 7. Auth behaviour

- Flow: PKCE (`src/supabase.ts`)
- Email/password signup and login
- Signup without session → “check your email”
- Recovery: URL `type=recovery` or `PASSWORD_RECOVERY` event → reset form
- `resetPasswordForEmail` redirect = `window.location.origin`
- 60s cooldown on forgot-password

---

## 8. Accepted upload types

`DropZone.tsx`:

- `text/plain` `.txt`
- `application/pdf` `.pdf`
- `text/csv` / `application/vnd.ms-excel` `.csv`

n8n must parse the same types. Adding `.docx` requires DropZone `accept` **and** an n8n extract node.

---

## 9. Local storage keys

| Key | Purpose |
|---|---|
| `bas_theme` | `light` \| `dark` |
| `chat_session_id` | n8n memory correlation |
| `upload_session_id` | n8n upload correlation |

Clearing site data starts a new chat memory thread on the n8n side.

---

## 10. Known contract mismatches to preserve or fix

1. `src/supabase.ts` URL vs `VITE_SUPABASE_URL` — two sources of truth.
2. Landing “per month” vs lifetime row counts.
3. Migration comment 3 uploads vs code 5.
4. History tab does not list `transcript_history`.
5. n8n webhooks are unauthenticated from the browser’s point of view.
