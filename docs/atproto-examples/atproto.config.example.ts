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
  },
  statePath: 'atproto-state.json',
  syndicationPath: 'atproto-syndication.json',
  wellKnownDir: 'public/.well-known',
} satisfies AtprotoSyncConfig;
