import preview from '../../astro/.storybook/preview';
import type { AstroComponentFactory } from '@storybook-astro/renderer/types';
import { scottnathCom } from '../../test/helpers/bsky-users/index.js';
import BlueskyUser from './BlueskyUser.astro';

const meta = preview.meta({
  title: 'ATProto/BlueskyUser',
  component: BlueskyUser as unknown as AstroComponentFactory,
});

export const Default = meta.story({
  args: {
    actor: scottnathCom.actor,
  },
});

export const WithTimestamp = meta.story({
  args: {
    actor: scottnathCom.actor,
    timestamp: new Date(scottnathCom.welcomePost!.likedAt!),
    timestampLabel: 'liked',
  },
});
