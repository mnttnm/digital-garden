---
description: Create a quick TIL (Today I Learned) entry
allowed-tools:
  - Read
  - Write
  - Glob
---

Create a TIL entry about: $ARGUMENTS

## Writing Style

Read and follow [references/writing-style.md](references/writing-style.md) for voice, title, and structure guidelines.

## Instructions

1. Generate a short slug from the topic (max 5 words, lowercase, hyphens)
2. Use today's date
3. Create at: `src/content/discoveries/YYYY-MM-DD-slug.md`

## File Template

```markdown
---
title: "[What you noticed or learned — straightforward, no clickbait]"
date: [Today's date YYYY-MM-DD]
kind: learning
tags: [[1-2 relevant tags]]
draft: false
images: []
videos: []
prompts: []
---

[Write 2-5 short paragraphs. Lead with what it is, share your experience, include practical details (tool names, commands, flags). Skip preamble and takeaway wrap-ups. Prose over bullets unless the content is genuinely a list.]
```

## Voice Quick Reference

- First person — "I tried...", "The standout was...", "Worth knowing:"
- Calm and genuine — enthusiastic without hype
- Value density — every sentence earns its place
- Title says what the post is about, not how to feel about it
- Generalize internal details — reader doesn't need your project names or people names

Create immediately without asking questions.
