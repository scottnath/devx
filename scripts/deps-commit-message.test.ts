import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dependencyChangeLines, formatCommitMessage } from './deps-commit-message.mjs';

const before = { dependencies: { zod: '4.6.5', astro: '7.3.4', gone: '1.0.0', same: '1.0.0' } };
const after = {
  dependencies: { zod: '4.6.7', astro: '7.4.10', same: '1.0.0' },
  devDependencies: { fresh: '2.0.0' },
};

describe('dependencyChangeLines', () => {
  it('lists bumps, additions and removals sorted by name', () => {
    assert.deepEqual(dependencyChangeLines(before, after), [
      '- astro: 7.3.4 → 7.4.10',
      '- fresh: added at 2.0.0',
      '- gone: removed (was 1.0.0)',
      '- zod: 4.6.5 → 4.6.7',
    ]);
  });

  it('returns nothing when the manifests match', () => {
    assert.deepEqual(dependencyChangeLines(before, before), []);
    assert.deepEqual(dependencyChangeLines({}, {}), []);
  });
});

describe('formatCommitMessage', () => {
  it('writes a gitmoji subject and one line per dependency', () => {
    assert.equal(
      formatCommitMessage({ dependencies: { astro: '7.3.4' } }, { dependencies: { astro: '7.4.10' } }),
      ':arrow_up: Update dependencies\n\nDependencies:\n- astro: 7.3.4 → 7.4.10\n\nVerified: npm run verify\n',
    );
  });

  it('supports another emoji and a lockfile-only update', () => {
    assert.equal(
      formatCommitMessage(before, before, ':boom:'),
      ':boom: Update dependencies\n\nVerified: npm run verify\n',
    );
  });
});
