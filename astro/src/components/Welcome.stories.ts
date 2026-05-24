import preview from '../../.storybook/preview';
import Welcome from './Welcome.astro';

const meta = preview.meta({
  title: 'Components/Welcome',
  component: Welcome,
});

export const Default = meta.story({
  args: {
    name: 'Storybook',
  },
});

export const CustomName = meta.story({
  args: {
    name: 'devx',
  },
});
