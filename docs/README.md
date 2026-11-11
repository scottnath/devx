# docs/

Guides shipped inside the published package (`docs` is in `package.json` `files`), so consumer repos and their agents can read them from `node_modules/@scottnath/devx/docs/`.

| Doc | Audience | Contents |
|-----|----------|----------|
| [meta-package.md](meta-package.md) | Anyone new to the repo | What a meta-package is and how devx is laid out |
| [release.md](release.md) | Maintainers | Release presets, rules, and the release-notes template |
| [dependency-updates.md](dependency-updates.md) | Maintainers, agents | The dependency-update process and how bumps reach the changelog |
| [how-to-write-a-commit.md](how-to-write-a-commit.md) | Agents, in devx and consumer repos | Commit format and the emoji table. **Generated** |
| [gitmoji-rules.md](gitmoji-rules.md) | Reference | Emoji → release type. **Generated** |
| [how-to-write-a-commit.template.md](how-to-write-a-commit.template.md) | Maintainers | Source for the generated commit guide |
| [atproto.md](atproto.md) | Consumers | Setting up AT Protocol publishing on an Astro site |
| [atproto-examples/](atproto-examples/) | Consumers | Copy-paste config, content schema, workflow snippet |
| [history/](history/) | Maintainers | Design decisions and research behind the atproto work. Background only — not a description of current behaviour |

Generated files are rewritten by `npm run extract:rules`. Edit `release-rules.mjs` or the template instead.

Per-directory READMEs (`atproto/`, `cli/`, `storybook/`, `test/`, `scripts/`, `astro/`) cover internals; start from [AGENTS.md](../AGENTS.md).
