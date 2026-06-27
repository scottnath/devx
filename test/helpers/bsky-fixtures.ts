/** Builders for lexicon-valid Bluesky views used in comments tests. */
import { VALID_CID } from './atp-mock.js';
import type { BskyUserFixture } from './bsky-users/types.js';

export interface PostViewOptions {
  uri: string;
  text: string;
  handle?: string;
  did?: string;
  displayName?: string;
  createdAt?: string;
  parentUri?: string;
  rootUri?: string;
  likeCount?: number;
  replyCount?: number;
  repostCount?: number;
  quoteCount?: number;
  bookmarkCount?: number;
}

/** Minimal but lexicon-valid app.bsky.feed.defs#postView. */
export function makePostView(opts: PostViewOptions): Record<string, unknown> {
  const reply =
    opts.parentUri !== undefined
      ? {
          root: { uri: opts.rootUri ?? opts.parentUri, cid: VALID_CID },
          parent: { uri: opts.parentUri, cid: VALID_CID },
        }
      : undefined;
  return {
    uri: opts.uri,
    cid: VALID_CID,
    author: {
      did: opts.did ?? 'did:plc:author',
      handle: opts.handle ?? 'author.bsky.social',
      displayName: opts.displayName,
    },
    record: {
      $type: 'app.bsky.feed.post',
      text: opts.text,
      createdAt: opts.createdAt ?? '2026-01-01T00:00:00.000Z',
      reply,
    },
    likeCount: opts.likeCount ?? 0,
    replyCount: opts.replyCount ?? 0,
    repostCount: opts.repostCount ?? 0,
    quoteCount: opts.quoteCount ?? 0,
    bookmarkCount: opts.bookmarkCount ?? 0,
    indexedAt: opts.createdAt ?? '2026-01-01T00:00:00.000Z',
  };
}

export interface ThreadNode {
  post: PostViewOptions;
  replies?: ThreadNode[];
}

/** Build an app.bsky.feed.defs#threadViewPost tree. */
export function makeThread(node: ThreadNode): Record<string, unknown> {
  return {
    $type: 'app.bsky.feed.defs#threadViewPost',
    post: makePostView(node.post),
    replies: (node.replies ?? []).map(makeThread),
  };
}

export interface ProfileViewOptions {
  did?: string;
  handle?: string;
  displayName?: string;
  avatar?: string;
  createdAt?: string;
}

/** Minimal app.bsky.actor.defs#profileView for likes/reposts mocks. */
export function makeProfileView(opts: ProfileViewOptions = {}): Record<string, unknown> {
  return {
    did: opts.did ?? 'did:plc:author',
    handle: opts.handle ?? 'author.bsky.social',
    displayName: opts.displayName,
    avatar: opts.avatar,
    createdAt: opts.createdAt ?? '2026-01-01T00:00:00.000Z',
  };
}

/** app.bsky.feed.getLikes#like entry. */
export function makeLike(opts: {
  handle?: string;
  displayName?: string;
  did?: string;
  createdAt?: string;
  indexedAt?: string;
} = {}): Record<string, unknown> {
  return {
    $type: 'app.bsky.feed.getLikes#like',
    actor: makeProfileView({
      did: opts.did,
      handle: opts.handle,
      displayName: opts.displayName,
    }),
    createdAt: opts.createdAt ?? '2026-02-01T00:00:00.000Z',
    indexedAt: opts.indexedAt ?? opts.createdAt ?? '2026-02-01T00:00:00.000Z',
  };
}

/** Build a getLikes entry from a {@link BskyUserFixture}. */
export function makeLikeFromUser(
  user: BskyUserFixture,
  createdAt = user.welcomePost?.likedAt,
): Record<string, unknown> {
  return makeLike({
    did: user.profileView.did,
    handle: user.profileView.handle,
    displayName: user.profileView.displayName,
    createdAt,
  });
}

/** Build a profileView mock from a {@link BskyUserFixture}. */
export function makeProfileViewFromUser(user: BskyUserFixture): Record<string, unknown> {
  return makeProfileView(user.profileView);
}

/** Build postView options for a user's welcome-post reply. */
export function replyPostOptions(
  user: BskyUserFixture,
  parentUri: string,
  rootUri = parentUri,
): PostViewOptions {
  const reply = user.welcomePost?.reply;
  if (!reply) throw new Error(`${user.handle} has no welcome-post reply fixture`);
  return {
    uri: reply.uri,
    text: reply.text,
    did: user.profileView.did,
    handle: user.profileView.handle,
    displayName: user.profileView.displayName,
    createdAt: reply.createdAt,
    parentUri,
    rootUri,
  };
}

/** Build a postView for a user's welcome-post reply. */
export function makeReplyPostView(
  user: BskyUserFixture,
  parentUri: string,
  rootUri = parentUri,
): Record<string, unknown> {
  return makePostView(replyPostOptions(user, parentUri, rootUri));
}

/** Build a postView for a user's welcome-post quote. */
export function makeQuotePostView(user: BskyUserFixture): Record<string, unknown> {
  const quote = user.welcomePost?.quote;
  if (!quote) throw new Error(`${user.handle} has no welcome-post quote fixture`);
  return makePostView({
    uri: quote.uri,
    text: quote.text,
    did: user.profileView.did,
    handle: user.profileView.handle,
    displayName: user.profileView.displayName,
    createdAt: quote.createdAt,
  });
}
