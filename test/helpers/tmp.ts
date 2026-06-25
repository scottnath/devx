import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Create a unique OS temp dir for a test. Caller must pass it to `cleanup`. */
export function makeTmpDir(prefix = 'devx-atproto-'): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

/** Remove a temp dir tree, ignoring errors. */
export function cleanup(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}
