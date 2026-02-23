# Architecture Guide

This document explains how content moves through the system and where each responsibility lives.

## 1) System Context

```mermaid
flowchart LR
  subgraph Clients
    RC["Raycast Extension"]
    IOS["iOS Shortcut"]
    ADM["Admin Dashboard /admin/review"]
  end

  subgraph AstroApp["Astro App (Vercel)"]
    ING["/api/capture/ingest"]
    ACT["/api/capture/{id}/approve|reject|refine|update|restore|preview"]
    LIST["/api/capture/list"]
    PUB["/api/capture/publish-all"]
    SUB["/api/subscribe"]
    SITE["Site Routes / /notes /til /projects"]
  end

  subgraph DataAndExternal
    REDIS["Upstash Redis"]
    GITHUB["GitHub API"]
    RESEND["Resend API"]
    CONTENT["Repo Content\nsrc/content + public/captures"]
  end

  RC --> ING
  IOS --> ING
  ADM --> LIST
  ADM --> ACT
  ADM --> PUB

  ING --> REDIS
  LIST --> REDIS
  ACT --> REDIS
  PUB --> REDIS

  PUB --> GITHUB
  GITHUB --> CONTENT
  CONTENT --> SITE

  SUB --> RESEND
```

## 2) Capture Lifecycle

```mermaid
stateDiagram-v2
  [*] --> pending
  pending --> approved: approve
  pending --> rejected: reject
  rejected --> pending: restore
  approved --> rejected: reject
  approved --> published: publish-all
  published --> [*]
```

## 3) Batch Publishing Flow

```mermaid
flowchart TD
  A["Fetch approved captures"] --> B{"Any approved items?"}
  B -- "No" --> C["Return: no items to publish"]
  B -- "Yes" --> D["Transform captures to content output"]
  D --> E["Merge project activity updates by project slug"]
  E --> F["Save capture images to public/captures"]
  F --> G["Create blobs + tree via GitHub Git API"]
  G --> H["Create one commit on main"]
  H --> I["Mark captures as published in Redis"]
  I --> J["Vercel deploy from new commit"]
```

## 4) Directory Responsibilities

- `src/pages/`: user-facing pages and API routes.
- `src/lib/capture/`: capture domain logic.
- `src/lib/newsletter/`: newsletter content aggregation and rendering.
- `src/content/`: published notes, TILs, and projects.
- `capture-extension/`: Raycast client for desktop capture.
- `ios-shortcut/`: setup instructions for iOS capture.

## 5) Where To Start (New Contributor)

1. Read `README.md` for local setup and runbooks.
2. Read `src/content/config.ts` to understand schemas.
3. Read `src/lib/learning-log.ts` to see how the main feed is composed.
4. For capture features, follow this order:
   - `src/pages/api/capture/ingest.ts`
   - `src/lib/capture/store.ts`
   - `src/pages/admin/review.astro`
   - `src/lib/capture/publish.ts`
5. For newsletter features, start at:
   - `src/lib/newsletter/generate.mjs`
   - `scripts/newsletter-preview.mjs`
   - `scripts/newsletter-send.mjs`
