import preview from '../../astro/.storybook/preview';
import type { AstroComponentFactory } from '@storybook-astro/renderer/types';
import { welcomePostLikes } from '../../test/helpers/bsky-users/index.js';
import BlueskyLikes from './BlueskyLikes.astro';

const meta = preview.meta({
  title: 'ATProto/BlueskyLikes',
  component: BlueskyLikes as unknown as AstroComponentFactory,
});

export const WithMockLikes = meta.story({
  args: {
    likes: welcomePostLikes,
  },
});

export const Empty = meta.story({
  args: {
    likes: [],
  },
});
