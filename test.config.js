/**
 * Test config for @scottnath/devx. Tests live next to the files they cover
 * (e.g. atproto/sync.ts ↔ atproto/sync.test.ts).
 * Run with: node --import tsx test.config.js [--coverage]
 */
import { runNodeTests } from './test/helpers/test-runner.js';

runNodeTests({
  testDir: 'atproto',
  coverageExcludeGlobs: ['**/*.test.ts', '**/test/**'],
}).catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
