import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  actorFromProfile,
  fetchLikes,
  fetchPostEngagement,
  fetchQuotes,
  fetchRepostedBy,
} from './reactions.js';
import { installAtpMock } from '../test/helpers/atp-mock.js';
import { makeLike, makePostView, makeProfileView, makeThread } from '../test/helpers/bsky-fixtures.js';

const POST_URI = 'at://did:plc:author/app.bsky.feed.post/root';

describe('actorFromProfile', () => {
  it('builds profileUrl from handle', () => {
    const actor = actorFromProfile({
      did: 'did:plc:alice',
      handle: 'alice.bsky.social',
      displayName: 'Alice',
    });
    assert.strictEqual(actor.profileUrl, 'https://bsky.app/profile/alice.bsky.social');
    assert.strictEqual(actor.displayName, 'Alice');
  });
});

describe('fetchLikes', () => {
  it('maps likes from getLikes', async (t) => {
    installAtpMock(t, {
      likes: [
        makeLike({ handle: 'alice.bsky.social', displayName: 'Alice', createdAt: '2026-02-01T00:00:00.000Z' }),
        makeLike({ handle: 'bob.bsky.social', createdAt: '2026-03-01T00:00:00.000Z' }),
      ],
    });

    const { likes } = await fetchLikes(POST_URI);
    assert.strictEqual(likes.length, 2);
    assert.strictEqual(likes[0].actor.handle, 'alice.bsky.social');
    assert.strictEqual(likes[0].actor.profileUrl, 'https://bsky.app/profile/alice.bsky.social');
    assert.strictEqual(likes[0].likedAt.toISOString(), '2026-02-01T00:00:00.000Z');
  });

  it('returns [] on fetch error', async (t) => {
    t.mock.method(console, 'error', () => {});
    installAtpMock(t);
    const { likes } = await fetchLikes(POST_URI);
    assert.deepStrictEqual(likes, []);
  });
});

describe('fetchRepostedBy', () => {
  it('maps reposters from getRepostedBy', async (t) => {
    installAtpMock(t, {
      repostedBy: [
        makeProfileView({ handle: 'reposter.bsky.social', displayName: 'Reposter' }),
      ],
    });

    const { reposts } = await fetchRepostedBy(POST_URI);
    assert.strictEqual(reposts.length, 1);
    assert.strictEqual(reposts[0].actor.handle, 'reposter.bsky.social');
  });
});

describe('fetchQuotes', () => {
  it('maps quote posts from getQuotes', async (t) => {
    installAtpMock(t, {
      quotes: [
        makePostView({
          uri: 'at://did:plc:quoter/app.bsky.feed.post/q1',
          text: 'great post',
          handle: 'quoter.bsky.social',
          createdAt: '2026-04-01T00:00:00.000Z',
        }),
      ],
    });

    const { quotes } = await fetchQuotes(POST_URI);
    assert.strictEqual(quotes.length, 1);
    assert.strictEqual(quotes[0].text, 'great post');
    assert.strictEqual(quotes[0].author.handle, 'quoter.bsky.social');
    assert.strictEqual(
      quotes[0].sourceUrl,
      'https://bsky.app/profile/quoter.bsky.social/post/q1',
    );
  });
});

describe('fetchPostEngagement', () => {
  it('reads counts from the root post in getPostThread', async (t) => {
    installAtpMock(t, {
      thread: makeThread({
        post: {
          uri: POST_URI,
          text: 'announcement',
          likeCount: 3,
          repostCount: 2,
          quoteCount: 1,
          replyCount: 5,
          bookmarkCount: 4,
        },
      }),
    });

    const engagement = await fetchPostEngagement(POST_URI);
    assert.deepStrictEqual(engagement, {
      likeCount: 3,
      repostCount: 2,
      quoteCount: 1,
      replyCount: 5,
      bookmarkCount: 4,
    });
  });

  it('returns {} for a not-found thread', async (t) => {
    installAtpMock(t);
    const engagement = await fetchPostEngagement(POST_URI);
    assert.deepStrictEqual(engagement, {});
  });
});
