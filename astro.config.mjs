// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Static output only (GitHub Pages). Served from the apex custom domain, so no `base`.
export default defineConfig({
  site: 'https://yousefalsharif.me',
  output: 'static',
  // React only for the hero 3D island (CLAUDE.md stack).
  integrations: [react()],
  trailingSlash: 'ignore',
  // CSS is ~3 KB gzipped: inline it to remove render-blocking requests (faster LCP on mobile).
  build: { inlineStylesheets: 'always' },
  // Astro's dev toolbar (dev server only) isn't part of the design.
  devToolbar: { enabled: false },
});
