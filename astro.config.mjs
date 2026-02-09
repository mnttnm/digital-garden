import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Use BASE_PATH env var for flexibility across deployment targets:
// - Vercel: BASE_PATH='' (or unset) -> deploys to root
// - GitHub Pages: BASE_PATH='/digital-garden' -> deploys to /digital-garden/
// Note: For Vercel, we default to empty. Set BASE_PATH='/digital-garden' for GitHub Pages
const base = process.env.BASE_PATH ?? '';
const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const siblingRepoRoot = path.resolve(projectRoot, '../digital-garden');

export default defineConfig({
  site: process.env.SITE_URL || 'https://digital-garden-five-kappa.vercel.app',
  base,
  output: 'server',
  adapter: vercel(),
  vite: {
    server: {
      fs: {
        // Allow serving symlinked dependencies from the sibling checkout during local dev.
        allow: [projectRoot, siblingRepoRoot]
      }
    }
  },
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true
    }
  }
});
