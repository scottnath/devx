import type { AtprotoSyncConfig } from '@scottnath/devx/atproto';

/**
 * Copy to your repo root as `atproto.config.ts` and edit values.
 */
export default {
  siteUrl: 'https://example.com',
  identifier: process.env.ATP_IDENTIFIER,
  contentDir: 'src/content/blog',
  postPathPrefix: '/blog',
  publication: {
    name: 'Example Blog',
    description: 'Long-form posts from example.com',
    // Square icon (image/*, <=1MB, ideally >=256x256). Shown in Bluesky's
    // enhanced Standard.site preview. Uploaded once; use `sync --force` to replace.
    iconPath: 'public/images/publication-icon.png',
    // Optional palette apps use to render your content (hex or {r,g,b}).
    theme: {
      accent: '#3366ff',
      background: '#ffffff',
      foreground: '#111111',
      accentForeground: '#ffffff',
    },
    // Optional self-labels / content warnings.
    // labels: ['!warn'],
    // Set false to opt the publication out of discovery feeds (default true).
    // showInDiscover: true,
  },
  statePath: 'atproto-state.json',
  syndicationPath: 'atproto-syndication.json',
  wellKnownDir: 'public/.well-known',
} satisfies AtprotoSyncConfig;
