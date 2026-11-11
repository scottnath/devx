# test/

Test infrastructure. The tests themselves live beside the code they cover (`atproto/sync.test.ts`, `cli/atproto.test.ts`, `release-notes.test.ts`, `scripts/deps-commit-message.test.ts`).

```bash
npm test                                         # everything, with coverage
node --import tsx --test atproto/sync.test.ts    # one file
```

Tests use Node's built-in `node:test` and `node:assert` — no Jest or Vitest. TypeScript runs through `tsx`.

## helpers/test-runner.js — published

Exported as `@scottnath/devx/test-runner` so consumer repos get the same runner:

```js
// test.config.js
import { runNodeTests } from '@scottnath/devx/test-runner';
runNodeTests({ testDir: 'src' });
```

```bash
node --import tsx test.config.js --coverage
```

| Option | Default | |
|--------|---------|---|
| `testDir` | `'.'` | Directory or array of directories to scan recursively |
| `suffix` | `'.test.ts'` | Test file suffix |
| `ignore` | `['node_modules', 'dist', '.git']` | Directory names to skip |
| `timeout` | `30000` | Per-test timeout (ms) |
| `concurrency` | `true` | Run files in parallel |
| `coverage` | `--coverage` in argv | Collect coverage |
| `coverageExcludeGlobs` | tests, `test/`, `node_modules` | |

It exits 1 when no test files are found, and sets a failing exit code when any test fails. This repo's own config is [`test.config.js`](../test.config.js). `test-runner.js` is the only file in `test/` listed in `package.json` `files`; changes to its options are public API.

## helpers/ — internal

| File | Use |
|------|-----|
| `atp-mock.ts` | `installAtpMock(t, options)` replaces `globalThis.fetch` with lexicon-valid AT Protocol and Bluesky responses, records every call (`mock.calls`, `mock.callsTo('createRecord')`), and restores itself when the test ends |
| `bsky-fixtures.ts` | Builders for API response shapes: `makePostView`, `makeThread`, `makeProfileView`, `makeLike`, … |
| `bsky-users/` | Fixture accounts and one "welcome post" with real-looking likes, replies and quotes. Shared by unit tests and component stories |
| `tmp.ts` | `makeTmpDir()` / `cleanup()` for tests that write files |

## Rules for tests

- No network. If code calls an endpoint the mock does not answer, extend `atp-mock.ts`.
- Anything that writes files uses a temp dir from `tmp.ts`, never the repo.
- Mock responses must stay lexicon-valid (note `VALID_CID`): the real `@atproto/api` client validates them, which is what makes these tests meaningful after a dependency update.
