#!/usr/bin/env node
/**
 * Extracts release rules from release-rules.mjs and generates gitmoji-rules.md.
 * Run from package root: node scripts/extract-release-rules.mjs
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gitmojis } from 'gitmojis';
import { releaseRules, PATCH_DOCS_SUBSET, EXTRA_META } from '../release-rules.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DOCS_DIR = join(ROOT, 'docs');

const codeToMeta = new Map(gitmojis.map((g) => [g.code, { emoji: g.emoji, description: g.description }]));
function getMeta(code) {
  return codeToMeta.get(code) ?? EXTRA_META.get(code) ?? { emoji: '❓', description: code };
}

function row(code, releaseType, whenToUse = '') {
  const meta = getMeta(code);
  const emoji = meta.emoji;
  const desc = whenToUse || meta.description;
  return `| ${emoji} | \`${code}\` | **${releaseType}** | ${whenToUse || desc} |`;
}

function table(codes, releaseType, whenColumn = 'When to use') {
  const header = `| Emoji | Code | Release type | ${whenColumn} |`;
  const sep = '|-------|------|--------------|-------|';
  const rows = codes.map((code) => row(code, releaseType));
  return [header, sep, ...rows].join('\n');
}

const majorTable = table(releaseRules.major, 'major', 'When to use');
const minorTable = table(releaseRules.minor, 'minor', 'When to use');
const patchTable = table(PATCH_DOCS_SUBSET, 'patch', 'When to use');

const md = `# Gitmoji release rules

Auto-generated from \`@scottnath/devx\` release config. Used by semantic-release.

## Format

\`\`\`
<emoji> Short description

Optional body

Optional footer (e.g. issue refs: #123)
\`\`\`

Use either the raw emoji character or the \`:code:\` shorthand — both are valid.

## Major

${majorTable}

## Minor

${minorTable}

## Patch

${patchTable}

*Other gitmojis also trigger patch — this table shows common ones.*

## Reserved (do not use manually)

| Emoji | Code | Notes |
|-------|------|-------|
| 🔖 | \`:bookmark:\` | Created by semantic-release for version tags |
`;

const emojiSection = `
### Major

${majorTable}

### Minor

${minorTable}

### Patch

${patchTable}

*Other gitmojis also trigger patch — this table shows common ones.*

### Reserved (do not use manually)

| Emoji | Code | Notes |
|-------|------|-------|
| 🔖 | \`:bookmark:\` | Created by semantic-release for version tags |
`.trim();

mkdirSync(DOCS_DIR, { recursive: true });
writeFileSync(join(DOCS_DIR, 'gitmoji-rules.md'), md, 'utf8');
console.log('Wrote docs/gitmoji-rules.md');

const templatePath = join(DOCS_DIR, 'how-to-write-a-commit.template.md');
const template = readFileSync(templatePath, 'utf8');
const markerStart = '<!-- EMOJI_SECTION_START -->';
const markerEnd = '<!-- EMOJI_SECTION_END -->';
const replaced = template.replace(
  new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}`, 'g'),
  `${markerStart}\n${emojiSection}\n${markerEnd}`
);
writeFileSync(join(DOCS_DIR, 'how-to-write-a-commit.md'), replaced, 'utf8');
console.log('Wrote docs/how-to-write-a-commit.md');
