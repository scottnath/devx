import { AppBskyFeedDefs, AtpAgent } from '@atproto/api';
import type { AppBskyFeedPost } from '@atproto/api';
import { actorFromProfile } from './reactions.js';
import type { Comment, FetchCommentsOptions } from './types.js';

export type { Comment } from './types.js';

const PUBLIC_API = 'https://public.api.bsky.app';

/** Map a Bluesky post view to a {@link Comment}. */
function bskyPostToComment(post: AppBskyFeedDefs.PostView): Comment {
  const record = post.record as AppBskyFeedPost.Record;
  const postId = post.uri.split('/').pop();
  return {
    uri: post.uri,
    cid: post.cid,
    text: record.text ?? '',
    author: actorFromProfile(post.author),
    createdAt: new Date(record.createdAt ?? post.indexedAt),
    source: 'bluesky',
    sourceUrl: `https://bsky.app/profile/${post.author.handle}/post/${postId}`,
    parentUri: record.reply?.parent.uri,
    likeCount: post.likeCount,
    replyCount: post.replyCount,
    repostCount: post.repostCount,
    quoteCount: post.quoteCount,
    bookmarkCount: post.bookmarkCount,
  };
}

/** A node in a `getPostThread` response (any branch of the thread union). */
type ThreadNode =
  | AppBskyFeedDefs.ThreadViewPost
  | AppBskyFeedDefs.NotFoundPost
  | AppBskyFeedDefs.BlockedPost
  | { $type: string };

/** Flatten a thread view into comments, skipping the root post (depth 0). */
function processThread(node: ThreadNode, maxDepth: number, depth = 0): Comment[] {
  if (!AppBskyFeedDefs.isThreadViewPost(node) || depth > maxDepth) return [];
  const comments: Comment[] = [];
  if (depth > 0) comments.push(bskyPostToComment(node.post));
  for (const reply of node.replies ?? []) {
    comments.push(...processThread(reply, maxDepth, depth + 1));
  }
  return comments;
}

/** Fetch the reply thread for an announcement skeet as flat comments. */
async function fetchBlueskyReplies(postUri: string, maxDepth: number): Promise<Comment[]> {
  const agent = new AtpAgent({ service: PUBLIC_API });
  try {
    const res = await agent.app.bsky.feed.getPostThread({ uri: postUri, depth: maxDepth });
    return processThread(res.data.thread, maxDepth, 0);
  } catch (error) {
    console.error('Failed to fetch Bluesky replies:', error);
    return [];
  }
}

/**
 * Build a nested, chronologically-sorted comment tree from a flat list,
 * linking each comment to its parent by AT-URI.
 */
export function buildCommentTree(comments: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];
  for (const c of comments) map.set(c.uri, { ...c, replies: [] });
  for (const c of comments) {
    const node = map.get(c.uri)!;
    if (c.parentUri && map.has(c.parentUri)) {
      map.get(c.parentUri)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  }
  const sort = (list: Comment[]) => {
    list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    for (const c of list) if (c.replies?.length) sort(c.replies);
  };
  sort(roots);
  return roots;
}

/**
 * Fetch federated comments for a blog post: replies to its announcement skeet,
 * returned as a nested comment tree.
 *
 * URL mention search (`app.bsky.feed.searchPosts`) is not called here — that
 * endpoint returns 403 on `public.api.bsky.app` without authenticated App View.
 */
export async function fetchComments(options: FetchCommentsOptions): Promise<Comment[]> {
  const { bskyPostUri, maxDepth = 3, maxComments = 100 } = options;
  const all: Comment[] = [];
  if (bskyPostUri) all.push(...(await fetchBlueskyReplies(bskyPostUri, maxDepth)));
  return buildCommentTree(all.slice(0, maxComments));
}

/** Count every comment in a tree, including nested replies. */
export function countComments(tree: Comment[]): number {
  let n = 0;
  const walk = (list: Comment[]) => {
    for (const c of list) {
      n++;
      if (c.replies?.length) walk(c.replies);
    }
  };
  walk(tree);
  return n;
}
