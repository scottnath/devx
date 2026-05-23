/**
 * Single source of truth for semantic-release-gitmoji release rules.
 * Used by release-config.mjs, release-config-npm.mjs, and scripts/extract-release-rules.mjs.
 */
import { gitmojis } from 'gitmojis';

export const MAJOR_EMOJIS = [':boom:'];
export const MINOR_EMOJIS = [':sparkles:', ':new:'];
export const EXTRA_PATCH_EMOJIS = [];

/** Curated patch subset for docs — full list (~100+) is too heavy for AI context */
export const PATCH_DOCS_SUBSET = [
  ':art:', ':zap:', ':fire:', ':bug:', ':memo:', ':rocket:',
  ':white_check_mark:', ':construction:', ':recycle:', ':heavy_plus_sign:',
  ':heavy_minus_sign:', ':alien:', ':wheelchair:', ':beers:', ':clown_face:',
  ':egg:', ':airplane:',
  ':wrench:',
  ':ambulance:',
  ':lock:',
  ':arrow_up:',
];

/** Metadata for codes not in gitmojis package */
export const EXTRA_META = new Map([
  [':new:', { emoji: '🆕', description: 'New feature or capability' }],
]);

const reservedEmojis = new Set([...MAJOR_EMOJIS, ...MINOR_EMOJIS]);
export const patchEmojis = [
  ...gitmojis.map((g) => g.code).filter((code) => !reservedEmojis.has(code))
  .filter((code) => PATCH_DOCS_SUBSET.includes(code)),
  ...EXTRA_PATCH_EMOJIS,
];

/** Release rules for semantic-release-gitmoji */
export const releaseRules = {
  major: MAJOR_EMOJIS,
  minor: MINOR_EMOJIS,
  patch: patchEmojis,
};
