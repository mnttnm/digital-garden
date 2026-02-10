# Digital Garden - Claude Code Guide

Personal site for sharing a unified dev journal stream (`learning.log`). Built with Astro and deployed to Vercel.

## Project Overview

The site is intentionally minimal and centered on one primary page:
- **learning.log (`/`)** — Unified stream of project updates + discoveries
- **About (`/about/`)** — Bio and contact

Supporting detail routes:
- **Notes detail** — `/notes/[slug]/`
- **Project detail** — `/projects/[slug]/` (includes per-project activity feed)

---

## Quick Start

```bash
npm install
npm run dev            # http://localhost:4321
npm run build
```

---

## Content Structure

All content lives in `src/content/` with two collections.

### Notes (`src/content/notes/`)

```markdown
---
title: "Note Title"
date: 2026-02-08
tags: ["topic"]
featured: false
type: "essay"  # essay | link | snippet | thought
link: "https://..."  # optional, used for type=link
takeaway: "One-sentence key insight"
draft: false
---

Content here...
```

### Projects (`src/content/projects/`)

```markdown
---
title: "Project Name"
description: "What this project does"
date: 2026-02-08
featured: false
github: "https://github.com/..."
live: "https://..."
stack: ["Astro", "Vercel"]
outcome: "Shipped in 2 weeks"
tags: ["web-dev"]
activity:
  - date: 2026-02-08
    title: "What changed"
    summary: "Short update summary"
    type: "update"  # update | learning | discovery | milestone | experiment | fix
    highlights:
      - "Concrete highlight"
    links:
      - label: "PR"
        url: "https://github.com/..."
draft: false
---

Detailed description...
```

---

## How learning.log is built

`src/lib/learning-log.ts` normalizes both collections into one stream model:
- bucket: `project-updates` or `what-i-discovered`
- date, title, crux, href, metadata
- deterministic anchors for project activity events

Used by:
- `src/pages/index.astro` (homepage stream)
- `src/pages/rss.xml.ts` (unified RSS feed)
- `src/pages/projects/[...slug].astro` (event anchor targets)

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | `learning.log` stream with filters + pagination |
| `/about/` | Bio and contact |
| `/notes/[slug]/` | Note detail |
| `/projects/[slug]/` | Project detail + activity feed |
| `/rss.xml` | Unified RSS feed |
| `/api/subscribe` | Newsletter subscription endpoint |

---

## Build / Runtime

- Astro output mode is **server** (`astro.config.mjs`) to support query-based pagination/filtering on `/`.
- Dynamic detail routes are prerendered (`export const prerender = true`) for notes/projects pages.

---

## Key Files

- `src/pages/index.astro` — feed UI
- `src/lib/learning-log.ts` — stream normalization + anchor generation
- `src/pages/projects/[...slug].astro` — project page + activity anchors
- `src/pages/notes/[...slug].astro` — note detail
- `src/layouts/Base.astro` — global layout + nav
- `src/pages/rss.xml.ts` — RSS

---

## Newsletter Setup

Required environment variables:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_AUDIENCE_ID=aud_xxxxxxxxxxxx
# optional
RESEND_FROM_EMAIL=you@yourdomain.com
```

Used by `src/pages/api/subscribe.ts`.
