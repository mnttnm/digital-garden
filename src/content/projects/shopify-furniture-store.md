---
title: "Shopify Store for a Furniture Brand"
description: "Migrating my sister's WooCommerce furniture store to Shopify — using AI-powered agentic tools instead of the visual builder to see how far it can go."
date: 2026-02-28
featured: true
stack: ["Shopify", "Shopify CLI", "Claude Code", "Shopify MCP", "WooCommerce"]
outcome: "Exploring how far agentic AI tools can take a real e-commerce migration project."
tags: ["shopify", "e-commerce", "ai-assisted", "migration", "agentic-coding"]
image: "/images/projects/shopify-furniture-store/spotlight.png"
activity:
  - date: 2026-03-09
    title: "Longest Claude Session for Shopify Theme"
    summary: "Ran my longest Claude session to generate a Shopify theme for the store. The session lasted almost 30 minutes and produced a theme for me to test. Of course, it wasn't as finished as I wanted, but letting agents run for such a long duration on a task is definitely a new experience for me. The `claude --dangerously-skip-permission` command was needed to make it happen."
    activityType: "learning"
    tags:
      - "Claude"
      - "AI Agents"
      - "Shopify Themes"
      - "AI Development"
    images:
      - src: "/captures/2026-03-09-mmj5ehlb-8ubl.png"
    videos: []
    code: |
      Prompt Gist:
           1. Primary Request and Intent:
              The user requested building a production-grade, premium Shopify store for Greetwood, an
           Indian furniture brand. Key requirements:
              - Create custom premium widgets (not basic Dawn defaults) that are reusable and publishable
              - Target Indian market with premium, bug-free, seamless, intuitive, clean, modern
           experience
              - Use Shopify CLI only (IDE-first, code-first approach)
              - Lead all aspects: design, UX, marketing, copy
              - Track progress via git commits
              - Use placeholder images until real ones are provided
              - Don't stop until complete
    codeLanguage: "markdown"
    prompts: []
  - date: 2026-02-28
    title: "New Project: Starting the WooCommerce to Shopify migration"
    summary: "Kicking off a project to migrate my sister's furniture store from WooCommerce to Shopify. The goal: use AI as much as possible — Shopify CLI, Shopify MCP, and Claude Code — instead of the visual builder. A learning experiment to see how far agentic coding can take a real store build."
    tags: ["kickoff", "shopify", "agentic-coding", "migration"]
    activityType: "milestone"
    highlights:
      - "Product data exported from WooCommerce, converted via scripts, and uploaded to Shopify"
      - "Shopify CLI and Shopify MCP set up as the primary development interface with Claude Code"
      - "Deliberately avoiding the web-based visual builder to test AI-driven workflows"
    image: "/images/projects/shopify-furniture-store/spotlight.png"
    imageAlt: "Shopify admin dashboard for the GreetWood furniture store with products loaded"
    imageCaption: "Store foundation ready — products migrated, theme applied, AI tooling wired up."

  - date: 2026-03-01
    title: "Configuring a Shopify store via Claude Code feels surprisingly good"
    summary: "Been setting up a Shopify store with Claude Code instead of clicking around the admin. Theme colors, collections, nav menus — all through CLI and API calls. Honestly? It flows way better than I expected. No tab-switching, no hunting for the right settings panel. Just describe what I want, watch it happen. The combo of Shopify CLI and their MCP server is what makes it work. AI needs APIs, not buttons."
    tags: ["shopify", "ai-assisted", "mcp", "cli"]
    activityType: "learning"
    highlights:
      - "Theme colors, collections, and nav menus configured entirely through CLI and API"
      - "No tab-switching or hunting for settings panels"
      - "Shopify CLI + MCP server combo makes AI-driven store setup actually practical"
    links:
      - label: "Shopify Dev MCP"
        url: "https://shopify.dev/docs/apps/build/devmcp"
    image: "/images/projects/shopify-furniture-store/shopify-store-with-ai.png"
    imageAlt: "Summary of AI-assisted Shopify store implementation showing technical concepts used"
draft: false
---

## What This Project Is About

My sister runs a furniture store that's currently on WooCommerce. She's looking to move to Shopify, and I'm taking it on — partly to help, partly as a learning experiment.

The plan is to lean on AI as much as possible. Instead of using Shopify's web-based visual builder, I'm working through Shopify CLI and Shopify MCP with Claude Code to handle everything from data migration to theme customization. Let's see how it goes.
