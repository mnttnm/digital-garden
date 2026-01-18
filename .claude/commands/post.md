---
description: Create a new blog post
allowed-tools:
  - Read
  - Write
  - Glob
  - TodoWrite
---

Create a new blog post with the title: $ARGUMENTS

## Instructions

1. Generate a URL-friendly slug from the title (lowercase, hyphens, no special chars)
2. Use today's date in YYYY-MM-DD format
3. Create the file at: `src/content/posts/YYYY-MM-DD-slug.md`

## File Template

```markdown
---
title: "[Title from arguments]"
description: "[Generate a 1-sentence description based on the title]"
date: [Today's date YYYY-MM-DD]
tags: []
draft: false
---

[Add a brief intro paragraph based on the title, then leave space for the user to write]

## [Suggested first heading based on topic]

[Content placeholder - user will fill in]
```

## After Creating

1. Show the created file path
2. Briefly confirm what was created
3. Suggest relevant tags based on the title keywords

Do NOT ask questions - just create the post immediately with sensible defaults.
