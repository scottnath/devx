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
import {
  makeLikeFromUser,
  makeProfileViewFromUser,
  makeQuotePostView,
  makeThread,
} from '../test/helpers/bsky-fixtures.js';
import {
  chiitanLove,
  howspotdoingCom,
  scottnathCom,
  welcomePostUri,
} from '../test/helpers/bsky-users/index.js';

describe('actorFromProfile', () => {
  it('builds profileUrl from handle', () => {
    const actor = actorFromProfile(scottnathCom.profileView);
    assert.strictEqual(actor.profileUrl, 'https://bsky.app/profile/scottnath.com');
    assert.strictEqual(actor.displayName, 'Scott Nath 🚫🧊');
  });
});

describe('fetchLikes', () => {
  it('maps likes from getLikes', async (t) => {
    installAtpMock(t, {
      likes: [makeLikeFromUser(scottnathCom), makeLikeFromUser(chiitanLove)],
    });

    const { likes } = await fetchLikes(welcomePostUri);
    assert.strictEqual(likes.length, 2);
    assert.strictEqual(likes[0].actor.handle, 'scottnath.com');
    assert.strictEqual(likes[0].actor.profileUrl, 'https://bsky.app/profile/scottnath.com');
    assert.strictEqual(likes[0].likedAt.toISOString(), scottnathCom.welcomePost!.likedAt);
  });

  it('returns [] on fetch error', async (t) => {
    t.mock.method(console, 'error', () => {});
    installAtpMock(t);
    const { likes } = await fetchLikes(welcomePostUri);
    assert.deepStrictEqual(likes, []);
  });
});

describe('fetchRepostedBy', () => {
  it('maps reposters from getRepostedBy', async (t) => {
    installAtpMock(t, {
      repostedBy: [makeProfileViewFromUser(chiitanLove)],
    });

    const { reposts } = await fetchRepostedBy(welcomePostUri);
    assert.strictEqual(reposts.length, 1);
    assert.strictEqual(reposts[0].actor.handle, 'chiitan.love');
  });
});

describe('fetchQuotes', () => {
  it('maps quote posts from getQuotes', async (t) => {
    installAtpMock(t, {
      quotes: [makeQuotePostView(howspotdoingCom)],
    });

    const { quotes } = await fetchQuotes(welcomePostUri);
    assert.strictEqual(quotes.length, 1);
    assert.strictEqual(quotes[0].text, '@marijuana.school see?');
    assert.strictEqual(quotes[0].author.handle, 'howspotdoing.com');
    assert.strictEqual(
      quotes[0].sourceUrl,
      'https://bsky.app/profile/howspotdoing.com/post/3mp6y5gvfq22m',
    );
  });
});

describe('fetchPostEngagement', () => {
  it('reads counts from the root post in getPostThread', async (t) => {
    installAtpMock(t, {
      thread: makeThread({
        post: {
          uri: welcomePostUri,
          text: 'This is a post about nothing. I did not have time to post.',
          likeCount: 4,
          repostCount: 0,
          quoteCount: 1,
          replyCount: 2,
          bookmarkCount: 0,
        },
      }),
    });

    const engagement = await fetchPostEngagement(welcomePostUri);
    assert.deepStrictEqual(engagement, {
      likeCount: 4,
      repostCount: 0,
      quoteCount: 1,
      replyCount: 2,
      bookmarkCount: 0,
    });
  });

  it('returns {} for a not-found thread', async (t) => {
    installAtpMock(t);
    const engagement = await fetchPostEngagement(welcomePostUri);
    assert.deepStrictEqual(engagement, {});
  });
});
