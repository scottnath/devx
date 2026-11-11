#!/usr/bin/env node
/**
 * Writes the commit message for a dependency update: one line per direct
 * dependency whose version differs between HEAD and the working tree.
 * Run after `ncu --doctor -u` (see docs/dependency-updates.md).
 *
 * release-notes.mjs parses the "- name: from → to" lines out of the commit
 * body, which is how the bumps reach the changelog.
 *
 *   node scripts/deps-commit-message.mjs [--emoji :boom:]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const SECTIONS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

/** One "- name: …" line per changed direct dependency, sorted by name. */
export function dependencyChangeLines(before, after) {
  const lines = new Map();
  for (const section of SECTIONS) {
    const from = before?.[section] ?? {};
    const to = after?.[section] ?? {};
    for (const name of new Set([...Object.keys(from), ...Object.keys(to)])) {
      if (from[name] === to[name]) continue;
      if (from[name] === undefined) lines.set(name, `- ${name}: added at ${to[name]}`);
      else if (to[name] === undefined) lines.set(name, `- ${name}: removed (was ${from[name]})`);
      else lines.set(name, `- ${name}: ${from[name]} → ${to[name]}`);
    }
  }
  return [...lines.keys()].sort((a, b) => a.localeCompare(b)).map((name) => lines.get(name));
}

/** Full commit message; the dependency block is omitted for a lockfile-only update. */
export function formatCommitMessage(before, after, emoji = ':arrow_up:') {
  const changes = dependencyChangeLines(before, after);
  const body = changes.length > 0 ? ['Dependencies:', ...changes, ''] : [];
  return [`${emoji} Update dependencies`, '', ...body, 'Verified: npm run verify', ''].join('\n');
}

if (import.meta.main) {
  const emojiFlag = process.argv.indexOf('--emoji');
  const emoji = emojiFlag === -1 ? undefined : process.argv[emojiFlag + 1];
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
  const before = JSON.parse(git('show', 'HEAD:package.json'));
  const after = JSON.parse(readFileSync('package.json', 'utf8'));
  const message = formatCommitMessage(before, after, emoji);
  const file = git('rev-parse', '--git-path', 'DEPS_COMMIT_MSG').trim();
  writeFileSync(file, message, 'utf8');
  console.log(`\n${message}\nCommit with:\n  git commit -a -F ${file}`);
}
