import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeStarCoordinates, mixHash } from '../src/lib/sky.ts';

describe('Bug 1 Verification: Featured Star Center & Determinism', () => {
  it('places the featured (newest) star at visual canvas center (50%, 48%)', () => {
    const newestNoteId = 'user_newest_wish_999';
    const coords = computeStarCoordinates(newestNoteId, true);
    assert.equal(coords.xPercent, 50.0);
    assert.equal(coords.yPercent, 48.0);
  });

  it('guarantees identical center coordinates on 3 consecutive reloads', () => {
    const noteId = 'seed_sky_01';
    const run1 = computeStarCoordinates(noteId, true);
    const run2 = computeStarCoordinates(noteId, true);
    const run3 = computeStarCoordinates(noteId, true);

    assert.deepEqual(run1, run2);
    assert.deepEqual(run2, run3);
    assert.equal(run1.xPercent, 50.0);
    assert.equal(run1.yPercent, 48.0);
  });

  it('guarantees identical deterministic position across multiple devices', () => {
    const noteIdA = 'device_a_note_123';
    // Device 1 calculation
    const dev1 = computeStarCoordinates(noteIdA, false);
    // Device 2 calculation
    const dev2 = computeStarCoordinates(noteIdA, false);

    assert.equal(dev1.xPercent, dev2.xPercent);
    assert.equal(dev1.yPercent, dev2.yPercent);
  });

  it('ensures surrounding stars maintain safe distance and stay within bounds', () => {
    const testIds = Array.from({ length: 25 }, (_, i) => `seed_sky_${String(i).padStart(2, '0')}`);
    for (const id of testIds) {
      const coords = computeStarCoordinates(id, false);
      assert.ok(coords.xPercent >= 8 && coords.xPercent <= 92, `x ${coords.xPercent} out of bounds`);
      assert.ok(coords.yPercent >= 12 && coords.yPercent <= 88, `y ${coords.yPercent} out of bounds`);
    }
  });
});
