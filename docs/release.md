# Release presets

The semantic-release configuration every scottnath repo extends. The files sit at the package root because consumers reference them through `exports`.

| File | Export | Role |
|------|--------|------|
| `release-config.mjs` | `@scottnath/devx` | Preset: analyze commits → write `CHANGELOG.md` → GitHub Release |
| `release-config-npm.mjs` | `@scottnath/devx/npm` | Same, plus publish to the registry in the repo's `publishConfig` (`@semantic-release/npm`) |
| `release-rules.mjs` | — | Which gitmoji triggers which version bump. Single source of truth |
| `release-notes.mjs` | — | Release-notes template: sections, and dependency lines pulled from commit bodies |
| `release.config.mjs` | — | devx's own config. It extends `@scottnath/devx/npm`, so devx releases itself with its own preset |

Consumer setup is in the root [README](../README.md#semantic-release).

## Plugins, in order

1. **`semantic-release-gitmoji`** — picks the release type from commit emoji (`releaseRules`) and renders the notes (`releaseNotes`).
2. **`@semantic-release/changelog`** — prepends the notes to `CHANGELOG.md` in the CI workspace.
3. **`@semantic-release/npm`** — `/npm` preset only.
4. **`@semantic-release/github`** — creates the GitHub Release and comments on released issues and pull requests.

There is no `@semantic-release/git` step, so `CHANGELOG.md` is **not committed back** to the repository. The durable changelog is the GitHub Releases page.

## Release rules

`release-rules.mjs` exports:

| Name | Meaning |
|------|---------|
| `MAJOR_EMOJIS` | 💥 `:boom:` |
| `MINOR_EMOJIS` | ✨ `:sparkles:`, 🆕 `:new:` |
| `PATCH_DOCS_SUBSET` | The gitmoji that trigger a patch release. Despite the name this is the effective patch list, not only a docs list |
| `releaseRules` | `{ major, minor, patch }` passed to the plugin |

A commit whose emoji is in none of the lists (for example 👷 `:construction_worker:`) does not trigger a release.

After editing the lists, run `npm run extract:rules` to regenerate [gitmoji-rules.md](gitmoji-rules.md) and [how-to-write-a-commit.md](how-to-write-a-commit.md).

## Release notes

`release-notes.mjs` replaces the plugin's default template. Sections, in order:

| Section | Commits |
|---------|---------|
| 💥 Breaking Changes | `:boom:` |
| ✨ New Features | `:sparkles:`, `:new:` |
| 🐛 Bug Fixes | `:bug:` |
| 🚑 Critical Hotfixes | `:ambulance:` |
| 🔒 Security Issues | `:lock:` |
| ⬆️ Dependency Updates | `:arrow_up:`, `:heavy_plus_sign:`, `:heavy_minus_sign:` |

Other patch emoji (📝, ♻️, 🎨, …) still trigger a release but are not listed in the notes — that matches the plugin's default behaviour.

Under any listed commit, body lines of the form `- name: 1.0.0 → 1.1.0` are rendered as nested bullets. [`scripts/deps-commit-message.mjs`](../scripts/deps-commit-message.mjs) writes those lines; see [dependency-updates.md](dependency-updates.md).

`release-notes.test.ts` renders the template through the plugin's own classes, so an incompatible `semantic-release-gitmoji` update fails `npm test`.

## Changing a preset

Every consumer picks up preset changes on their next devx upgrade, so:

- Adding a section or a patch emoji: ✨.
- Changing which emoji cause a major or minor release, adding or removing a plugin, or changing `branches`: 💥.
- New root files that the presets import must be added to `files` in `package.json`.

## devx's own release

`.github/workflows/release.yml` runs on every push to `main`: `npm ci` → `npm run verify` → `npx semantic-release`. The published version comes from the commits since the last tag; `package.json` stays at `0.0.0-development`.
