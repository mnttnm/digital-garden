---
description: List all draft content (unpublished)
allowed-tools:
  - Glob
  - Read
  - Grep
---

Find and list all content marked as drafts.

## Instructions

1. Search all content directories for files with `draft: true`
2. For each draft, extract:
   - Title
   - Type (post/til/resource/project)
   - Date created
   - File path

## Output Format

```
📋 Drafts (X total)
===================

Posts:
  • "[Title]" - created [date]
    src/content/posts/[filename]

TILs:
  • "[Title]" - created [date]
    src/content/til/[filename]

Resources:
  • "[Title]" - created [date]
    src/content/resources/[filename]

Projects:
  • "[Title]" - created [date]
    src/content/projects/[filename]
```

If no drafts:
```
✨ No drafts! All content is published.
```

## Tip

After listing, ask if the user wants to:
- Publish a specific draft (set draft: false)
- Delete an abandoned draft
- Edit a draft
