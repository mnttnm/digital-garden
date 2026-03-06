# Digital Garden - Claude Code Guide

Personal site for sharing a unified dev journal stream (`learning.log`). Built with Astro and deployed to Vercel.

## Project Overview

The site is intentionally minimal and centered on one primary page:
- **learning.log (`/`)** — Unified stream of project updates + discoveries
- **About (`/about/`)** — Bio and contact

Supporting detail routes:
- **Discoveries detail** — `/discoveries/[slug]/`
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

### Discoveries (`src/content/discoveries/`)

```markdown
---
title: "Discovery Title"
date: 2026-02-08
kind: "learning"  # learning | resource
tags: ["topic"]
url: "https://..."  # optional, for resources
linkTitle: "Actual page title"  # optional, extracted from URL
images: []
videos: []
code: ""  # optional code snippet
codeLanguage: "typescript"
prompts: []
draft: false
---

Your commentary or insight here...
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
    activityType: "update"  # update | milestone | fix | learning | discovery | experiment
    tags: ["feature"]
    images: []
    videos: []
    prompts: []
draft: false
---

Detailed description...
```

---

## How learning.log is built

`src/lib/learning-log.ts` normalizes both collections into one stream model:

- bucket: `project-updates` or `discoveries`
- kind: `learning` or `resource` (for discoveries)
- date, title, crux, href, images, video, code, tags
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
| `/discoveries/[slug]/` | Discovery detail (learning or resource) |
| `/projects/[slug]/` | Project detail + activity feed |
| `/rss.xml` | Unified RSS feed |
| `/api/subscribe` | Newsletter subscription endpoint |
| `/api/capture/*` | Capture ingest and review APIs |
| `/admin/review` | Capture review dashboard |

---

## Build / Runtime

- Astro output mode is **server** (`astro.config.mjs`) to support query-based pagination/filtering on `/`.
- Dynamic detail routes are prerendered (`export const prerender = true`) for discoveries/projects pages.

---

## Key Files

- `src/pages/index.astro` — feed UI
- `src/lib/learning-log.ts` — stream normalization + anchor generation
- `src/lib/capture/` — capture pipeline (store, refine, transform, publish)
- `src/pages/projects/[...slug].astro` — project page + activity anchors
- `src/pages/discoveries/[...slug].astro` — discovery detail
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

---

## Design Context

### Users
Developers, builders, and curious tinkerers who enjoy following someone's learning journey. They visit to:
- Discover useful tools and resources
- See what projects are being built and how
- Pick up practical insights from real-world experimentation

Context: Often browsing on mobile during commutes or breaks, or on desktop during focused reading time.

### Brand Personality
**Thoughtful, Curious, Genuine**

Voice: First-person, conversational, shares the "why" behind decisions. Not performative—writes as if explaining to a friend who's also building things.

Tone: Calm but engaged. Shows enthusiasm without hype. Admits uncertainty when present.

### Aesthetic Direction

**Visual tone:** Editorial, text-first, warm and readable
- Paper-like warmth in light mode, cozy dark mode
- Serif typography for body content (Source Serif 4)
- Generous whitespace, unhurried rhythm
- Subtle animations that enhance without distracting

**References:**
- Current site aesthetic (keep and refine)
- impeccable.style — clean presentation, thoughtful typography
- Paco Coursey / Rauno — minimal personal sites
- Ink & Switch — research-paper clarity

**Anti-references:**
- Overly corporate/sterile designs
- Aggressive dark patterns or attention-grabbing UI
- Cluttered dashboards with too much competing for attention

**Theme:** Light + Dark mode with warm/cool variants already implemented

### Design Principles

1. **Reading comes first** — Every design decision should serve readability. Long-form content needs to feel effortless to consume.

2. **Calm over loud** — Prefer subtlety. Animations should feel natural, not performative. Colors should guide, not shout.

3. **Mobile is primary** — Many visitors browse on phones. Touch targets, scroll behavior, and information density must work at 375px.

4. **Show, don't decorate** — If an element doesn't help understanding, remove it. Visual interest comes from content and typography, not ornament.

5. **Respect user preferences** — Honor system color scheme, reduced motion preferences, and provide theme controls.

### Design Tokens (Current)

```css
/* Typography */
--font-serif: 'Source Serif 4', Georgia, serif;
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Colors - Light (warm) */
--bg-primary: #faf8f5;
--bg-card: #ffffff;
--text-primary: #1c1917;
--text-secondary: #57534e;
--text-tertiary: #a8a29e;
--accent: #c4704b;
--accent-hover: #9a3412;

/* Colors - Dark (warm) */
--bg-primary: #141210;
--bg-card: #1c1a17;
--text-primary: #e8e4df;
--accent: #d98e73;

/* Spacing */
--spacing: 1.5rem;
--max-width: 1024px;

/* Breakpoints */
375px  — very small mobile
420px  — small mobile
480px  — mobile
768px  — tablet/desktop
```
