import { definePreview, type Preview } from 'storybook/internal/csf';
import type { ProjectAnnotations } from 'storybook/internal/types';
import type { AstroRenderer } from '@storybook-astro/renderer/types';
import {
  astroParameters,
  render,
  renderToCanvas,
} from './astro-renderer.js';

const defaultControlsMatchers = {
  color: /(background|color)$/i,
  date: /Date$/i,
};

/** Storybook preview helper for Astro projects using @storybook-astro/framework. */
export function defineAstroPreview(
  input: ProjectAnnotations<AstroRenderer> = {},
): Preview<AstroRenderer> {
  const { parameters, ...rest } = input;

  return definePreview<AstroRenderer>({
    render,
    renderToCanvas,
    ...rest,
    parameters: {
      ...astroParameters,
      ...parameters,
      controls: {
        matchers: defaultControlsMatchers,
        ...parameters?.controls,
      },
    },
  });
}

export type { AstroRenderer } from '@storybook-astro/renderer/types';

export {
  astroParameters,
  render,
  renderToCanvas,
} from './astro-renderer.js';
