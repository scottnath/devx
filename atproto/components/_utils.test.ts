import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatRelativeTime } from './_utils.js';

/** A Date `ms` milliseconds before now. */
const ago = (ms: number) => new Date(Date.now() - ms);

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

describe('formatRelativeTime', () => {
  it('returns "just now" for under a minute', () => {
    assert.strictEqual(formatRelativeTime(ago(30_000)), 'just now');
  });

  it('returns minutes for under an hour', () => {
    assert.strictEqual(formatRelativeTime(ago(5 * MIN)), '5m ago');
  });

  it('returns hours for under a day', () => {
    assert.strictEqual(formatRelativeTime(ago(3 * HOUR)), '3h ago');
  });

  it('returns days for under a week', () => {
    assert.strictEqual(formatRelativeTime(ago(2 * DAY)), '2d ago');
  });

  it('returns a month/day date within the current year', () => {
    const now = new Date();
    const early = new Date(now.getFullYear(), 0, 2); // Jan 2 this year
    // Only assert the branch when Jan 2 is >= 7 days ago (i.e. not early January).
    if (Date.now() - early.getTime() >= 7 * DAY) {
      const out = formatRelativeTime(early);
      assert.match(out, /^Jan 2$/);
    }
  });

  it('includes the year for dates in a different year', () => {
    const out = formatRelativeTime(new Date('2000-03-15T12:00:00Z'));
    assert.match(out, /2000/);
    assert.match(out, /Mar/);
  });
});
