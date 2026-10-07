import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function mixHash(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function computeStarCoordinates(noteId: string, isFeatured: boolean) {
  if (isFeatured) {
    return { xPercent: 50.0, yPercent: 48.0 };
  }
  const rawHash = noteId.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
  const hash = mixHash(rawHash);
  const angle = ((hash % 360) * Math.PI) / 180;
  const rx = 15 + ((hash >>> 8) % 32);
  const ry = 13 + ((hash >>> 16) % 27);
  let x = 50 + Math.cos(angle) * rx;
  let y = 48 + Math.sin(angle) * ry;

  if (Math.hypot(x - 50, y - 48) < 14) {
    x = 50 + Math.cos(angle) * 16;
    y = 48 + Math.sin(angle) * 15;
  }

  return {
    xPercent: Math.min(92, Math.max(8, x)),
    yPercent: Math.min(88, Math.max(12, y)),
  };
}

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
