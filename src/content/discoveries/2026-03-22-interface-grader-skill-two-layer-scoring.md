---
title: "Grading interfaces with a two-layer scoring skill in Claude Code"
date: 2026-03-22
kind: learning
tags: ["claude-code", "skills", "ui-design", "design-quality", "evaluation"]
draft: true
images:
  - src: "/captures/discoveries/interface-grader-scorecard.png"
    alt: "Interface grader score card showing Layer 1 goal alignment at 100% and per-page craft scores"
videos: []
code: ""
codeLanguage: ""
prompts: []
---

I built a Claude Code skill that grades any website or app interface on a 0–100% scale. Binary pass/fail across ~55 criteria covering typography, color, composition, copy, motion, and responsiveness.

Layer 1 establishes what the site is trying to achieve. The agent reads the site, forms assumptions about purpose and audience, confirms with you, then builds a "Site Context Card." Layer 2 grades craft quality through that lens. When a criterion conflicts with the confirmed goal, it becomes an "intentional exception" (pass with justification) instead of a failure. My digital garden deliberately keeps brand text quiet so content dominates. A generic rubric calls that a failure. The two-layer system recognizes it as correct for a content-first site, while still catching real issues like a missing `viewport-fit=cover` meta tag.

The skill identifies unique page types and grades each one separately. This caught something every previous version missed. My Feed page scored 92%, but my About page scored 67%. The page most important for recruiters (my secondary audience) was my weakest. No motion, filler subtitle, generic heading. A single-page rubric would have averaged that away.

A fast code pass reads the source and catches structural issues in ~30 seconds. A visual pass takes Playwright screenshots at desktop and mobile viewports and evaluates perceptual qualities. The code pass covers 82% of criteria. The visual pass caught one thing the code missed: brand text that looked fine in CSS was actually invisible when rendered, because position and area matter as much as font-size.

Each grade writes to `grades/grade-NNN.md` with a delta report showing exactly what moved. Run it after every major UI change and you get a quantitative changelog of design decisions. The practical rhythm: code pass after every iteration (cheap, fast), visual pass before deploying (thorough, catches perceptual issues). Parallel subagents per page type means four pages grade in ~30 seconds.
