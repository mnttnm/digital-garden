---
description: List all tags and their usage counts
allowed-tools:
  - Glob
  - Read
  - Grep
---

Show all tags used across the digital garden.

## Instructions

1. Read all content files in `src/content/`
2. Extract the `tags` array from each file's frontmatter
3. Count occurrences of each tag
4. Sort by count (most used first)

## Output Format

```
🏷️  Tags Overview
=================

Most used:
  #javascript (12)
  #web-dev (8)
  #rust (5)
  #til (4)

All tags:
  #api #astro #automation #book #cli #css
  #database #design #devops #docker #git
  #golang #html #javascript #linux #node
  #performance #python #react #rust #sql
  #testing #typescript #web-dev #writing
```

## Suggestions

After listing, note:
- Any inconsistent tags (e.g., "js" vs "javascript")
- Tags used only once (candidates for consolidation)
- Suggest tag cleanup if needed
