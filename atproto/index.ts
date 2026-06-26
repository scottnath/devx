/** Public API for devx Astro sites. Everything else is internal. */
export type { AtprotoSyncConfig, Comment, FetchCommentsOptions } from './types.js';
export { fetchComments, countComments } from './comments.js';
export { generateDocumentLinkTag } from './verification.js';
