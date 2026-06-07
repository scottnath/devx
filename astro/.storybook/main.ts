import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { defineMain } from '@storybook-astro/framework/node';

const rendererEntryPreview = join(
  dirname(fileURLToPath(import.meta.resolve('@storybook-astro/framework/package.json'))),
  '../renderer/dist/entry-preview.js',
);

/**
 * Resolve astro-renderer entry-preview for the monorepo reference site.
 * Installed consumers resolve ../../../@storybook-astro/... without this plugin.
 */
function devxAstroRendererEntryPlugin(): Plugin {
  return {
    name: 'devx-astro-renderer-entry',
    resolveId(source, importer) {
      if (
        importer?.includes('/storybook/astro-renderer') &&
        source.includes('@storybook-astro/renderer/dist/entry-preview')
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
