import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  computeHash,
  loadBlogPosts,
  normalizeTags,
  slugToRkey,
  type BlogPost,
} from './posts.js';
import { cleanup, makeTmpDir } from '../test/helpers/tmp.js';

describe('slugToRkey', () => {
  it('replaces unsafe characters with dashes', () => {
    assert.strictEqual(slugToRkey('dir/post a!'), 'dir-post-a-');
  });

  it('preserves allowed characters', () => {
    assert.strictEqual(slugToRkey('My_Post-1'), 'My_Post-1');
  });

  it('truncates to 128 characters', () => {
    assert.strictEqual(slugToRkey('a'.repeat(200)).length, 128);
  });
});

describe('computeHash', () => {
  it('is a stable 64-char sha256 hex digest', () => {
    const h = computeHash('hello');
    assert.match(h, /^[0-9a-f]{64}$/);
    assert.strictEqual(h, computeHash('hello'));
  });

  it('differs for different input', () => {
    assert.notStrictEqual(computeHash('a'), computeHash('b'));
  });
});

describe('normalizeTags', () => {
  it('returns undefined for missing, null, or empty values', () => {
    assert.strictEqual(normalizeTags(undefined), undefined);
    assert.strictEqual(normalizeTags(null), undefined);
    assert.strictEqual(normalizeTags([]), undefined);
    assert.strictEqual(normalizeTags(['', '  ']), undefined);
  });

  it('returns trimmed string tags', () => {
    assert.deepStrictEqual(normalizeTags(['a', 'b']), ['a', 'b']);
  });
});

describe('loadBlogPosts', () => {
  let dir: string;
  let contentDir: string;

  beforeEach(() => {
    dir = makeTmpDir();
    contentDir = join(dir, 'content', 'blog');
    mkdirSync(join(contentDir, 'nested'), { recursive: true });
    writeFileSync(
      join(contentDir, 'first.md'),
      '---\ntitle: First\ndate: 2026-01-01\ntags: [a, b]\n---\nSee [docs](/docs).',
    );
    writeFileSync(
      join(contentDir, 'nested', 'second.md'),
      '---\ntitle: Second\ndate: 2026-02-01\ndraft: true\n---\nbody two',
    );
    writeFileSync(join(contentDir, 'ignore.txt'), 'not markdown');
  });

  afterEach(() => cleanup(dir));

  it('loads markdown files sorted by date descending', async () => {
    const posts = await loadBlogPosts(contentDir, '/blog', 'https://example.com');
    assert.strictEqual(posts.length, 2);
    assert.deepStrictEqual(
      posts.map((p: BlogPost) => p.slug),
      ['nested/second', 'first'],
    );
  });

  it('builds postPath, resolves links, and exposes plain text', async () => {
    const posts = await loadBlogPosts(contentDir, '/blog', 'https://example.com');
    const first = posts.find((p) => p.slug === 'first')!;
    assert.strictEqual(first.postPath, '/blog/first');
    assert.strictEqual(first.frontmatter.title, 'First');
    assert.deepStrictEqual(first.frontmatter.tags, ['a', 'b']);
    assert.strictEqual(first.markdown, 'See [docs](https://example.com/docs).');
    assert.strictEqual(first.textContent, 'See docs.');
    assert.match(first.contentHash, /^[0-9a-f]{64}$/);
  });

  it('marks draft posts', async () => {
    const posts = await loadBlogPosts(contentDir, '/blog', 'https://example.com');
    const second = posts.find((p) => p.slug === 'nested/second')!;
    assert.strictEqual(second.frontmatter.draft, true);
  });

  it('returns an empty array for a missing directory', async () => {
    const posts = await loadBlogPosts(join(dir, 'nope'), '/blog', 'https://example.com');
    assert.deepStrictEqual(posts, []);
  });

  it('skips files without a valid date', async (t) => {
    t.mock.method(console, 'warn', () => {});
    writeFileSync(join(contentDir, 'no-date.md'), '---\ntitle: No date\n---\nbody');
    const posts = await loadBlogPosts(contentDir, '/blog', 'https://example.com');
    assert.ok(!posts.some((p) => p.slug === 'no-date'));
  });

  it('loads ogImage from frontmatter', async () => {
    writeFileSync(
      join(contentDir, 'with-og.md'),
      '---\ntitle: With OG\ndate: 2026-03-01\nogImage: public/images/cover.png\n---\nbody',
    );
    const posts = await loadBlogPosts(contentDir, '/blog', 'https://example.com');
    const post = posts.find((p) => p.slug === 'with-og')!;
    assert.strictEqual(post.frontmatter.ogImage, 'public/images/cover.png');
  });
});
