---
title: "Run a skill audit session before starting a project"
date: 2026-03-18
kind: learning
tags:
  - claude-code
  - skills
  - workflow
  - planning
images: []
videos: []
prompts: []
draft: true
---

Before building an MCP server for a large content dataset, I spent 3-4 rounds of conversation just figuring out which skills to use. Not building anything — just auditing the skill library with the LLM.

With 50+ installed skills across multiple publishers (superpowers, compound-engineering, anthropic-skills, mcp-builder), there's overlap, conflict, and ambiguity. Two skills might cover "brainstorming" with different philosophies. A review workflow designed for Rails has framework-agnostic agents buried inside it that you'd miss if you only read the name. Some skills output artifacts that another publisher's skill can't auto-detect.

The process was iterative. Round one: "find me all skills relevant to this project." The LLM produced a reasonable list. Round two: "review these to make sure they're suitable." I had it actually read each skill's full content — not the one-line description, the entire SKILL.md. That round caught that I was missing engineering rigor skills (systematic-debugging, verification-before-completion, the architecture-strategist and performance-oracle agents inside compound-engineering's review workflow). I'd dismissed them as overkill or framework-specific without reading what they actually do.

Round three: "why aren't we considering engineering quality skills?" This forced a re-evaluation. The LLM read the full content of every quality-focused skill and reclassified them. Skills I'd downgraded moved back up. Skills from the wrong domain got dropped. The final map had clear tiers — problem definition, planning, implementation, review, documentation — with specific skills assigned to each phase and notes on where publisher boundaries would cause handoff issues.

Round four was about the handoff problem itself. Skills from different publishers expect artifacts in different directories. A brainstorm from superpowers writes to `docs/superpowers/specs/`. The compound-engineering planner looks in `docs/brainstorms/`. Neither knows the other exists. We established bridging rules: always pass file paths explicitly, create handoff summaries at publisher boundaries, never rely on auto-detection across publishers.

The whole audit took maybe 20 minutes. Without it, I would have started building with half the right skills and discovered the gaps mid-implementation — when it's expensive to course-correct.
