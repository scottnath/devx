import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseFrontmatter,
  stringifyFrontmatter,
  updatePostFrontmatter,
} from './frontmatter.js';
import { cleanup, makeTmpDir } from '../test/helpers/tmp.js';

describe('parseFrontmatter', () => {
  it('returns empty data when there is no frontmatter', () => {
    const { data, content } = parseFrontmatter('# Just content');
    assert.deepStrictEqual(data, {});
    assert.strictEqual(content, '# Just content');
  });

  it('returns empty data when the frontmatter is unterminated', () => {
    const raw = '---\ntitle: x\nno closing fence';
    const { data, content } = parseFrontmatter(raw);
    assert.deepStrictEqual(data, {});
    assert.strictEqual(content, raw);
  });

  it('parses strings, booleans, and arrays', () => {
    const raw = '---\ntitle: "Hello"\ndraft: true\npinned: false\ntags: [a, "b", c]\n---\nbody';
    const { data, content } = parseFrontmatter(raw);
    assert.strictEqual(data.title, 'Hello');
    assert.strictEqual(data.draft, true);
    assert.strictEqual(data.pinned, false);
    assert.deepStrictEqual(data.tags, ['a', 'b', 'c']);
    assert.strictEqual(content, 'body');
  });

  it('ignores lines that are not key: value', () => {
    const raw = '---\ntitle: ok\nthis is not valid\n---\n';
    const { data } = parseFrontmatter(raw);
    assert.deepStrictEqual(data, { title: 'ok' });
  });

  it('ignores empty scalar values such as tags:', () => {
    const raw = '---\ntitle: ok\ntags:\n---\nbody';
    const { data } = parseFrontmatter(raw);
    assert.deepStrictEqual(data, { title: 'ok' });
  });
});

describe('stringifyFrontmatter', () => {
  it('skips undefined values and renders arrays as a list', () => {
    const out = stringifyFrontmatter({ title: 'x', skip: undefined, tags: ['a', 'b'] }, 'body');
    assert.strictEqual(out, '---\ntitle: x\ntags:\n  - a\n  - b\n---\nbody');
  });

  it('round-trips scalar data', () => {
    const raw = '---\ntitle: Hello\ndraft: true\n---\nbody text';
    const { data, content } = parseFrontmatter(raw);
    const again = parseFrontmatter(stringifyFrontmatter(data, content));
    assert.strictEqual(again.data.title, 'Hello');
    assert.strictEqual(again.data.draft, true);
    assert.strictEqual(again.content, 'body text');
  });
});

describe('updatePostFrontmatter', () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = makeTmpDir();
    file = join(dir, 'post.md');
    writeFileSync(file, '---\ntitle: Hello\n---\nbody');
  });

  afterEach(() => cleanup(dir));

  it('adds and overwrites keys', () => {
    updatePostFrontmatter(file, { atprotoRkey: 'abc', title: 'New' });
    const { data, content } = parseFrontmatter(readFileSync(file, 'utf8'));
    assert.strictEqual(data.title, 'New');
    assert.strictEqual(data.atprotoRkey, 'abc');
    assert.strictEqual(content, 'body');
  });

  it('deletes keys whose update value is undefined', () => {
    updatePostFrontmatter(file, { title: undefined });
    const { data } = parseFrontmatter(readFileSync(file, 'utf8'));
    assert.strictEqual(data.title, undefined);
  });
});
