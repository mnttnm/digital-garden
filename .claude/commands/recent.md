---
description: Show recently modified content
allowed-tools:
  - Bash
  - Glob
  - Read
---

Show the most recently modified content files.

## Instructions

1. Find all markdown files in `src/content/`
2. Sort by modification time (most recent first)
3. Show the 10 most recent
4. For each, show:
   - Title (from frontmatter)
   - Type (post/til/resource/project)
   - Last modified time
   - Draft status

## Commands to Use

```bash
# Find recently modified files
find src/content -name "*.md" -type f -exec ls -lt {} + | head -15
```

Or use `ls -lt` with glob patterns.

## Output Format

```
🕐 Recent Content
=================

1. "[Title]" (post)
   Modified: [time ago] | Status: [published/draft]

2. "[Title]" (til)
   Modified: [time ago] | Status: [published/draft]

...
```

Keep it scannable. Show relative times like "2 hours ago", "yesterday", "3 days ago".
