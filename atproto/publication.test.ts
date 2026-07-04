import { describe, it } from 'node:test';
import assert from 'node:assert';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AtpAgent } from '@atproto/api';
import { AtprotoClient } from './client.js';
import { buildPublicationRecord, ensurePublication, isPresent, listPublications } from './publication.js';
import { installAtpMock, type AtpMock, type StoredRecord } from '../test/helpers/atp-mock.js';
import { cleanup, makeTmpDir } from '../test/helpers/tmp.js';

const DID = 'did:plc:test1234567890';

/** Install the mock, log in, and hand back the underlying agent plus the mock. */
async function setup(
  t: import('node:test').TestContext,
  publications: StoredRecord[] = [],
): Promise<{ agent: AtpAgent; mock: AtpMock }> {
  const mock = installAtpMock(t, { did: DID, publications });
  const client = await AtprotoClient.login(DID, 'pw');
  return { agent: client.getAgent(), mock };
}

/** Write a tiny placeholder image and return its path; auto-cleaned. */
function tmpIcon(t: import('node:test').TestContext, name = 'icon.png'): string {
  const dir = makeTmpDir();
  t.after(() => cleanup(dir));
  const path = join(dir, name);
  writeFileSync(path, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  return path;
}

const publicationRecord = (value: Record<string, unknown>): StoredRecord => ({
  uri: `at://${DID}/site.standard.publication/self`,
  value: { $type: 'site.standard.publication', ...value },
});

describe('isPresent', () => {
  it('drops undefined, null, empty string, and empty array', () => {
    assert.strictEqual(isPresent(undefined), false);
    assert.strictEqual(isPresent(null), false);
    assert.strictEqual(isPresent(''), false);
    assert.strictEqual(isPresent([]), false);
  });

  it('keeps falsy-but-meaningful values and non-empty collections', () => {
    assert.strictEqual(isPresent(0), true);
    assert.strictEqual(isPresent(false), true);
    assert.strictEqual(isPresent('x'), true);
    assert.strictEqual(isPresent([1]), true);
    assert.strictEqual(isPresent({}), true);
  });
});

describe('buildPublicationRecord', () => {
  it('emits only url and name when nothing else is provided', () => {
    const record = buildPublicationRecord({ url: 'https://x.com', name: 'X' });
    assert.deepStrictEqual(record, { $type: 'site.standard.publication', url: 'https://x.com', name: 'X' });
  });

  it('strips empty description and label arrays, and omits preferences when unset', () => {
    const record = buildPublicationRecord({
      url: 'https://x.com',
      name: 'X',
      description: '',
      labels: [],
    });
    assert.ok(!('description' in record));
    assert.ok(!('labels' in record));
    assert.ok(!('preferences' in record));
  });

  it('serializes theme colors from hex, 3-digit hex, and rgb objects', () => {
    const record = buildPublicationRecord({
      url: 'https://x.com',
      name: 'X',
      theme: {
        accent: '#3366ff',
        background: { r: 255, g: 255, b: 255 },
        foreground: '#000',
        accentForeground: '#ffffff',
      },
    });
    const theme = record.basicTheme as Record<string, Record<string, unknown>>;
    assert.strictEqual(theme.$type, 'site.standard.theme.basic');
    assert.deepStrictEqual(theme.accent, { $type: 'site.standard.theme.color#rgb', r: 0x33, g: 0x66, b: 0xff });
    assert.deepStrictEqual(theme.background, { $type: 'site.standard.theme.color#rgb', r: 255, g: 255, b: 255 });
    assert.deepStrictEqual(theme.foreground, { $type: 'site.standard.theme.color#rgb', r: 0, g: 0, b: 0 });
  });

  it('clamps out-of-range rgb channels to 0–255', () => {
    const record = buildPublicationRecord({
      url: 'https://x.com',
      name: 'X',
      theme: {
        accent: { r: 300, g: -5, b: 10.6 },
        background: '#fff',
        foreground: '#000',
        accentForeground: '#fff',
      },
    });
    const theme = record.basicTheme as Record<string, Record<string, number>>;
    assert.deepStrictEqual(theme.accent, { $type: 'site.standard.theme.color#rgb', r: 255, g: 0, b: 11 });
  });

  it('throws on an invalid hex color', () => {
    assert.throws(
      () =>
        buildPublicationRecord({
          url: 'https://x.com',
          name: 'X',
          theme: { accent: 'nope', background: '#fff', foreground: '#000', accentForeground: '#fff' },
        }),
      /Invalid hex color/,
    );
  });

  it('builds selfLabels and preferences', () => {
    const record = buildPublicationRecord({
      url: 'https://x.com',
      name: 'X',
      labels: ['!warn', 'nsfw'],
      showInDiscover: false,
    });
    assert.deepStrictEqual(record.labels, {
      $type: 'com.atproto.label.defs#selfLabels',
      values: [{ val: '!warn' }, { val: 'nsfw' }],
    });
    assert.deepStrictEqual(record.preferences, { showInDiscover: false });
  });

  it('attaches the provided icon blob', () => {
    const blob = { $type: 'blob', ref: { $link: 'x' } };
    const record = buildPublicationRecord({ url: 'https://x.com', name: 'X' }, blob);
    assert.strictEqual(record.icon, blob);
  });
});

describe('listPublications', () => {
  it('maps records to summaries with rkey, url, and value', async (t) => {
    const { agent } = await setup(t, [
      publicationRecord({ url: 'https://x.com', name: 'X' }),
    ]);
    const pubs = await listPublications(agent, DID);
    assert.strictEqual(pubs.length, 1);
    assert.strictEqual(pubs[0].rkey, 'self');
    assert.strictEqual(pubs[0].url, 'https://x.com');
    assert.strictEqual((pubs[0].value as { name: string }).name, 'X');
  });

  it('defaults url to an empty string when absent', async (t) => {
    const { agent } = await setup(t, [publicationRecord({ name: 'No URL' })]);
    const pubs = await listPublications(agent, DID);
    assert.strictEqual(pubs[0].url, '');
  });
});

describe('ensurePublication', () => {
  it('creates a record when none matches', async (t) => {
    const { agent, mock } = await setup(t, []);
    const uri = await ensurePublication(agent, DID, { url: 'https://new.com', name: 'New' });
    assert.match(uri, /site\.standard\.publication/);
    assert.strictEqual(mock.callsTo('/xrpc/com.atproto.repo.createRecord').length, 1);
  });

  it('returns the existing uri without writing when metadata is unchanged', async (t) => {
    const { agent, mock } = await setup(t, [
      publicationRecord({ url: 'https://x.com', name: 'X', description: 'd' }),
    ]);
    const uri = await ensurePublication(agent, DID, { url: 'https://x.com', name: 'X', description: 'd' });
    assert.strictEqual(uri, `at://${DID}/site.standard.publication/self`);
    assert.strictEqual(mock.callsTo('/xrpc/com.atproto.repo.putRecord').length, 0);
    assert.strictEqual(mock.callsTo('/xrpc/com.atproto.repo.createRecord').length, 0);
  });

  it('updates the record in place when metadata changed', async (t) => {
    const { agent, mock } = await setup(t, [publicationRecord({ url: 'https://x.com', name: 'Old' })]);
    await ensurePublication(agent, DID, { url: 'https://x.com', name: 'New', description: 'Fresh' });
    const put = mock.callsTo('/xrpc/com.atproto.repo.putRecord')[0];
    assert.ok(put, 'a metadata change triggers a putRecord');
    const record = (put.body as { rkey: string; record: Record<string, unknown> });
    assert.strictEqual(record.rkey, 'self');
    assert.strictEqual(record.record.name, 'New');
  });

  it('uploads the icon and includes it in a created record', async (t) => {
    const { agent, mock } = await setup(t, []);
    await ensurePublication(agent, DID, { url: 'https://new.com', name: 'New', iconPath: tmpIcon(t) });
    assert.strictEqual(mock.callsTo('/xrpc/com.atproto.repo.uploadBlob').length, 1);
    const record = (mock.callsTo('/xrpc/com.atproto.repo.createRecord')[0].body as {
      record: Record<string, unknown>;
    }).record;
    assert.ok(record.icon, 'icon blob is present');
  });

  it('does not re-upload the icon when the record already has one', async (t) => {
    const { agent, mock } = await setup(t, [
      publicationRecord({
        url: 'https://x.com',
        name: 'X',
        icon: { $type: 'blob', ref: { $link: 'existing' }, mimeType: 'image/png', size: 1 },
      }),
    ]);
    await ensurePublication(agent, DID, { url: 'https://x.com', name: 'X', iconPath: tmpIcon(t) });
    assert.strictEqual(mock.callsTo('/xrpc/com.atproto.repo.uploadBlob').length, 0);
  });

  it('re-uploads the icon when force is set', async (t) => {
    const { agent, mock } = await setup(t, [
      publicationRecord({
        url: 'https://x.com',
        name: 'X',
        icon: { $type: 'blob', ref: { $link: 'existing' }, mimeType: 'image/png', size: 1 },
      }),
    ]);
    await ensurePublication(
      agent,
      DID,
      { url: 'https://x.com', name: 'X', iconPath: tmpIcon(t) },
      { force: true },
    );
    assert.strictEqual(mock.callsTo('/xrpc/com.atproto.repo.uploadBlob').length, 1);
  });

  it('derives the blob mime type from the icon file extension', async (t) => {
    for (const name of ['logo.jpg', 'logo.jpeg', 'logo.gif', 'logo.webp', 'logo.svg', 'logo.avif', 'logo.bin']) {
      const { agent, mock } = await setup(t, []);
      await ensurePublication(agent, DID, {
        url: 'https://new.com',
        name: 'New',
        iconPath: tmpIcon(t, name),
      });
      assert.strictEqual(
        mock.callsTo('/xrpc/com.atproto.repo.uploadBlob').length,
        1,
        `uploaded icon for ${name}`,
      );
    }
  });
});
