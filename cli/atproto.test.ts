import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, syncArgsFromOptions } from './atproto.js';
import { cleanup, makeTmpDir } from '../test/helpers/tmp.js';

describe('syncArgsFromOptions', () => {
  it('defaults all flags to false/undefined', () => {
    assert.deepStrictEqual(syncArgsFromOptions({}), {
      dryRun: false,
      force: false,
      postSlug: undefined,
      delete: false,
    });
  });

  it('maps commander-style options', () => {
    assert.deepStrictEqual(
      syncArgsFromOptions({
        dryRun: true,
        force: true,
        delete: true,
        post: 'my-slug',
      }),
      {
        dryRun: true,
        force: true,
        postSlug: 'my-slug',
        delete: true,
      },
    );
  });
});

describe('loadConfig', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => cleanup(dir));

  it('loads a default export', async () => {
    const file = join(dir, 'default.config.ts');
    writeFileSync(file, 'export default { siteUrl: "https://a.com", contentDir: "content" };');
    const config = await loadConfig(file);
    assert.strictEqual(config.siteUrl, 'https://a.com');
  });

  it('falls back to a named `config` export', async () => {
    const file = join(dir, 'named.config.ts');
    writeFileSync(file, 'export const config = { siteUrl: "https://b.com", contentDir: "c" };');
    const config = await loadConfig(file);
    assert.strictEqual(config.siteUrl, 'https://b.com');
  });
});
