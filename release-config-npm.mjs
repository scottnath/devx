import { releaseNotes } from './release-notes.mjs';
import { releaseRules } from './release-rules.mjs';

/** @type {import('semantic-release').GlobalConfig} */
export default {
  branches: ['main'],
  plugins: [
    ['semantic-release-gitmoji', { releaseRules, releaseNotes }],
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    '@semantic-release/npm',
    '@semantic-release/github',
  ],
};
