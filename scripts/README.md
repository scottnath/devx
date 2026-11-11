# scripts/

Maintenance scripts for this repo. Plain Node ES modules with no dependencies beyond what devx already ships. The directory is published, because `extract-release-rules.mjs` runs in `prepublishOnly`.

| Script | npm script | Purpose |
|--------|-----------|---------|
| `extract-release-rules.mjs` | `npm run extract:rules` | Generates `docs/gitmoji-rules.md` and `docs/how-to-write-a-commit.md` from [`release-rules.mjs`](../release-rules.mjs) |
| `deps-commit-message.mjs` | last step of `npm run deps:update` | Writes the dependency-update commit message that feeds the changelog |

## extract-release-rules.mjs

Reads the rule lists from `release-rules.mjs`, looks up each emoji's description in the `gitmojis` package, and writes two files:

- `docs/gitmoji-rules.md` — fully generated.
- `docs/how-to-write-a-commit.md` — `docs/how-to-write-a-commit.template.md` with the block between `<!-- EMOJI_SECTION_START -->` and `<!-- EMOJI_SECTION_END -->` replaced.

To change which emoji trigger which release, edit `release-rules.mjs` and re-run. To change the surrounding prose, edit the template and re-run. Never edit the two outputs directly. `npm run verify` runs this script, so a broken rule file fails CI and the release.

## deps-commit-message.mjs

The updating itself is done by npm-check-updates; see [docs/dependency-updates.md](../docs/dependency-updates.md). This script only covers the part ncu does not: it compares the working `package.json` with `HEAD` and writes one `- name: from → to` line per changed direct dependency to `.git/DEPS_COMMIT_MSG`. `--emoji :boom:` changes the subject's gitmoji.

Those lines are a contract with [`release-notes.mjs`](../release-notes.mjs), whose `DEPENDENCY_LINE` pattern parses them back out of the commit body. `release-notes.test.ts` feeds one into the other, so changing either format without the other fails the tests.
