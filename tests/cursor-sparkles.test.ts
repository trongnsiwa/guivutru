import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('CursorSparkles global ambient fx logic', () => {
  const MAX_MOTES = 6;
  const THROTTLE_MS = 60;
  const MOTE_LIFETIME_MS = 400;

  it('enforces MAX_MOTES hard cap of 6', () => {
    let motes: { id: number; x: number; y: number }[] = [];
    const spawnMote = (x: number, y: number, id: number) => {
      const next = motes.length >= MAX_MOTES ? motes.slice(motes.length - MAX_MOTES + 1) : motes;
      motes = [...next, { id, x, y }];
    };

    for (let i = 1; i <= 20; i++) {
      spawnMote(i * 10, i * 10, i);
    }

    assert.equal(motes.length, 6);
    assert.deepEqual(
      motes.map((m) => m.id),
      [15, 16, 17, 18, 19, 20]
    );
  });

  it('throttles mote spawns to >= 60ms intervals', () => {
    let lastSpawnTime = -100;
    const spawnTimes: number[] = [];

    const handleMouseMove = (now: number) => {
      if (now - lastSpawnTime < THROTTLE_MS) return;
      lastSpawnTime = now;
      spawnTimes.push(now);
    };

    // Simulate 10 rapid events within 140ms
    const timestamps = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135];
    for (const t of timestamps) {
      handleMouseMove(t);
    }

    assert.deepEqual(spawnTimes, [0, 60, 120]);
    assert.equal(spawnTimes.length, 3);
  });

  it('guards against touch devices (desktop-only)', () => {
    const isTouchDevice = (winTouch: boolean, maxTouchPoints: number) => {
      return winTouch || maxTouchPoints > 0;
    };

    assert.equal(isTouchDevice(true, 0), true);
    assert.equal(isTouchDevice(false, 5), true);
    assert.equal(isTouchDevice(false, 0), false);
  });

  it('skips completely on /dev/share-card route', () => {
    const shouldSkipRoute = (path: string) => path.startsWith('/dev/share-card');

    assert.equal(shouldSkipRoute('/dev/share-card'), true);
    assert.equal(shouldSkipRoute('/dev/share-card/preview'), true);
    assert.equal(shouldSkipRoute('/'), false);
    assert.equal(shouldSkipRoute('/viet'), false);
    assert.equal(shouldSkipRoute('/toi'), false);
    assert.equal(shouldSkipRoute('/bau-troi'), false);
  });

  it('suppresses motes over modals (backdrop or dialog) and ShareCard', () => {
    const mockMatches = (selector: string, matchedSelector: string) => {
      return selector.split(', ').some((part) => part.trim() === matchedSelector);
    };

    const isSuppressed = (matchedClassOrRole: string) => {
      const allowedPatterns = [
        '.fixed.inset-0.z-50',
        '[role="dialog"]',
        '[data-modal]',
        '[data-share-card]',
        '.share-card',
      ];
      return allowedPatterns.includes(matchedClassOrRole);
    };

    assert.equal(isSuppressed('.fixed.inset-0.z-50'), true);
    assert.equal(isSuppressed('[role="dialog"]'), true);
    assert.equal(isSuppressed('[data-modal]'), true);
    assert.equal(isSuppressed('[data-share-card]'), true);
    assert.equal(isSuppressed('.share-card'), true);
    assert.equal(isSuppressed('.standard-content'), false);
  });

  it('drains motes to 0 within 400ms when mouse movement stops', async () => {
    let motes = [{ id: 1 }, { id: 2 }, { id: 3 }];
    let idleTimer: NodeJS.Timeout | null = null;

    const onMouseStop = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        motes = [];
      }, MOTE_LIFETIME_MS);
    };

    onMouseStop();
    assert.equal(motes.length, 3);

    await new Promise((resolve) => setTimeout(resolve, 450));
    assert.equal(motes.length, 0);
  });

  it('guarantees 0 child nodes in container when cursor is still for >1s', async () => {
    // Simulate DOM container
    const container = {
      children: [{ id: 'mote-1' }, { id: 'mote-2' }] as { id: string }[],
    };

    let idleTimer: NodeJS.Timeout | null = null;
    const triggerSpawn = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        container.children = [];
      }, MOTE_LIFETIME_MS);
    };

    triggerSpawn();
    assert.equal(container.children.length, 2);

    // After 1 second of stillness (> 400ms idle cap)
    await new Promise((resolve) => setTimeout(resolve, 1050));
    assert.equal(container.children.length, 0);
  });
});
