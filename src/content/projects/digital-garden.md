---
title: "learning.log"
description: "A living publishing system that combines fast capture, editorial review, newsletter shipping, and a calm reading experience."
date: 2026-01-19
featured: true
github: "https://github.com/mnttnm/digital-garden"
stack: ["Astro", "Raycast", "iOS Shortcuts", "Resend", "Upstash Redis", "Vercel"]
outcome: "From static pages to a product-style changelog: capture quickly, curate deliberately, and ship consistently."
tags: ["digital-garden", "publishing-system", "changelog", "workflow", "design"]
activity:
  - date: 2026-01-19
    title: "Why I built learning.log — a personal publishing system"
    summary: "I wanted a place to think out loud, ship what I learn, and build in public without the pressure of perfection. learning.log is my attempt at a calm, continuous feed where projects evolve as changelogs and discoveries land as they happen — not polished essays that never ship."
    tags: ["vision", "publishing", "building-in-public"]
    activityType: "milestone"
    highlights:
      - "One unified stream instead of scattered blog posts, project pages, and notes"
      - "Changelog-style updates that show work-in-progress, not just finished work"
      - "Capture-first workflow so ideas don't get lost between mobile and desktop"
      - "A calm reading experience that invites return visits"
    image: "/images/projects/digital-garden/changelog/feed-entries.png"
    imageAlt: "learning.log unified feed showing project updates and discoveries"
    imageCaption: "A single timeline for everything I'm learning and building."

  - date: 2026-02-08
    title: "Multi-theme system introduced for a calm reading experience - thank you CC"
    summary: "Why not make it dynamic++ when it is increasingly easily to do so, just don't overdo it and make sure the theme stays relevant for your project"
    tags: ["design-system", "theming", "accessibility"]
    activityType: "update"
    highlights:
      - "Multiple visual modes including system-following auto theme"
      - "Reduced visual noise through spacing and typography tuning"
      - "Consistent look across feed, project pages, and details"
    images:
      - src: "/images/projects/digital-garden/changelog/theme-system.png"
        alt: "Theme controls showing warmth, font, and appearance options"
        caption: "Calm aesthetics became a core product feature, not just styling."
      - src: "/images/projects/digital-garden/changelog/dark-theme.png"
        alt: "Learning.log feed in dark mode"
      - src: "/images/projects/digital-garden/changelog/light-theme.png"
        alt: "Learning.log feed in light mode"

  - date: 2026-02-13
    title: "Capture pipeline launched with iOS Shortcuts + Raycast input"
    summary: "Built a capture solution using Apple Shortcuts for mobile and Raycast interface on Mac, This was my first time building workflows using shortcuts and I think they are really powerful. The Raycast to capture resources is also pretty cool imo"
    tags: ["capture", "ios-shortcuts", "raycast", "workflow"]
    activityType: "learning"
    highlights:
      - "You can build crazy workflows using the native apple shortcults tool"
      - "Desktop quick capture for low-friction publishing"
      - "Review-first flow before public release"
    images:
      - src: "/images/projects/digital-garden/changelog/capture-by-shortcuts.png"
        alt: "iOS Shortcuts workflow showing capture actions and API integration"
        caption: "Mobile capture via Share Sheet sends content straight to the review queue."
      - src: "/images/projects/digital-garden/changelog/raycast-capture-mac.png"
        alt: "Raycast extension with fields for content, image, comment, project, and tags"
        caption: "Desktop capture with structured input for quick publishing."

  - date: 2026-02-13
    title: "Newsletter shipping moved into a repeatable automation loop"
    summary: "Preview-first generation and controlled send flow now support a dependable publishing cadence without manual scramble."
    tags: ["newsletter", "automation", "operations"]
    activityType: "milestone"
    highlights:
      - "Preview workflow before send"
      - "Batch publishing aligns site updates and email output"
      - "Operational rhythm improved for regular shipping"

  - date: 2026-02-28
    title: "Built a skill that turns Claude Code sessions into feed entries"
    summary: "I kept noticing that useful things come up during Claude Code sessions — tricks, gotchas, tooling patterns — but I'd lose them once the session ended. So I built a harvest-feed skill that scans the conversation history and proposes 4-5 draft entries, classified by type, written in first person, and saved as drafts for review. Now I can capture insights without worrying about missing something important."
    tags: ["skills", "content-pipeline", "claude-code", "workflow"]
    activityType: "update"
    highlights:
      - "Type /harvest-feed at the end of any session and get draft posts from what just happened"
      - "Auto-classifies each suggestion as TIL, essay, or project update based on what fits"
      - "Writes everything with draft: true — nothing publishes until I review it"
      - "Bonus: built the whole skill using the skill-creator skill — init_skill.py scaffolds the structure, you just fill in the logic"

  - date: 2026-03-02
    title: "Built a first-time visitor welcome experience"
    summary: "New visitors now see a calm, immersive welcome before diving into the feed. A personal greeting types out character by character while a preview of actual content scrolls alongside — learnings, resources, and voices I follow. Click to enter, and it gets out of the way forever."
    tags: ["ux", "onboarding", "design"]
    activityType: "update"
    highlights:
      - "Typed-out greeting to make the welcome feel personal, not static"
      - "Preview generated from real posts so the first impression reflects the actual feed"
      - "Carefully tuned animation and timing to make the whole experience flow naturally"
    videos:
      - src: "/images/projects/digital-garden/changelog/onboarding-welcome.mp4"
        poster: "/images/projects/digital-garden/changelog/onboarding-welcome-poster.png"
        title: "Onboarding welcome experience"
        caption: "A calm introduction before the feed."
draft: false
---

## Product Overview

learning.log is designed as a lightweight publishing product:

- capture quickly from mobile and desktop
- review and curate before shipping
- publish updates in structured milestones
- ship newsletter issues through a repeatable workflow
- maintain a calm, clean reading experience through multi-theme design
