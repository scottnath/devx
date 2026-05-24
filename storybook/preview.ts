import { definePreview } from 'storybook/internal/csf';
import {
  argTypesEnhancers,
  astroParameters,
  render,
  renderToCanvas,
} from './astro-renderer.js';

type PreviewInput = NonNullable<Parameters<typeof definePreview>[0]>;

const defaultControlsMatchers = {
  color: /(background|color)$/i,
  date: /Date$/i,
};

/** Storybook preview helper that wires Astro rendering without importing @storybook-astro/framework in the browser. */
export function defineAstroPreview(input: PreviewInput = {}) {
  const { parameters, ...rest } = input;

  return definePreview({
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

export {
  argTypesEnhancers,
  astroParameters,
  render,
  renderToCanvas,
} from './astro-renderer.js';
