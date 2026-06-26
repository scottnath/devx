import preview from '../../astro/.storybook/preview';
import type { AstroComponentFactory } from '@storybook-astro/renderer/types';
import BlogPost from './BlogPost.astro';

const meta = preview.meta({
  title: 'ATProto/BlogPost',
  component: BlogPost as unknown as AstroComponentFactory,
});

export const ArticleOnly = meta.story({
  args: {
    title: 'Welcome to the blog',
    description: 'Article header and body without engagement sections.',
    date: new Date('2026-06-01T00:00:00.000Z'),
    showEngagement: false,
  },
});

export const WithEmptyEngagement = meta.story({
  args: {
    title: 'Welcome to the blog',
    description: 'Engagement sections show empty states without a bskyPostUri.',
    date: new Date('2026-06-01T00:00:00.000Z'),
    showEngagement: true,
  },
});
