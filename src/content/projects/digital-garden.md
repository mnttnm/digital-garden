---
title: "learning.log"
description: "Unified activity stream that merges project updates with notes and resources."
date: 2026-01-25
featured: true
github: "https://github.com/YOUR_USERNAME/digital-garden"
stack: ["Astro", "Resend", "Vercel"]
outcome: "What shipped, what I discovered, and what changed."
tags: ["digital-garden", "dx"]
activity:
  - date: 2026-02-05
    title: "Shipped the activity feed for project pages"
    summary: "Refactored the project page so each project can act like a living document with a timeline of updates, learnings, and discoveries."
    tags: ["digital-garden", "dx"]
    type: "milestone"
    image: "https://cdn.magicpatterns.com/uploads/kc72dTznMXENW79WW648Qp/image.png"
    imageCaption: "The new activity feed in action"
    actionLabel: "View project details"
    actionUrl: "/projects/digital-garden/"
  - date: 2026-01-28
    title: "Simplified the auth token refresh logic"
    summary: "The old refresh logic had 3 nested try-catch blocks and a race condition. Rewrote it as a simple queue that batches concurrent refresh requests."
    tags: ["typescript", "auth", "async"]
    type: "fix"
    codeLanguage: "typescript"
    code: |
      async function refreshToken() {
        if (refreshPromise) return refreshPromise;

        refreshPromise = fetch('/api/auth/refresh', {
          method: 'POST'
        }).then(res => res.json())
          .finally(() => {
            refreshPromise = null;
          });

        return refreshPromise;
      }
draft: false
---

## About This Project

This stream is built with [Astro](https://astro.build) and designed to be:

- **Minimal** — Focus on content, not flashy design
- **Fast** — Static HTML, minimal JavaScript
- **Newsletter-ready** — Resend-powered email subscriptions

## Features

- Unified notes collection (essays, links, snippets, thoughts)
- Projects with outcomes and tech stack
- Email newsletter with daily/weekly digest
- Clean, editorial typography with Source Serif 4 and Inter
- Vercel deployment with API routes

## Tech Stack

- **Framework:** Astro
- **Styling:** Plain CSS (no framework)
- **Email:** Resend
- **Deployment:** Vercel
- **Content:** Markdown with frontmatter
