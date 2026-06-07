import { definePreview, type Preview } from 'storybook/internal/csf';
import type { ProjectAnnotations } from 'storybook/internal/types';
import type { AstroRenderer } from '@storybook-astro/renderer/types';

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
    ...rest,
    parameters: {
      ...parameters,
      controls: {
        matchers: defaultControlsMatchers,
        ...parameters?.controls,
      },
    },
  });
}

export type { AstroRenderer } from '@storybook-astro/renderer/types';
