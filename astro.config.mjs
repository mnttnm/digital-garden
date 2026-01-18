import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://your-domain.vercel.app',
  base: '/digital-garden',
  output: 'hybrid',
  adapter: vercel(),
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true
    }
  }
});
