# Project Changelog

A timeline of changes made to the digital garden project.

---

## 2026-02-11

### Updated About page content and styling
- Refreshed bio description with personal context (10+ years web development, AI-assisted workflows, agentic development)
- Changed meta description from service-focused to "Builder and tinkerer sharing notes on AI, tools, and side projects"
- Updated page subtitle to "A little context on who's writing all this"
- Replaced "What I help with" services section with "Currently interested in" section
- Simplified "Work with me" to "Get in touch" with updated contact links (Twitter/X, LinkedIn, GitHub)
- Removed "Available for projects" status indicator and Calendly link
- Adjusted font sizes and spacing throughout for better visual hierarchy
- Updated link styling with accent colors and hover states

---

## 2026-02-11

### Refactored projects listing display
- Updated `getLatestActivityDate` to return full activity object instead of just date
- Changed project margin layout to show only relative timestamp without stack display
- Updated project card to prioritize latest activity title over separate metadata
- Redesigned meta links section with improved spacing and separator styling

### Standardized page headers across site
- Added consistent header pattern to homepage (h1.page-title + p.page-subtitle)
- Applied header styling to about and projects pages
- Implemented clamp-based responsive sizing for titles: `clamp(1.4rem, 2.5vw, 1.8rem)`
- Uses serif font family with 500 weight and letter-spacing for visual consistency

### Added article content link styling
- Implemented prose links with accent color and semi-transparent underlines
- Added hover state with full opacity underline transition
- Applied to all links within article content areas

### Added Projects list page
- Created `/projects/` route with feed-style layout matching homepage
- Added "Projects" nav item between "learning.log" and "About"
- Each project shows: title (clickable with subtle underline), description, latest activity, and meta links (Code/Live/tags)
- Left margin displays relative timestamp (e.g., "2w ago")

### Simplified homepage feed
- Removed filter tabs (All/Projects/Discoveries) - now shows unified stream
- Streamlined pagination logic

### Standardized page headers
- All pages now use consistent header pattern: h1 title + subtitle
- Applied uniform styling across homepage, projects, and about pages
- Uses serif font, responsive sizing via clamp(), tertiary color subtitles

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

### Added
- New TIL: "Compound Engineering plugin for AI-assisted dev workflows"
- Newsletter workflow plan document (`docs/newsletter-workflow.md`) with 4-phase implementation strategy for personalized newsletters with content preferences

---
