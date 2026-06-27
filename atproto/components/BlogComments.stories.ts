import preview from '../../astro/.storybook/preview';
import type { AstroComponentFactory } from '@storybook-astro/renderer/types';
import {
  welcomePostCommentTree,
  welcomePostUri,
} from '../../test/helpers/bsky-users/index.js';
import BlogComments from './BlogComments.astro';

const meta = preview.meta({
  title: 'ATProto/BlogComments',
  component: BlogComments as unknown as AstroComponentFactory,
});

export const WithMockComments = meta.story({
  args: {
    bskyPostUri: welcomePostUri,
    comments: welcomePostCommentTree,
  },
});

export const NoUri = meta.story({
  args: {},
});

export const EmptyThread = meta.story({
  args: {
    bskyPostUri: welcomePostUri,
    comments: [],
  },
});
