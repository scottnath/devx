import {
  AppBskyFeedDefs,
  AtpAgent,
  type AppBskyActorDefs,
  type AppBskyFeedPost,
} from '@atproto/api';
import type {
  BlueskyActor,
  FetchReactionsOptions,
  PostEngagement,
  PostLike,
  PostQuote,
  PostRepost,
} from './types.js';

const PUBLIC_API = 'https://public.api.bsky.app';
const DEFAULT_LIMIT = 50;

/** Map a Bluesky profile view to a {@link BlueskyActor}. */
export function actorFromProfile(
  profile: Pick<AppBskyActorDefs.ProfileViewBasic, 'did' | 'handle' | 'displayName' | 'avatar'>,
): BlueskyActor {
  return {
    did: profile.did,
    handle: profile.handle,
    displayName: profile.displayName,
    avatar: profile.avatar,
    profileUrl: `https://bsky.app/profile/${profile.handle}`,
  };
}

function postIdFromUri(uri: string): string | undefined {
  return uri.split('/').pop();
}

function quoteFromPostView(post: AppBskyFeedDefs.PostView): PostQuote {
  const record = post.record as AppBskyFeedPost.Record;
  const postId = postIdFromUri(post.uri);
  return {
    uri: post.uri,
    text: record.text ?? '',
    author: actorFromProfile(post.author),
    quotedAt: new Date(record.createdAt ?? post.indexedAt),
    sourceUrl: `https://bsky.app/profile/${post.author.handle}/post/${postId}`,
  };
}

/** Fetch who liked a post. */
export async function fetchLikes(
  uri: string,
  opts: FetchReactionsOptions = {},
): Promise<{ likes: PostLike[]; cursor?: string }> {
  const agent = new AtpAgent({ service: PUBLIC_API });
  try {
    const res = await agent.app.bsky.feed.getLikes({
      uri,
      limit: opts.limit ?? DEFAULT_LIMIT,
      cursor: opts.cursor,
    });
    return {
      likes: res.data.likes.map((like) => ({
        actor: actorFromProfile(like.actor),
        likedAt: new Date(like.createdAt ?? like.indexedAt),
      })),
      cursor: res.data.cursor,
    };
  } catch (error) {
    console.error('Failed to fetch Bluesky likes:', error);
    return { likes: [] };
  }
}

/** Fetch who reposted a post. */
export async function fetchRepostedBy(
  uri: string,
  opts: FetchReactionsOptions = {},
): Promise<{ reposts: PostRepost[]; cursor?: string }> {
  const agent = new AtpAgent({ service: PUBLIC_API });
  try {
    const res = await agent.app.bsky.feed.getRepostedBy({
      uri,
      limit: opts.limit ?? DEFAULT_LIMIT,
      cursor: opts.cursor,
    });
    return {
      reposts: res.data.repostedBy.map((actor) => ({
        actor: actorFromProfile(actor),
        // Public API returns actors only — no repost timestamp per entry.
        repostedAt: new Date(0),
      })),
      cursor: res.data.cursor,
    };
  } catch (error) {
    console.error('Failed to fetch Bluesky reposts:', error);
    return { reposts: [] };
  }
}

/** Fetch quote posts for a post. */
export async function fetchQuotes(
  uri: string,
  opts: FetchReactionsOptions = {},
): Promise<{ quotes: PostQuote[]; cursor?: string }> {
  const agent = new AtpAgent({ service: PUBLIC_API });
  try {
    const res = await agent.app.bsky.feed.getQuotes({
      uri,
      limit: opts.limit ?? DEFAULT_LIMIT,
      cursor: opts.cursor,
    });
    return {
      quotes: res.data.posts.map(quoteFromPostView),
      cursor: res.data.cursor,
    };
  } catch (error) {
    console.error('Failed to fetch Bluesky quotes:', error);
    return { quotes: [] };
  }
}

/** Fetch engagement counts from the root post in a thread view. */
export async function fetchPostEngagement(uri: string): Promise<PostEngagement> {
  const agent = new AtpAgent({ service: PUBLIC_API });
  try {
    const res = await agent.app.bsky.feed.getPostThread({ uri, depth: 0 });
    const thread = res.data.thread;
    if (!AppBskyFeedDefs.isThreadViewPost(thread)) return {};
    const post = thread.post;
    return {
      likeCount: post.likeCount,
      repostCount: post.repostCount,
      quoteCount: post.quoteCount,
      replyCount: post.replyCount,
      bookmarkCount: post.bookmarkCount,
    };
  } catch (error) {
    console.error('Failed to fetch Bluesky post engagement:', error);
    return {};
  }
}
