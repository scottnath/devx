import preview from '../../astro/.storybook/preview';
import type { AstroComponentFactory } from '@storybook-astro/renderer/types';
import BlueskyLikes from './BlueskyLikes.astro';

const meta = preview.meta({
  title: 'ATProto/BlueskyLikes',
  component: BlueskyLikes as unknown as AstroComponentFactory,
});

export const WithMockLikes = meta.story({
  args: {
    likes: [
      {
        actor: {
          did: 'did:plc:alice',
          handle: 'alice.bsky.social',
          displayName: 'Alice',
          profileUrl: 'https://bsky.app/profile/alice.bsky.social',
        },
        likedAt: new Date('2026-06-01T12:00:00.000Z'),
      },
      {
        actor: {
          did: 'did:plc:bob',
          handle: 'bob.bsky.social',
          displayName: 'Bob',
          profileUrl: 'https://bsky.app/profile/bob.bsky.social',
        },
        likedAt: new Date('2026-06-02T08:30:00.000Z'),
      },
    ],
  },
});

export const Empty = meta.story({
  args: {
    likes: [],
  },
});
