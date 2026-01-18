---
description: Commit and push all changes to deploy the site
allowed-tools:
  - Bash
  - Read
  - Glob
---

Publish all changes to the live site.

## Instructions

1. Run `git status` to see what's changed
2. If there are changes:
   - Stage all changes: `git add -A`
   - Generate a smart commit message based on what changed
   - Commit with that message
   - Push to origin main
3. If no changes: Report that there's nothing to publish

## Commit Message Format

Based on the files changed, generate a message like:
- "Add: new post about [topic]" - for new posts
- "Add: TIL about [topic]" - for new TILs
- "Add: [resource name] to resources" - for new resources
- "Update: [project name] project" - for project updates
- "Update: multiple content pieces" - for multiple changes
- "Fix: [description]" - for corrections

## After Publishing

Report:
1. What was committed (summary)
2. Confirm push was successful
3. Remind that GitHub Actions will deploy automatically (takes ~1-2 minutes)

## Important

- Do NOT use `git add -i` or any interactive git commands
- Use `git add -A` to stage everything
- Push to `origin main`
