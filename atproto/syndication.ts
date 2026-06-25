import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { ComAtprotoRepoStrongRef } from '@atproto/api';
import type { AtprotoSyndication, SyndicationEntry } from './types.js';

const empty: AtprotoSyndication = { posts: {} };

/** Read the syndication tracking file, or an empty record if it doesn't exist. */
export function readSyndication(path: string): AtprotoSyndication {
  if (!existsSync(path)) return structuredClone(empty);
  return JSON.parse(readFileSync(path, 'utf8')) as AtprotoSyndication;
}

/** Write the syndication tracking file as pretty JSON. */
export function writeSyndication(path: string, data: AtprotoSyndication): void {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

/** Whether the given post path has already been announced. */
export function isSyndicated(data: AtprotoSyndication, postPath: string): boolean {
  return postPath in data.posts;
}

/** Strong ref to the announcement skeet for a post path, if any. */
export function syndicationRef(
  data: AtprotoSyndication,
  postPath: string,
): ComAtprotoRepoStrongRef.Main | undefined {
  const entry = data.posts[postPath];
  return entry ? { uri: entry.uri, cid: entry.cid } : undefined;
}

/** Record that a post path was announced with the given entry. */
export function recordSyndication(
  data: AtprotoSyndication,
  postPath: string,
  entry: SyndicationEntry,
): void {
  data.posts[postPath] = entry;
}
