import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { printSummary, syncToAtproto } from '../atproto/sync.js';
import type { AtprotoSyncConfig, SyncArgs } from '../atproto/types.js';

/** Options for the `atproto sync` command. */
export interface AtprotoSyncOptions {
  dryRun?: boolean;
  force?: boolean;
  post?: string;
  delete?: boolean;
  config?: string;
}

/** Map commander options to {@link SyncArgs}. */
export function syncArgsFromOptions(options: AtprotoSyncOptions): SyncArgs {
  return {
    dryRun: Boolean(options.dryRun),
    force: Boolean(options.force),
    postSlug: options.post,
    delete: Boolean(options.delete),
  };
}

/** Dynamically import a config module, accepting a default or named `config` export. */
export async function loadConfig(configPath: string): Promise<AtprotoSyncConfig> {
  const abs = resolve(process.cwd(), configPath);
  const mod = await import(pathToFileURL(abs).href);
  return (mod.default ?? mod.config) as AtprotoSyncConfig;
}

/** Run Workflow A sync from parsed commander options. */
export async function runAtprotoSync(
  options: AtprotoSyncOptions = {},
  configOrPath?: AtprotoSyncConfig | string,
): Promise<void> {
  const args = syncArgsFromOptions(options);
  const configPath =
    options.config ??
    (typeof configOrPath === 'string' ? configOrPath : undefined) ??
    'atproto.config.ts';
  const config =
    configOrPath && typeof configOrPath !== 'string'
      ? configOrPath
      : await loadConfig(configPath);

  if (args.dryRun) console.log('DRY RUN — no changes will be made\n');

  const results = await syncToAtproto(config, args);
  printSummary(results, args.dryRun);

  if (results.some((r) => r.action === 'error')) {
    process.exit(1);
  }
}
