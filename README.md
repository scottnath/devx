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
import type { StorybookConfig } from '@storybook-astro/framework';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  framework: {
    name: '@storybook-astro/framework',
    options: {},
  },
};

export default config;
```

**`.storybook/preview.ts`:**

```typescript
import type { Preview } from '@storybook-astro/framework';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

**Example story (`src/components/Welcome.stories.ts`):**

```typescript
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
```

## Gitmoji commits

Repos using `@scottnath/devx` use [Gitmoji](https://gitmoji.dev) commit messages for semantic-release.

```
<emoji> Short description

Optional body
```

See [docs/gitmoji-rules.md](docs/gitmoji-rules.md) and [docs/how-to-write-a-commit.md](docs/how-to-write-a-commit.md).

Regenerate docs: `npm run extract:rules`

## Node

Use Node 24 (`.nvmrc` contains `24`).
