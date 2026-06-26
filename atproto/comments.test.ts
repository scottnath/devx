import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildCommentTree,
  countComments,
  fetchComments,
  type Comment,
} from './comments.js';
import { installAtpMock } from '../test/helpers/atp-mock.js';
import { makePostView, makeThread } from '../test/helpers/bsky-fixtures.js';

function comment(uri: string, createdAt: string, parentUri?: string): Comment {
  return {
    uri,
    cid: 'cid',
    text: uri,
    author: { did: 'did:plc:a', handle: 'a.bsky.social' },
    createdAt: new Date(createdAt),
    source: 'bluesky',
    sourceUrl: `https://bsky.app/${uri}`,
    parentUri,
  };
}

describe('buildCommentTree', () => {
  it('nests replies under their parent and sorts by createdAt ascending', () => {
    const flat = [
      comment('at://root/reply-b', '2026-02-01'),
      comment('at://root/reply-a', '2026-01-01'),
      comment('at://root/reply-a/child', '2026-03-01', 'at://root/reply-a'),
    ];
    const tree = buildCommentTree(flat);
    assert.deepStrictEqual(
      tree.map((c) => c.uri),
      ['at://root/reply-a', 'at://root/reply-b'],
    );
    assert.deepStrictEqual(tree[0].replies?.map((c) => c.uri), ['at://root/reply-a/child']);
  });

  it('treats a comment with an unknown parent as a root', () => {
    const tree = buildCommentTree([comment('at://x/y', '2026-01-01', 'at://missing/parent')]);
    assert.strictEqual(tree.length, 1);
    assert.strictEqual(tree[0].uri, 'at://x/y');
  });
});

describe('countComments', () => {
  it('counts nested comments recursively', () => {
    const tree = buildCommentTree([
      comment('at://r/a', '2026-01-01'),
      comment('at://r/a/1', '2026-01-02', 'at://r/a'),
      comment('at://r/a/1/i', '2026-01-03', 'at://r/a/1'),
      comment('at://r/b', '2026-01-01'),
    ]);
    assert.strictEqual(countComments(tree), 4);
  });

  it('returns 0 for an empty tree', () => {
    assert.strictEqual(countComments([]), 0);
  });
});

describe('fetchComments', () => {
  it('returns [] with no options', async () => {
    const comments = await fetchComments({});
    assert.deepStrictEqual(comments, []);
  });

  it('transforms a Bluesky thread into a nested comment tree', async (t) => {
    const rootUri = 'at://did:plc:author/app.bsky.feed.post/root';
    installAtpMock(t, {
      thread: makeThread({
        post: { uri: rootUri, text: 'root post' },
        replies: [
          {
            post: {
              uri: 'at://did:plc:author/app.bsky.feed.post/a',
              text: 'reply a',
              handle: 'alice.bsky.social',
              createdAt: '2026-02-01T00:00:00.000Z',
              parentUri: rootUri,
            },
            replies: [
              {
                post: {
                  uri: 'at://did:plc:author/app.bsky.feed.post/a1',
                  text: 'reply a1',
                  createdAt: '2026-03-01T00:00:00.000Z',
                  parentUri: 'at://did:plc:author/app.bsky.feed.post/a',
                },
              },
            ],
          },
          {
            post: {
              uri: 'at://did:plc:author/app.bsky.feed.post/b',
              text: 'reply b',
              createdAt: '2026-01-01T00:00:00.000Z',
              parentUri: rootUri,
            },
          },
        ],
      }),
    });

    const comments = await fetchComments({ bskyPostUri: rootUri });
    assert.strictEqual(countComments(comments), 3);
    // root excluded; b (Jan) sorts before a (Feb)
    assert.deepStrictEqual(comments.map((c) => c.text), ['reply b', 'reply a']);
    const replyA = comments.find((c) => c.text === 'reply a')!;
    assert.strictEqual(replyA.author.handle, 'alice.bsky.social');
    assert.strictEqual(replyA.source, 'bluesky');
    assert.strictEqual(
      replyA.sourceUrl,
      'https://bsky.app/profile/alice.bsky.social/post/a',
    );
    assert.deepStrictEqual(replyA.replies?.map((c) => c.text), ['reply a1']);
  });

  it('returns [] for a not-found thread', async (t) => {
    installAtpMock(t); // default thread is notFoundPost
    const comments = await fetchComments({
      bskyPostUri: 'at://did:plc:test/app.bsky.feed.post/missing',
    });
    assert.deepStrictEqual(comments, []);
  });

  it('swallows thread fetch errors and returns []', async (t) => {
    t.mock.method(console, 'error', () => {});
    installAtpMock(t, { threadError: true });
    const comments = await fetchComments({ bskyPostUri: 'at://did/app.bsky.feed.post/x' });
    assert.deepStrictEqual(comments, []);
  });

  it('does not call searchPosts for canonicalUrl (public API returns 403)', async (t) => {
    const rootUri = 'at://did:plc:author/app.bsky.feed.post/root';
    const mock = installAtpMock(t, {
      thread: makeThread({
        post: { uri: rootUri, text: 'root' },
        replies: [
          {
            post: {
              uri: 'at://did:plc:author/app.bsky.feed.post/a',
              text: 'a reply',
              createdAt: '2026-01-01T00:00:00.000Z',
              parentUri: rootUri,
            },
          },
        ],
      }),
      searchPosts: [
        makePostView({
          uri: 'at://did:plc:other/app.bsky.feed.post/mention',
          text: 'a mention',
          createdAt: '2026-04-01T00:00:00.000Z',
        }),
      ],
    });

    const comments = await fetchComments({
      bskyPostUri: rootUri,
      canonicalUrl: 'https://example.com/blog/post/',
    });
    assert.deepStrictEqual(comments.map((c) => c.text), ['a reply']);
    assert.strictEqual(mock.callsTo('/xrpc/app.bsky.feed.searchPosts').length, 0);
  });
});
