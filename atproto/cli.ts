import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { printSummary, syncToAtproto } from './sync.js';
import type { AtprotoSyncConfig, SyncArgs } from './types.js';

/** Parse sync CLI flags (`--dry-run`, `--force`, `--delete`, `--post=`). */
export function parseSyncArgs(argv = process.argv.slice(2)): SyncArgs {
  return {
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
    postSlug: argv.find((a) => a.startsWith('--post='))?.split('=')[1],
    delete: argv.includes('--delete'),
  };
}

/** Resolve the config path from `--config=`, defaulting to `atproto.config.ts`. */
export function configPathFromArgs(argv = process.argv.slice(2)): string {
  return argv.find((a) => a.startsWith('--config='))?.split('=')[1] ?? 'atproto.config.ts';
}

/** Dynamically import a config module, accepting a default or named `config` export. */
export async function loadConfig(configPath: string): Promise<AtprotoSyncConfig> {
  const abs = resolve(process.cwd(), configPath);
  const mod = await import(pathToFileURL(abs).href);
  return (mod.default ?? mod.config) as AtprotoSyncConfig;
}

/**
 * Entry point for a consumer's sync script: load config (object or path), run
 * the sync, print a summary, and exit non-zero on any per-post error.
 */
export async function runSyncCli(configOrPath?: AtprotoSyncConfig | string): Promise<void> {
  const args = parseSyncArgs();
  const config =
    typeof configOrPath === 'string' || configOrPath === undefined
      ? await loadConfig(typeof configOrPath === 'string' ? configOrPath : configPathFromArgs())
      : configOrPath;

  if (args.dryRun) console.log('DRY RUN — no changes will be made\n');

  const results = await syncToAtproto(config, args);
  printSummary(results, args.dryRun);

  if (results.some((r) => r.action === 'error')) {
    process.exit(1);
  }
}
