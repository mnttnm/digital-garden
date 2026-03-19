---
description: Add a curated resource (link with commentary)
allowed-tools:
  - Read
  - Write
  - Glob
  - WebFetch
---

Add this resource to my collection: $ARGUMENTS

## Writing Style

Read and follow [references/writing-style.md](references/writing-style.md) for voice, title, and structure guidelines.

## Instructions

1. If argument is a URL:
   - Fetch the page to get the actual title
   - Infer tags from the content type
2. If argument is a description:
   - Ask for the URL, or create with placeholder

3. Generate slug from resource title
4. Create at: `src/content/discoveries/YYYY-MM-DD-slug.md`

## File Template

```markdown
---
title: "[What this resource is about — straightforward, no clickbait]"
date: [Today's date YYYY-MM-DD]
kind: resource
tags: [[1-3 relevant tags]]
draft: false
url: "[The URL]"
linkTitle: "[Actual page title from the link]"
images: []
videos: []
prompts: []
---

[1-2 sentences on why it's worth checking out. Not a review — just why you're sharing it. Keep it genuine.]
```

## Voice Quick Reference

- Brief and genuine — a nudge, not a pitch
- Why you're sharing it, not a summary of what's in it
- Title describes the topic, not your reaction to it
- No superlatives or emotional bait

Create immediately. Fetch the page to get the actual title.
