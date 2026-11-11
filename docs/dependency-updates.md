# Dependency updates

`@scottnath/devx` exists to hand the same dependency versions to every consumer repo, so keeping them current is the main maintenance job here. Updates run through [npm-check-updates](https://github.com/raineorshine/npm-check-updates) (`ncu`). The process guarantees two things:

1. **Nothing is committed until every check passes** on the new versions.
2. **The changelog names every dependency that moved**, with its old and new version.

## Run it

```bash
npm ci
npm run deps:check     # optional: list available updates, change nothing
npm run deps:update    # upgrade → verify → write commit message
git commit -a -F .git/DEPS_COMMIT_MSG
```

Then open a pull request and merge it **without squashing** (see [Why not squash](#why-not-squash)).

## What `deps:update` does

```
ncu --doctor -u && npm update && npm run verify && node scripts/deps-commit-message.mjs
```

1. **`ncu --doctor -u`** — runs `npm run verify` on the current tree, upgrades every direct dependency in `package.json` to latest (exact pins stay exact), installs, and runs `npm run verify` again. If that fails, ncu restores the manifest, tries each upgrade on its own, keeps the ones that pass, and prints the ones that break.
2. **`npm update`** — refreshes transitive packages in `package-lock.json`. Direct dependencies are pinned, so this does not move them.
3. **`npm run verify`** — checks the tree again with the refreshed lockfile.
4. **`scripts/deps-commit-message.mjs`** — compares `package.json` with `HEAD`, writes the commit message to `.git/DEPS_COMMIT_MSG`, and prints it.

`npm run verify` is rules extraction, unit tests, `astro check`, the site build, and the Storybook build.

## Configuration

[`.ncurc.json`](../.ncurc.json):

| Setting | Effect |
|---------|--------|
| `"peer": true` | Skip an upgrade when an installed package's peer range rejects it. ncu lists these under "Ignored incompatible updates" with the package that blocks them |
| `"doctorTest": "npm run verify"` | Doctor mode runs the full check, not only `npm test` |

Any ncu flag can be passed through npm with `--`:

| Example | Use |
|---------|-----|
| `npm run deps:check -- --format repo` | Show each package's repository link |
| `npm run deps:update -- -x astro` | Hold a package back (`--reject`) |
| `npm run deps:update -- -f '@atproto/*'` | Update only matching packages (`--filter`) |
| `npm run deps:update -- -t minor` | Stay within the current major (`--target`) |
| `npm run deps:update -- --cooldown 7` | Skip versions published in the last 7 days |

To hold a package back permanently, add `"reject": ["name"]` to `.ncurc.json` and say why in [Currently held back](#currently-held-back).

## The commit message

```
:arrow_up: Update dependencies

Dependencies:
- @atproto/api: 0.20.44 → 0.31.0
- astro: 7.3.4 → 7.4.10
- zod: 4.6.5 → 4.6.7

Verified: npm run verify
```

Do not reword the `- name: from → to` lines. [`release-notes.mjs`](../release-notes.mjs) parses them out of the commit body when semantic-release builds the release notes, producing:

```markdown
## ⬆️ Dependency Updates
- [`abc1234`](…) Update dependencies
    - `@atproto/api` 0.20.44 → 0.31.0
    - `astro` 7.3.4 → 7.4.10
    - `zod` 4.6.5 → 4.6.7
```

That text becomes the GitHub Release and the `CHANGELOG.md` entry. You can add prose above or below the list; only the list lines are picked up.

Because the template lives in the shared release preset, consumer repos get the same behaviour: any commit of theirs whose body contains lines in this format shows them in its changelog.

## Choosing the release type

The message defaults to ⬆️ `:arrow_up:`, a **patch** release. `npm run deps:check` groups updates into Patch, Minor, Major, and "Major version zero" (0.x packages, where any release may break). A Major or version-zero entry is a prompt to think, not an automatic major release:

- **Stay on ⬆️** when consumers are insulated — the package is only used inside devx (`@atproto/api` behind `atproto/`), or tests and builds show no consumer-visible change.
- **Use 💥** when consumers will have to change something: a new Astro or Storybook major, a raised Node requirement, a removed config option. Regenerate the message with `node scripts/deps-commit-message.mjs --emoji :boom:`.

Dependency lines are rendered under whichever section the commit lands in, so a 💥 update still lists its packages.

## When something breaks

- **Doctor reports a broken upgrade** — the rest are already applied. Either fix the code in the same commit if the fix is small and mechanical, or leave that package behind and handle it as its own change.
- **`@storybook-astro/*` updates** — if Storybook fails to build, check the relative import in `storybook/astro-renderer.ts` and the redirect plugin in `astro/.storybook/main.ts` first.
- **`gitmojis` updates** — `extract:rules` may rewrite the docs. Commit the regenerated files with the update.
- Do not install with `--force` or `--legacy-peer-deps`: consumers would inherit the broken resolution.

## Why not squash

semantic-release reads each commit on `main`. A squash merge replaces the ⬆️ commit with the pull request title, so the release type can change and the dependency list is gone from the changelog. Merge dependency pull requests with a merge commit or a rebase merge.

## Currently held back

| Package | Held at | Latest | Why |
|---------|---------|--------|-----|
| `typescript` | 6.0.3 | 7.0.2 | Peer ranges: `@astrojs/check` and `@storybook-astro/framework` require `^5.0.0 \|\| ^6.0.0`. Held automatically by `peer: true`; it will update on its own once they allow 7 |

Remove a row when the block clears and the package updates cleanly.
