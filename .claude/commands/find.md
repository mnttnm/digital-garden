---
description: Search content by keyword
allowed-tools:
  - Grep
  - Glob
  - Read
---

Search for content containing: $ARGUMENTS

## Instructions

1. Search all files in `src/content/` for the keyword(s)
2. Search both:
   - Frontmatter (title, description, tags)
   - Body content
3. Show matching files with context

## Output Format

```
🔍 Search results for "[keyword]"
==================================

Found X matches:

📝 [Post Title]
   src/content/posts/filename.md
   "...context around the match..."

💡 [TIL Title]
   src/content/til/filename.md
   "...context around the match..."

🔗 [Resource Title]
   src/content/resources/filename.md
   "...context around the match..."
```

## If No Results

```
No content found matching "[keyword]"

Try:
- Different keywords
- Check spelling
- Use /tags to see available topics
```

## Tips

- Search is case-insensitive
- Show 1-2 lines of context around each match
- Highlight the matching portion if possible
