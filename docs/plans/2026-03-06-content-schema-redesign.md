# Content Schema Redesign

## Context

The current schema evolved organically with 4 collections (notes, til, resources, projects), inconsistent field naming, and gaps in the capture pipeline. This redesign creates a clean, consistent schema from first principles.

**User Requirements:**

- Unified schema for learnings and resources
- Projects stay separate with nested activity array
- All content supports: images, videos, code blocks, prompts
- Two feed buckets: "project-updates" vs "discoveries"
- Title = page title (for links) or user-defined title
- Keep user's authentic voice — AI refinement fixes grammar, not tone

---

## Proposed Schema

### Collection 1: `discoveries` (replaces notes, til, resources)

```typescript
// src/content/config.ts
const discoveries = defineCollection({
  type: 'content',
  schema: z.object({
    // Core fields
    title: z.string(),                    // User's title (their framing of this entry)
    date: z.coerce.date(),
    kind: z.enum(['learning', 'resource']),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),

    // Link (optional - present for resources and link-based learnings)
    url: z.string().url().optional(),
    linkTitle: z.string().optional(),     // Actual page title (for link widget display)

    // Media (all use arrays for consistency)
    images: z.array(z.object({
      src: z.string(),
      alt: z.string().optional(),
      caption: z.string().optional(),
    })).default([]),
    videos: z.array(z.object({
      src: z.string(),
      poster: z.string().optional(),
      caption: z.string().optional(),
    })).default([]),
    code: z.string().optional(),
    codeLanguage: z.string().optional(),

    // Prompts used to create/refine this content
    prompts: z.array(z.string()).default([]),
  }),
});
```

**Key decisions:**

- `title` = user's framing of the entry (what they want to call it)
- `linkTitle` = actual page title from URL (displayed on link widget, fallback for title if user doesn't provide one)
- `images[]` array only (no separate `image` field) — simpler, consistent
- `videos[]` supported at schema level
- `prompts[]` tracks AI prompts used for this entry
- No `featured`, `takeaway` — body content serves these purposes

---

### Collection 2: `projects` (simplified)

```typescript
const projects = defineCollection({
  type: 'content',
  schema: z.object({
    // Core fields
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),

    // Project-specific
    github: z.string().url().optional(),
    live: z.string().url().optional(),
    stack: z.array(z.string()).default([]),

    // Activity log (same media schema as discoveries)
    activity: z.array(z.object({
      date: z.coerce.date(),
      title: z.string(),
      summary: z.string(),
      activityType: z.enum([
        'update',
        'milestone',
        'fix',
        'learning',      // Kept! Connects project work to learnings
        'discovery',
        'experiment'
      ]).default('update'),
      tags: z.array(z.string()).default([]),

      // Media (same structure as discoveries)
      images: z.array(z.object({
        src: z.string(),
        alt: z.string().optional(),
        caption: z.string().optional(),
      })).default([]),
      videos: z.array(z.object({
        src: z.string(),
        poster: z.string().optional(),
        caption: z.string().optional(),
      })).default([]),
      code: z.string().optional(),
      codeLanguage: z.string().optional(),

      // Links
      url: z.string().url().optional(),
      actionLabel: z.string().optional(),
      actionUrl: z.string().url().optional(),

      // Prompts
      prompts: z.array(z.string()).default([]),
    })).default([]),
  }),
});
```

**Activity types kept:**

- `learning` — "I learned something while building this" (connects to discoveries)
- `discovery` — "I found something useful"
- `update` — general progress
- `milestone` — significant achievement
- `fix` — bug fix or improvement
- `experiment` — trying something new

---

## Capture Pipeline Changes

### Types (`src/lib/capture/types.ts`)

```typescript
// Simplified types
export type CaptureSource = 'raycast' | 'shortcut' | 'slack' | 'api';
export type CaptureStatus = 'pending' | 'approved' | 'published' | 'rejected';

// Content classification
export type DiscoveryKind = 'learning' | 'resource';
export type ActivityType = 'update' | 'milestone' | 'fix' | 'learning' | 'discovery' | 'experiment';

export interface CaptureImage {
  src: string;
  alt?: string;
  caption?: string;
  data?: string;  // base64 for upload
}

export interface CaptureVideo {
  src: string;
  poster?: string;
  caption?: string;
  data?: string;  // base64 for upload
}

export interface Capture {
  id: string;
  createdAt: string;
  source: CaptureSource;
  status: CaptureStatus;

  // Content
  title?: string;
  url?: string;
  note?: string;              // User's commentary (renamed from "text")

  // Classification
  kind: DiscoveryKind;
  projectSlug?: string;       // If set, this is a project update
  activityType?: ActivityType; // Only for project updates

  // Media (arrays for consistency)
  images?: CaptureImage[];
  videos?: CaptureVideo[];
  code?: string;
  codeLanguage?: string;

  // Metadata
  tags?: string[];
  prompts?: string[];         // AI prompts used

  // AI refinement
  refined?: RefinedCapture;
  publishUseRefined?: boolean;

  // After publishing
  publishedSlug?: string;
}

export interface RefinedCapture {
  title: string;              // User's title (refined)
  linkTitle?: string;         // Extracted page title from URL
  body: string;
  suggestedTags: string[];
  suggestedKind: DiscoveryKind;
  refinedAt: string;
  promptUsed: string;         // Track the refinement prompt
}
```

**Changes from current:**

- `text` → `note` (clearer naming)
- `images` uses consistent object shape with `src`, `alt`, `caption`
- `videos` added to capture
- `prompts[]` tracks AI usage

---

### Ingest Payload (`CaptureIngestPayload`)

```typescript
export interface CaptureIngestPayload {
  url?: string;
  note?: string;              // Renamed from "text"
  source: CaptureSource;
  tags?: string[];
  project?: string;
  activityType?: ActivityType;  // New: can set during capture

  // Media
  images?: Array<{
    data: string;             // base64
    alt?: string;
    caption?: string;
  }>;
  videos?: Array<{
    data: string;             // base64
    poster?: string;
    caption?: string;
  }>;
  code?: string;
  codeLanguage?: string;
}
```

---

### AI Refinement Guidelines

**Philosophy: Fix, don't transform**

The AI refinement step should:

1. **Preserve the user's voice** — Keep their tone, style, and personality
2. **Fix grammar and spelling** — Correct obvious errors
3. **Improve sentence flow** — Make it readable, not polished
4. **Never add information** — Only use what the user provided
5. **Never remove information** — Preserve all user content
6. **Keep it raw and authentic** — Not corporate or overly professional

**Refinement prompt template:**

```
You are helping refine a personal note. The user's authentic voice matters more than polish.

Rules:
- Fix grammar, spelling, and sentence flow
- Keep the original tone and style (casual, personal, authentic)
- Do NOT add information the user didn't provide
- Do NOT remove any information
- Do NOT make it sound corporate or professional
- Preserve the user's personality and writing quirks
- Keep it SHORT — match the original length

Original note:
{user_note}

URL (if shared):
{url}

Return the refined version that sounds like the same person wrote it, just cleaner.
```

**What NOT to do:**

- "This fascinating article explores..." → Keep user's original framing
- Adding transitions like "Furthermore," "Moreover,"
- Expanding short notes into paragraphs
- Removing casual language or humor

---

## Admin UI Changes

### CaptureCard Field Layout

```
┌─────────────────────────────────────────────────────┐
│ [raycast] [2h ago]                        [Refined] │
├─────────────────────────────────────────────────────┤
│ Title: [________________________________]           │
│ URL:   [________________________________] (optional)│
│                                                     │
│ Note:  [________________________________]           │
│        [________________________________]           │
│        [________________________________]           │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ IMAGES                              [+ Add]     │ │
│ │ [img1] [img2] [img3]                            │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ VIDEOS                              [+ Add]     │ │
│ │ [video1] [video2]                               │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ CODE                                            │ │
│ │ Language: [javascript ▼]                        │ │
│ │ [________________________________]              │ │
│ │ [________________________________]              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Kind: [learning ▼]    (or "Project: my-proj")       │
│ Activity Type: [learning ▼]  (shown if project set) │
│ Tags: #ai #agents [+]                               │
├─────────────────────────────────────────────────────┤
│ [Refine] [Reset to Raw]       [Reject] [Approve]    │
└─────────────────────────────────────────────────────┘
```

**Key additions:**

- Videos section with add/remove capability
- Activity Type dropdown (visible when project is selected)
- Code block with language selector
- Images section (replaces single image field)

---

## Feed & Learning Log

### Simplified Types (`src/lib/learning-log.ts`)

```typescript
export type FeedBucket = 'project-updates' | 'discoveries';

export interface FeedItem {
  id: string;
  bucket: FeedBucket;
  date: Date;
  title: string;
  crux: string;                    // First sentence or body excerpt
  href: string;
  isExternal: boolean;

  // Context
  kind?: DiscoveryKind;            // For discoveries
  projectSlug?: string;            // For project updates
  projectTitle?: string;
  activityType?: ActivityType;

  // Media previews
  images?: ImagePreview[];
  video?: VideoPreview;            // First video for preview
  code?: CodePreview;

  // Link preview (for entries with url)
  linkPreview?: {
    title: string;                 // linkTitle from frontmatter (actual page title)
    url: string;
    domain: string;                // Extracted from url
  };

  tags: string[];
}
```

---

## Routes

| Route | Content |
|-------|---------|
| `/` | Unified feed (FeedItems sorted by date) |
| `/discoveries/{slug}/` | Discovery detail page |
| `/projects/{slug}/` | Project detail + activity log |
| `/rss.xml` | RSS feed |

**Redirects for backwards compatibility:**

- `/notes/{slug}/` → `/discoveries/{slug}/`
- `/til/{slug}/` → `/discoveries/{slug}/`

---

## Migration Plan

### Phase 1: Schema & Types

1. Create new `discoveries` collection in config.ts
2. Update capture types (`text` → `note`, add videos, prompts)
3. Update transform.ts with single `transformToDiscovery`

### Phase 2: Content Migration

Migration script to convert existing content:

```bash
# notes/*.md → discoveries/*.md
# - Add kind: 'learning' or 'resource' (based on old type)
# - Convert image/imageAlt to images array
# - Add empty prompts array

# til/*.md → discoveries/*.md
# - Add kind: 'learning'
# - Convert image/imageAlt to images array

# resources/*.md → discoveries/*.md
# - Add kind: 'resource'
# - Convert image/imageAlt to images array

# projects/*.md
# - Rename activity[].type → activity[].activityType
# - Convert single image to images array
# - Add empty prompts arrays
```

### Phase 3: Rendering

1. Update learning-log.ts to read from `discoveries` collection
2. Create `/discoveries/[slug].astro` detail page
3. Add redirects from old routes
4. Update index.astro for new FeedItem structure

### Phase 4: Admin UI

1. Update CaptureCard with new fields
2. Add video section
3. Add activity type dropdown
4. Rename "Body" to "Note"

### Phase 5: AI Refinement

1. Update refinement prompt in refine.ts
2. Ensure original content is preserved
3. Add `promptUsed` tracking to refined output

### Phase 6: Cleanup

1. Delete old collection definitions
2. Delete old page routes
3. Update CLAUDE.md documentation

---

## Files to Modify

| File | Action |
|------|--------|
| `src/content/config.ts` | Replace 4 collections with 2 |
| `src/lib/capture/types.ts` | Simplify, rename text→note, add videos |
| `src/lib/capture/transform.ts` | Single transform function |
| `src/lib/capture/refine.ts` | Update prompt for authentic tone |
| `src/lib/learning-log.ts` | Read from discoveries, simplify |
| `src/components/capture/CaptureCard.astro` | New layout with videos |
| `src/pages/discoveries/[...slug].astro` | New detail page |
| `src/pages/index.astro` | Update for new FeedItem |
| `scripts/migrate-content.ts` | New migration script |

---

## Edge Cases Addressed

1. **Video support end-to-end**: Capture → Storage → Admin UI → Transform → Render
2. **AI refinement tone**: Explicit guidelines to preserve authenticity
3. **No data loss**: Refinement preserves all user input
4. **Prompts tracking**: `prompts[]` field on all content
5. **Activity type for projects**: Dropdown in admin, `learning` type preserved
6. **Images consistency**: Single `images[]` array everywhere
7. **Field naming**: `note` is clearer than `text`
8. **Title vs linkTitle**: User's title for feed entry, page title for link widget
9. **Title fallback**: If user doesn't provide title, use linkTitle (page title)

---

## Verification

After implementation:

1. Capture a link → publishes with kind='resource', url populated
2. Capture text → publishes with kind='learning'
3. Capture with multiple images → all appear in images array
4. Capture video → video appears in admin and published content
5. Capture project update → can select activityType='learning'
6. Refine content → tone stays authentic, grammar improved
7. Home feed shows two buckets correctly
8. Old URLs redirect properly
9. Link entry: title = user's title, link widget shows linkTitle (page title)
10. Link entry without user title: falls back to linkTitle
