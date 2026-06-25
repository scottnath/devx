# @scottnath/devx

Shared dev tooling for scottnath repositories: semantic-release with gitmoji, Astro, and Storybook for Astro.

Install as a devDependency from [GitHub Packages](https://github.com/scottnath/devx/packages). Tooling packages are bundled in `dependencies` and install transitively. Add `typescript` explicitly in your repo — it is not transitive.

**`.npmrc`:**

```
@scottnath:registry=https://npm.pkg.github.com
```

**Install:**

```bash
npm install -D @scottnath/devx
```

In GitHub Actions, use `registry-url: https://npm.pkg.github.com`, `scope: '@scottnath'`, and `NODE_AUTH_TOKEN` (typically `secrets.GITHUB_TOKEN` with `packages: read`).

## semantic-release

Two presets:

- `@scottnath/devx` — changelog + GitHub release (non-npm repos)
- `@scottnath/devx/npm` — adds GitHub Packages publish

**GitHub-only release** (`release.config.mjs`):

```javascript
/** @type {import('semantic-release').GlobalConfig} */
export default { extends: '@scottnath/devx' };
```

**GitHub Packages publish** (`release.config.mjs`):

```javascript
/** @type {import('semantic-release').GlobalConfig} */
export default { extends: '@scottnath/devx/npm' };
```

Add `@scottnath/devx` as a devDependency. All semantic-release plugins come transitively.

## Astro (TypeScript)

`astro`, `@astrojs/check`, Storybook packages, etc. come transitively via `@scottnath/devx`. Add `typescript` to your repo `devDependencies`.

**Root `package.json` (workspace example):**

```json
{
  "private": true,
  "type": "module",
  "workspaces": ["site"],
  "scripts": {
    "start": "npm run dev -w site",
    "dev": "npm run dev -w site",
    "build": "npm run build -w site",
    "preview": "npm run preview -w site",
    "typecheck": "npm run typecheck -w site",
    "storybook": "npm run storybook -w site",
    "build-storybook": "npm run build-storybook -w site"
  },
  "devDependencies": {
    "@scottnath/devx": "^1.0.0",
    "typescript": "^6.0.3"
  },
  "engines": { "node": ">=24.0.0" }
}
```

**Site workspace `package.json` (scripts only):**

```json
{
  "name": "site",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "typecheck": "astro check",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

**`astro.config.ts`:**

```typescript
import { defineConfig } from 'astro/config';

export default defineConfig({});
```

**`tsconfig.json`:**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

## Storybook for Astro (TypeScript)

**`.storybook/main.ts`:**

```typescript
import { defineMain } from '@storybook-astro/framework/node';

export default defineMain({
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  framework: {
    name: '@storybook-astro/framework',
    options: {},
  },
});
```

**`.storybook/preview.ts`:**

```typescript
import { defineAstroPreview } from '@scottnath/devx/storybook/preview';

export default defineAstroPreview({});
```

Optional: pass Storybook preview options (merged with Astro defaults):

```typescript
export default defineAstroPreview({
  parameters: {
    layout: 'centered',
  },
});
```

**Example story (`src/components/Welcome.stories.ts`):**

```typescript
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
```

## Gitmoji commits

Repos using `@scottnath/devx` use [Gitmoji](https://gitmoji.dev) commit messages for semantic-release.

```
<emoji> Short description

Optional body
```

See [docs/gitmoji-rules.md](docs/gitmoji-rules.md) and [docs/how-to-write-a-commit.md](docs/how-to-write-a-commit.md).

Regenerate docs: `npm run extract:rules`

## AT Protocol (Astro + atmosphere)

Requirements for connecting devx Astro sites to the atmosphere (standard.site publish, optional Bluesky ingest): [docs/atproto.md](docs/atproto.md).

### Quick start (Workflow A — publish)

1. Copy [docs/atproto-examples/atproto.config.example.ts](docs/atproto-examples/atproto.config.example.ts) → `atproto.config.ts`
2. Copy [docs/atproto-examples/sync-to-atproto.example.ts](docs/atproto-examples/sync-to-atproto.example.ts) → `scripts/sync-to-atproto.ts`
3. Add blog content under `src/content/blog/` (see [content.config.example.ts](docs/atproto-examples/content.config.example.ts))
4. Set `public/.well-known/atproto-did` to your DID
5. Run:

```bash
ATPROTO_APP_PASSWORD="xxxx-xxxx" ATP_IDENTIFIER="your-handle.com" npm run sync:atproto
```

**Consumer `package.json` script:**

```json
"sync:atproto": "npx tsx scripts/sync-to-atproto.ts"
```

**Verification in a post layout:**

```astro
---
import { generateDocumentLinkTag } from '@scottnath/devx/atproto';
const linkTag = entry.data.atprotoRkey && did
  ? generateDocumentLinkTag(did, entry.data.atprotoRkey)
  : null;
---
```

**Blog comments (v1):** `BlogComments.astro` lives in the site template; it imports `fetchComments` from `@scottnath/devx/atproto`. Sync writes `bskyPostUri` to frontmatter; rebuild to refresh threads.

**CI:** merge [atproto-publish.workflow.snippet.yml](docs/atproto-examples/atproto-publish.workflow.snippet.yml); secrets `ATPROTO_APP_PASSWORD`, `ATP_IDENTIFIER`.

## Node

Use Node 24 (`.nvmrc` contains `24`).
