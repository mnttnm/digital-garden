# Content Capture & Publishing System

## Overview

A system for capturing content from multiple clients (Raycast, iOS Shortcut) and publishing to the digital garden after review.

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Mac            │      │                 │      │                 │
│  (Raycast ext)  │─────▶│                 │      │                 │
└─────────────────┘      │  /api/capture/  │      │   Upstash       │
                         │    ingest       │─────▶│   Redis         │
┌─────────────────┐      │                 │      │                 │
│  iPhone         │      │                 │      └────────┬────────┘
│  (iOS Shortcut) │─────▶│                 │               │
└─────────────────┘      └─────────────────┘               │
                                                           │
┌─────────────────┐      ┌─────────────────┐      ┌────────▼────────┐
│  Live Site      │◀─────│   GitHub API    │◀─────│  Review Dashboard│
│  (Vercel)       │      │   (commit MDX)  │      │  /admin/review   │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Components

### Core Library (`src/lib/capture/`)

| File | Purpose |
|------|---------|
| `types.ts` | Capture schema, RefinedCapture interface |
| `store.ts` | Upstash Redis CRUD operations |
| `providers.ts` | AI provider configuration (OpenAI, Google, Azure) |
| `refine.ts` | LLM refinement via Vercel AI SDK |
| `transform.ts` | Capture → MDX transformation |
| `publish.ts` | GitHub commit logic |
| `index.ts` | Public exports |

### API Routes (`src/pages/api/capture/`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/capture/ingest` | POST | Main entry point for capture clients |
| `/api/capture/list` | GET | List captures by status |
| `/api/capture/[id]/approve` | POST | Approve and publish capture |
| `/api/capture/[id]/reject` | POST | Reject capture |
| `/api/capture/[id]/refine` | POST | Trigger AI refinement |
| `/api/capture/[id]/update` | PATCH | Edit capture metadata |
| `/api/capture/[id]/preview` | GET | Preview publish output |

### Admin UI (`src/pages/admin/`)

| File | Purpose |
|------|---------|
| `index.astro` | Login page |
| `review.astro` | Review dashboard |

### Capture Clients

| Client | Location | Purpose |
|--------|----------|---------|
| Raycast Extension | `capture-extension/` | Mac capture via Cmd+Space |
| iOS Shortcut | `ios-shortcut/SETUP.md` | iPhone Share Sheet capture |

## Environment Variables

```bash
# Capture API
CAPTURE_API_KEY=...             # Secret for client auth

# Upstash Redis
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# GitHub (for commits)
GITHUB_TOKEN=ghp_...
GITHUB_REPO=username/digital-garden

# AI Refinement
AI_PROVIDER=google              # openai | google | azure
AI_MODEL=gemini-2.0-flash-exp

# Provider keys (only need active one)
GOOGLE_GENERATIVE_AI_API_KEY=...
OPENAI_API_KEY=...
AZURE_RESOURCE_NAME=...
AZURE_API_KEY=...

# Admin
ADMIN_PASSWORD=...
```

## Usage Flow

### Capture (5 seconds)
1. Copy URL/text to clipboard
2. Cmd+Space → "capture" → Enter
3. Toast: "Captured!"

### Review (daily)
1. Visit `/admin/review`
2. Click "Refine" for AI cleanup
3. Compare raw vs refined
4. Approve → publishes to GitHub
5. Vercel auto-deploys

## Batched Publishing (Cost Optimization)

To minimize Vercel deployments, captures are **batched**:

1. **Approve** items → moves to "Queued" status
2. **Publish All** → commits all queued items in ONE GitHub commit
3. **One deployment** regardless of item count

### Trigger Options

| Method | Cost | Setup |
|--------|------|-------|
| Manual "Publish All" button | Free | None |
| Vercel Cron (daily at 8am) | Free | Add CRON_SECRET env var |
| External cron (cron-job.org) | Free | Point to `/api/capture/publish-all` |

### Status Flow

```
pending → approved (queued) → published
                ↘ rejected
```

## Implementation Status

- [x] Core library (types, store, refine, transform, publish)
- [x] API routes (ingest, list, approve, reject, refine, update, preview, publish-all)
- [x] Admin dashboard (login, review page, publish all button)
- [x] Batched publishing (single commit for multiple items)
- [x] Vercel Cron config (vercel.json)
- [x] Raycast extension
- [x] iOS Shortcut documentation
- [ ] Slack bot (optional, future)
- [ ] Image upload to CDN (optional, future)
