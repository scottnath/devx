import preview from '../../astro/.storybook/preview';
import type { AstroComponentFactory } from '@storybook-astro/renderer/types';
import BlueskyReposts from './BlueskyReposts.astro';

const meta = preview.meta({
  title: 'ATProto/BlueskyReposts',
  component: BlueskyReposts as unknown as AstroComponentFactory,
});

export const WithMockReposts = meta.story({
  args: {
    reposts: [
      {
        actor: {
          did: 'did:plc:carol',
          handle: 'carol.bsky.social',
          displayName: 'Carol',
          profileUrl: 'https://bsky.app/profile/carol.bsky.social',
        },
        repostedAt: new Date(0),
      },
    ],
  },
});

export const Empty = meta.story({
  args: {
    reposts: [],
  },
});
