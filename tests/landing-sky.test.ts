import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  pickPreviewNotes,
  pickUpcomingNotes,
  formatCountdownDays,
  fetchSkyCount,
  SEEDED_SKY_NOTES,
} from '../src/lib/sky.ts';
import type { SkyNote } from '../src/lib/sky.ts';

function createMockNote(overrides: Partial<SkyNote>): SkyNote {
  return {
    id: overrides.id || `note_${Math.random()}`,
    pseudonym: overrides.pseudonym || 'người-ẩn-danh',
    paperTheme: overrides.paperTheme || 'dem-sao',
    stickerIds: overrides.stickerIds || ['⭐'],
    unlockAt: overrides.unlockAt ?? 1700000000000,
    status: overrides.status || 'opened',
    createdAt: overrides.createdAt ?? 1690000000000,
    openedAt: overrides.openedAt ?? null,
    content: overrides.content ?? 'Lời chúc gửi vào không gian',
    seed: overrides.seed,
    isReported: overrides.isReported,
  };
}

describe('Landing Sky Pure Helpers (LANDING.md Bundle A)', () => {
  describe('pickPreviewNotes (§4 A1)', () => {
    it('sorts notes by createdAt descending and takes up to limit', () => {
      const notes: SkyNote[] = [
        createMockNote({ id: 'note_1', createdAt: 100, status: 'opened' }),
        createMockNote({ id: 'note_3', createdAt: 300, status: 'opened' }),
        createMockNote({ id: 'note_2', createdAt: 200, status: 'opened' }),
      ];

      const result = pickPreviewNotes(notes, 2);
      assert.equal(result.length, 2);
      assert.equal(result[0].id, 'note_3');
      assert.equal(result[1].id, 'note_2');
    });

    it('returns empty array when source notes is empty or limit <= 0', () => {
      assert.deepEqual(pickPreviewNotes([], 12), []);
      assert.deepEqual(pickPreviewNotes([createMockNote({})], 0), []);
      assert.deepEqual(pickPreviewNotes([createMockNote({})], -1), []);
    });

    it('guarantees at least one sealed note when source contains one but top N has none', () => {
      // 15 opened notes with newer timestamps, 1 sealed note with older timestamp
      const openedNotes = Array.from({ length: 15 }, (_, i) =>
        createMockNote({
          id: `opened_${i}`,
          createdAt: 2000 + i, // 2000 to 2014
          status: 'opened',
        })
      );
      const sealedNote = createMockNote({
        id: 'sealed_old',
        createdAt: 1000,
        status: 'sealed',
      });

      const allNotes = [...openedNotes, sealedNote];
      const preview = pickPreviewNotes(allNotes, 12);

      assert.equal(preview.length, 12);
      // The top 11 must be the newest opened notes (opened_14 down to opened_4)
      assert.equal(preview[0].id, 'opened_14');
      assert.equal(preview[10].id, 'opened_4');
      // The last slot must be swapped for the most recent sealed note
      assert.equal(preview[11].id, 'sealed_old');
      assert.equal(preview[11].status, 'sealed');
    });

    it('picks the MOST RECENT sealed note when multiple sealed notes exist outside top N', () => {
      const openedNotes = Array.from({ length: 14 }, (_, i) =>
        createMockNote({
          id: `opened_${i}`,
          createdAt: 3000 + i,
          status: 'opened',
        })
      );
      const olderSealed = createMockNote({
        id: 'sealed_1',
        createdAt: 1000,
        status: 'sealed',
      });
      const newerSealed = createMockNote({
        id: 'sealed_2',
        createdAt: 2000,
        status: 'sealed',
      });

      const preview = pickPreviewNotes([...openedNotes, olderSealed, newerSealed], 12);
      assert.equal(preview.length, 12);
      assert.equal(preview[11].id, 'sealed_2');
    });

    it('does not swap if top N already contains a sealed note', () => {
      const notes = [
        createMockNote({ id: 'opened_1', createdAt: 500, status: 'opened' }),
        createMockNote({ id: 'sealed_top', createdAt: 400, status: 'sealed' }),
        createMockNote({ id: 'opened_2', createdAt: 300, status: 'opened' }),
        createMockNote({ id: 'sealed_bottom', createdAt: 100, status: 'sealed' }),
      ];

      const preview = pickPreviewNotes(notes, 3);
      assert.equal(preview.length, 3);
      assert.equal(preview[0].id, 'opened_1');
      assert.equal(preview[1].id, 'sealed_top');
      assert.equal(preview[2].id, 'opened_2');
    });

    it('does not swap if source contains zero sealed notes', () => {
      const notes = Array.from({ length: 15 }, (_, i) =>
        createMockNote({ id: `opened_${i}`, createdAt: 100 + i, status: 'opened' })
      );
      const preview = pickPreviewNotes(notes, 12);
      assert.equal(preview.length, 12);
      assert.ok(preview.every((n) => n.status === 'opened'));
    });
  });

  describe('pickUpcomingNotes (§4 A2)', () => {
    it('filters for sealed notes unlocking in the future and sorts by unlockAt ascending', () => {
      const now = 1700000000000;
      const notes: SkyNote[] = [
        createMockNote({ id: 'past_sealed', status: 'sealed', unlockAt: now - 1000 }),
        createMockNote({ id: 'opened_future', status: 'opened', unlockAt: now + 50000 }),
        createMockNote({ id: 'future_3', status: 'sealed', unlockAt: now + 30000 }),
        createMockNote({ id: 'future_1', status: 'sealed', unlockAt: now + 10000 }),
        createMockNote({ id: 'future_2', status: 'sealed', unlockAt: now + 20000 }),
        createMockNote({ id: 'future_4', status: 'sealed', unlockAt: now + 40000 }),
      ];

      const upcoming = pickUpcomingNotes(notes, now, 3);
      assert.equal(upcoming.length, 3);
      assert.equal(upcoming[0].id, 'future_1');
      assert.equal(upcoming[1].id, 'future_2');
      assert.equal(upcoming[2].id, 'future_3');
    });

    it('enforces 3-item cap by default', () => {
      const now = 1700000000000;
      const notes = Array.from({ length: 10 }, (_, i) =>
        createMockNote({
          id: `upcoming_${i}`,
          status: 'sealed',
          unlockAt: now + (i + 1) * 86400000,
        })
      );

      const upcoming = pickUpcomingNotes(notes, now);
      assert.equal(upcoming.length, 3);
      assert.equal(upcoming[0].id, 'upcoming_0');
      assert.equal(upcoming[1].id, 'upcoming_1');
      assert.equal(upcoming[2].id, 'upcoming_2');
    });

    it('returns empty array when no notes qualify', () => {
      const now = 1700000000000;
      const notes = [
        createMockNote({ status: 'opened', unlockAt: now + 10000 }),
        createMockNote({ status: 'sealed', unlockAt: now - 10000 }),
      ];
      assert.deepEqual(pickUpcomingNotes(notes, now), []);
    });
  });

  describe('formatCountdownDays (§4 A2, §7)', () => {
    const DAY_MS = 86400000;
    const now = 1700000000000;

    it('formats 30 days boundary correctly', () => {
      assert.equal(formatCountdownDays(now + 30 * DAY_MS, now), '30 ngày nữa');
    });

    it('formats 1 day boundary correctly', () => {
      assert.equal(formatCountdownDays(now + 1 * DAY_MS, now), '1 ngày nữa');
    });

    it('formats today (0 days or within day) as "Hôm nay"', () => {
      assert.equal(formatCountdownDays(now, now), 'Hôm nay');
      assert.equal(formatCountdownDays(now + 3600000, now), 'Hôm nay'); // 1 hour ahead
      assert.equal(formatCountdownDays(now - 1000, now), 'Hôm nay'); // past
    });

    it('produces "29 ngày nữa" for seed_sky_21_sealed in the seed fallback path', () => {
      const sealedSeed = SEEDED_SKY_NOTES.find((n) => n.id === 'seed_sky_21_sealed');
      assert.ok(sealedSeed, 'seed_sky_21_sealed must exist in SEEDED_SKY_NOTES');
      const now = Date.now();
      const countdown = formatCountdownDays(sealedSeed.unlockAt, now);
      // unlockAt is evaluated at module evaluation time; by test execution time elapsedMs > 0,
      // so diffMs < 30 * 86400000 and Math.floor yields 29.
      assert.equal(countdown, '29 ngày nữa');
    });
  });

  describe('fetchSkyCount (§4 A3 null-return behavior)', () => {
    it('returns null when Supabase is unconfigured or called with no arguments', async () => {
      const count = await fetchSkyCount();
      assert.equal(count, null);
    });

    it('returns null when client is null', async () => {
      const count = await fetchSkyCount(2000, null);
      assert.equal(count, null);
    });

    it('returns null on query error (never returns 0 on failure)', async () => {
      const mockClientWithError: any = {
        from: () => ({
          select: async () => ({
            data: null,
            count: null,
            error: new Error('Database connection failed'),
          }),
        }),
      };

      const result = await fetchSkyCount(2000, mockClientWithError);
      assert.equal(result, null);
    });

    it('returns null when client throws an exception', async () => {
      const mockClientWithException: any = {
        from: () => ({
          select: async () => {
            throw new Error('Crash');
          },
        }),
      };

      const result = await fetchSkyCount(2000, mockClientWithException);
      assert.equal(result, null);
    });

    it('returns null on timeout (> timeoutMs)', async () => {
      const mockHangingClient: any = {
        from: () => ({
          select: () => new Promise((resolve) => setTimeout(resolve, 500)),
        }),
      };

      const result = await fetchSkyCount(50, mockHangingClient); // 50ms timeout
      assert.equal(result, null);
    });

    it('returns legitimate count 0 when query genuinely resolves to 0', async () => {
      const mockZeroClient: any = {
        from: () => ({
          select: async () => ({
            data: [],
            count: 0,
            error: null,
          }),
        }),
      };

      const result = await fetchSkyCount(2000, mockZeroClient);
      assert.equal(result, 0);
    });

    it('returns legitimate positive count when query resolves successfully', async () => {
      const mockValidClient: any = {
        from: () => ({
          select: async () => ({
            data: [],
            count: 1284,
            error: null,
          }),
        }),
      };

      const result = await fetchSkyCount(2000, mockValidClient);
      assert.equal(result, 1284);
    });
  });
});
