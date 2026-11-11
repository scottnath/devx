# astro/ — reference site

npm workspace `devx-site`. A minimal Astro project that proves the devx toolchain works end to end, and hosts Storybook for the shared components. It is **not published** with the package.

It does three jobs:

1. **Living example** of the consumer layout described in the root README: a scripts-only `package.json` with no dependencies of its own — Astro, Storybook and the rest resolve from the root install.
2. **Documentation site.** `src/pages/index.astro` renders the root `README.md` with `marked`, deployed to GitHub Pages at `https://scottnath.github.io/devx` by `.github/workflows/deploy-pages.yml`.
3. **Storybook host** for its own stories and for `../atproto/components/**/*.stories.ts`.

## Commands

Run from the repo root:

| Command | Does |
|---------|------|
| `npm start` | `astro dev` |
| `npm run build` | `astro build` → `astro/dist` |
| `npm run typecheck` | `astro check` |
| `npm run storybook` | Storybook dev server on :6006 |
| `npm run build-storybook` | Static Storybook → `astro/storybook-static` |

## Files

| Path | Notes |
|------|-------|
| `astro.config.ts` | `site` + `base: '/devx'` for Pages. Vite is allowed to read `..` so the page can import the root README |
| `src/pages/index.astro` | The whole site: root README → HTML |
| `src/layouts/Layout.astro` | Page shell and global styles |
| `src/components/Welcome.astro`, `Welcome.stories.ts` | Sample component and story, in the form consumers should copy |
| `.storybook/main.ts` | Story globs, plus a Vite plugin that redirects the renderer import in `storybook/astro-renderer.ts` — see [storybook/README.md](../storybook/README.md) |
| `.storybook/preview.ts` | Uses `@scottnath/devx/storybook/preview` through the package's own `exports`, exactly as a consumer would |
| `tsconfig.json` | Extends `astro/tsconfigs/strict` |

## Why it matters for dependency updates

`typecheck`, `build` and `build-storybook` here are three of the five checks in `npm run verify`. They are the only automated proof that a new Astro or Storybook version still works with the shared config, so keep this site building against whatever `package.json` pins.

Because the page content is the root README, editing the README changes the deployed site.
