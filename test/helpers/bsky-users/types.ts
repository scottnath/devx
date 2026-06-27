import type { BlueskyActor, Comment, PostLike, PostQuote } from '../../../atproto/types.js';

/** Minimal app.bsky.actor.defs#profileView fields for API mocks. */
export interface BskyProfileView {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  createdAt: string;
}

export interface BskyWelcomePostReply {
  uri: string;
  cid: string;
  text: string;
  createdAt: string;
}

export interface BskyWelcomePostQuote {
  uri: string;
  cid: string;
  text: string;
  createdAt: string;
}

/** Real Bluesky profile plus interactions on the slacktivist welcome skeet. */
export interface BskyUserFixture {
  handle: string;
  actor: BlueskyActor;
  profileView: BskyProfileView;
  welcomePost?: {
    likedAt?: string;
    reply?: BskyWelcomePostReply;
    quote?: BskyWelcomePostQuote;
  };
}

export type { BlueskyActor, Comment, PostLike, PostQuote };
