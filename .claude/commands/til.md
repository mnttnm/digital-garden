---
description: Create a quick TIL (Today I Learned) entry
allowed-tools:
  - Read
  - Write
  - Glob
---

Create a TIL entry about: $ARGUMENTS

## Instructions

1. Generate a short slug from the topic (max 5 words, lowercase, hyphens)
2. Use today's date
3. Create at: `src/content/til/YYYY-MM-DD-slug.md`

## File Template

```markdown
---
title: "[Concise title capturing the learning]"
date: [Today's date YYYY-MM-DD]
tags: [[Infer 1-2 relevant tags from the topic]]
draft: false
---

[Write 1-3 short paragraphs explaining the learning based on what the user provided. Keep it concise and practical. Include a code example if relevant.]
```

## Guidelines

- TILs are SHORT - 1-3 paragraphs max
- Focus on the practical insight
- Include code snippets when applicable
- Use simple, direct language

Create immediately without asking questions.
