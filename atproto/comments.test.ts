import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildCommentTree,
  countComments,
  fetchComments,
  type Comment,
} from './comments.js';
import { installAtpMock } from '../test/helpers/atp-mock.js';
import { makeThread, replyPostOptions } from '../test/helpers/bsky-fixtures.js';
import {
  marijuanaSchool,
  scottnathCom,
  welcomePostUri,
} from '../test/helpers/bsky-users/index.js';

function comment(uri: string, createdAt: string, parentUri?: string): Comment {
  return {
    uri,
    cid: 'cid',
    text: uri,
    author: scottnathCom.actor,
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
    installAtpMock(t, {
      thread: makeThread({
        post: { uri: welcomePostUri, text: 'root post' },
        replies: [
          {
            post: replyPostOptions(scottnathCom, welcomePostUri),
          },
          {
            post: replyPostOptions(marijuanaSchool, welcomePostUri),
          },
        ],
      }),
    });

    const comments = await fetchComments({ bskyPostUri: welcomePostUri });
    assert.strictEqual(countComments(comments), 2);
    assert.deepStrictEqual(comments.map((c) => c.text), ['do better', 'What is this slackiness?']);
    const scottReply = comments.find((c) => c.text === 'do better')!;
    assert.strictEqual(scottReply.author.handle, 'scottnath.com');
    assert.strictEqual(scottReply.source, 'bluesky');
    assert.strictEqual(
      scottReply.sourceUrl,
      'https://bsky.app/profile/scottnath.com/post/3mp62vhjcs22m',
    );
  });

  it('returns [] for a not-found thread', async (t) => {
    installAtpMock(t); // default thread is notFoundPost
    const comments = await fetchComments({
      bskyPostUri: welcomePostUri,
    });
    assert.deepStrictEqual(comments, []);
  });

  it('swallows thread fetch errors and returns []', async (t) => {
    t.mock.method(console, 'error', () => {});
    installAtpMock(t, { threadError: true });
    const comments = await fetchComments({ bskyPostUri: welcomePostUri });
    assert.deepStrictEqual(comments, []);
  });

  it('does not call searchPosts for canonicalUrl (public API returns 403)', async (t) => {
    const mock = installAtpMock(t, {
      thread: makeThread({
        post: { uri: welcomePostUri, text: 'root' },
        replies: [
          {
            post: replyPostOptions(scottnathCom, welcomePostUri),
          },
        ],
      }),
    });

    const comments = await fetchComments({
      bskyPostUri: welcomePostUri,
      canonicalUrl: 'https://slacktivist.com/blog/welcome/',
    });
    assert.deepStrictEqual(comments.map((c) => c.text), ['do better']);
    assert.strictEqual(mock.callsTo('/xrpc/app.bsky.feed.searchPosts').length, 0);
  });
});
