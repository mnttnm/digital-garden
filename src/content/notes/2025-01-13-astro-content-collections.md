---
title: "Astro Content Collections make managing blog content a breeze"
date: 2025-01-13
tags: ["astro", "web-dev"]
featured: false
type: "thought"
takeaway: "Type-safe frontmatter, automatic routing, and built-in Markdown support in one simple API."
draft: false
---

Just discovered Astro's [Content Collections](https://docs.astro.build/en/guides/content-collections/) feature. It provides:

- **Type-safe frontmatter** — Define schemas with Zod, get autocomplete and validation
- **Automatic routing** — Use `getCollection()` and `getEntry()` to query content
- **Built-in Markdown/MDX support** — Just write `.md` files in the content folder

The setup is simple: create a `src/content/config.ts` file, define your collections, and you're done. No more manual frontmatter parsing or broken links.
