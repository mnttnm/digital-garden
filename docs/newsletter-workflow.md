# Newsletter Workflow Plan

## Goal

Create an effortless workflow to share learnings, curated links, and project updates with subscribers who can filter by interest and frequency.

---

## Current State

- **Subscription**: Captures email + frequency (daily/weekly) — no content preferences
- **Content types**: essay, link, snippet, thought (notes) + projects
- **Automation**: GitHub Action exists but scripts not implemented
- **Commands**: `/post`, `/til`, `/resource`, `/project` for content creation

---

## Proposed Solution

### Subscriber Preferences (Simple Model)

Two choices only — easy to understand, easy to manage:

| Preference        | What they receive                                       |
| ----------------- | ------------------------------------------------------- |
| **All updates**   | Everything — learnings, curated links, project updates  |
| **Projects only** | Just project launches, milestones, and updates          |

### Content Categorization

Content is either "project" or "general":

- **Projects** — From `src/content/projects/` collection
- **General** — All notes (essays, TILs, links, thoughts, snippets)

No schema changes needed — we use the existing collection structure.

---

## Implementation Phases

### Phase 1: Content Foundation (Manual Start)

**Goal**: Establish capture habit, no code changes needed initially

**Daily Routine** (5-10 min):

1. Browse Twitter/YouTube/feeds in morning
2. For each interesting find: `/resource <url>` with your take
3. For learnings: `/til <what you learned>`
4. For project updates: `/project <update>`
5. End of day: `/publish` to deploy

**Files to modify**:

- `.claude/commands/resource.md` — Enhance to auto-detect source platform

### Phase 2: Subscription Enhancement

**Goal**: Let subscribers choose their interests

**Changes**:

- Update subscription form with topic checkboxes
- Store preferences in Resend (using Topics or custom fields)
- Send personalized welcome email based on choices

**Files to modify**:

- `src/components/SubscribeForm.astro` — Add topic selection UI
- `src/pages/api/subscribe.ts` — Handle topic preferences

### Phase 3: Newsletter Generation (Manual Review)

**Goal**: Generate newsletter, you review before sending

**New commands**:

- `/newsletter-preview` — Generate and preview email in browser
- `/newsletter-send` — Send the approved newsletter

**Workflow**:

1. Run `/newsletter-preview daily` or `/newsletter-preview weekly`
2. Opens HTML preview in browser showing exactly what subscribers will receive
3. Review content, make edits if needed
4. Run `/newsletter-send` to dispatch to all subscribers

**Scripts to create**:

```
scripts/
  generate-newsletter.ts   # Aggregate content, generate HTML
  send-newsletter.ts       # Send via Resend API
  templates/
    daily.html             # Daily digest template
    weekly.html            # Weekly digest template
```

**Logic**:

1. Query content published since last newsletter
2. Separate into: notes (all general content) vs projects
3. Generate two versions: "all updates" and "projects only"
4. On send: match each subscriber to their preference version

### Phase 4: Semi-Automation (Future)

**Goal**: Reduce friction while keeping approval control

**When ready**:

- GitHub Action generates preview daily/weekly
- Sends you a notification with preview link
- You click "approve" to send, or ignore to skip
- No action = no email sent (safe default)

**File to modify**:

- `.github/workflows/newsletter.yml` — Enable preview generation

---

## New Slash Commands

### `/curate` (quick capture)

```bash
/curate https://twitter.com/user/status/123
```

- Auto-detects platform (Twitter, YouTube, article)
- Fetches title/metadata from URL
- Creates note with `type: link` and source info in frontmatter
- Prompts for your take/commentary

### `/dailycapture` (guided session)

Interactive capture that asks:

1. What did you learn today?
2. Any interesting links to share?
3. Project updates?

Creates all content in one session.

---

## Email Template Structure

```
Subject: [Daily/Weekly] Notes from Mohit — Jan 15

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THINGS I LEARNED
- Redis sorted sets for leaderboards
- CSS container queries are production-ready
[Read more →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INTERESTING FINDS
- [Twitter] Why SQLite is taking over
- [YouTube] Fireship on Bun 1.0
- [Article] The end of localhost

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT UPDATES
- Digital Garden: Added newsletter preferences
[View project →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Manage preferences] [Unsubscribe]
```

---

## Verification Plan

1. **Phase 1**: Manually create 5 pieces of content using new workflow, verify they appear on site
2. **Phase 2**: Test subscription with different preference combinations
3. **Phase 3**: Run newsletter script locally, verify email content matches subscriber preferences
4. **Phase 4**: Monitor first automated sends, check delivery rates in Resend dashboard

---

## Files to Create

- `scripts/generate-newsletter.ts` — Content aggregation logic
- `scripts/send-newsletter.ts` — Resend API integration
- `scripts/templates/daily.html` — Daily digest email template
- `scripts/templates/weekly.html` — Weekly digest email template
- `.claude/commands/curate.md` — Quick URL capture command
- `.claude/commands/newsletter-preview.md` — Preview newsletter command
- `.claude/commands/newsletter-send.md` — Send newsletter command

## Files to Modify

- `src/components/SubscribeForm.astro` — Add "All updates" vs "Projects only" toggle
- `src/pages/api/subscribe.ts` — Store content preference alongside frequency
- `.claude/commands/resource.md` — Auto-detect source platform (Twitter/YouTube/etc)
- `.github/workflows/newsletter.yml` — Enable preview generation (Phase 4)
