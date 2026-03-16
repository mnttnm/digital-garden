---
title: "You're probably leaving easy value on the table if you use Claude"
date: 2026-03-11
kind: learning
tags:
  - ai-tools
  - workflow
  - cowork
  - productivity
draft: false
images: []
videos: []
prompts: []
---

Every morning at 9 AM, Claude checks my calendar, scans Slack, looks at yesterday's progress, and sends me a prioritized plan for the day. Every Friday evening, it drafts my end-of-week update. All on autopilot.

What it took to set up:

1. Installed a few [official plugins](https://support.claude.com/en/articles/13837440-use-plugins-in-cowork) — Productivity, Slack, Google Calendar.
2. Connected the [connectors](https://claude.ai/settings/connectors) — just OAuth, couple of minutes each.
3. Typed `/schedule`, described what I wanted in plain English.

That's it. No prompt engineering, no API wiring, no orchestration. The plugins ship with skills that already know how to search Slack, read calendars, manage tasks. You just tell it what to do.

The `/schedule` command is what makes this really click. You describe a task, pick a cadence, and [Cowork](https://support.claude.com/en/articles/13345190-get-started-with-cowork) runs it for you with full access to all your connected tools. So my daily planner isn't a dumb cron job — it actually reads my real calendar, real Slack messages, real task list, and reasons about what matters today.

I started with defaults and tweaked after seeing what it produced. Small stuff — "also check #general" or "flag meetings that need prep." Start simple, iterate from what you see.

If you're already on Claude Pro/Max and haven't tried plugins + `/schedule`, just go click a few install buttons. The barrier isn't knowledge — it's just getting started.
