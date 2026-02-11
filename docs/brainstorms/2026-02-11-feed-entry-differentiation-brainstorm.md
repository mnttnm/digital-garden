# Feed Entry Visual Differentiation

**Date:** 2026-02-11
**Status:** Ready for planning

## What We're Building

Visual differentiation between project updates and other entries (learnings, resources, thoughts) in the learning.log feed, enabling quick scanning while maintaining a clean aesthetic.

### The Problem

All feed entries currently look nearly identical. The only distinction is a small colored dot and category label, making it difficult to quickly identify project updates vs discoveries when scrolling.

### The Solution

Add a **left border accent** to project entries using the warm accent color (`--accent: #c4704b`). This creates a subtle but clear vertical stripe pattern that's instantly scannable without adding visual clutter.

```
┌──────────────────────────────────
│ Feb 10    PROJECT UPDATE •
│           Launched new feature...
└──────────────────────────────────
  ↑ warm accent border (3-4px)
```

## Why This Approach

### User Goals
- **Quick scanning** — Instantly spot project updates vs discoveries while scrolling
- **Subtle but clear** — Professional look, not visually busy
- **Project emphasis** — Project updates represent shipped work and should feel like milestones

### Rejected Alternatives

1. **Subtle Background Tint** — Can feel busy when project entries cluster; harder to calibrate across themes
2. **Enhanced Category Chip** — Smaller visual footprint, less scannable than full-width treatment

### Why Left Border Works Best
- Minimal visual noise—clean and professional
- Creates instantly scannable vertical stripe pattern
- Leverages existing `--accent` color for brand consistency
- No major layout restructuring needed

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Visual treatment | Left border accent | Clean, scannable, minimal layout change |
| Border color | `--accent` (#c4704b) | Warm, on-brand, already in design system |
| Border width | 3-4px | Visible but not heavy |
| Which entries get border | Project updates only | Creates clear "shipped work" milestone feel |
| Other entries | No special treatment | Keeps them clean, lets projects stand out |

## Open Questions

- Should the border extend full height of the entry or just partial?
- Should hover state intensify the border slightly?
- Does this need any adjustment for dark mode visibility?

## Implementation Scope

**Affected files:**
- `src/pages/index.astro` — Add conditional border class to project entries

**Estimated complexity:** Small — CSS-only change with conditional class

## Success Criteria

- [ ] Project entries have visible left border accent
- [ ] Border uses existing `--accent` color
- [ ] Works correctly in both light and dark themes
- [ ] Quick scan test: Can identify project vs discovery in <1 second
