---
title: "Claude Code Agent Teams and multi-agent coordination"
date: 2026-03-11
kind: learning
tags: ["claude-code", "agents", "multi-agent", "tmux", "workflow"]
draft: false
images:
  - src: /captures/discoveries/agent-teams-parallel-build-review.png
    alt: "Multiple agent team panes running in parallel — builders committing code, reviewer critiquing, and the app running live"
videos: []
code: ""
codeLanguage: ""
prompts: []
---

[Claude Code Agent Teams](https://code.claude.com/docs/en/agent-teams) lets you spawn multiple independent Claude Code instances that coordinate through a shared task list and mailbox. Unlike subagents which run within a single session and only report back, these are fully separate sessions that talk to each other directly.

I gave it a rough product idea, asked for a PM, architect, three builders, and a reviewer — Claude spawned all of them. tmux split-pane mode made this work visually. Each agent gets its own pane, everyone's visible at once, and you can click into any pane to interact. It turns multi-agent coordination into something you can actually watch.

![Agent team architecture handoff — build phases table with dependencies, agents picking up tasks](/captures/discoveries/agent-teams-architecture-handoff.png)

The coordination was what impressed me most. The PM wrote a PRD, sent me questions, I answered, the architect picked up the finalized doc, builders waited for dependencies to resolve automatically, then started in parallel. No manual handoffs — the mailbox and task dependency system handled it.

With Claude's 1M context window each agent holds enough project context to stay coherent across a full build. By the end — multiple phases, multiple commits — I had a working app on localhost.

**Good to know:** the feature is experimental — enable with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` in settings. Avoid two agents editing the same file. 3-5 teammates is the sweet spot since token usage scales with team size. Teammates auto-load your CLAUDE.md, MCP servers, and skills.
