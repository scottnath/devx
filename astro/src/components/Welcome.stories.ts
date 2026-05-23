import Welcome from './Welcome.astro';

export default {
  title: 'Components/Welcome',
  component: Welcome,
};

export const Default = {
  args: {
    name: 'Storybook',
  },
};

export const CustomName = {
  args: {
    name: 'devx',
  },
};
