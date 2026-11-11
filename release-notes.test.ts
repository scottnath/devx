import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import releaseConfig from './release-config.mjs';
import releaseConfigNpm from './release-config-npm.mjs';
import { dependencyLines } from './release-notes.mjs';
import { formatCommitMessage } from './scripts/deps-commit-message.mjs';

const require = createRequire(import.meta.url);
// Render through the real plugin internals so a plugin upgrade that breaks the template fails here.
const ReleaseNotes = require('semantic-release-gitmoji/lib/release-notes.js');
const getConfig = require('semantic-release-gitmoji/lib/helper/get-config.js');

type Commit = { subject: string; body?: string; hash?: string };

async function render(commits: Commit[], config = releaseConfig): Promise<string> {
  const [, pluginConfig] = config.plugins[0] as [string, object];
  const context = {
    options: { repositoryUrl: 'https://github.com/scottnath/devx.git' },
    commits: commits.map(({ subject, body = '', hash = 'abc1234def' }) => ({
      subject,
      body,
      message: `${subject}\n\n${body}`,
      hash,
      commit: { long: hash, short: hash.slice(0, 7) },
    })),
    lastRelease: { gitTag: 'v2.0.0' },
    nextRelease: { gitTag: 'v2.0.1', version: '2.0.1' },
  };
  const notes = new ReleaseNotes(context, getConfig(pluginConfig).releaseNotes);
  await notes.updateContext(context);
  return notes.toString();
}

const depsBody = formatCommitMessage(
  { dependencies: { astro: '7.3.4', '@atproto/api': '0.20.44', gone: '1.0.0' } },
  { dependencies: { astro: '7.4.10', '@atproto/api': '0.31.0', fresh: '2.0.0' } },
)
  .split('\n')
  .slice(2)
  .join('\n');

describe('dependencyLines', () => {
  it('extracts the lines written by scripts/deps-commit-message.mjs', () => {
    assert.deepEqual(dependencyLines(depsBody), [
      '`@atproto/api` 0.20.44 → 0.31.0',
      '`astro` 7.3.4 → 7.4.10',
      '`fresh` added at 2.0.0',
      '`gone` removed (was 1.0.0)',
    ]);
  });

  it('ignores prose, ordinary bullets and empty bodies', () => {
    assert.deepEqual(dependencyLines('Some context\n- a normal bullet\n- note: see docs'), []);
    assert.deepEqual(dependencyLines(''), []);
    assert.deepEqual(dependencyLines(undefined), []);
  });
});

describe('release notes template', () => {
  it('lists every bumped dependency under Dependency Updates', async () => {
    const notes = await render([{ subject: ':arrow_up: Update dependencies', body: depsBody }]);
    assert.match(notes, /^# \[v2\.0\.1\]\(https:\/\/github\.com\/scottnath\/devx\/compare\/v2\.0\.0\.\.\.v2\.0\.1\)/m);
    assert.match(notes, /## ⬆️ Dependency Updates\n- \[`abc1234`\]\(.+\) +Update dependencies/);
    assert.match(notes, /\n {4}- `astro` 7\.3\.4 → 7\.4\.10\n/);
    assert.match(notes, /\n {4}- `@atproto\/api` 0\.20\.44 → 0\.31\.0\n/);
    assert.match(notes, /\n {4}- `fresh` added at 2\.0\.0\n/);
    assert.match(notes, /\n {4}- `gone` removed \(was 1\.0\.0\)/);
    assert.doesNotMatch(notes, /Verified/);
  });

  it('accepts the raw emoji as well as the :code: form', async () => {
    const notes = await render([{ subject: '⬆️ Update dependencies', body: depsBody }]);
    assert.match(notes, /## ⬆️ Dependency Updates/);
    assert.match(notes, /`astro` 7\.3\.4 → 7\.4\.10/);
  });

  it('shows dependency lines on a breaking dependency release too', async () => {
    const notes = await render([{ subject: ':boom: Update dependencies', body: depsBody }]);
    assert.match(notes, /## 💥 Breaking Changes\n- .+Update dependencies/);
    assert.match(notes, /\n {4}- `astro` 7\.3\.4 → 7\.4\.10/);
    assert.doesNotMatch(notes, /Dependency Updates/);
  });

  it('keeps the standard sections and adds 🆕, ➕ and ➖ commits', async () => {
    const notes = await render([
      { subject: ':heavy_minus_sign: Drop left-pad' },
      { subject: ':heavy_plus_sign: Add commander' },
      { subject: ':lock: Patch token leak' },
      { subject: ':ambulance: Hotfix sync crash' },
      { subject: ':bug: Fix null handling' },
      { subject: ':new: Add quotes component' },
      { subject: ':sparkles: Add sync --post' },
      { subject: ':boom: Require Node 26' },
    ]);
    const headings = notes.match(/^## .+$/gm);
    assert.deepEqual(headings, [
      '## 💥 Breaking Changes',
      '## ✨ New Features',
      '## 🐛 Bug Fixes',
      '## 🚑 Critical Hotfixes',
      '## 🔒 Security Issues',
      '## ⬆️ Dependency Updates',
    ]);
    for (const subject of [
      'Require Node 26',
      'Add sync --post',
      'Add quotes component',
      'Fix null handling',
      'Hotfix sync crash',
      'Patch token leak',
      'Add commander',
      'Drop left-pad',
    ]) {
      assert.ok(notes.includes(subject), `missing "${subject}"`);
    }
  });

  it('omits empty sections', async () => {
    const notes = await render([{ subject: ':bug: Fix null handling' }]);
    assert.deepEqual(notes.match(/^## .+$/gm), ['## 🐛 Bug Fixes']);
  });

  it('is used by both presets', () => {
    for (const config of [releaseConfig, releaseConfigNpm]) {
      const [name, options] = config.plugins[0] as [string, { releaseNotes: { template: string } }];
      assert.equal(name, 'semantic-release-gitmoji');
      assert.match(options.releaseNotes.template, /Dependency Updates/);
    }
  });
});
