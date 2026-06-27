import type { Comment, PostLike, PostQuote } from '../../../atproto/types.js';
import { chiitanLove } from './chiitan.love.js';
import { howspotdoingCom } from './howspotdoing.com.js';
import { marijuanaSchool } from './marijuana.school.js';
import { scottnathCom } from './scottnath.com.js';
import { slacktivistCom } from './slacktivist.com.js';
import type { BskyUserFixture } from './types.js';
import { welcomePostUri } from './welcome-post.js';

export type { BskyProfileView, BskyUserFixture, BskyWelcomePostQuote, BskyWelcomePostReply } from './types.js';
export { welcomePostCid, welcomePostUri, welcomePostUrl } from './welcome-post.js';

export { chiitanLove } from './chiitan.love.js';
export { howspotdoingCom } from './howspotdoing.com.js';
export { marijuanaSchool } from './marijuana.school.js';
export { scottnathCom } from './scottnath.com.js';
export { slacktivistCom } from './slacktivist.com.js';

/** All five accounts that interacted with the welcome skeet (likes, replies, or quotes). */
export const welcomePostUsers = [
  scottnathCom,
  chiitanLove,
  howspotdoingCom,
  marijuanaSchool,
  slacktivistCom,
] as const;

function postIdFromUri(uri: string): string {
  return uri.split('/').pop()!;
}

function replyToComment(user: BskyUserFixture, parentUri: string): Comment {
  const reply = user.welcomePost!.reply!;
  return {
    uri: reply.uri,
    cid: reply.cid,
    text: reply.text,
    author: user.actor,
    createdAt: new Date(reply.createdAt),
    source: 'bluesky',
    sourceUrl: `https://bsky.app/profile/${user.handle}/post/${postIdFromUri(reply.uri)}`,
    parentUri,
  };
}

/** Likes on the welcome skeet, newest first (matching public API order). */
export const welcomePostLikes: PostLike[] = welcomePostUsers
  .filter((u): u is BskyUserFixture & { welcomePost: { likedAt: string } } =>
    Boolean(u.welcomePost?.likedAt),
  )
  .map((u) => ({
    actor: u.actor,
    likedAt: new Date(u.welcomePost.likedAt),
  }));

/** Flat reply comments on the welcome skeet. */
export const welcomePostReplyComments: Comment[] = [
  replyToComment(scottnathCom, welcomePostUri),
  replyToComment(marijuanaSchool, welcomePostUri),
];

/** Nested comment tree for the welcome skeet (chronological roots). */
export const welcomePostCommentTree: Comment[] = [...welcomePostReplyComments].sort(
  (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
);

/** Quote posts referencing the welcome skeet. */
export const welcomePostQuotes: PostQuote[] = howspotdoingCom.welcomePost?.quote
  ? [
      {
        uri: howspotdoingCom.welcomePost.quote.uri,
        text: howspotdoingCom.welcomePost.quote.text,
        author: howspotdoingCom.actor,
        quotedAt: new Date(howspotdoingCom.welcomePost.quote.createdAt),
        sourceUrl: `https://bsky.app/profile/${howspotdoingCom.handle}/post/${postIdFromUri(howspotdoingCom.welcomePost.quote.uri)}`,
      },
    ]
  : [];
