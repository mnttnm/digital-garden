# Digital Garden - Claude Code Guide

Personal site for sharing notes and showcasing projects. Built with Astro, deployed to Vercel.

## Project Overview

A minimal, editorial-style site with:
- **Notes** — Essays, links, code snippets, and quick thoughts
- **Projects** — Things I've built with outcomes and tech stacks
- **Newsletter** — Resend-powered email subscription (daily/weekly)

---

## Quick Start

```bash
npm install            # Install dependencies
npm run dev            # Start dev server at localhost:4321
npm run build          # Build for production
```

---

## Content Structure

All content lives in `src/content/` with two collections:

### Notes (`src/content/notes/`)
Unified collection for all written content.

```markdown
---
title: "Note Title"
date: 2025-01-13
tags: ["topic"]
featured: false
type: "essay"  # essay | link | snippet | thought
link: "https://..."  # required for type: link
takeaway: "One-sentence key insight"
draft: false
---

Content here...
```

### Projects (`src/content/projects/`)
Project showcases with outcomes.

```markdown
---
title: "Project Name"
description: "What this project does"
date: 2025-01-13
featured: false
github: "https://github.com/..."
live: "https://..."
stack: ["Astro", "Resend", "Vercel"]
outcome: "Shipped in 2 weeks"
tags: ["tech"]
draft: false
---

Detailed description, learnings...
```

---

## File Naming

- **Notes:** `YYYY-MM-DD-slug-title.md`
- **Projects:** `project-name.md`

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home with intro, featured notes & projects |
| `/notes/` | Chronological feed of all notes |
| `/notes/[slug]/` | Individual note |
| `/projects/` | All projects |
| `/projects/[slug]/` | Individual project |
| `/about/` | Bio and contact info |
| `/rss.xml` | RSS feed |
| `/api/subscribe` | Newsletter subscription endpoint |

---

## Newsletter Setup

1. Create a Resend account at https://resend.com
2. Create an API key and Audience
3. Set environment variables:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   RESEND_AUDIENCE_ID=aud_xxxxxxxxxxxx
   ```
4. Add these as secrets in Vercel and GitHub

---

## Deployment

Deployed to Vercel with hybrid rendering:
- Static pages (notes, projects) are pre-rendered
- API routes (`/api/subscribe`) run as serverless functions

To deploy:
1. Connect repo to Vercel
2. Set environment variables in Vercel dashboard
3. Push to main branch

---

## Configuration

| Setting | Location |
|---------|----------|
| Site URL | `astro.config.mjs` → `site` |
| Base path | `astro.config.mjs` → `base` |
| Typography | `src/styles/global.css` |
| Navigation | `src/layouts/Base.astro` |

---

## Slash Commands

| Command | Description |
|---------|-------------|
| `/publish` | Commit and push to deploy |
| `/preview` | Start local dev server |
| `/status` | Show git status |
| `/build` | Build and check for errors |
