import preview from '../../astro/.storybook/preview';
import type { AstroComponentFactory } from '@storybook-astro/renderer/types';
import { chiitanLove } from '../../test/helpers/bsky-users/index.js';
import BlueskyReposts from './BlueskyReposts.astro';

const meta = preview.meta({
  title: 'ATProto/BlueskyReposts',
  component: BlueskyReposts as unknown as AstroComponentFactory,
});

/** No reposts on the welcome skeet; chiitan.love liked it and stands in for layout demos. */
export const WithMockReposts = meta.story({
  args: {
    reposts: [
      {
        actor: chiitanLove.actor,
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
