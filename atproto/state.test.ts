import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readState, writeState } from './state.js';
import type { AtprotoState } from './types.js';
import { cleanup, makeTmpDir } from '../test/helpers/tmp.js';

const sample: AtprotoState = {
  did: 'did:plc:abc',
  publicationAtUri: 'at://did:plc:abc/site.standard.publication/self',
  contentHashes: { '/blog/post': 'hash1' },
  documentRkeys: { '/blog/post': 'rkey1' },
};

describe('state', () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    dir = makeTmpDir();
    path = join(dir, 'atproto-state.json');
  });

  afterEach(() => cleanup(dir));

  it('readState returns null when the file does not exist', () => {
    assert.strictEqual(readState(path), null);
  });

  it('writeState then readState round-trips the state', () => {
    writeState(path, sample);
    assert.deepStrictEqual(readState(path), sample);
  });

  it('writeState pretty-prints JSON with a trailing newline', () => {
    writeState(path, sample);
    const raw = readFileSync(path, 'utf8');
    assert.ok(raw.endsWith('\n'));
    assert.ok(raw.includes('\n  "did": "did:plc:abc"'));
  });
});
