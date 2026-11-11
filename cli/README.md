# cli/

The `snath-devx` command, published as the package `bin`. Built on [commander](https://github.com/tj/commander.js).

| File | Responsibility |
|------|----------------|
| `index.ts` | Entry point: loads `.env` (dotenv), defines commands and flags, dispatches |
| `atproto.ts` | `atproto sync` handler: maps flags to `SyncArgs`, loads the consumer's config file, runs [`syncToAtproto`](../atproto/README.md), sets the exit code |

## Commands

```
snath-devx atproto sync [options]
```

| Flag | Effect |
|------|--------|
| `--dry-run` | Print what would happen. No login, no writes |
| `--force` | Re-publish every post, ignoring content hashes (also replaces the publication icon) |
| `--post <slug>` | Sync one post |
| `--delete` | Delete remote documents that have no local post |
| `-c, --config <path>` | Config file (default `atproto.config.ts`, resolved from the working directory) |

Exit code is 1 if any post failed. Consumer usage and environment variables: [docs/atproto.md](../docs/atproto.md).

## Running it

The entry point is TypeScript with a `node --import tsx` shebang; `tsx` comes with devx.

- **In a consumer repo:** `npx snath-devx atproto sync`
- **In this repo:** `npm run sync:atproto` / `npm run sync:atproto:dry-run` (a package cannot invoke its own bin symlink)

## Adding a command

1. Put the handler in its own file (`cli/<name>.ts`) with the logic in exported functions that take plain options, so it can be tested without commander. See `atproto.ts` and `atproto.test.ts`.
2. Register it in `index.ts`. Keep `index.ts` to wiring only.
3. Document it here and in the root README.

A new command or flag is ✨. Renaming or removing one, or changing a default, is 💥 — consumers call these from `package.json` scripts and CI.
