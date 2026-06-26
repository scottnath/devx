#!/usr/bin/env -S node --import tsx
import 'dotenv/config';

import { Command } from 'commander';
import pkg from '../package.json' with { type: 'json' };
import { runAtprotoSync } from './atproto.js';

const program = new Command();

program.name('snath-devx').description('Scott Nath dev tooling').version(pkg.version);

const atproto = program.command('atproto').description('AT Protocol publishing');

atproto
  .command('sync')
  .description('Publish blog posts to your PDS')
  .option('--dry-run', 'Preview changes without writing')
  .option('--force', 'Re-publish all posts regardless of content hash')
  .option('--delete', 'Delete remote documents missing locally')
  .option('--post <slug>', 'Sync a single post by slug')
  .option('-c, --config <path>', 'Path to atproto.config.ts', 'atproto.config.ts')
  .action(async (options) => {
    await runAtprotoSync(options);
  });

await program.parseAsync();
