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
3. Create at: `src/content/discoveries/YYYY-MM-DD-slug.md`

## File Template

```markdown
---
title: "[Short title — what you noticed or learned]"
date: [Today's date YYYY-MM-DD]
kind: learning
tags: [[1-2 relevant tags]]
draft: false
images: []
videos: []
prompts: []
---

[Write 1-3 short sentences. Keep it raw and observational — just say what happened or what you noticed. Skip the takeaway wrap-up.]
```

## Voice

- First person — "I noticed...", "Ran into...", "Turns out..."
- Short and punchy — 2-4 sentences max
- Dev journal style, not tutorial style
- Mention surprises or gotchas if relevant

Create immediately without asking questions.
