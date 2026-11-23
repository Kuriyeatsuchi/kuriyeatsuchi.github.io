// @ts-check
import { defineConfig } from 'astro/config';

// Static output only (GitHub Pages). Served from the apex custom domain, so no `base`.
export default defineConfig({
  site: 'https://yousefalsharif.me',
  output: 'static',
  trailingSlash: 'ignore',
});
