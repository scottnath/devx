# AGENTS.md — @scottnath/devx

Orientation for AI agents (and humans in a hurry). Read this first; follow the links only for the area you are changing.

## What this repo is

`@scottnath/devx` is a **meta-package**: one devDependency that gives every scottnath repo the same toolchain (Astro, Storybook, semantic-release, AT Protocol publishing). It is published to GitHub Packages and consumed transitively, so:

- **`dependencies` in `package.json` are the product.** Every version here is installed in every consumer repo. Bumping one changes all of them.
- **`exports` and `bin` in `package.json` are the public API.** Renaming or removing an exported path, CLI flag, component prop, or config field is a breaking change (💥).
- **`files` in `package.json` decides what ships.** A new top-level file that consumers import must be added there or the published package breaks. `astro/`, tests, and CI are not published.

Background on the pattern: [docs/meta-package.md](docs/meta-package.md).

## Map

| Path | What it is | Public entry point | Details |
|------|------------|--------------------|---------|
| `release-config.mjs`, `release-config-npm.mjs`, `release-rules.mjs`, `release-notes.mjs` | semantic-release presets: gitmoji rules + changelog template | `@scottnath/devx`, `@scottnath/devx/npm` | [docs/release.md](docs/release.md) |
| `atproto/` | AT Protocol library: sync blog posts to a PDS, fetch Bluesky engagement | `@scottnath/devx/atproto` | [atproto/README.md](atproto/README.md) |
| `atproto/components/` | Astro components for posts, comments, likes, reposts, quotes | `@scottnath/devx/atproto/components/*` | [atproto/components/README.md](atproto/components/README.md) |
| `cli/` | `snath-devx` command (currently `atproto sync`) | `bin: snath-devx` | [cli/README.md](cli/README.md) |
| `storybook/` | `defineAstroPreview` helper for Storybook + Astro | `@scottnath/devx/storybook/preview` | [storybook/README.md](storybook/README.md) |
| `test/helpers/` | `node:test` runner (published) + ATProto mocks and fixtures (internal) | `@scottnath/devx/test-runner` | [test/README.md](test/README.md) |
| `scripts/` | Repo maintenance: gitmoji docs generator, dependency-update commit message | — | [scripts/README.md](scripts/README.md) |
| `astro/` | Reference site + Storybook host (npm workspace `devx-site`, deployed to GitHub Pages, **not published**) | — | [astro/README.md](astro/README.md) |
| `docs/` | Consumer-facing guides and design history | shipped in the package | [docs/README.md](docs/README.md) |
| `.github/workflows/` | CI, release, Pages deploy | — | [.github/workflows/README.md](.github/workflows/README.md) |

## Commands

Node 26 is required (`.nvmrc`). Install with `npm ci`.

| Command | Does |
|---------|------|
| `npm test` | All `*.test.ts` files via `node:test`, with coverage |
| `npm run typecheck` | `astro check` on the reference site |
| `npm run build` | Build the reference site |
| `npm run build-storybook` | Build Storybook (reference site stories + `atproto/components` stories) |
| `npm run extract:rules` | Regenerate `docs/gitmoji-rules.md` and `docs/how-to-write-a-commit.md` |
| `npm run verify` | **All of the above. Run before every commit.** |
| `npm run deps:check` | `ncu` — list available updates, change nothing |
| `npm run deps:update` | `ncu --doctor -u`, refresh the lockfile, verify, and write the changelog-ready commit message |

## Rules

1. **Verify before committing.** `npm run verify` must pass. CI runs the same script on every pull request and before every release.
2. **Gitmoji commits decide the release.** The first emoji in the subject picks the version bump: 💥 major, ✨/🆕 minor, the patch list in `release-rules.mjs` patch, anything else no release. See [docs/how-to-write-a-commit.md](docs/how-to-write-a-commit.md) and [docs/release.md](docs/release.md). Never use 🔖 by hand.
3. **Merge without squashing.** semantic-release reads individual commit subjects and bodies on `main`. A squash merge collapses them, loses the release type of all but one, and drops the dependency list from the changelog. Use a merge commit or rebase merge.
4. **Pin dependencies exactly** (`"astro": "7.4.10"`, no `^`). Consumers must all resolve the same versions.
5. **Dependency updates go through `npm run deps:update`** (npm-check-updates, configured in `.ncurc.json`), never hand-edited: [docs/dependency-updates.md](docs/dependency-updates.md). It records every bump in the commit body, which the release-notes template turns into changelog entries.
6. **Tests live next to the code** (`atproto/sync.ts` ↔ `atproto/sync.test.ts`). New logic needs a test. No network in tests — use `test/helpers/atp-mock.ts`.
7. **Do not hand-edit generated files:** `docs/gitmoji-rules.md`, `docs/how-to-write-a-commit.md` (edit `release-rules.mjs` or the `.template.md`, then `npm run extract:rules`), and `CHANGELOG.md` (written by semantic-release in CI, not committed).
8. **Keep docs in step.** Changing a feature means updating that directory's README, and the root `README.md` if consumer setup changes. The root README is also the home page of the Pages site.
9. **TypeScript runs unbuilt.** There is no compile step: the CLI and tests run through `tsx`, and consumers import `.ts`/`.astro` sources directly. Relative imports use `.js` extensions.

## Known sharp edges

- `storybook/astro-renderer.ts` imports `@storybook-astro/renderer` by a relative `../../../` path that only resolves once devx is installed inside a consumer's `node_modules`. Inside this repo, `astro/.storybook/main.ts` has a Vite plugin that redirects it. Re-check both after any `@storybook-astro/*` update.
- `npm run typecheck` only covers `astro/`. Nothing typechecks `atproto/`, `cli/`, or `test/` — tests execute them, but type errors there go unreported.
- `typescript` is held at 6.x: `@astrojs/check` and `@storybook-astro/framework` do not accept TypeScript 7 as a peer yet. `peer: true` in `.ncurc.json` skips it automatically.
- `npm-check-updates` is the only `devDependency`. Keep it there: anything in `dependencies` is installed in every consumer repo.
- The `cli/index.ts` shebang needs `tsx`; inside this repo use `npm run sync:atproto` rather than the `snath-devx` bin.
