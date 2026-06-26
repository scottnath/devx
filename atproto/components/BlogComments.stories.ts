import preview from '../../astro/.storybook/preview';
import type { AstroComponentFactory } from '@storybook-astro/renderer/types';
import BlogComments from './BlogComments.astro';

const meta = preview.meta({
  title: 'ATProto/BlogComments',
  component: BlogComments as unknown as AstroComponentFactory,
});

export const WithMockComments = meta.story({
  args: {
    bskyPostUri: 'at://did:plc:site/app.bsky.feed.post/root',
    comments: [
      {
        uri: 'at://did:plc:alice/app.bsky.feed.post/c1',
        cid: 'cid1',
        text: 'Thanks for writing this!',
        author: {
          did: 'did:plc:alice',
          handle: 'alice.bsky.social',
          displayName: 'Alice',
          profileUrl: 'https://bsky.app/profile/alice.bsky.social',
        },
        createdAt: new Date('2026-06-01T12:00:00.000Z'),
        source: 'bluesky',
        sourceUrl: 'https://bsky.app/profile/alice.bsky.social/post/c1',
        likeCount: 2,
        replies: [
          {
            uri: 'at://did:plc:bob/app.bsky.feed.post/c2',
            cid: 'cid2',
            text: 'Agreed!',
            author: {
              did: 'did:plc:bob',
              handle: 'bob.bsky.social',
              displayName: 'Bob',
              profileUrl: 'https://bsky.app/profile/bob.bsky.social',
            },
            createdAt: new Date('2026-06-01T14:00:00.000Z'),
            source: 'bluesky',
            sourceUrl: 'https://bsky.app/profile/bob.bsky.social/post/c2',
            parentUri: 'at://did:plc:alice/app.bsky.feed.post/c1',
          },
        ],
      },
    ],
  },
});

export const NoUri = meta.story({
  args: {},
});

export const EmptyThread = meta.story({
  args: {
    bskyPostUri: 'at://did:plc:site/app.bsky.feed.post/root',
    comments: [],
  },
});
