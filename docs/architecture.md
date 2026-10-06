# BAS Agentic — System Architecture

**Product:** BAS Agentic (Business, Applications, and Solutions)  
**Repo package name:** `n8n-file-upload`  
**Last mapped:** 2026-09-06  

This document describes how the Vite/React frontend, Supabase backend, n8n Cloud workflows, YouTube transcript retrieval, OpenAI, and Stripe fit together.

---

## 1. Executive summary

BAS Agentic is a **browser SPA** that authenticates users with **Supabase Auth**, stores usage and history in **Postgres**, bills through **Stripe Edge Functions**, and runs chat, uploads, and YouTube transcripts in the **`agent` Edge Function**.

| Capability | Where it actually runs | This repo contains |
|---|---|---|
| YouTube transcript fetch | `agent` function → RapidAPI | Client POST + response parser |
| OpenAI (chat, embeddings) | `agent` function (`gpt-4o-mini`, `text-embedding-3-small`) | `supabase/functions/agent/` |
| File ingest / RAG documents | `agent` function writes `documents` | Multipart upload client |
| Auth, plans, history, billing | Supabase + Stripe functions in this repo | Full source |

OpenAI and RapidAPI keys stay in Edge Function secrets (`OPENAI_API_KEY`, `RAPIDAPI_KEY`). They are not in the Vite client.

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
│ Supabase Edge Function       │   │ Supabase project             │
│ functions/v1/agent           │   │ tpxouggkkyljrmmhdlbr         │
│                              │   │                              │
│ action=chat → OpenAI + RAG   │   │ Auth (PKCE)                  │
│ action=transcript → RapidAPI │   │ Postgres + RLS               │
│ multipart upload → extract   │   │ Edge Functions:              │
│   PDF/CSV/TXT, embed, store  │   │   agent                      │
│ writes documents and         │   │   stripe-checkout            │
│ n8n_chat_histories           │   │   stripe-cancel              │
│                              │   │   stripe-webhook             │
└──────────────────────────────┘   └──────────────┬───────────────┘
                                                  ▼
                                   ┌──────────────────────────────┐
                                   │ Stripe                       │
                                   │ Checkout + subscriptions     │
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

### 3.2 Integration (Supabase `agent` function)

The SPA calls one authenticated function, `POST /functions/v1/agent`:

| Purpose | Request | Called from |
|---|---|---|
| Chat assistant | JSON `{ action: "chat", chatInput, sessionId, userId }` | `src/components/ChatWidget.tsx` |
| YouTube transcript | JSON `{ action: "transcript", userId, videoUrl }` | `src/components/TranscriptExtractor.tsx` |
| Document upload | multipart field `data` plus `fileName`, `fileType`, `userId` | `src/uploadService.ts` |

The function holds `OPENAI_API_KEY` and `RAPIDAPI_KEY`, and uses the service role to write `documents`, `n8n_chat_histories`, and `transcripts`. Those secrets must **never** be added to the Vite client. The caller must send the signed-in user's access token.

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
  → POST { action: "transcript", userId, videoUrl } → agent function (60s timeout)
  → RapidAPI youtube-transcript3 returns the caption text
  → function upserts public.transcripts and embeds chunks into documents
  → HTTP body returns pageContent / text
  → parseTranscript() normalizes to a string
  → INSERT transcript_history
  → refreshUsage() increments free-plan counter
```

**Source of truth for the client contract:** `src/components/TranscriptExtractor.tsx`.

### 4.2 Chat (OpenAI via n8n)

```
User sends message
  → sessionId from localStorage `chat_session_id` (24-char)
  → POST { action: "chat", chatInput, sessionId, userId } → agent function
  → gpt-4o-mini with match_documents (filtered by userId) and n8n_chat_histories
  → JSON reply with output
  → ChatWidget renders markdown
```

The SPA does **not** stream tokens. Chat is not persisted in `upload_history`; history tab is upload-only.

### 4.3 Document upload

```
DropZone accepts .txt / .pdf / .csv
  → App enforces free upload limit
  → uploadFileToWebhook(): FormData fields data, fileName, fileType, fileSize, userId, session
  → POST multipart → agent function
  → function extracts PDF, CSV, or text, embeds with OpenAI, inserts `documents`
  → SPA INSERT upload_history with webhook_response JSON string
```

### 4.4 Auth and plan gating

```
signUp / signInWithPassword / resetPasswordForEmail  (AuthPage)
  → session in AuthContext
  → UsageProvider loads user_plans, counts rows in upload_history and transcript_history
  → Free: 5 uploads, 3 transcripts  (UsageContext constants; migration comment still says 3 uploads)
  → adityaba70@gmail.com is exempt from those caps; every other account, including new signups, is not
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
