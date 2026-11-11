# .github/workflows/

| Workflow | Trigger | Does |
|----------|---------|------|
| `ci.yml` | Pull requests; manual | `npm ci` → `npm run verify` (rules extraction, tests, typecheck, site build, Storybook build). Also fails if generated docs are out of date |
| `release.yml` | Push to `main`; manual | `npm ci` → `npm run verify` → `npx semantic-release`: version from gitmoji commits, GitHub Release, publish `@scottnath/devx` to GitHub Packages |
| `deploy-pages.yml` | Push to `main` touching `astro/**`, `README.md`, `package.json`, `package-lock.json`; manual | Build the reference site and deploy to GitHub Pages |

All three read the Node version from `.nvmrc`.

Authentication uses the built-in `GITHUB_TOKEN` only: `packages: write` to publish, `contents: write` for the release and tag. No repository secrets are required.

Notes:

- `release.yml` runs on every push to `main`. Whether a release happens depends on the commits: see [docs/release.md](../../docs/release.md).
- A release that only changes dependencies still publishes — that is the point of the package.
- Workflow-only commits should use 👷 `:construction_worker:`, which does not trigger a release.
