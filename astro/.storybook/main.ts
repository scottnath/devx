import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { defineMain } from '@storybook-astro/framework/node';

const rendererEntryPreview = join(
  dirname(fileURLToPath(import.meta.resolve('@storybook-astro/framework/package.json'))),
  '../renderer/dist/entry-preview.js',
);

/** Resolve astro-renderer entry-preview for the monorepo reference site layout. */
function devxAstroRendererEntryPlugin(): Plugin {
  return {
    name: 'devx-astro-renderer-entry',
    resolveId(source, importer) {
      if (
        source === '../../@storybook-astro/renderer/dist/entry-preview.js' &&
        importer?.includes('/storybook/astro-renderer')
      ) {
        return rendererEntryPreview;
      }
    },
  };
}

export default defineMain({
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  framework: {
    name: '@storybook-astro/framework',
    options: {},
  },
  viteFinal: async (config) => {
    config.plugins ??= [];
    config.plugins.push(devxAstroRendererEntryPlugin());
    return config;
  },
});
