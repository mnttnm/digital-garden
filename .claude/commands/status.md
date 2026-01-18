---
description: Show site status - git changes, content counts, recent activity
allowed-tools:
  - Bash
  - Glob
  - Read
  - Grep
---

Show the current status of the digital garden.

## Instructions

Gather and display:

### 1. Git Status
Run `git status --short` to show:
- Uncommitted changes
- Untracked files
- Whether we're ahead/behind remote

### 2. Content Counts
Count files in each content directory:
- Posts: `src/content/posts/*.md`
- TILs: `src/content/til/*.md`
- Resources: `src/content/resources/*.md`
- Projects: `src/content/projects/*.md`

### 3. Draft Count
Search for `draft: true` across all content to show how many drafts exist.

### 4. Recent Activity
Show the 5 most recently modified content files.

## Output Format

```
📊 Digital Garden Status
========================

Git:
  [status summary - clean/changes pending/etc]

Content:
  📝 Posts:     X
  💡 TILs:      X
  🔗 Resources: X
  🔨 Projects:  X
  📋 Drafts:    X

Recent Changes:
  - [filename] (modified X ago)
  - [filename] (modified X ago)
  ...
```

Keep output concise and scannable.
