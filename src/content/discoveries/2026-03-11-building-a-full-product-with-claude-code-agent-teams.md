---
title: "Building a full product with Claude Code Agent Teams"
date: 2026-03-11
kind: learning
tags: ["claude-code", "agents", "multi-agent", "tmux", "workflow", "product-development"]
draft: true
images: []
videos: []
code: ""
codeLanguage: ""
prompts: []
---

Tried [Claude Code's Agent Teams](https://docs.anthropic.com/en/docs/claude-code/sub-agents) feature to build a full product from a raw idea — a community product recommendation directory for my housing society. The experience was genuinely impressive.

The setup: I created a "product-studio" team and spawned specialized agents — a product manager, an architect, three parallel builders, and a code reviewer. Each agent runs in its own tmux pane, so you can literally watch all of them working simultaneously on your screen. The PM writes the PRD in one pane, the architect reads it and designs the schema in another, then three builders implement search, UI, and mutations in parallel — all while you sit back and watch code appear in your VS Code.

What made it click wasn't just the parallelism — it was the communication. Agents send messages to each other and to me (the team lead). The PM finished the PRD, sent me a summary with open questions for the founder, I answered them, sent the answers back, and the PM updated the doc. The architect read the finalized PRD and produced an architecture doc. Builders read both docs before writing code. It felt like coordinating a real team, except everyone works at machine speed.

The numbers: 5 build phases, 9 git commits, 57 seeded database items with Hindi aliases, fuzzy search, full CRUD with upvotes and comments, admin panel — all browser-validated with Playwright. From "here's my rough idea for a product" to a working app running on localhost with real data flowing through it.

The biggest unlock was having the PM go first. It asked clarifying questions I wouldn't have thought of upfront — "Can users recommend multiple brands for the same item? What's your flat number format? Structured dropdown or free text for retailers?" — that would've caused rework if answered mid-build. The 40% planning, 10% building split from the compound engineering workflow held up.

Not everything was smooth — one agent got stuck waiting for browser permissions, seed data had invalid UUID hex characters that needed fixing, and I had to shim the Neon serverless driver for local Postgres. But the overall velocity was wild. This is a fundamentally different way to build software.
