import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { join } from 'node:path';
import {
  isSyndicated,
  readSyndication,
  recordSyndication,
  syndicationRef,
  writeSyndication,
} from './syndication.js';
import type { AtprotoSyndication } from './types.js';
import { cleanup, makeTmpDir } from '../test/helpers/tmp.js';

const entry = { uri: 'at://did/app.bsky.feed.post/x', cid: 'bafy', syndicatedAt: '2026-01-01T00:00:00.000Z' };

describe('syndication pure helpers', () => {
  it('isSyndicated reflects presence of a post path', () => {
    const data: AtprotoSyndication = { posts: { '/blog/a': entry } };
    assert.strictEqual(isSyndicated(data, '/blog/a'), true);
    assert.strictEqual(isSyndicated(data, '/blog/b'), false);
  });

  it('syndicationRef returns uri/cid or undefined', () => {
    const data: AtprotoSyndication = { posts: { '/blog/a': entry } };
    assert.deepStrictEqual(syndicationRef(data, '/blog/a'), { uri: entry.uri, cid: entry.cid });
    assert.strictEqual(syndicationRef(data, '/blog/missing'), undefined);
  });

  it('recordSyndication mutates the map', () => {
    const data: AtprotoSyndication = { posts: {} };
    recordSyndication(data, '/blog/a', entry);
    assert.deepStrictEqual(data.posts['/blog/a'], entry);
  });
});

describe('syndication persistence', () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    dir = makeTmpDir();
    path = join(dir, 'atproto-syndication.json');
  });

  afterEach(() => cleanup(dir));

  it('readSyndication returns an empty structure when missing', () => {
    assert.deepStrictEqual(readSyndication(path), { posts: {} });
  });

  it('returns a fresh empty object each call (no shared mutation)', () => {
    const a = readSyndication(path);
    recordSyndication(a, '/blog/a', entry);
    const b = readSyndication(path);
    assert.deepStrictEqual(b, { posts: {} });
  });

  it('writeSyndication then readSyndication round-trips', () => {
    const data: AtprotoSyndication = { posts: { '/blog/a': entry } };
    writeSyndication(path, data);
    assert.deepStrictEqual(readSyndication(path), data);
  });
});
