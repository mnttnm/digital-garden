---
title: "Building a retrieval skill for Lenny's open-source archive containing millions of words across newsletters and podcasts"
date: 2026-03-18
kind: learning
tags: ["claude-code", "skills", "retrieval", "ai-workflows", "mcp", "lennys-newsletter"]
draft: true
images:
  - src: "/captures/discoveries/lenny-research-skill-overview.png"
    alt: "Lenny Research skill — 4-step retrieval workflow and data pipeline overview"
videos: []
code: ""
codeLanguage: ""
prompts:
  - "If you are tasked to build agents, skills, and a system that will help me get responses from this huge dataset for any relevant question — how would you go about it? The goal is to optimize for correctness and quality of the response, not skip any relevant context, snippets, conversations, or posts that matter for the query, and at the same time be super quick in responding."
---

Lenny Rachitsky decided to make his entire newsletter and podcast archive open-source — 349 newsletter posts, 289 podcast transcripts, 5.4 million words of product management wisdom in markdown files. He put out a challenge to the community: build something innovative and creative on top of it.

While I figure out a bigger idea, I wanted to start by answering a simpler question — can I get better recall from the MCP server that already ships with the dataset? It has four tools (`search_content`, `list_content`, `read_content`, `read_excerpt`) that work fine for simple lookups, but ask a nuanced question and it misses relevant content because of vocabulary mismatches.

I started brainstorming with Claude Code and it proposed several approaches with varying technical complexity — semantic search, vector embeddings with cosine similarity, hybrid BM25 + vector retrieval, enhancing the MCP server directly. All valid, but they all meant spinning up new infrastructure. Then it clicked me what if I just ask Claude to build skills to deal with this data.

So I opened Claude Code and started with this prompt:

> If you are tasked to build agents, skills, and a system that will help me get responses from this huge dataset for any relevant question — how would you go about it? The goal is to optimize for correctness and quality of the response, not skip any relevant context, snippets, conversations, or posts that matter for the query, and at the same time be super quick in responding.

That's it. No architecture spec, no technical requirements document. Just the problem and the constraints. What came back was a full retrieval architecture I wouldn't have designed on my own — and the realization that I didn't need new infrastructure at all. I just needed a Claude Code skill.


## A skill as a retrieval policy

The skill doesn't create any new MCP servers or functions. It's purely an orchestration layer on top of the four original tools that ship with Lenny's dataset — teaching Claude a smarter way to use what's already there. It has three components:

**SKILL.md** — the core workflow (~75 lines). Takes your question, breaks it into multiple search probes, runs them in parallel, extracts the relevant parts, and synthesizes a cited response.

**references/topic-map.md** — 20 synonym clusters built from the actual archive tags. "Pricing" expands to `pricing|price|tier|package|monetization|revenue|freemium`. This is what closes the vocabulary gap — queries hit content even when it uses different words for the same concept.

**references/retrieval-guide.md** — extraction heuristics. Short newsletters get full-read, long podcast transcripts get targeted excerpts. All reads fire in parallel. The numbers came from Claude Code sampling actual files and measuring what worked.

## Skills are more than prompt templates

Going in, I thought skills were just fancy prompt files. What I found was different — they're retrieval *policies*. The synonym map means every query gets consistent expansion without burning tokens reasoning about it. The heuristics mean extraction adapts to content length automatically. It's encoded knowledge, not instructions.

The workflow that worked: describe what you need → let Claude Code architect the approach → use `skill-creator` (a skill for building skills) to enforce structure → test against real queries → put on your validation hat and iterate. I tested with queries like "How to find initial users without a network?" and "Compare different guests' advice on product-market fit." It was pulling from sources plain search missed and grouping by sub-theme.

After a few rounds of calibration — fixing missing citations, adjusting excerpt depth, tuning the synonym clusters — the skill got noticeably sharper. You're not writing code. You're calibrating a system.

## What's next

- **Streaming UI** — show the retrieval process as it happens instead of a blank wait
- **Creative interfaces** — a topic explorer mapping connections between guests, or a comparison view for different takes on the same topic
- **Generic retrieval skill** — extract the Lenny-specific parts into a reusable template for any large corpus
- **Proper evals** — ground truth answer sets, recall/precision metrics, with-skill vs without-skill comparisons
