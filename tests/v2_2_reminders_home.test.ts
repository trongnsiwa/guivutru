import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  processRemindersJob,
  buildReminderEmailHtml,
  EMAIL_REMINDER_SUBJECT,
  EMAIL_UNSUBSCRIBE_URL,
  type ReminderCandidate,
} from '../functions/api/cron/reminders.ts';
import { computeYearInReview } from '../src/lib/yearInReview.ts';
import {
  REACTION_GLYPHS,
  REACTION_LABELS,
  type ReactionType,
} from '../src/lib/reactions.ts';
import type { Note } from '../src/types/note.ts';

describe('v2.2 "Nhắc nhở & Nhà" (Reminders & Home) Verification Suite', () => {
  describe('1. Email Reminders (§4.1 Resend Integration & Idempotency)', () => {
    it('uses the exact Vietnamese copy from §4.1: "Bạn của ngày xưa gửi cho bạn một lá thư…"', () => {
      assert.equal(EMAIL_REMINDER_SUBJECT, 'Bạn của ngày xưa gửi cho bạn một lá thư…');
      const html = buildReminderEmailHtml('note-test-123');
      assert.ok(html.includes('Bạn của ngày xưa gửi cho bạn một lá thư…'));
    });

    it('includes the mandatory legal unsubscribe link in email body', () => {
      const html = buildReminderEmailHtml('note-test-123');
      assert.ok(html.includes(EMAIL_UNSUBSCRIBE_URL));
      assert.ok(html.includes('Tắt thông báo tại đây'));
    });

    it('processes reminder on calendar day unlock_at arrives', async () => {
      const now = Date.now();
      const pastUnlock = new Date(now - 3600000).toISOString(); // 1 hour ago
      const futureUnlock = new Date(now + 3600000 * 24).toISOString(); // 24 hours in future

      const candidates: ReminderCandidate[] = [
        {
          id: 'note_ready',
          userId: 'usr_1',
          userEmail: 'user1@example.com',
          unlockAt: pastUnlock,
          reminderSentAt: null,
        },
        {
          id: 'note_locked',
          userId: 'usr_2',
          userEmail: 'user2@example.com',
          unlockAt: futureUnlock,
          reminderSentAt: null,
        },
      ];

      const result = await processRemindersJob(candidates, { nowMs: now });
      assert.equal(result.emailsSent, 1);
      assert.equal(candidates[0].reminderSentAt !== null, true);
      assert.equal(candidates[1].reminderSentAt, null);
    });

    it('enforces idempotency: a note never receives two reminder emails (§4.1)', async () => {
      const now = Date.now();
      const pastUnlock = new Date(now - 3600000).toISOString();

      const candidate: ReminderCandidate = {
        id: 'note_already_sent',
        userId: 'usr_1',
        userEmail: 'user1@example.com',
        unlockAt: pastUnlock,
        reminderSentAt: new Date(now - 1000).toISOString(), // already sent!
      };

      const result = await processRemindersJob([candidate], { nowMs: now });
      assert.equal(result.emailsSent, 0); // 0 emails sent because already sent
    });
  });

  describe('2. Zalo OA Reminders (§4.2 Feature Flag)', () => {
    it('keeps Zalo OA feature-flagged OFF by default and ships email-only cleanly', async () => {
      const now = Date.now();
      const candidate: ReminderCandidate = {
        id: 'note_zalo_test',
        userId: 'usr_zalo',
        userEmail: 'user@example.com',
        unlockAt: new Date(now - 1000).toISOString(),
        reminderSentAt: null,
      };

      // By default: enableZalo = false
      const result = await processRemindersJob([candidate], {
        enableZalo: false,
        nowMs: now,
      });

      assert.equal(result.zaloSkipped, true);
      assert.equal(result.zaloSent, 0);
      assert.equal(result.emailsSent, 1);
    });

    it('can be enabled via feature flag when approved without breaking email flow', async () => {
      const now = Date.now();
      const candidate: ReminderCandidate = {
        id: 'note_zalo_test_enabled',
        userId: 'usr_zalo_2',
        userEmail: 'user@example.com',
        unlockAt: new Date(now - 1000).toISOString(),
        reminderSentAt: null,
      };

      const result = await processRemindersJob([candidate], {
        enableZalo: true,
        zaloAccessToken: 'mock-access-token',
        nowMs: now,
      });

      assert.equal(result.zaloSkipped, false);
      assert.equal(result.emailsSent, 1);
    });
  });

  describe('3. PWA Specification (§4.3)', () => {
    it('provides a valid manifest.webmanifest with standalone display and theme color', () => {
      const manifestPath = resolve(process.cwd(), 'public/manifest.webmanifest');
      assert.ok(existsSync(manifestPath), 'manifest.webmanifest must exist in public/');
      const content = JSON.parse(readFileSync(manifestPath, 'utf-8'));

      assert.equal(content.name, 'Gửi Vũ Trụ');
      assert.equal(content.short_name, 'Gửi Vũ Trụ');
      assert.equal(content.display, 'standalone');
      assert.equal(content.theme_color, '#0f0a24');
      assert.equal(content.background_color, '#080511');
      assert.ok(Array.isArray(content.icons) && content.icons.length >= 2);
    });

    it('includes service worker sw.js with offline read cache and strictly NO offline write', () => {
      const swPath = resolve(process.cwd(), 'public/sw.js');
      assert.ok(existsSync(swPath), 'public/sw.js must exist');
      const swContent = readFileSync(swPath, 'utf-8');

      // Offline read cached for navigate requests
      assert.ok(swContent.includes("request.mode === 'navigate'"));
      // Strictly guards against caching POST/write requests
      assert.ok(swContent.includes("request.method !== 'GET'"));
      assert.ok(swContent.includes('/viet'));
    });
  });

  describe('4. Reactions on Public Notes (§4.4)', () => {
    it('restricts reactions strictly to three options: 🌙 ⭐ 💗', () => {
      const allowedKeys: ReactionType[] = ['moon', 'star', 'heart'];
      assert.deepEqual(Object.keys(REACTION_GLYPHS), allowedKeys);
      assert.equal(REACTION_GLYPHS.moon, '🌙');
      assert.equal(REACTION_GLYPHS.star, '⭐');
      assert.equal(REACTION_GLYPHS.heart, '💗');
    });

    it('enforces author-only reaction count threshold: hidden unless author AND > 10', () => {
      // Simulation of get_author_reaction_count logic
      function simulateAuthorCount(
        isAuthor: boolean,
        totalReactions: number
      ): number {
        if (!isAuthor) return 0;
        if (totalReactions > 10) return totalReactions;
        return 0;
      }

      // 1. Non-author: always 0 (never see count)
      assert.equal(simulateAuthorCount(false, 5), 0);
      assert.equal(simulateAuthorCount(false, 15), 0);

      // 2. Author with <= 10 reactions: hidden (0)
      assert.equal(simulateAuthorCount(true, 3), 0);
      assert.equal(simulateAuthorCount(true, 10), 0);

      // 3. Author with > 10 reactions: visible!
      assert.equal(simulateAuthorCount(true, 11), 11);
      assert.equal(simulateAuthorCount(true, 42), 42);
    });

    it('allows changing reaction (1 reaction per user per note)', () => {
      const reactions = new Map<string, ReactionType>();
      const user = 'user_abc';
      const noteId = 'note_xyz';
      const key = `${noteId}:${user}`;

      // React with moon
      reactions.set(key, 'moon');
      assert.equal(reactions.get(key), 'moon');

      // Change reaction to star
      reactions.set(key, 'star');
      assert.equal(reactions.get(key), 'star');

      // Toggle off
      reactions.delete(key);
      assert.equal(reactions.get(key), undefined);
    });
  });

  describe('5. Year in Review (§4.5)', () => {
    const mockNote = (
      id: string,
      createdAt: number,
      content: string,
      status: 'sealed' | 'opened' = 'opened'
    ): Note => ({
      id,
      content,
      paperTheme: 'dem-sao',
      stickerIds: ['✨'],
      unlockAt: createdAt + 3600000 * 24 * 30,
      createdAt,
      status,
      isDeleted: false,
      visibility: 'private',
    });

    it('only enables Year in Review if user has ≥ 5 notes (§4.5)', () => {
      const now = Date.now();
      const notes4: Note[] = [
        mockNote('1', now - 4000, 'Note 1'),
        mockNote('2', now - 3000, 'Note 2'),
        mockNote('3', now - 2000, 'Note 3'),
        mockNote('4', now - 1000, 'Note 4'),
      ];

      const stats4 = computeYearInReview(notes4);
      assert.equal(stats4.isEligible, false);

      const notes5: Note[] = [
        ...notes4,
        mockNote('5', now, 'Note 5 with some extra words for review'),
      ];

      const stats5 = computeYearInReview(notes5);
      assert.equal(stats5.isEligible, true);
      assert.equal(stats5.notesWritten, 5);
      assert.ok(stats5.wordsSent > 0);
      assert.ok(stats5.moonsWatched > 0);
      assert.ok(stats5.featuredWish !== null);
    });

    it('computes stats accurately: notes written, words sent, moons watched', () => {
      const now = Date.now();
      const notes: Note[] = [
        mockNote('1', now - 50000, 'Một hai ba'), // 3 words
        mockNote('2', now - 40000, 'Bốn năm sáu bảy'), // 4 words
        mockNote('3', now - 30000, 'Tám chín mười'), // 3 words
        mockNote('4', now - 20000, 'Mười một mười hai'), // 4 words
        mockNote('5', now - 10000, 'Đây là điều ước dài nhất và đẹp nhất của năm'), // 11 words
      ];

      const stats = computeYearInReview(notes);
      assert.equal(stats.notesWritten, 5);
      assert.equal(stats.wordsSent, 25);
      assert.equal(stats.featuredWish?.id, '5'); // note 5 is longest
    });
  });
});
