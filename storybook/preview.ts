import { definePreview as definePreviewBase } from '@storybook-astro/renderer/index.ts';
import type { ProjectAnnotations } from 'storybook/internal/types';
import type { AstroRenderer } from '@storybook-astro/renderer/types';
import {
  argTypesEnhancers,
  astroParameters,
  render,
  renderToCanvas,
} from './astro-renderer.js';

const defaultControlsMatchers = {
  color: /(background|color)$/i,
  date: /Date$/i,
};

/** Storybook preview helper that wires Astro rendering without importing @storybook-astro/framework in the browser. */
export function defineAstroPreview(input: ProjectAnnotations<AstroRenderer> = {}) {
  const { parameters, ...rest } = input;

  return definePreviewBase({
    render,
    renderToCanvas,
    // Renderer types are narrower than Storybook's generic enhancer signature.
    argTypesEnhancers: argTypesEnhancers as never,
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
  argTypesEnhancers,
  astroParameters,
  render,
  renderToCanvas,
} from './astro-renderer.js';
