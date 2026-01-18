# Digital Garden 🌱

A minimal, text-focused blog built with [Astro](https://astro.build). Perfect for sharing notes, learnings, and curated resources.

## Features

- **Four content types:** Posts, TIL (Today I Learned), Resources, Projects
- **RSS feed** for subscribers
- **Dark mode** support (follows system preference)
- **Claude Code friendly** — includes CLAUDE.md for AI-assisted management
- **Auto-deploy** to GitHub Pages

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Creating Content

All content lives in `src/content/`. See [CLAUDE.md](./CLAUDE.md) for detailed documentation on content types and frontmatter schemas.

### Blog Post
```bash
# Create: src/content/posts/2025-01-13-my-post.md
```

### Quick Note (TIL)
```bash
# Create: src/content/til/2025-01-13-something-i-learned.md
```

### Curated Resource
```bash
# Create: src/content/resources/2025-01-13-cool-tool.md
```

### Project Update
```bash
# Create: src/content/projects/my-project.md
```

## Deployment

### GitHub Pages (Automatic)

1. Push to `main` branch
2. GitHub Actions builds and deploys automatically

### Manual Setup

1. Create a GitHub repo named `digital-garden` (or your preferred name)
2. Update `astro.config.mjs`:
   - Set `site` to your GitHub Pages URL
   - Set `base` to your repo name
3. Enable GitHub Pages in repo settings (Settings → Pages → Source: GitHub Actions)
4. Push your code

## Using with Claude Code

This project includes a `CLAUDE.md` file that helps Claude Code understand the project structure. You can use natural language to:

- "Create a new post about [topic]"
- "Add a TIL about [thing I learned]"
- "Save this link as a resource: [URL]"
- "Update the status of [project] to completed"
- "Publish my changes"

## Customization

- **Site title/nav:** Edit `src/layouts/Base.astro`
- **Styling:** Edit `src/styles/global.css`
- **Content schemas:** Edit `src/content/config.ts`
- **Site URL:** Edit `astro.config.mjs`

## License

MIT
