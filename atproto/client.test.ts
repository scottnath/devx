import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AtprotoClient } from './client.js';
import { installAtpMock } from '../test/helpers/atp-mock.js';

const DID = 'did:plc:test1234567890';

const docInput = {
  site: `at://${DID}/site.standard.publication/self`,
  title: 'Hello',
  path: '/blog/hello',
  publishedAt: '2026-01-01T00:00:00.000Z',
  textContent: 'hello world',
  markdown: '# hello world',
};

describe('AtprotoClient.login', () => {
  it('resolves a handle, finds the PDS, and stores the DID', async (t) => {
    const mock = installAtpMock(t, { did: DID });
    const client = await AtprotoClient.login('tester.example.com', 'app-password');
    assert.strictEqual(client.did, DID);
    assert.strictEqual(mock.callsTo('/xrpc/com.atproto.identity.resolveHandle').length, 1);
    assert.strictEqual(mock.callsTo('/xrpc/com.atproto.server.createSession').length, 1);
  });

  it('skips handle resolution when given a DID', async (t) => {
    const mock = installAtpMock(t, { did: DID });
    await AtprotoClient.login(DID, 'app-password');
    assert.strictEqual(mock.callsTo('/xrpc/com.atproto.identity.resolveHandle').length, 0);
  });
});

describe('AtprotoClient publication delegation', () => {
  // Publication behavior is covered in publication.test.ts; these assert the
  // client methods delegate to that module with the agent and DID.
  it('ensurePublication creates a record through the publication module', async (t) => {
    const mock = installAtpMock(t, { did: DID, publications: [] });
    const client = await AtprotoClient.login(DID, 'pw');
    const uri = await client.ensurePublication({ url: 'https://new.com', name: 'New' });
    assert.match(uri, /site\.standard\.publication/);
    assert.strictEqual(mock.callsTo('/xrpc/com.atproto.repo.createRecord').length, 1);
  });

  it('listPublications returns record summaries', async (t) => {
    installAtpMock(t, {
      did: DID,
      publications: [
        {
          uri: `at://${DID}/site.standard.publication/self`,
          value: { $type: 'site.standard.publication', url: 'https://example.com', name: 'Example' },
        },
      ],
    });
    const client = await AtprotoClient.login(DID, 'pw');
    const pubs = await client.listPublications();
    assert.strictEqual(pubs.length, 1);
    assert.strictEqual(pubs[0].url, 'https://example.com');
  });
});

describe('AtprotoClient.listDocuments', () => {
  it('maps records to stored documents with rkey, path and bskyPostRef', async (t) => {
    installAtpMock(t, {
      did: DID,
      documents: [
        {
          uri: `at://${DID}/site.standard.document/abc`,
          value: {
            path: '/blog/hello',
            bskyPostRef: { uri: 'at://did/app.bsky.feed.post/p', cid: 'c' },
          },
        },
      ],
    });
    const client = await AtprotoClient.login(DID, 'pw');
    const docs = await client.listDocuments();
    assert.strictEqual(docs.length, 1);
    assert.strictEqual(docs[0].rkey, 'abc');
    assert.strictEqual(docs[0].path, '/blog/hello');
    assert.deepStrictEqual(docs[0].bskyPostRef, {
      uri: 'at://did/app.bsky.feed.post/p',
      cid: 'c',
    });
  });
});

describe('AtprotoClient document writes', () => {
  it('createDocument returns uri and parsed rkey', async (t) => {
    installAtpMock(t, { did: DID });
    const client = await AtprotoClient.login(DID, 'pw');
    const { uri, rkey } = await client.createDocument(docInput);
    assert.match(uri, /site\.standard\.document/);
    assert.strictEqual(uri.split('/').pop(), rkey);
  });

  it('putDocument sends the given rkey and omits undefined fields', async (t) => {
    const mock = installAtpMock(t, { did: DID });
    const client = await AtprotoClient.login(DID, 'pw');
    const uri = await client.putDocument('my-rkey', docInput);
    assert.strictEqual(uri, `at://${DID}/site.standard.document/my-rkey`);

    const call = mock.callsTo('/xrpc/com.atproto.repo.putRecord')[0];
    const body = call.body as { rkey: string; record: Record<string, unknown> };
    assert.strictEqual(body.rkey, 'my-rkey');
    assert.ok(!('description' in body.record), 'undefined description should be stripped');
    assert.ok(!('bskyPostRef' in body.record), 'undefined bskyPostRef should be stripped');
  });

  it('deleteDocument issues a deleteRecord call', async (t) => {
    const mock = installAtpMock(t, { did: DID });
    const client = await AtprotoClient.login(DID, 'pw');
    await client.deleteDocument('gone');
    const call = mock.callsTo('/xrpc/com.atproto.repo.deleteRecord')[0];
    assert.strictEqual((call.body as { rkey: string }).rkey, 'gone');
  });
});
