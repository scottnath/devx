import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AtpAgent } from '@atproto/api';
import { createBlueskyTeaser, skeetText } from './crosspost.js';
import { cleanup, makeTmpDir } from '../test/helpers/tmp.js';

describe('skeetText', () => {
  it('returns short text unchanged', () => {
    assert.strictEqual(skeetText('hello'), 'hello');
  });

  it('returns text of exactly 300 chars unchanged', () => {
    const text = 'a'.repeat(300);
    assert.strictEqual(skeetText(text), text);
  });

  it('truncates longer text to 297 chars plus an ellipsis', () => {
    const out = skeetText('a'.repeat(400));
    assert.strictEqual(out.length, 298);
    assert.ok(out.endsWith('…'));
  });
});

/** A record-creation payload as passed to `com.atproto.repo.createRecord`. */
interface CreateRecordInput {
  repo: string;
  collection: string;
  record: Record<string, unknown>;
}

/** Minimal AtpAgent stub that records the created record. */
function mockAgent() {
  const createRecord = mock.fn(async (_input: CreateRecordInput) => ({
    data: { uri: 'at://did:plc:me/app.bsky.feed.post/xyz', cid: 'bafycid' },
  }));
  const uploadBlob = mock.fn(async () => ({
    data: { blob: { $type: 'blob', ref: { $link: 'bafyblob' }, mimeType: 'image/png', size: 1 } },
  }));
  const agent = {
    uploadBlob,
    com: { atproto: { repo: { createRecord } } },
  } as unknown as AtpAgent;
  return { agent, createRecord, uploadBlob };
}

describe('createBlueskyTeaser', () => {
  it('creates a feed post with an external embed and no thumb', async () => {
    const { agent, createRecord, uploadBlob } = mockAgent();
    const res = await createBlueskyTeaser(agent, 'did:plc:me', {
      text: 'Read my new post',
      url: 'https://example.com/blog/post/',
      title: 'My Post',
    });

    assert.deepStrictEqual(res, { uri: 'at://did:plc:me/app.bsky.feed.post/xyz', cid: 'bafycid' });
    assert.strictEqual(uploadBlob.mock.callCount(), 0);
    assert.strictEqual(createRecord.mock.callCount(), 1);

    const { collection, record } = createRecord.mock.calls[0].arguments[0];
    assert.strictEqual(collection, 'app.bsky.feed.post');
    const embed = record.embed as { external: Record<string, unknown> };
    assert.deepStrictEqual(embed.external, {
      uri: 'https://example.com/blog/post/',
      title: 'My Post',
    });
  });

  describe('with a thumbnail', () => {
    let dir: string;
    let thumb: string;

    beforeEach(() => {
      dir = makeTmpDir();
      thumb = join(dir, 'og.png');
      writeFileSync(thumb, 'fake-png-bytes');
    });

    afterEach(() => cleanup(dir));

    it('uploads the thumb and attaches it to the embed', async () => {
      const { agent, createRecord, uploadBlob } = mockAgent();
      await createBlueskyTeaser(agent, 'did:plc:me', {
        text: 'Read my new post',
        url: 'https://example.com/blog/post/',
        title: 'My Post',
        thumbPath: thumb,
      });

      assert.strictEqual(uploadBlob.mock.callCount(), 1);
      const { record } = createRecord.mock.calls[0].arguments[0];
      const embed = record.embed as { external: { thumb?: unknown } };
      assert.ok(embed.external.thumb);
    });

    it('ignores a thumb path that does not exist', async () => {
      const { agent, uploadBlob } = mockAgent();
      await createBlueskyTeaser(agent, 'did:plc:me', {
        text: 'Read my new post',
        url: 'https://example.com/blog/post/',
        title: 'My Post',
        thumbPath: join(dir, 'missing.png'),
      });
      assert.strictEqual(uploadBlob.mock.callCount(), 0);
    });
  });
});
