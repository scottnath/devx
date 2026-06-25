/**
 * Reusable native Node.js test runner. Discovers test files and runs them with
 * the built-in `node:test` runner and spec reporter — no Jest/Vitest.
 *
 * Consume from another repo (after installing `@scottnath/devx`):
 *
 *   // test.config.js
 *   import { runNodeTests } from '@scottnath/devx/test-runner';
 *   runNodeTests({ testDir: 'src' });
 *
 * Run with: node --import tsx test.config.js [--coverage]
 */
import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const DEFAULT_IGNORE = ['node_modules', 'dist', '.git'];

/**
 * Recursively collect test files under `dir`.
 * @param {string} dir
 * @param {{ suffix?: string, ignore?: string[] }} [options]
 * @returns {Promise<string[]>}
 */
export async function findTestFiles(dir, options = {}) {
  const { suffix = '.test.ts', ignore = DEFAULT_IGNORE } = options;
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignore.includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findTestFiles(path, { suffix, ignore })));
    } else if (entry.name.endsWith(suffix)) {
      files.push(path);
    }
  }
  return files;
}

/**
 * @typedef {object} RunNodeTestsConfig
 * @property {string | string[]} [testDir] Directory (or directories) to scan. Default: `'.'`.
 * @property {string} [suffix] Test file suffix. Default: `'.test.ts'`.
 * @property {number} [timeout] Per-test timeout in ms. Default: `30000`.
 * @property {boolean} [concurrency] Run files concurrently. Default: `true`.
 * @property {boolean} [coverage] Collect coverage. Default: `--coverage` in argv.
 * @property {string[]} [coverageExcludeGlobs] Globs excluded from coverage.
 * @property {string[]} [ignore] Directory names to skip while scanning.
 */

/**
 * Discover and run test files. Sets a non-zero exit code on failure.
 * @param {RunNodeTestsConfig} [config]
 */
export async function runNodeTests(config = {}) {
  const {
    testDir = '.',
    suffix = '.test.ts',
    timeout = 30000,
    concurrency = true,
    coverage = process.argv.includes('--coverage'),
    coverageExcludeGlobs = ['**/*.test.ts', '**/test/**', '**/node_modules/**'],
    ignore = DEFAULT_IGNORE,
  } = config;

  const dirs = Array.isArray(testDir) ? testDir : [testDir];
  const found = await Promise.all(dirs.map((dir) => findTestFiles(dir, { suffix, ignore })));
  const files = found.flat().sort();

  if (files.length === 0) {
    console.error(`No ${suffix} files found under: ${dirs.join(', ')}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} test file(s)\n`);

  const stream = run({ files, timeout, concurrency, coverage, coverageExcludeGlobs });
  stream.compose(spec).pipe(process.stdout);
  stream.on('test:fail', () => {
    process.exitCode = 1;
  });
  return stream;
}
