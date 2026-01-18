---
description: Create or update a project entry
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

Create or update project: $ARGUMENTS

## Instructions

1. First, check if a project with a similar name exists in `src/content/projects/`
2. If exists: UPDATE the existing project (e.g., change status, add update notes)
3. If new: CREATE a new project file

## For NEW Projects

Create at: `src/content/projects/project-slug.md`

```markdown
---
title: "[Project Name]"
description: "[1-sentence description of what it does]"
date: [Today's date YYYY-MM-DD]
status: "in-progress"
repo: ""
demo: ""
tags: [[relevant tech/topic tags]]
draft: false
---

## About

[2-3 sentences describing the project goals]

## Features

- [Feature 1]
- [Feature 2]

## Tech Stack

- [Technology 1]
- [Technology 2]

## Progress

- [ ] [First milestone]
- [ ] [Second milestone]
```

## For EXISTING Projects

Common updates:
- Change `status` to: idea → in-progress → completed → archived
- Add repo/demo URLs
- Update progress section
- Add new learnings or notes

## Status Values

- `idea` - Just an idea, not started
- `in-progress` - Actively working on it
- `completed` - Done and working
- `archived` - No longer maintained

If updating, preserve existing content and add to it.
