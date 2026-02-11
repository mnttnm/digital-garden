# Project Changelog

A timeline of changes made to the digital garden project.

---

## 2026-02-11

### Added TIL (Today I Learned) content type
- Created new `til` collection with schema in content config
- Integrated TILs into the learning.log feed
- Added TIL detail page route at `/til/[slug]/`
- First TIL: "Use Claude in Chrome for debugging deployment issues"

### Cleaned up sample content

- Removed placeholder resource notes (css-grid, oklch, react server components)
- Kept only user-created notes

### Added visual accent to project entries

- Added left border accent (3px solid) to project update entries in learning.log feed
- Uses `--accent` color for brand consistency, auto-adapts to dark mode
- Enables quick visual scanning to distinguish project updates from other entries

---
