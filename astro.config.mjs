// @ts-check
import { defineConfig } from 'astro/config';

// Static output only (GitHub Pages). Served from the apex custom domain, so no `base`.
export default defineConfig({
  site: 'https://yousefalsharif.me',
  output: 'static',
  trailingSlash: 'ignore',
  // CSS is ~3 KB gzipped: inline it to remove render-blocking requests (faster LCP on mobile).
  build: { inlineStylesheets: 'always' },
});
