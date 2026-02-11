---
title: "feat: Add left border accent to project entries"
type: feat
date: 2026-02-11
---

# Add Left Border Accent to Project Entries

Add a visual left border accent to project update entries in the learning.log feed, enabling quick scanning to distinguish them from other entry types.

## Acceptance Criteria

- [x] Project entries display a 3-4px left border using `--accent` color
- [x] Border extends full height of the entry
- [x] Non-project entries (learnings, resources, thoughts) remain unchanged
- [x] Works correctly in both light and dark themes
- [x] No hover state change (static border)

## Context

**Problem:** All feed entries look nearly identical. The small category dot and label provide minimal visual distinction when scanning.

**Solution:** Add a left border accent to project entries only, creating an instantly scannable vertical stripe pattern.

**Brainstorm:** [docs/brainstorms/2026-02-11-feed-entry-differentiation-brainstorm.md](../brainstorms/2026-02-11-feed-entry-differentiation-brainstorm.md)

## Implementation

### src/pages/index.astro

**1. Add conditional class to entry item (around line 78):**

Current:
```astro
<li class="entry-item reveal" style={`--reveal-delay: ${Math.min(index * 42, 260)}ms;`}>
```

Change to:
```astro
<li class:list={['entry-item', 'reveal', { 'entry-project': item.category === 'projects' }]} style={`--reveal-delay: ${Math.min(index * 42, 260)}ms;`}>
```

**2. Add CSS for project border accent (in `<style>` section):**

```css
/* Project entry left border accent */
.entry-item.entry-project {
  border-left: 3px solid var(--accent);
  padding-left: 0.75rem;
  margin-left: -0.75rem;
}
```

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Border color | `var(--accent)` | Uses existing design token; auto-adapts to dark mode |
| Border width | 3px | Visible but not heavy |
| Placement | Full entry height | Consistent vertical stripe for scanning |
| Hover state | None | YAGNI—keep it simple |

## Testing Checklist

- [ ] Light theme: Border visible with warm accent color
- [ ] Dark theme: Border visible with adjusted accent color
- [ ] Mobile: Border displays correctly on small screens
- [ ] Quick scan test: Can identify project entries in <1 second

## References

- Pattern: `class:list` conditional classes (line 87 in index.astro)
- Design tokens: `src/styles/global.css` lines 6-23 (light), 73-111 (dark)
- Brainstorm: `docs/brainstorms/2026-02-11-feed-entry-differentiation-brainstorm.md`
