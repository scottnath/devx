import 'dotenv/config';
import { resolve } from 'node:path';
import type { ComAtprotoRepoStrongRef } from '@atproto/api';
import { AtprotoClient } from './client.js';
import { createBlueskyTeaser, resolveThumbPath, skeetText } from './crosspost.js';
import { updatePostFrontmatter } from './frontmatter.js';
import { loadBlogPosts, slugToRkey } from './posts.js';
import { readState, writeState } from './state.js';
import {
  isSyndicated,
  readSyndication,
  recordSyndication,
  syndicationRef,
  writeSyndication,
} from './syndication.js';
import type {
  AtprotoSyncConfig,
  BlogPost,
  DocumentInput,
  SyncArgs,
  SyncResult,
} from './types.js';
import { writePublicationWellKnown } from './verification.js';

/** Resolve after `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Map a loaded post to a document record payload. */
function postToDocument(
  post: BlogPost,
  publicationAtUri: string,
  bskyPostRef?: ComAtprotoRepoStrongRef.Main,
): DocumentInput {
  return {
    site: publicationAtUri,
    title: post.frontmatter.title,
    publishedAt: post.frontmatter.date.toISOString(),
    path: post.postPath,
    description: post.frontmatter.description,
    tags: post.frontmatter.tags,
    textContent: post.textContent,
    markdown: post.markdown,
    bskyPostRef,
  };
}

/** Pick the document rkey: frontmatter override → state → slug-derived. */
function resolveRkey(post: BlogPost, stateRkey?: string): string {
  return post.frontmatter.atprotoRkey ?? stateRkey ?? slugToRkey(post.slug);
}

/**
 * Workflow A: publish local markdown posts to the PDS as `site.standard.document`
 * records, optionally announcing each on Bluesky for comments, and write state
 * and frontmatter back. Honors dry-run, force, single-post, and delete modes.
 * @returns Per-post results describing what changed.
 */
export async function syncToAtproto(
  config: AtprotoSyncConfig,
  args: SyncArgs,
): Promise<SyncResult[]> {
  const cwd = process.cwd();
  const siteUrl = config.siteUrl.replace(/\/$/, '');
  const contentDir = resolve(cwd, config.contentDir);
  const statePath = resolve(cwd, config.statePath ?? 'atproto-state.json');
  const syndicationPath = resolve(cwd, config.syndicationPath ?? 'atproto-syndication.json');
  const wellKnownDir = resolve(cwd, config.wellKnownDir ?? 'public/.well-known');
  const crossPostEnabled = process.env.BLUESKY_CROSSPOST !== '0';

  const appPassword = process.env.ATPROTO_APP_PASSWORD;
  const identifier = config.identifier ?? process.env.ATP_IDENTIFIER ?? process.env.ATPROTO_IDENTIFIER;

  if (!args.dryRun) {
    if (!appPassword) {
      throw new Error('Missing ATPROTO_APP_PASSWORD (create at https://bsky.app/settings/app-passwords)');
    }
    if (!identifier) {
      throw new Error('Missing identifier: set ATP_IDENTIFIER env or atproto.config.ts identifier');
    }
  } else if (!identifier) {
    console.warn('DRY RUN: set ATP_IDENTIFIER to preview login target');
  }

  let client: AtprotoClient | null = null;
  if (identifier && appPassword && !args.dryRun) {
    console.log(`Logging in as ${identifier}…`);
    client = await AtprotoClient.login(identifier, appPassword);
    console.log(`  DID: ${client.did}`);
  } else if (args.dryRun) {
    console.log(`Would log in as ${identifier ?? '(set ATP_IDENTIFIER)'}`);
  }

  const results: SyncResult[] = [];
  const state = readState(statePath);
  const syndication = readSyndication(syndicationPath);

  let publicationAtUri: string;
  if (client) {
    publicationAtUri = await client.ensurePublication({
      url: siteUrl,
      name: config.publication.name,
      description: config.publication.description,
    });
    console.log(`Publication: ${publicationAtUri}`);
    writePublicationWellKnown(wellKnownDir, publicationAtUri);
  } else {
    publicationAtUri = state?.publicationAtUri ?? `at://did:plc:example/site.standard.publication/self`;
    console.log(`Would ensure publication for ${siteUrl}`);
    console.log(`Would write ${wellKnownDir}/site.standard.publication`);
  }

  let posts = await loadBlogPosts(contentDir, config.postPathPrefix, siteUrl);
  console.log(`Found ${posts.length} posts in ${config.contentDir}`);

  if (args.postSlug) {
    posts = posts.filter((p) => p.slug === args.postSlug || p.slug.endsWith(`/${args.postSlug}`));
    if (posts.length === 0) throw new Error(`Post not found: ${args.postSlug}`);
  }

  const existingDocs = args.dryRun || args.force || !client ? [] : await client.listDocuments();
  const existingByPath = new Map(existingDocs.map((d) => [d.path, d]));
  const existingByRkey = new Map(existingDocs.map((d) => [d.rkey, d]));

  const newHashes: Record<string, string> = { ...(state?.contentHashes ?? {}) };
  const documentRkeys: Record<string, string> = { ...(state?.documentRkeys ?? {}) };

  for (const post of posts) {
    if (post.frontmatter.draft) {
      console.log(`  skip ${post.slug} (draft)`);
      results.push({ slug: post.slug, action: 'skipped' });
      continue;
    }

    const hashChanged = state?.contentHashes[post.postPath] !== post.contentHash;
    const stateRkey = documentRkeys[post.postPath];
    const rkey = resolveRkey(post, stateRkey);
    const needsAnnouncement =
      crossPostEnabled &&
      post.frontmatter.crosspost !== false &&
      !isSyndicated(syndication, post.postPath) &&
      !post.frontmatter.bskyPostUri;

    let bskyRef = syndicationRef(syndication, post.postPath);

    try {
      if (needsAnnouncement && client) {
        const url = `${siteUrl}${post.postPath}/`;
        const thumbPath =
          resolveThumbPath(cwd, post.frontmatter.ogImage) ??
          resolveThumbPath(cwd, config.defaultOgPath);
        const summary = post.frontmatter.description || post.frontmatter.title;
        const skeet = await createBlueskyTeaser(client.getAgent(), client.did, {
          text: skeetText(summary),
          url,
          title: post.frontmatter.title,
          description: summary,
          thumbPath,
        });
        bskyRef = { uri: skeet.uri, cid: skeet.cid };
        recordSyndication(syndication, post.postPath, {
          uri: skeet.uri,
          cid: skeet.cid,
          syndicatedAt: new Date().toISOString(),
        });
        console.log(`  bluesky: ${post.slug} → ${skeet.uri}`);
      } else if (needsAnnouncement && args.dryRun) {
        console.log(`  would announce ${post.slug} on Bluesky (for comments)`);
      }

      const crossPostJustCreated = needsAnnouncement && !!client;
      if (!hashChanged && !args.force && !crossPostJustCreated) {
        const syndUri = syndicationRef(syndication, post.postPath)?.uri;
        if (client && syndUri && !post.frontmatter.bskyPostUri) {
          updatePostFrontmatter(post.filePath, { bskyPostUri: syndUri });
        }
        results.push({ slug: post.slug, action: 'unchanged', uri: post.frontmatter.atprotoUri });
        continue;
      }

      const existingDoc = existingByPath.get(post.postPath) ?? existingByRkey.get(rkey);
      if (!bskyRef && existingDoc?.bskyPostRef) bskyRef = existingDoc.bskyPostRef;

      const doc = postToDocument(post, publicationAtUri, bskyRef);
      let resultUri: string | undefined;
      let resultRkey: string | undefined;

      if (existingDoc && !args.force) {
        console.log(`  update ${post.slug}`);
        if (client) {
          resultUri = await client.putDocument(existingDoc.rkey, doc);
          resultRkey = existingDoc.rkey;
          documentRkeys[post.postPath] = existingDoc.rkey;
          newHashes[post.postPath] = post.contentHash;
          results.push({ slug: post.slug, action: 'updated', uri: resultUri });
        } else {
          results.push({ slug: post.slug, action: 'updated', uri: existingDoc.uri });
        }
      } else if (stateRkey || post.frontmatter.atprotoRkey) {
        console.log(`  create ${post.slug} (put ${rkey})`);
        if (client) {
          resultUri = await client.putDocument(rkey, doc);
          resultRkey = rkey;
          documentRkeys[post.postPath] = rkey;
          newHashes[post.postPath] = post.contentHash;
          results.push({ slug: post.slug, action: 'created', uri: resultUri });
          console.log(`    ${resultUri}`);
        } else {
          results.push({ slug: post.slug, action: 'created' });
        }
      } else {
        console.log(`  create ${post.slug}`);
        if (client) {
          const created = await client.createDocument(doc);
          resultUri = created.uri;
          resultRkey = created.rkey;
          documentRkeys[post.postPath] = created.rkey;
          newHashes[post.postPath] = post.contentHash;
          results.push({ slug: post.slug, action: 'created', uri: resultUri });
          console.log(`    ${resultUri}`);
        } else {
          results.push({ slug: post.slug, action: 'created' });
        }
      }

      if (client && resultUri && resultRkey) {
        updatePostFrontmatter(post.filePath, {
          atprotoUri: resultUri,
          atprotoRkey: resultRkey,
          bskyPostUri: bskyRef?.uri ?? post.frontmatter.bskyPostUri,
        });
      } else if (client && bskyRef && crossPostJustCreated) {
        updatePostFrontmatter(post.filePath, { bskyPostUri: bskyRef.uri });
      }

      if (client) await sleep(100);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  error ${post.slug}: ${message}`);
      results.push({ slug: post.slug, action: 'error', error: message });
    }
  }

  if (args.delete && !args.postSlug && client) {
    const localPaths = new Set(posts.map((p) => p.postPath));
    for (const doc of existingDocs) {
      if (doc.path && !localPaths.has(doc.path)) {
        console.log(`  delete ${doc.path}`);
        await client.deleteDocument(doc.rkey);
        results.push({ slug: doc.path, action: 'deleted' });
      }
    }
  }

  if (client) {
    writeState(statePath, {
      did: client.did,
      publicationAtUri,
      contentHashes: newHashes,
      documentRkeys,
    });
    if (crossPostEnabled) writeSyndication(syndicationPath, syndication);
  }

  return results;
}

/** Print an aggregated count of sync results to the console. */
export function printSummary(results: SyncResult[], dryRun: boolean): void {
  const counts = {
    created: results.filter((r) => r.action === 'created').length,
    updated: results.filter((r) => r.action === 'updated').length,
    unchanged: results.filter((r) => r.action === 'unchanged').length,
    skipped: results.filter((r) => r.action === 'skipped').length,
    deleted: results.filter((r) => r.action === 'deleted').length,
    errors: results.filter((r) => r.action === 'error').length,
  };

  console.log('\nSummary');
  console.log(`  created:   ${counts.created}`);
  console.log(`  updated:   ${counts.updated}`);
  console.log(`  unchanged: ${counts.unchanged}`);
  console.log(`  skipped:   ${counts.skipped}`);
  console.log(`  deleted:   ${counts.deleted}`);
  console.log(`  errors:    ${counts.errors}`);
  if (dryRun) console.log('  (dry run — no changes written)');
}
