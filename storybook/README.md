# storybook/

Storybook preview helper for Astro projects, exported as `@scottnath/devx/storybook/preview`. It wires the [`@storybook-astro`](https://www.npmjs.com/package/@storybook-astro/framework) renderer into Storybook's CSF factory API so each consumer's `.storybook/preview.ts` is one line.

| File | Responsibility |
|------|----------------|
| `preview.ts` | `defineAstroPreview(input)` — merges the Astro renderer's `render`, `renderToCanvas` and parameters with the consumer's options, and adds default control matchers (`color`, `date`) |
| `astro-renderer.ts` | Re-exports the renderer's preview entry |

Consumer usage (also in the root README):

```ts
// .storybook/preview.ts
import { defineAstroPreview } from '@scottnath/devx/storybook/preview';

export default defineAstroPreview({ parameters: { layout: 'centered' } });
```

Stories then use `preview.meta({...})` and `meta.story({...})`. Working example: [astro/src/components/Welcome.stories.ts](../astro/src/components/Welcome.stories.ts).

## The fragile part

`astro-renderer.ts` imports the renderer by relative path:

```ts
from '../../../@storybook-astro/renderer/dist/entry-preview.js'
```

`dist/entry-preview.js` is not in that package's `exports`, so it cannot be imported by name. The path assumes this file sits at `node_modules/@scottnath/devx/storybook/` with `@storybook-astro/renderer` hoisted beside `@scottnath` — true in a consumer install, false in this repo. Here, a Vite plugin in [astro/.storybook/main.ts](../astro/.storybook/main.ts) intercepts the import and points it at the real file.

After any `@storybook-astro/*` or `storybook` update:

1. `npm run build-storybook` must pass (covers this repo's redirect).
2. Check that `node_modules/@storybook-astro/renderer/dist/entry-preview.js` still exists and still exports `parameters`, `render`, `renderToCanvas` (covers consumers, which CI here cannot see).

There are no unit tests in this directory; the Storybook build is the check.
