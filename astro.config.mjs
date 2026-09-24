// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Production URL: https://haydarpasapeteam-sys.github.io/haydarpasa-spor/
// GitHub Pages project-page deployment: site = user/org pages root, base = repo name.
export default defineConfig({
  site: 'https://haydarpasapeteam-sys.github.io',
  base: '/haydarpasa-spor/',
  trailingSlash: 'always',
  output: 'static',
  compressHTML: true,
  image: {
    // Sharp is used at build time to generate responsive AVIF/WebP derivatives
    // from originals committed under public/media/images/.
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
  integrations: [sitemap()],
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
