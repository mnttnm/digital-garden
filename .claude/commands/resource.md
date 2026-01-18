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
   - Fetch the page to get title and description
   - Infer the category from the content type
2. If argument is a description:
   - Ask for the URL, or create with placeholder

3. Generate slug from resource title
4. Create at: `src/content/resources/YYYY-MM-DD-slug.md`

## File Template

```markdown
---
title: "[Resource title - from page or argument]"
description: "[Why this is valuable - 1 sentence]"
date: [Today's date YYYY-MM-DD]
category: "[article|video|tool|book|course|other]"
url: "[The URL]"
tags: [[1-3 relevant tags]]
draft: false
---

[Write 2-3 sentences about why this resource is worth checking out. What's the key insight or value?]

[If applicable, add bullet points of highlights or key takeaways]
```

## Category Guidelines

- `article` - Blog posts, essays, documentation
- `video` - YouTube, talks, tutorials
- `tool` - Software, libraries, apps
- `book` - Books, ebooks
- `course` - Online courses, tutorials
- `other` - Podcasts, repos, anything else

Create immediately. Infer category from URL/content.
