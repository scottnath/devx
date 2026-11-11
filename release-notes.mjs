/**
 * Release-notes (changelog) config shared by release-config.mjs and release-config-npm.mjs.
 *
 * Extends the semantic-release-gitmoji default template with:
 * - a "Dependency Updates" section (⬆️ ➕ ➖ commits), which the default template drops
 * - 🆕 commits under New Features (they trigger a minor release but were not listed)
 * - one nested bullet per dependency line found in a commit body, so the changelog
 *   says exactly which packages moved. scripts/deps-commit-message.mjs writes those lines.
 */

/** Matches the lines written by scripts/deps-commit-message.mjs (a trailing "(label)" is allowed). */
const DEPENDENCY_LINE =
  /^- (\S+): (?:(\S+) → (\S+)(?: \(([^)]+)\))?|added at (\S+)|removed \(was ([^)]+)\))\s*$/;

/**
 * Extract dependency changes from a commit body.
 * @param {string} [body]
 * @returns {string[]} markdown fragments, e.g. "`astro` 7.3.4 → 7.4.10 (minor)"
 */
export function dependencyLines(body = '') {
  return String(body ?? '')
    .split(/\r?\n/)
    .map((line) => DEPENDENCY_LINE.exec(line))
    .filter(Boolean)
    .map(([, name, from, to, label, added, removed]) => {
      if (added) return `\`${name}\` added at ${added}`;
      if (removed) return `\`${name}\` removed (was ${removed})`;
      return `\`${name}\` ${from} → ${to}${label ? ` (${label})` : ''}`;
    });
}

export const commitTemplate = `[\`{{commit.short}}\`](https://github.com/{{owner}}/{{repo}}/commit/{{commit.short}}) {{subject}} {{#if issues}}(Issues:{{#each issues}} [\`{{text}}\`]({{link}}){{/each}}){{/if}}{{#if wip}}{{#each wip}}
    - [\`{{commit.short}}\`](https://github.com/{{owner}}/{{repo}}/commit/{{commit.short}}) {{subject}}{{/each}}
{{/if}}{{#each (dependencyLines body)}}
    - {{{this}}}{{/each}}`;

const section = (title, key) => `{{#if ${key}}}
## ${title}
{{#each ${key}}}
- {{> commitTemplate}}
{{/each}}
{{/if}}
`;

export const template = `{{#if compareUrl}}
# [v{{nextRelease.version}}]({{compareUrl}}) ({{datetime "UTC:yyyy-mm-dd"}})
{{else}}
# v{{nextRelease.version}} ({{datetime "UTC:yyyy-mm-dd"}})
{{/if}}

{{#with commits}}
{{#if boom}}
## 💥 Breaking Changes
{{#each boom}}
- {{> commitTemplate}}
{{/each}}
{{/if}}

{{#if (any sparkles new)}}
## ✨ New Features
{{#each sparkles}}
- {{> commitTemplate}}
{{/each}}
{{#each new}}
- {{> commitTemplate}}
{{/each}}
{{/if}}

${section('🐛 Bug Fixes', 'bug')}
${section('🚑 Critical Hotfixes', 'ambulance')}
${section('🔒 Security Issues', 'lock')}
{{#if (any arrow_up heavy_plus_sign heavy_minus_sign)}}
## ⬆️ Dependency Updates
{{#each arrow_up}}
- {{> commitTemplate}}
{{/each}}
{{#each heavy_plus_sign}}
- {{> commitTemplate}}
{{/each}}
{{#each heavy_minus_sign}}
- {{> commitTemplate}}
{{/each}}
{{/if}}
{{/with}}`;

/** `releaseNotes` option for semantic-release-gitmoji. */
export const releaseNotes = {
  template,
  partials: { commitTemplate },
  helpers: {
    dependencyLines,
    /** True when any argument is a non-empty list (last arg is the Handlebars options object). */
    any: (...args) => args.slice(0, -1).some((list) => Array.isArray(list) && list.length > 0),
  },
};
