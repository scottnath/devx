# ATProto engagement + shared Astro components — agent handoff

**Created:** 2026-06-26  
**Status:** Not started — implement in order below  
**Current devx release:** `@scottnath/devx@1.1.4`  
**Repos:** `devx` → release → `slacktivist.com` → deploy → `devx-template`

---

## Goal

1. Add Bluesky **liker / reposter / quote** fetchers to devx (Step 1).
2. Move blog ATProto **Astro components into devx** with Storybook stories.
3. Release devx, update **slacktivist.com** (remove duplicates, deploy), then **devx-template**.

---

## Background (from prior session)

### What works on `public.api.bsky.app` (no auth)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `app.bsky.feed.getPostThread` | Reply thread (comments) | ✅ Used by `fetchComments` |
| `app.bsky.feed.getLikes` | Who liked a post | ✅ Returns `likes[].actor` (ProfileView) |
| `app.bsky.feed.getRepostedBy` | Who reposted | ✅ Returns actors |
| `app.bsky.feed.getQuotes` | Quote posts | ✅ Returns full posts + authors |
| `app.bsky.feed.searchPosts` | URL mention search | ❌ **403** — do not use |

**Welcome skeet URI (test fixture):**  
`at://did:plc:oo5ar6gz52vqqgqhabc7jdqu/app.bsky.feed.post/3mp5yzyempz2g`

**DID:** `did:plc:oo5ar6gz52vqqgqhabc7jdqu`  
**Handle:** `slacktivist.com`

### What devx already has

- `atproto/comments.ts` — `fetchComments`, `countComments`
- `Comment` type includes `likeCount`, `replyCount` but **UI never renders them**
- `processThread` **skips depth 0** — announcement skeet (where teaser likes live) is discarded
- `searchPosts` removed in 1.1.4 (403 on public API)
- Public exports in `atproto/index.ts`: `fetchComments`, `countComments`, `generateDocumentLinkTag`, types

### What sites currently duplicate

| File | slacktivist | devx-template |
|------|-------------|---------------|
| `src/components/BlogComments.astro` | ✅ | ✅ (copy) |
| `src/layouts/BlogPost.astro` | ✅ | ✅ (copy) |

`BlogPost.astro` imports site-specific `Layout.astro`, reads `public/.well-known/atproto-did`, renders article + `<BlogComments>`.

---

## Phase 1 — devx data layer (Step 1)

**Location:** `devx/atproto/` (new file `reactions.ts` or extend `comments.ts`)

### Types (`atproto/types.ts`)

```ts
/** Shared actor shape for likes, reposts, comments, quotes */
export interface BlueskyActor {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  profileUrl: string; // https://bsky.app/profile/{handle}
}

export interface PostLike {
  actor: BlueskyActor;
  likedAt: Date;
}

export interface PostRepost {
  actor: BlueskyActor;
  repostedAt: Date;
}

export interface PostQuote {
  uri: string;
  text: string;
  author: BlueskyActor;
  quotedAt: Date;
  sourceUrl: string;
}

export interface PostEngagement {
  likeCount?: number;
  repostCount?: number;
  quoteCount?: number;
  replyCount?: number;
  bookmarkCount?: number;
}

export interface FetchReactionsOptions {
  limit?: number;   // default 50
  cursor?: string;
}
```

**Note:** Bookmarks are **count-only** on `PostView` — no public “who bookmarked” API.

### Functions to implement

All use `new AtpAgent({ service: 'https://public.api.bsky.app' })`.

| Export | API | Returns |
|--------|-----|---------|
| `fetchLikes(uri, opts?)` | `getLikes` | `{ likes: PostLike[]; cursor? }` |
| `fetchRepostedBy(uri, opts?)` | `getRepostedBy` | `{ reposts: PostRepost[]; cursor? }` |
| `fetchQuotes(uri, opts?)` | `getQuotes` | `{ quotes: PostQuote[]; cursor? }` |
| `fetchPostEngagement(uri)` | `getPostThread` depth=0 | `PostEngagement` from root `PostView` |

Helper: `actorFromProfile(profile)` → `BlueskyActor`.

### Extend existing comment work (optional in same PR)

- Add `repostCount`, `quoteCount`, `bookmarkCount` to `Comment` + `bskyPostToComment`
- Consider returning root skeet from `fetchComments` or use `fetchPostEngagement` in `BlogPost`

### Tests

- Mirror `comments.test.ts` + `test/helpers/atp-mock.ts` — add mock handlers for:
  - `/xrpc/app.bsky.feed.getLikes`
  - `/xrpc/app.bsky.feed.getRepostedBy`
  - `/xrpc/app.bsky.feed.getQuotes`
- Unit tests with fixtures; no live network in CI

### Export from `atproto/index.ts`

```ts
export { fetchLikes, fetchRepostedBy, fetchQuotes, fetchPostEngagement } from './reactions.js';
export type { BlueskyActor, PostLike, PostRepost, PostQuote, PostEngagement, FetchReactionsOptions } from './types.js';
```

---

## Phase 2 — Astro components in devx

**Location:** `devx/atproto/components/`

### Directory layout (target)

```
atproto/components/
  BlueskyUser.astro          # avatar + name + handle; link to profile
  BlueskyUser.stories.ts
  BlueskyLikes.astro         # list of likers via fetchLikes
  BlueskyLikes.stories.ts
  BlueskyReposts.astro
  BlueskyReposts.stories.ts
  BlueskyQuotes.astro
  BlueskyQuotes.stories.ts
  BlogComments.astro         # moved from sites; uses BlueskyUser
  BlogComments.stories.ts
  BlogPost.astro             # moved from sites; article + all engagement
  BlogPost.stories.ts
  _utils.ts                  # optional: formatRelativeTime shared helper
```

### Component design rules

1. **`BlueskyUser.astro`** — presentational; props: `actor: BlueskyActor`, optional `timestamp`, `timestampLabel` (e.g. “liked”, “replied”).

2. **Engagement components** (`BlueskyLikes`, `BlueskyReposts`, `BlueskyQuotes`):
   - Props: `bskyPostUri?: string`
   - **Storybook override props:** `likes?`, `reposts?`, `quotes?` — when provided, skip fetch (stories must not hit live API)
   - Fetch at Astro frontmatter build time when URI present
   - Render empty state when no URI / no data
   - Use `BlueskyUser` for each row

3. **`BlogComments.astro`** — port from slacktivist; replace inline author markup with `<BlueskyUser />`; optionally show per-comment `likeCount`.

4. **`BlogPost.astro`** — **must not import site `Layout.astro`**. Options (pick one):
   - **Recommended:** devx `BlogPost.astro` = article header + body slot + `BlueskyLikes` + `BlueskyReposts` + `BlueskyQuotes` + `BlogComments`. Site keeps thin `src/layouts/BlogPost.astro` wrapper that adds `Layout`, SEO, and `<link rel="atproto">` via `generateDocumentLinkTag`.
   - Props: `title`, `description?`, `date`, `ogImage?`, `bskyPostUri?`, `canonicalUrl?`, `atprotoDocumentLinkTag?` (pre-rendered HTML string or omit and pass `did` + `atprotoRkey`)

### Styles

- Co-locate `<style>` in each component (match existing slacktivist patterns)
- Use semantic class prefixes: `bluesky-user`, `bluesky-likes`, `blog-comments`, etc.

---

## Phase 3 — Storybook in devx

**File:** `devx/astro/.storybook/main.ts`

Current stories glob:
```ts
stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
```

**Add:**
```ts
stories: [
  '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  '../../atproto/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
],
```

**Story pattern** (see `astro/src/components/Welcome.stories.ts`):
```ts
import preview from '../../../astro/.storybook/preview';
import type { AstroComponentFactory } from '@storybook-astro/renderer/types';
import BlueskyLikes from './BlueskyLikes.astro';

const meta = preview.meta({
  title: 'ATProto/BlueskyLikes',
  component: BlueskyLikes as unknown as AstroComponentFactory,
});

export const WithMockLikes = meta.story({
  args: {
    likes: [{ actor: { did: '...', handle: 'alice.bsky.social', displayName: 'Alice', profileUrl: '...' }, likedAt: new Date() }],
  },
});
```

**Verify:**
```bash
cd devx && npm run storybook
cd devx && npm run build-storybook
```

---

## Phase 4 — Package exports

**File:** `devx/package.json`

Add exports so sites can import `.astro` files:

```json
"exports": {
  "./atproto": "./atproto/index.ts",
  "./atproto/components/*": "./atproto/components/*"
}
```

Ensure `files` includes `atproto` (already does).

**Site import example:**
```astro
import BlogComments from '@scottnath/devx/atproto/components/BlogComments.astro';
import BlueskyLikes from '@scottnath/devx/atproto/components/BlueskyLikes.astro';
```

Update `docs/atproto.md` — replace “copy BlogPost/BlogComments from template” with import-from-devx instructions.

---

## Phase 5 — devx QA, commit, release

```bash
cd devx
npm test
npm run typecheck
npm run build
npm run build-storybook
```

**Commit (gitmoji):**
```
✨ Add Bluesky engagement fetchers and shared ATProto components
```

Push to `main` → Release workflow → semantic-release (expect patch e.g. **1.1.5** or minor **1.2.0** if you consider components a feature).

Watch: `gh run watch <run-id> --repo scottnath/devx`

Confirm: `npm view @scottnath/devx version --registry=https://npm.pkg.github.com`

---

## Phase 6 — slacktivist.com

1. Bump `@scottnath/devx` to new version; `npm install`
2. **Remove** `src/components/BlogComments.astro`
3. **Replace** `src/layouts/BlogPost.astro` with thin wrapper:

```astro
---
import DevxBlogPost from '@scottnath/devx/atproto/components/BlogPost.astro';
import Layout from './Layout.astro';
import { generateDocumentLinkTag } from '@scottnath/devx/atproto';
// ... read did, entry props, documentLinkTag (same as today)
---
<Layout title={...} description={...} ogImagePath={...}>
  <Fragment slot="head">{documentLinkTag && <Fragment set:html={documentLinkTag} />}</Fragment>
  <DevxBlogPost
    title={...}
    date={...}
    bskyPostUri={...}
    canonicalUrl={...}
    ogImage={...}
  >
    <slot />
  </DevxBlogPost>
</Layout>
```

4. Update `.storybook/main.ts` if slacktivist had local BlogComments stories (unlikely)
5. `npm run typecheck && npm run build && npm run build-storybook`
6. Commit: `⬆️ Bump devx; use shared ATProto components`
7. Push → Publish workflow (ATProto sync + GitHub Pages)

**Secrets required (already configured):** `ATPROTO_APP_PASSWORD`, `ATP_IDENTIFIER`

---

## Phase 7 — devx-template

After slacktivist deploy succeeds:

1. Same bump + import pattern as slacktivist
2. Remove duplicate `BlogComments.astro`
3. Slim `BlogPost.astro` wrapper
4. Commit + push (template uses GitHub Pages at `scottnath.github.io/devx-template`)

---

## Pitfalls / decisions already made

| Topic | Decision |
|-------|----------|
| `searchPosts` for URL mentions | **Do not use** — 403 on public API |
| Who bookmarked | **Not available** — count only |
| “Did I like this?” | Needs auth — out of scope |
| Engagement freshness | Static at **build time** (same as comments); document in README |
| `.env` for local sync | Must live in **site repo root**, not devx |
| `tags` frontmatter | Use `.nullish()` in content schema; empty `tags:` is invalid in YAML |
| Bluesky embed on sync | `description` required on external embed (fixed in 1.1.3) |

---

## Acceptance checklist

- [ ] `fetchLikes`, `fetchRepostedBy`, `fetchQuotes`, `fetchPostEngagement` exported + tested
- [ ] All 6 Astro components + stories in `atproto/components/`
- [ ] Storybook shows ATProto component stories
- [ ] `package.json` exports for `.astro` imports
- [ ] devx released to GitHub Packages
- [ ] slacktivist uses devx components; duplicates removed; Publish green
- [ ] devx-template updated to match slacktivist pattern
- [ ] `docs/atproto.md` updated

---

## Quick test commands (live API, manual)

```bash
# Likes on welcome skeet
curl "https://public.api.bsky.app/xrpc/app.bsky.feed.getLikes?uri=at://did:plc:oo5ar6gz52vqqgqhabc7jdqu/app.bsky.feed.post/3mp5yzyempz2g&limit=10"

# Engagement counts on root post
curl "https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=at://did:plc:oo5ar6gz52vqqgqhabc7jdqu/app.bsky.feed.post/3mp5yzyempz2g&depth=0"
```

---

## Reference files (current)

| Path | Notes |
|------|-------|
| `devx/atproto/comments.ts` | Pattern for public API fetch |
| `devx/atproto/index.ts` | Public exports |
| `devx/test/helpers/atp-mock.ts` | Extend for new XRPC mocks |
| `devx/astro/.storybook/main.ts` | Add stories glob |
| `devx/astro/src/components/Welcome.stories.ts` | Story pattern |
| `slacktivist.com/src/components/BlogComments.astro` | Source to move |
| `slacktivist.com/src/layouts/BlogPost.astro` | Source to refactor |
| `slacktivist.com/src/content/blog/welcome.md` | Has `bskyPostUri` for testing |
