/**
 * Shared types for the devx atproto module — the single source of truth for
 * devx-specific shapes. Anything that already exists in `@atproto/api` is
 * imported from there (e.g. strong refs, profile views) rather than redefined.
 */
import type { AppBskyActorDefs, ComAtprotoRepoStrongRef } from '@atproto/api';

/** Publication metadata for a `site.standard.publication` record. */
export interface AtprotoPublicationConfig {
  /** Human-readable name of the publication. */
  name: string;
  /** Optional publication description. */
  description?: string;
}

/** Consumer-supplied configuration for {@link syncToAtproto} (Workflow A). */
export interface AtprotoSyncConfig {
  /** Canonical site URL, e.g. `https://slacktivist.com`. */
  siteUrl: string;
  /** ATProto handle or DID. Falls back to the `ATP_IDENTIFIER` env var. */
  identifier?: string;
  /** Directory of blog markdown/mdx files (relative to cwd). */
  contentDir: string;
  /** URL path prefix for posts, e.g. `/blog` → `/blog/my-post`. */
  postPathPrefix: string;
  /** Publication record details. */
  publication: AtprotoPublicationConfig;
  /** Path to the sync state file (relative to cwd). */
  statePath?: string;
  /** Path to the syndication tracking file (relative to cwd). */
  syndicationPath?: string;
  /** Directory for `.well-known` static files (relative to cwd). */
  wellKnownDir?: string;
  /** Optional OG/thumbnail image for Bluesky crosspost embeds. */
  defaultOgPath?: string;
}

/** Parsed CLI flags controlling a sync run. */
export interface SyncArgs {
  /** Preview changes without writing to the PDS or disk. */
  dryRun: boolean;
  /** Re-publish every post regardless of content hash. */
  force: boolean;
  /** Limit the run to a single post slug. */
  postSlug?: string;
  /** Delete remote documents that no longer exist locally. */
  delete: boolean;
}

/** Outcome of syncing a single post. */
export interface SyncResult {
  /** Post slug (or remote path for deletions). */
  slug: string;
  /** What happened to this post during the run. */
  action: 'created' | 'updated' | 'skipped' | 'deleted' | 'unchanged' | 'error';
  /** AT-URI of the resulting document, when known. */
  uri?: string;
  /** Error message when `action` is `'error'`. */
  error?: string;
}

/** Persisted sync state, keyed by post path, used for idempotent runs. */
export interface AtprotoState {
  /** DID of the authenticated repo. */
  did: string;
  /** AT-URI of the site's `site.standard.publication` record. */
  publicationAtUri: string;
  /** Map of post path → content hash of the last published version. */
  contentHashes: Record<string, string>;
  /** Map of post path → document rkey on the PDS. */
  documentRkeys: Record<string, string>;
}

/**
 * A syndicated Bluesky announcement: a strong ref to the skeet plus when it
 * was created. Augments `com.atproto.repo.strongRef` rather than redefining it.
 */
export interface SyndicationEntry extends ComAtprotoRepoStrongRef.Main {
  /** ISO timestamp of when the announcement skeet was created. */
  syndicatedAt: string;
}

/** Local record of which posts have been announced on Bluesky, keyed by post path. */
export interface AtprotoSyndication {
  /** Map of post path → syndication entry. */
  posts: Record<string, SyndicationEntry>;
}

/** Frontmatter fields read from a blog markdown/mdx file. */
export interface BlogPostFrontmatter {
  /** Post title. */
  title: string;
  /** Optional short description / summary. */
  description?: string;
  /** Publish date. */
  date: Date;
  /** Optional tags. */
  tags?: string[];
  /** When `true`, the post is skipped during sync. */
  draft?: boolean;
  /** Set to `false` to opt out of the Bluesky announcement. */
  crosspost?: boolean;
  /** AT-URI of the published `site.standard.document` (written back by sync). */
  atprotoUri?: string;
  /** Document rkey on the PDS (written back by sync). */
  atprotoRkey?: string;
  /** AT-URI of the Bluesky announcement skeet (written back by sync). */
  bskyPostUri?: string;
}

/** A blog post loaded from disk, ready to publish. */
export interface BlogPost {
  /** Path-based slug relative to the content dir (e.g. `nested/post`). */
  slug: string;
  /** Absolute path to the source file. */
  filePath: string;
  /** Site-relative URL path, e.g. `/blog/nested/post`. */
  postPath: string;
  /** Parsed frontmatter. */
  frontmatter: BlogPostFrontmatter;
  /** Raw markdown body (frontmatter stripped). */
  body: string;
  /** SHA-256 hash of the full source file, used to detect changes. */
  contentHash: string;
  /** Markdown with root-relative links resolved to absolute URLs. */
  markdown: string;
  /** Plain-text rendering of the markdown for `textContent`. */
  textContent: string;
}

/** Input for creating/ensuring a `site.standard.publication` record. */
export interface PublicationInput {
  /** Canonical site URL. */
  url: string;
  /** Publication name. */
  name: string;
  /** Optional description. */
  description?: string;
}

/** A publication record summary returned when listing publications. */
export interface PublicationSummary {
  /** AT-URI of the publication record. */
  uri: string;
  /** Canonical site URL stored on the record. */
  url: string;
}

/** Input for creating/updating a `site.standard.document` record. */
export interface DocumentInput {
  /** AT-URI of the parent publication. */
  site: string;
  /** Document title. */
  title: string;
  /** Site-relative URL path. */
  path: string;
  /** ISO publish timestamp. */
  publishedAt: string;
  /** Optional description. */
  description?: string;
  /** Optional tags. */
  tags?: string[];
  /** Plain-text body. */
  textContent: string;
  /** Markdown body. */
  markdown: string;
  /** Optional strong ref to the Bluesky announcement skeet. */
  bskyPostRef?: ComAtprotoRepoStrongRef.Main;
}

/** A `site.standard.document` record as stored on the PDS. */
export interface StoredDocument {
  /** AT-URI of the document record. */
  uri: string;
  /** Document rkey. */
  rkey: string;
  /** Site-relative URL path, if present on the record. */
  path?: string;
  /** Strong ref to the Bluesky announcement skeet, if present. */
  bskyPostRef?: ComAtprotoRepoStrongRef.Main;
}

/** Result of creating a document: its AT-URI and parsed rkey. */
export interface CreatedDocument {
  /** AT-URI of the new document. */
  uri: string;
  /** Parsed rkey of the new document. */
  rkey: string;
}

/**
 * Minimal DID document shape — only the `service` entries we read to discover a
 * PDS endpoint. (`@atproto/api` does not export a DID document type.)
 */
export interface DidDocument {
  /** Declared services, including the `#atproto_pds` endpoint. */
  service?: Array<{
    id?: string;
    type?: string;
    serviceEndpoint?: string;
  }>;
}

/** Input for {@link createBlueskyTeaser}. */
export interface CrosspostInput {
  /** Skeet text (the announcement copy). */
  text: string;
  /** Canonical URL of the article being announced. */
  url: string;
  /** Article title, used for the external embed card. */
  title: string;
  /** Optional path to a local thumbnail image for the embed. */
  thumbPath?: string;
}

/** Strong ref to a created Bluesky skeet (its AT-URI and CID). */
export type CrosspostResult = ComAtprotoRepoStrongRef.Main;

/** A federated comment derived from a Bluesky post. */
export interface Comment {
  /** AT-URI of the source post. */
  uri: string;
  /** CID of the source post. */
  cid: string;
  /** Post text. */
  text: string;
  /** Author profile (subset of `app.bsky.actor.defs#profileViewBasic`). */
  author: Pick<AppBskyActorDefs.ProfileViewBasic, 'did' | 'handle' | 'displayName' | 'avatar'>;
  /** When the post was created. */
  createdAt: Date;
  /** Origin network. */
  source: 'bluesky';
  /** Public URL to the post on bsky.app. */
  sourceUrl: string;
  /** AT-URI of the parent post, when this is a reply. */
  parentUri?: string;
  /** Like count, if available. */
  likeCount?: number;
  /** Reply count, if available. */
  replyCount?: number;
  /** Nested replies (populated by {@link buildCommentTree}). */
  replies?: Comment[];
}

/** Options for {@link fetchComments}. */
export interface FetchCommentsOptions {
  /** AT-URI of the announcement skeet whose replies become comments. */
  bskyPostUri?: string;
  /** Canonical article URL; matching posts are pulled in as mentions. */
  canonicalUrl?: string;
  /** Maximum reply depth to traverse. Default `3`. */
  maxDepth?: number;
  /** Maximum number of comments to return. Default `100`. */
  maxComments?: number;
}
