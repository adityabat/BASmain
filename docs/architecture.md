# BAS Agentic — System Architecture

**Product:** BAS Agentic (Business, Applications, and Solutions)  
**Repo package name:** `n8n-file-upload`  
**Last mapped:** 2026-09-06  

This document describes how the Vite/React frontend, Supabase backend, n8n Cloud workflows, YouTube transcript retrieval, OpenAI, and Stripe fit together.

---

## 1. Executive summary

BAS Agentic is a **browser SPA** that authenticates users with **Supabase Auth**, stores usage and history in **Postgres**, bills through **Stripe Edge Functions**, and offloads all AI / YouTube work to **n8n Cloud webhooks**.

Critical fact for anyone changing APIs:

| Capability | Where it actually runs | This repo contains |
|---|---|---|
| YouTube transcript fetch | n8n workflow behind `POST /webhook/fetch` | Client POST + response parser only |
| OpenAI (chat, embeddings, summarization) | n8n nodes (not in Git) | Client POST to chat/upload webhooks only |
| File ingest / RAG documents | n8n workflow behind `POST /webhook/upload` | Multipart upload client only |
| Auth, plans, history, billing | Supabase + Stripe functions in this repo | Full source |

There is **no** `openai` SDK, **no** YouTube Data API key, and **no** n8n workflow JSON in this repository. Changing models, prompts, or transcript providers is an **n8n editor** change, plus optional contract updates in the React files listed in [code-map.md](./code-map.md).

---

## 2. High-level system diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Vite + React 18 + Tailwind)                           │
│  LandingPage → AuthPage → App (tabs: Chat / Transcripts /       │
│  Upload / History)                                              │
└──────────────┬───────────────────────────────┬──────────────────┘
               │ HTTPS JSON / FormData         │ supabase-js
               ▼                               ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│ n8n Cloud                    │   │ Supabase project             │
│ m-objectsai.app.n8n.cloud    │   │ tpxouggkkyljrmmhdlbr         │
│                              │   │                              │
│ /webhook/Chat   → OpenAI     │   │ Auth (PKCE)                  │
│ /webhook/fetch  → YouTube    │   │ Postgres + RLS               │
│                   transcript │   │ Storage (none used by SPA)   │
│                   (+ optional│   │ Edge Functions:              │
│                    OpenAI)   │   │   stripe-checkout            │
│ /webhook/upload → parse file │   │   stripe-cancel              │
│                   embed via  │   │   stripe-webhook             │
│                   OpenAI     │   └──────────────┬───────────────┘
│                   write      │                  │
│                   documents /│                  ▼
│                   n8n_chat_  │   ┌──────────────────────────────┐
│                   histories  │   │ Stripe                       │
└──────────────────────────────┘   │ Checkout + subscriptions     │
                                   └──────────────────────────────┘
```

---

## 3. Runtime layers

### 3.1 Presentation (this repo: `src/`)

Single-page app with no React Router. `App.tsx` switches views by local state:

1. Unauthenticated → `LandingPage` or `AuthPage`
2. Authenticated → tabbed workspace
3. Password recovery URL → `AuthPage` reset mode

Providers (outer → inner) from `src/main.tsx`:

`ThemeProvider` → `AuthProvider` → `UsageProvider` → `App`

### 3.2 Integration (n8n Cloud)

Three production webhook URLs are **hardcoded** in the SPA:

| Workflow purpose | Path | Called from |
|---|---|---|
| Chat assistant (OpenAI) | `https://m-objectsai.app.n8n.cloud/webhook/Chat` | `src/components/ChatWidget.tsx` |
| YouTube transcript | `https://m-objectsai.app.n8n.cloud/webhook/fetch` | `src/components/TranscriptExtractor.tsx` |
| Document upload / ingest | `https://m-objectsai.app.n8n.cloud/webhook/upload` | `src/uploadService.ts` |

n8n is expected to hold:

- OpenAI API key (or compatible provider credentials)
- YouTube transcript retrieval (n8n YouTube / community transcript node, or HTTP to a transcript API)
- Supabase credentials (service role) to write `documents`, `n8n_chat_histories`, and possibly `transcripts`

Those credentials must **never** be added to the Vite client.

### 3.3 Data and identity (Supabase)

| Concern | Implementation |
|---|---|
| Users / sessions | Supabase Auth, PKCE, session persisted in the browser |
| Plans | `user_plans.plan` = `free` \| `pro` |
| Upload log | `upload_history` (written by the SPA after n8n returns) |
| Transcript log | `transcript_history` (written by the SPA after n8n returns) |
| RAG corpus | `documents` + `match_documents(vector, …)` (n8n / Postgres; not called by SPA) |
| Chat memory | `n8n_chat_histories` (n8n; RLS enabled; SPA does not read it) |
| Alternate transcript table | `public.transcripts` (RLS in migrations; SPA uses `transcript_history`) |
| Billing | `stripe_customers`, `stripe_subscriptions`, `stripe_orders`, views `stripe_user_subscriptions` / `stripe_user_orders` |

Project ref: `tpxouggkkyljrmmhdlbr` (`supabase/config.toml`, `src/supabase.ts`).

### 3.4 Billing (Stripe via Edge Functions)

| Function | JWT | Role |
|---|---|---|
| `stripe-checkout` | required | Create Checkout Session for Pro (~AUD 29/month fallback `price_data`) |
| `stripe-cancel` | required | Set `cancel_at_period_end` or resume |
| `stripe-webhook` | Stripe signature | Persist customer/sub/order; set `user_plans` to `pro` or `free` |

Secrets live in Edge Function env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, optional `STRIPE_PRICE_ID`.

---

## 4. Request flows

### 4.1 YouTube transcript (end to end)

```
User pastes URL in Transcripts tab
  → App checks isTranscriptLimitReached (UsageContext)
  → TranscriptExtractor validates youtube.com / youtu.be
  → POST { userId, videoUrl } → n8n /webhook/fetch  (60s timeout)
  → n8n fetches captions (YouTube transcript API / node)
  → n8n optionally calls OpenAI (summarize / clean) — not visible here
  → HTTP body returns pageContent / text / JSON array / concatenated JSON blobs
  → parseTranscript() normalizes to a string
  → INSERT transcript_history
  → refreshUsage() increments free-plan counter
```

**Source of truth for the client contract:** `src/components/TranscriptExtractor.tsx`.

### 4.2 Chat (OpenAI via n8n)

```
User sends message
  → sessionId from localStorage `chat_session_id` (24-char)
  → POST { chatInput, sessionId, userId } → n8n /webhook/Chat
  → n8n LangChain / OpenAI agent, likely Postgres chat memory + match_documents
  → JSON reply with output | message | text | response
  → ChatWidget renders markdown
```

The SPA does **not** stream tokens. Chat is not persisted in `upload_history`; history tab is upload-only.

### 4.3 Document upload

```
DropZone accepts .txt / .pdf / .csv
  → App enforces free upload limit
  → uploadFileToWebhook(): FormData fields data, fileName, fileType, fileSize, userId, session
  → POST multipart → n8n /webhook/upload
  → n8n parses file, likely embeddings (OpenAI) into `documents`
  → SPA INSERT upload_history with webhook_response JSON string
```

### 4.4 Auth and plan gating

```
signUp / signInWithPassword / resetPasswordForEmail  (AuthPage)
  → session in AuthContext
  → UsageProvider loads user_plans, counts rows in upload_history and transcript_history
  → Free: 5 uploads, 3 transcripts  (UsageContext constants; migration comment still says 3 uploads)
  → Pro: unlimited until Stripe subscription.deleted reverts plan
```

Limits are **client-side counts plus UI gates**. They are not enforced inside n8n. A user who bypasses the UI can still hit webhooks unless n8n also checks `user_plans`.

### 4.5 Upgrade / cancel

```
UpgradeModal → POST VITE_SUPABASE_URL/functions/v1/stripe-checkout
  → Stripe Checkout → stripe-webhook checkout.session.completed
  → user_plans = pro
  → App polls user_plans when ?upgrade=success

CancelSubscriptionModal → POST …/stripe-cancel { action: cancel | resume }
  → Stripe cancel_at_period_end
  → later customer.subscription.deleted → user_plans = free
```

---

## 5. Trust boundaries

| Boundary | What is trusted | Risk if misconfigured |
|---|---|---|
| Browser | User JWT for Supabase only | n8n URLs are public; anyone who copies them can invoke workflows |
| n8n | OpenAI key, YouTube access, often service_role | Must validate `userId` and ideally require a shared secret header |
| Supabase RLS | User can only CRUD own history/plan | `documents` is readable by any authenticated user (shared KB) |
| Edge Functions | Stripe secret, service role | Webhook signature must stay valid |

Recommended hardening when changing APIs: move webhook URLs and a shared `x-webhook-secret` into env vars; verify the secret in n8n; enforce plan limits in n8n or a Supabase Edge Function proxy.

---

## 6. Component relationships (SPA)

```
main.tsx
  ThemeContext          localStorage `bas_theme`
  AuthContext           supabase.auth
  UsageContext          user_plans, counts, stripe_user_subscriptions
  App.tsx
    LandingPage / AuthPage
    ChatWidget          n8n Chat
    TranscriptExtractor n8n fetch + transcript_history
    DropZone, FileList  local queue
    uploadService       n8n upload
    UploadHistory       upload_history SELECT
    UpgradeModal        stripe-checkout
    CancelSubscriptionModal  stripe-cancel
```

---

## 7. Related documents

- [Code map](./code-map.md) — every file and the exact n8n / OpenAI / YouTube call sites
- [Technical specification](./technical.md) — payloads, tables, env, stack
- [Design and change playbook](./design.md) — how to change n8n workflows or swap APIs
- [Status](./status.md)
