import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { AtprotoState } from './types.js';

/** Read the sync state file, or `null` if it doesn't exist. */
export function readState(statePath: string): AtprotoState | null {
  if (!existsSync(statePath)) return null;
  return JSON.parse(readFileSync(statePath, 'utf8')) as AtprotoState;
}

/** Write the sync state file as pretty JSON with a trailing newline. */
export function writeState(statePath: string, state: AtprotoState): void {
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}
