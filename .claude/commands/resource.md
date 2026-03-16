---
description: Add a curated resource (link with commentary)
allowed-tools:
  - Read
  - Write
  - Glob
  - WebFetch
---

Add this resource to my collection: $ARGUMENTS

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
title: "[Short title describing the resource]"
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

[1-2 sentences on why it's worth checking out. Keep it casual — "Came across this...", "Worth bookmarking."]
```

## Voice

- Brief and casual — not a review, just a nudge
- Why you're sharing it, not what's in it
- Skip formal descriptions

Create immediately. Fetch the page to get the actual title.
