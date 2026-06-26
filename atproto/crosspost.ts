import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { RichText, type AtpAgent } from '@atproto/api';
import type { CrosspostInput, CrosspostResult } from './types.js';

/** Resolve a thumb path relative to `cwd`, or return `undefined` when unset. */
export function resolveThumbPath(cwd: string, path?: string): string | undefined {
  if (!path) return undefined;
  return resolve(cwd, path);
}

/** Bluesky posts cap at 300 graphemes; truncate with an ellipsis if longer. */
export function skeetText(text: string): string {
  return text.length <= 300 ? text : `${text.slice(0, 297)}…`;
}

/**
 * Create a Bluesky "teaser" skeet that links to an article via an external
 * embed card. The skeet doubles as the comment thread for the post.
 * @returns A strong ref (uri + cid) to the created skeet.
 */
export async function createBlueskyTeaser(
  agent: AtpAgent,
  did: string,
  input: CrosspostInput,
): Promise<CrosspostResult> {
  const external: Record<string, unknown> = {
    uri: input.url,
    title: input.title,
  };

  if (input.thumbPath && existsSync(input.thumbPath)) {
    const bytes = readFileSync(input.thumbPath);
    const mime = input.thumbPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const uploaded = await agent.uploadBlob(bytes, { encoding: mime });
    external.thumb = uploaded.data.blob;
  }

  const rt = new RichText({ text: input.text });
  await rt.detectFacets(agent);

  const res = await agent.com.atproto.repo.createRecord({
    repo: did,
    collection: 'app.bsky.feed.post',
    record: {
      $type: 'app.bsky.feed.post',
      text: rt.text,
      facets: rt.facets,
      createdAt: new Date().toISOString(),
      embed: {
        $type: 'app.bsky.embed.external',
        external,
      },
    },
  });

  return { uri: res.data.uri, cid: res.data.cid };
}
