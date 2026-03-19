---
title: "Org-wide Claude Code adoption at Intercom: learnings worth borrowing"
date: 2026-03-18
kind: resource
tags: ["claude-code", "ai-engineering", "enterprise"]
draft: false
url: "https://x.com/brian_scanlan/status/2033978300003987527"
linkTitle: "Brian Scanlan on X"
images: []
videos: []
prompts: []
---

If you're in engineering leadership exploring how to roll out AI-assisted development across an org, this thread from Brian Scanlan (VP Engineering at Intercom) is worth your time. It covers how they've built an internal Claude-based engineering platform with 13 plugins, 100+ purpose-built skills, and lifecycle hooks, not just for individual developers but as infrastructure that scales to non-engineering teams too.

Some notable numbers: ~90% of their pull requests are now authored or opened via Claude Code. Non-engineers (design managers, product leaders, support) run production-data queries themselves through a carefully gated read-only Rails console. Every Claude session is instrumented, gaps are auto-detected, and missing skills get created as GitHub issues automatically.
