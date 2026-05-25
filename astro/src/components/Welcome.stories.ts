import preview from '../../.storybook/preview';
import type { AstroComponentFactory } from '@storybook-astro/renderer/types';
import Welcome from './Welcome.astro';

const meta = preview.meta({
  title: 'Components/Welcome',
  component: Welcome as unknown as AstroComponentFactory,
});

export const Default = meta.story({
  args: {
    name: 'Devx Astro Storymeow 🐱',
  },
});

export const CustomName = meta.story({
  args: {
    name: 'devx',
  },
});
