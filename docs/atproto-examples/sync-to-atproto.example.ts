#!/usr/bin/env npx tsx
import { runSyncCli } from '@scottnath/devx/atproto';
import config from '../atproto.config.ts';

await runSyncCli(config);
