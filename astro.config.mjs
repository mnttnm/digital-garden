import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Use BASE_PATH env var for flexibility across deployment targets:
// - Vercel: BASE_PATH='' (or unset) -> deploys to root
// - GitHub Pages: BASE_PATH='/digital-garden' -> deploys to /digital-garden/
// Note: For Vercel, we default to empty. Set BASE_PATH='/digital-garden' for GitHub Pages
const base = process.env.BASE_PATH ?? '';

export default defineConfig({
  site: process.env.SITE_URL || 'https://digital-garden-five-kappa.vercel.app',
  base,
  output: 'static',
  adapter: vercel(),
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true
    }
  }
});
