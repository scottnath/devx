import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseFrontmatter } from './frontmatter.js';
import { computeHash } from './posts.js';
import { readState } from './state.js';
import { readSyndication } from './syndication.js';
import { syncToAtproto } from './sync.js';
import type { AtprotoSyncConfig, SyncArgs } from './types.js';
import { installAtpMock } from '../test/helpers/atp-mock.js';
import { cleanup, makeTmpDir } from '../test/helpers/tmp.js';

const DID = 'did:plc:test1234567890';
const ENV_KEYS = ['ATPROTO_APP_PASSWORD', 'ATP_IDENTIFIER', 'ATPROTO_IDENTIFIER', 'BLUESKY_CROSSPOST'];

function makeConfig(overrides: Partial<AtprotoSyncConfig> = {}): AtprotoSyncConfig {
  return {
    siteUrl: 'https://example.com',
    identifier: DID,
    contentDir: 'content/blog',
    postPathPrefix: '/blog',
    publication: { name: 'Example', description: 'desc' },
    ...overrides,
  };
}

const args = (over: Partial<SyncArgs> = {}): SyncArgs => ({
  dryRun: false,
  force: false,
  postSlug: undefined,
  delete: false,
  ...over,
});

function silence(t: import('node:test').TestContext) {
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'warn', () => {});
  t.mock.method(console, 'error', () => {});
}

describe('syncToAtproto', () => {
  let dir: string;
  let contentDir: string;
  let savedCwd: string;
  let savedEnv: Record<string, string | undefined>;

  beforeEach(() => {
    savedCwd = process.cwd();
    savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    for (const k of ENV_KEYS) delete process.env[k];
    dir = makeTmpDir();
    contentDir = join(dir, 'content', 'blog');
    mkdirSync(contentDir, { recursive: true });
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(savedCwd);
    for (const k of ENV_KEYS) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
    cleanup(dir);
  });

  it('dry run skips drafts, reports creates, and writes nothing', async (t) => {
    silence(t);
    writeFileSync(join(contentDir, 'live.md'), '---\ntitle: Live\ndate: 2026-01-01\n---\nbody');
    writeFileSync(
      join(contentDir, 'wip.md'),
      '---\ntitle: WIP\ndate: 2026-02-01\ndraft: true\n---\nbody',
    );

    const results = await syncToAtproto(makeConfig(), args({ dryRun: true }));
    const bySlug = Object.fromEntries(results.map((r) => [r.slug, r.action]));
    assert.strictEqual(bySlug['live'], 'created');
    assert.strictEqual(bySlug['wip'], 'skipped');
    assert.ok(!existsSync(join(dir, 'atproto-state.json')), 'no state file in dry run');
  });

  it('throws when publishing without credentials', async (t) => {
    silence(t);
    await assert.rejects(
      () => syncToAtproto(makeConfig(), args()),
      /ATPROTO_APP_PASSWORD/,
    );
  });

  it('reads ATP_IDENTIFIER from .env in cwd', async (t) => {
    const logs: string[] = [];
    t.mock.method(console, 'log', (msg: unknown) => logs.push(String(msg)));
    t.mock.method(console, 'warn', () => {});
    t.mock.method(console, 'error', () => {});

    writeFileSync(join(dir, '.env'), 'ATP_IDENTIFIER=from-dotenv.bsky.social\n');
    const { config } = await import('dotenv');
    config();

    await syncToAtproto(makeConfig({ identifier: undefined }), args({ dryRun: true }));
    assert.ok(logs.some((line) => line.includes('from-dotenv.bsky.social')));
  });

  it('publishes a new post: creates doc, announces, writes state and frontmatter', async (t) => {
    silence(t);
    process.env.ATPROTO_APP_PASSWORD = 'app-password';
    const mock = installAtpMock(t, { did: DID });

    const file = join(contentDir, 'hello.md');
    writeFileSync(
      file,
      '---\ntitle: Hello World\ndescription: A short friendly description\ndate: 2026-01-01\n---\nBody with a [link](/other).',
    );

    const results = await syncToAtproto(makeConfig(), args());
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].action, 'created');

    // Publication, Bluesky announcement, and document records were all created.
    const collections = mock
      .callsTo('/xrpc/com.atproto.repo.createRecord')
      .map((c) => (c.body as { collection: string }).collection);
    assert.deepStrictEqual(collections.sort(), [
      'app.bsky.feed.post',
      'site.standard.document',
      'site.standard.publication',
    ]);

    const state = readState(join(dir, 'atproto-state.json'));
    assert.strictEqual(state?.did, DID);
    assert.ok(state?.documentRkeys['/blog/hello']);

    const syndication = readSyndication(join(dir, 'atproto-syndication.json'));
    assert.ok(syndication.posts['/blog/hello']);

    const { data } = parseFrontmatter(readFileSync(file, 'utf8'));
    assert.match(String(data.atprotoUri), /site\.standard\.document/);
    assert.ok(data.atprotoRkey);
    assert.match(String(data.bskyPostUri), /app\.bsky\.feed\.post/);

    assert.ok(
      existsSync(join(dir, 'public', '.well-known', 'site.standard.publication')),
      'publication well-known file written',
    );
  });

  it('reports unchanged when content hash matches and post is already announced', async (t) => {
    silence(t);
    process.env.ATPROTO_APP_PASSWORD = 'app-password';
    installAtpMock(t, { did: DID });

    const file = join(contentDir, 'hello.md');
    const raw =
      '---\ntitle: Hello\ndate: 2026-01-01\natprotoRkey: hello\nbskyPostUri: at://did:plc:me/app.bsky.feed.post/p\n---\nbody';
    writeFileSync(file, raw);

    // Pre-seed state so the content hash matches.
    writeFileSync(
      join(dir, 'atproto-state.json'),
      JSON.stringify({
        did: DID,
        publicationAtUri: `at://${DID}/site.standard.publication/self`,
        contentHashes: { '/blog/hello': computeHash(raw) },
        documentRkeys: { '/blog/hello': 'hello' },
      }),
    );

    const results = await syncToAtproto(makeConfig(), args());
    assert.strictEqual(results[0].action, 'unchanged');
  });

  it('updates an existing remote document via putRecord using its rkey', async (t) => {
    silence(t);
    process.env.ATPROTO_APP_PASSWORD = 'app-password';
    const mock = installAtpMock(t, {
      did: DID,
      documents: [
        {
          uri: `at://${DID}/site.standard.document/existing`,
          value: { path: '/blog/hello' },
        },
      ],
    });

    // Already announced (has bskyPostUri) so no new announcement is created.
    writeFileSync(
      join(contentDir, 'hello.md'),
      '---\ntitle: Hello\ndate: 2026-01-01\nbskyPostUri: at://did:plc:me/app.bsky.feed.post/p\n---\nchanged body',
    );

    const results = await syncToAtproto(makeConfig(), args());
    assert.strictEqual(results[0].action, 'updated');
    const put = mock.callsTo('/xrpc/com.atproto.repo.putRecord')[0];
    assert.strictEqual((put.body as { rkey: string }).rkey, 'existing');
  });

  it('creates a document with putRecord when frontmatter pins an rkey', async (t) => {
    silence(t);
    process.env.ATPROTO_APP_PASSWORD = 'app-password';
    process.env.BLUESKY_CROSSPOST = '0'; // skip announcement for a focused assertion
    const mock = installAtpMock(t, { did: DID });

    writeFileSync(
      join(contentDir, 'hello.md'),
      '---\ntitle: Hello\ndate: 2026-01-01\natprotoRkey: pinned-key\n---\nbody',
    );

    const results = await syncToAtproto(makeConfig(), args());
    assert.strictEqual(results[0].action, 'created');
    const put = mock.callsTo('/xrpc/com.atproto.repo.putRecord')[0];
    assert.strictEqual((put.body as { rkey: string }).rkey, 'pinned-key');
  });
});
