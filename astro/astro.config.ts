import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://scottnath.github.io',
  base: '/devx',
  vite: {
    assetsInclude: ['**/*.md'],
    server: {
      fs: {
        allow: ['..'],
      },
    },
  },
});
