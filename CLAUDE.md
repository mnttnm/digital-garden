# Digital Garden - Claude Code Guide

This is an Astro-based blog/digital garden. This file helps Claude Code understand and manage this project effectively.

## Project Overview

A minimal, text-focused blog for sharing notes, learnings, and curated resources. Built with Astro and deployed to GitHub Pages.

---

## Slash Commands

This project includes custom slash commands for easy content management. Type `/` in Claude Code to see all available commands.

### Content Creation

| Command | Description | Example |
|---------|-------------|---------|
| `/post` | Create a new blog post | `/post Getting Started with Rust` |
| `/til` | Create a TIL entry | `/til Git stash accepts a message` |
| `/resource` | Add a curated link | `/resource https://example.com/article` |
| `/project` | Create/update a project | `/project My Side Project` |

### Publishing

| Command | Description | Example |
|---------|-------------|---------|
| `/publish` | Commit and push to deploy | `/publish` |
| `/build` | Build site, check for errors | `/build` |
| `/preview` | Start local dev server | `/preview` |
| `/status` | Show git status & content counts | `/status` |

### Management

| Command | Description | Example |
|---------|-------------|---------|
| `/drafts` | List all unpublished drafts | `/drafts` |
| `/recent` | Show recently modified content | `/recent` |
| `/tags` | List all tags with counts | `/tags` |
| `/find` | Search content by keyword | `/find async await` |

---

## Quick Start

```bash
npm install            # Install dependencies
npm run dev            # Start dev server at localhost:4321
npm run build          # Build for production
```

---

## Content Structure

All content lives in `src/content/` with four collections:

### 1. Posts (`src/content/posts/`)
Long-form articles and tutorials.

```markdown
---
title: "Article Title"
description: "Brief description for previews and SEO"
date: 2025-01-13
tags: ["tag1", "tag2"]
draft: false
image: "/images/optional-hero.jpg"  # optional
---

Content here...
```

### 2. TIL - Today I Learned (`src/content/til/`)
Quick notes and small discoveries.

```markdown
---
title: "Short descriptive title"
date: 2025-01-13
tags: ["topic"]
draft: false
---

Brief content...
```

### 3. Resources (`src/content/resources/`)
Curated links with commentary.

```markdown
---
title: "Resource Title"
description: "Why this is valuable"
date: 2025-01-13
category: "article"  # article | video | tool | book | course | other
url: "https://example.com"
tags: ["topic"]
draft: false
---

Your notes/commentary about this resource...
```

### 4. Projects (`src/content/projects/`)
Personal projects and experiments.

```markdown
---
title: "Project Name"
description: "What this project does"
date: 2025-01-13
status: "in-progress"  # idea | in-progress | completed | archived
repo: "https://github.com/user/repo"  # optional
demo: "https://demo-url.com"  # optional
tags: ["tech-used"]
image: "/images/project-screenshot.png"  # optional
draft: false
---

Detailed description, updates, learnings...
```

---

## File Naming Conventions

- **Posts:** `YYYY-MM-DD-slug-title.md` (e.g., `2025-01-13-getting-started-with-rust.md`)
- **TIL:** `YYYY-MM-DD-short-description.md` (e.g., `2025-01-13-git-stash-pop.md`)
- **Resources:** `YYYY-MM-DD-resource-name.md` (e.g., `2025-01-13-designing-data-intensive-apps.md`)
- **Projects:** `project-name.md` (e.g., `digital-garden.md`)

---

## Images

Store images in `public/images/` and reference them as `/digital-garden/images/filename.jpg` in markdown.

---

## Tags

Use lowercase, hyphenated tags for consistency:
- ✅ Good: `machine-learning`, `web-dev`, `rust`, `til`
- ❌ Avoid: `Machine Learning`, `webDev`, `RUST`

---

## Drafts

Set `draft: true` in frontmatter to hide content from the site while working on it.

---

## Typical Workflows

### Quick TIL
```
/til I learned that CSS :has() selector can style parent elements
/publish
```

### Add a resource
```
/resource https://example.com/great-article
/publish
```

### Write an article
```
/post How I Built My Digital Garden
# Edit the created file...
/publish
```

### Check what needs attention
```
/status
/drafts
```

---

## Configuration

| Setting | Location |
|---------|----------|
| Site URL | `astro.config.mjs` → `site` |
| Site title | `src/layouts/Base.astro` |
| Navigation | `src/layouts/Base.astro` |
| Styling | `src/styles/global.css` |

---

## Deployment

This site auto-deploys to GitHub Pages when you push to `main`. The workflow is in `.github/workflows/deploy.yml`.

To deploy manually:
```bash
npm run build
# Upload dist/ folder to your hosting
```
