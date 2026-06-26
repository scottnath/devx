import preview from '../../astro/.storybook/preview';
import type { AstroComponentFactory } from '@storybook-astro/renderer/types';
import BlueskyUser from './BlueskyUser.astro';

const meta = preview.meta({
  title: 'ATProto/BlueskyUser',
  component: BlueskyUser as unknown as AstroComponentFactory,
});

export const Default = meta.story({
  args: {
    actor: {
      did: 'did:plc:alice',
      handle: 'alice.bsky.social',
      displayName: 'Alice',
      profileUrl: 'https://bsky.app/profile/alice.bsky.social',
    },
  },
});

export const WithTimestamp = meta.story({
  args: {
    actor: {
      did: 'did:plc:alice',
      handle: 'alice.bsky.social',
      displayName: 'Alice',
      profileUrl: 'https://bsky.app/profile/alice.bsky.social',
    },
    timestamp: new Date('2026-06-01T12:00:00.000Z'),
    timestampLabel: 'liked',
  },
});
