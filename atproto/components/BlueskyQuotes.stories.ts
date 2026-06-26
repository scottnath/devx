import preview from '../../astro/.storybook/preview';
import type { AstroComponentFactory } from '@storybook-astro/renderer/types';
import BlueskyQuotes from './BlueskyQuotes.astro';

const meta = preview.meta({
  title: 'ATProto/BlueskyQuotes',
  component: BlueskyQuotes as unknown as AstroComponentFactory,
});

export const WithMockQuotes = meta.story({
  args: {
    quotes: [
      {
        uri: 'at://did:plc:dan/app.bsky.feed.post/q1',
        text: 'Great read — sharing this with my followers.',
        author: {
          did: 'did:plc:dan',
          handle: 'dan.bsky.social',
          displayName: 'Dan',
          profileUrl: 'https://bsky.app/profile/dan.bsky.social',
        },
        quotedAt: new Date('2026-06-03T15:00:00.000Z'),
        sourceUrl: 'https://bsky.app/profile/dan.bsky.social/post/q1',
      },
    ],
  },
});

export const Empty = meta.story({
  args: {
    quotes: [],
  },
});
