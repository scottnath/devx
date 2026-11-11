# atproto/

AT Protocol library for devx Astro sites. Publishes blog markdown to a PDS as [standard.site](https://standard.site/) documents, announces posts on Bluesky, and fetches engagement (comments, likes, reposts, quotes) for display at build time.

- **Consumer guide:** [docs/atproto.md](../docs/atproto.md) — setup, config, CI.
- **Why it is built this way:** [docs/history/atproto.md](../docs/history/atproto.md).
- **Only runtime dependency:** `@atproto/api` (plus `@atproto/common-web`, `dotenv`).

## Public API

Exported as `@scottnath/devx/atproto` from [`index.ts`](index.ts). **Anything not re-exported there is internal** and can change freely.

| Export | From | Purpose |
|--------|------|---------|
| `fetchComments`, `countComments` | `comments.ts` | Reply thread under a post's Bluesky announcement, as a tree |
| `fetchLikes`, `fetchRepostedBy`, `fetchQuotes`, `fetchPostEngagement`, `actorFromProfile` | `reactions.ts` | Engagement lists for a post URI |
| `generateDocumentLinkTag` | `verification.ts` | `<link rel="site.standard.document">` tag for a post's `<head>` |
| Types: `AtprotoSyncConfig`, `Comment`, `PostEngagement`, `PostLike`, `PostQuote`, `PostRepost`, `BlueskyActor`, `FetchCommentsOptions`, `FetchReactionsOptions` | `types.ts` | |

The sync itself is reached through the CLI ([cli/README.md](../cli/README.md)), not this entry point. Components are in [components/](components/README.md).

## Files

| File | Responsibility |
|------|----------------|
| `sync.ts` | `syncToAtproto` — the whole publish run. Start here |
| `client.ts` | `AtprotoClient` — login, publication and document record CRUD on the PDS |
| `publication.ts` | Build, find, create and update the `site.standard.publication` record (icon blob, theme, labels) |
| `posts.ts` | Load blog files from `contentDir`; slug → rkey; content hash |
| `frontmatter.ts` | Minimal YAML frontmatter parse/stringify; writes sync results back into posts |
| `transform.ts` | Markdown → plain text; relative links → absolute |
| `crosspost.ts` | Bluesky announcement post with link-card embed and thumbnail |
| `state.ts` | Read/write `atproto-state.json` (content hashes, rkeys) |
| `syndication.ts` | Read/write `atproto-syndication.json` (which posts were announced) |
| `verification.ts` | `.well-known` files and the document link tag |
| `comments.ts`, `reactions.ts` | Read-only public Bluesky API calls (no login) |
| `types.ts` | Every shared type. Config fields are documented here |

## How a sync run works

`syncToAtproto(config, args)` in `sync.ts`:

1. Resolve paths and credentials (`ATPROTO_APP_PASSWORD`, `ATP_IDENTIFIER` or `config.identifier`). A dry run needs neither and never logs in.
2. Log in, ensure the publication record exists and matches config, write `public/.well-known/site.standard.publication`.
3. Load posts. For each non-draft post:
   - If it has never been announced and crossposting is on, create the Bluesky post and record it in the syndication file.
   - If the content hash is unchanged (and no `--force`), mark `unchanged` and move on.
   - Otherwise create or update the `site.standard.document` record, then write `atprotoUri`, `atprotoRkey`, `bskyPostUri` into the post's frontmatter.
4. With `--delete`, remove remote documents that have no local post.
5. Write the state file.

A failure on one post is recorded as an `error` result and the run continues; the CLI exits 1 if any post errored.

## Working in here

- Tests sit beside each file (`sync.ts` ↔ `sync.test.ts`). Run `npm test`.
- No network in tests. [`test/helpers/atp-mock.ts`](../test/helpers/atp-mock.ts) replaces `fetch` with lexicon-valid responses, so the real `@atproto/api` client code runs — this is what catches breakage when `@atproto/api` is updated.
- `@atproto/api` is `0.x`: any minor bump may break. After updating it, run the tests and read its changelog for lexicon changes.
- Adding to the public API means exporting from `index.ts`, documenting it in `docs/atproto.md`, and using ✨. Changing or removing an export, a config field, or a frontmatter field is 💥.
