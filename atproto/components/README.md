# atproto/components/

Astro components that render a blog post and its Bluesky engagement. Consumers import them by path: `@scottnath/devx/atproto/components/BlogPost.astro`.

All data is fetched **at build time** in the component frontmatter and rendered as static HTML — there is no client-side JavaScript. A site must rebuild to pick up new likes or comments.

| Component | Renders | Key props |
|-----------|---------|-----------|
| `BlogPost.astro` | Article header and body (default slot), followed by all engagement sections | `title`, `date`, `description?`, `ogImage?`, `bskyPostUri?`, `canonicalUrl?`, `showEngagement?` (default `true`) |
| `BlogComments.astro` | Threaded replies to the announcement post | `bskyPostUri?`, `canonicalUrl?`, `maxDepth?` (3), `title?`, `showReplyLink?`, `showLikeCounts?`, `comments?` |
| `BlueskyLikes.astro` | Avatars of accounts that liked the post | `bskyPostUri?`, `likes?`, `title?` |
| `BlueskyReposts.astro` | Accounts that reposted | `bskyPostUri?`, `reposts?`, `title?` |
| `BlueskyQuotes.astro` | Quote posts | `bskyPostUri?`, `quotes?`, `title?` |
| `BlueskyUser.astro` | One account: avatar, name, handle, optional timestamp | `actor`, `timestamp?`, `timestampLabel?` |

Every component also accepts `class`.

## Conventions

- **Data override prop.** Each fetching component takes its data as an optional prop (`comments`, `likes`, `reposts`, `quotes`). When the prop is passed, nothing is fetched. Stories and tests always pass it, so Storybook never touches the network. Keep this pattern for new components.
- **Fetch failures do not fail the build.** Errors are caught, logged, and shown as a short message in place of the section.
- **No `bskyPostUri`, placeholder text.** A post that was never announced still renders each section, with a line such as "Likes appear after the post is synced to Bluesky." Pass `showEngagement={false}` to `BlogPost` to drop the sections.
- `_utils.ts` holds shared helpers (`formatRelativeTime`) and has its own test. The underscore keeps it out of the component namespace.

## Stories

Each component has a `*.stories.ts` beside it, using fixtures from [`test/helpers/bsky-users/`](../../test/README.md). They are loaded by the reference site's Storybook ([astro/.storybook/main.ts](../../astro/.storybook/main.ts)):

```bash
npm run storybook        # dev server on :6006
npm run build-storybook  # what CI checks
```

A new component needs a story; `build-storybook` is the only automated check that these `.astro` files compile.

Prop changes are public API: adding an optional prop is ✨, renaming or removing one is 💥.
