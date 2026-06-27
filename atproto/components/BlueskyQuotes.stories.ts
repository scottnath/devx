import preview from '../../astro/.storybook/preview';
import type { AstroComponentFactory } from '@storybook-astro/renderer/types';
import { welcomePostQuotes } from '../../test/helpers/bsky-users/index.js';
import BlueskyQuotes from './BlueskyQuotes.astro';

const meta = preview.meta({
  title: 'ATProto/BlueskyQuotes',
  component: BlueskyQuotes as unknown as AstroComponentFactory,
});

export const WithMockQuotes = meta.story({
  args: {
    quotes: welcomePostQuotes,
  },
});

export const Empty = meta.story({
  args: {
    quotes: [],
  },
});
