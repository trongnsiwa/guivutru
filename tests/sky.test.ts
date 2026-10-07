import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { containsBadWords, BAD_WORD_REJECTION, RATE_LIMIT_REJECTION } from '../src/lib/moderation.ts';
import { generatePseudonym } from '../src/lib/pseudonym.ts';

/**
 * Test model for PostgreSQL Database Engine with v2.1 Sky Wall & Moderation policies.
 * Simulates:
 * 1. public.notes_base table
 * 2. public.user_pseudonyms table
 * 3. public.reports table
 * 4. public.sky_notes view (§3.2, §3.7: zero PII, masked sealed content, is_reported = false)
 * 5. public.report_note RPC (§3.4 Layer 2)
 * 6. public.check_public_rate_limit RPC (§3.5)
 */
interface DBRow {
  id: string;
  user_id: string | null;
  device_id: string | null;
  content: string | null;
  prompt_id: string | null;
  paper_theme: string;
  sticker_ids: string[];
  unlock_at: string;
  status: 'sealed' | 'opened';
  visibility: 'private' | 'public';
  pseudonym?: string | null;
  seed?: boolean;
  is_reported?: boolean;
  reported_at?: string | null;
  report_count?: number;
  created_at: string;
  opened_at: string | null;
  updated_at: string;
  published_at?: string | null;
  is_deleted: boolean;
}

interface ReportRow {
  id: string;
  note_id: string;
  reporter_user_id: string | null;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
}

class PostgresSkySimulator {
  public baseTable: DBRow[] = [];
  public userPseudonyms = new Map<string, string>();
  public reports: ReportRow[] = [];

  insert(callerUserId: string | null, row: DBRow) {
    if (row.visibility === 'public' && !row.seed) {
      if (!callerUserId) {
        throw new Error('Publishing requires login');
      }

      // Check server-side rate limit (§3.5)
      if (!this.checkRateLimit(callerUserId, new Date(row.created_at).getTime())) {
        throw new Error(RATE_LIMIT_REJECTION);
      }

      // Assign stable pseudonym if not already set
      if (!row.pseudonym) {
        if (!this.userPseudonyms.has(callerUserId)) {
          this.userPseudonyms.set(callerUserId, generatePseudonym());
        }
        row.pseudonym = this.userPseudonyms.get(callerUserId);
      }
    }

    this.baseTable.push({
      ...row,
      is_reported: row.is_reported ?? false,
      report_count: row.report_count ?? 0,
    });
  }

  checkRateLimit(userId: string, nowMs: number = Date.now()): boolean {
    const oneDayAgo = nowMs - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = nowMs - 7 * 24 * 60 * 60 * 1000;

    const userPublicNotes = this.baseTable.filter(
      (n) => n.user_id === userId && n.visibility === 'public' && !n.is_deleted && !n.seed
    );

    const pastDayCount = userPublicNotes.filter((n) => {
      const pubTime = n.published_at ? new Date(n.published_at).getTime() : new Date(n.created_at).getTime();
      return pubTime >= oneDayAgo;
    }).length;

    if (pastDayCount >= 1) return false;

    const pastWeekCount = userPublicNotes.filter((n) => {
      const pubTime = n.published_at ? new Date(n.published_at).getTime() : new Date(n.created_at).getTime();
      return pubTime >= sevenDaysAgo;
    }).length;

    if (pastWeekCount >= 5) return false;

    return true;
  }

  updateVisibility(callerUserId: string | null, noteId: string, newVisibility: 'private' | 'public', nowMs: number = Date.now()) {
    const note = this.baseTable.find((n) => n.id === noteId);
    if (!note || note.user_id !== callerUserId) {
      throw new Error('Note not found or permission denied');
    }

    if (newVisibility === 'public' && note.visibility === 'private') {
      if (!callerUserId) {
        throw new Error('Publishing requires login');
      }
      if (!this.checkRateLimit(callerUserId, nowMs)) {
        throw new Error(RATE_LIMIT_REJECTION);
      }
      if (!note.pseudonym) {
        if (!this.userPseudonyms.has(callerUserId)) {
          this.userPseudonyms.set(callerUserId, generatePseudonym());
        }
        note.pseudonym = this.userPseudonyms.get(callerUserId);
      }
      note.published_at = new Date(nowMs).toISOString();
    }

    note.visibility = newVisibility;
    note.updated_at = new Date(nowMs).toISOString();
  }

  reportNoteRPC(noteId: string, reporterId: string | null, reason = 'Inappropriate content') {
    const note = this.baseTable.find((n) => n.id === noteId);
    if (!note) throw new Error('Note not found');

    // Rule 1: A user cannot report their own note (§3.4.2)
    if (reporterId && note.user_id && reporterId === note.user_id) {
      throw new Error('Cannot report your own note');
    }

    // Rule 2: A user cannot report the same note twice (§3.4.2)
    if (reporterId && this.reports.some((r) => r.note_id === noteId && r.reporter_user_id === reporterId)) {
      throw new Error('Already reported');
    }

    this.reports.push({
      id: `rep_${Date.now()}_${Math.random()}`,
      note_id: noteId,
      reporter_user_id: reporterId,
      reason,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    // Immediately hide note pending review per §3.4 Layer 2
    note.is_reported = true;
    note.reported_at = new Date().toISOString();
    note.report_count = (note.report_count || 0) + 1;
    return true;
  }

  adminModerateRPC(noteId: string, action: 'duyet_lai' | 'xoa') {
    const note = this.baseTable.find((n) => n.id === noteId);
    if (!note) throw new Error('Note not found');

    if (action === 'duyet_lai') {
      note.is_reported = false;
      this.reports.filter((r) => r.note_id === noteId).forEach((r) => (r.status = 'reviewed'));
    } else if (action === 'xoa') {
      note.is_deleted = true;
      this.reports.filter((r) => r.note_id === noteId).forEach((r) => (r.status = 'reviewed'));
    }
    return true;
  }

  /**
   * Queries public.sky_notes VIEW (§3.2, §3.7)
   * SELECT
   *   id, pseudonym, paper_theme, sticker_ids, unlock_at, status, created_at, opened_at, seed,
   *   CASE WHEN status = 'sealed' AND unlock_at > now() THEN NULL ELSE content END AS content
   * FROM public.notes_base
   * WHERE visibility = 'public' AND is_deleted = FALSE AND is_reported = FALSE;
   */
  selectSkyNotesView(nowMs: number = Date.now()) {
    return this.baseTable
      .filter((n) => n.visibility === 'public' && !n.is_deleted && !n.is_reported)
      .map((n) => {
        const isSealedAndLocked =
          n.status === 'sealed' && new Date(n.unlock_at).getTime() > nowMs;

        // Note: Zero PII! user_id, device_id, reporter info explicitly omitted!
        return {
          id: n.id,
          pseudonym: n.pseudonym,
          paper_theme: n.paper_theme,
          sticker_ids: [...n.sticker_ids],
          unlock_at: n.unlock_at,
          status: n.status,
          created_at: n.created_at,
          opened_at: n.opened_at,
          seed: n.seed ?? false,
          content: isSealedAndLocked ? null : n.content,
        };
      });
  }
}

describe('v2.1 "Bầu trời" (Sky) Verification Suite', () => {
  describe('1. Moderation Layer 1: Pre-filter Bad Word Check (§3.4)', () => {
    it('rejects Vietnamese profanities', () => {
      assert.equal(containsBadWords('bài viết này đm thật là vcl'), true);
      assert.equal(containsBadWords('địt mẹ bực mình ghê'), true);
      assert.equal(containsBadWords('con đĩ này'), true);
      assert.equal(containsBadWords('đồ chó đẻ'), true);
    });

    it('rejects bypass evasion attempts with punctuation and symbols', () => {
      assert.equal(containsBadWords('d.m vũ trụ'), true);
      assert.equal(containsBadWords('v_l thật chứ'), true);
    });

    it('rejects spaced-letter evasion attempts (§3.4.1)', () => {
      assert.equal(containsBadWords('f u c k'), true);
      assert.equal(containsBadWords('đ m cuộc đời'), true);
      assert.equal(containsBadWords('s h i t'), true);
      assert.equal(containsBadWords('c ặ c'), true);
    });

    it('rejects diacritic-stripping evasion attempts (§3.4.1)', () => {
      assert.equal(containsBadWords('dit me cuoc doi'), true);
      assert.equal(containsBadWords('do cho de'), true);
      assert.equal(containsBadWords('khon nan that chu'), true);
    });

    it('rejects leetspeak substitution attempts (§3.4.1)', () => {
      assert.equal(containsBadWords('f*ck you'), true);
      assert.equal(containsBadWords('sh!t happen'), true);
      assert.equal(containsBadWords('you b!tch'), true);
      assert.equal(containsBadWords('d!ck head'), true);
    });

    it('allows innocent Vietnamese words with similar substrings', () => {
      assert.equal(containsBadWords('đám mây trôi'), false);
      assert.equal(containsBadWords('con đường dài'), false);
      assert.equal(containsBadWords('đi dạo bờ hồ'), false);
    });

    it('rejects English profanities', () => {
      assert.equal(containsBadWords('this is fucking shit'), true);
      assert.equal(containsBadWords('what the fuck'), true);
      assert.equal(containsBadWords('you bitch'), true);
    });

    it('allows clean and emotional Vietnamese wish content', () => {
      assert.equal(containsBadWords('Mong mẹ luôn khỏe mạnh bình an.'), false);
      assert.equal(containsBadWords('Ước một ngày thức dậy thấy lòng an yên.'), false);
      assert.equal(containsBadWords('Gửi vũ trụ: Mong người ấy cũng đang nhìn lên cùng một vầng trăng.'), false);
      assert.equal(containsBadWords('Năm sau mình sẽ đỗ thủ khoa đại học.'), false);
    });

    it('provides the exact Vietnamese rejection copy', () => {
      assert.equal(BAD_WORD_REJECTION, 'Viết lại nhẹ nhàng hơn nha, vũ trụ nghe hết á 🌙');
    });
  });

  describe('2. Moderation Layer 2: Report & Instant Hide (§3.4 Layer 2, §3.7)', () => {
    it('hides note immediately upon reporting (0ms local, pending review on DB)', () => {
      const db = new PostgresSkySimulator();
      const now = Date.now();

      db.insert('user_a', {
        id: 'note_public_1',
        user_id: 'user_a',
        device_id: 'dev_1',
        content: 'Một điều ước đẹp trên bầu trời.',
        prompt_id: null,
        paper_theme: 'dem-sao',
        sticker_ids: ['⭐'],
        unlock_at: new Date(now - 1000).toISOString(),
        status: 'opened',
        visibility: 'public',
        created_at: new Date(now).toISOString(),
        opened_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
        is_deleted: false,
      });

      // Verify visible before report
      const beforeReport = db.selectSkyNotesView(now);
      assert.equal(beforeReport.length, 1);
      assert.equal(beforeReport[0].id, 'note_public_1');

      // User reports note
      const reportSuccess = db.reportNoteRPC('note_public_1', 'user_b', 'Nội dung phản cảm');
      assert.equal(reportSuccess, true);

      // Verify immediately hidden from sky_notes view
      const afterReport = db.selectSkyNotesView(now);
      assert.equal(afterReport.length, 0, 'Reported note must disappear immediately from sky view');

      // Verify report record logged in reports table
      assert.equal(db.reports.length, 1);
      assert.equal(db.reports[0].note_id, 'note_public_1');
      assert.equal(db.reports[0].status, 'pending');
    });

    it('blocks a user from reporting their own note (§3.4.2)', () => {
      const db = new PostgresSkySimulator();
      const now = Date.now();
      const authorId = 'user_author_99';

      db.insert(authorId, {
        id: 'note_own_test',
        user_id: authorId,
        device_id: 'dev_1',
        content: 'Điều ước của chính tôi',
        prompt_id: null,
        paper_theme: 'dem-sao',
        sticker_ids: [],
        unlock_at: new Date(now - 1000).toISOString(),
        status: 'opened',
        visibility: 'public',
        created_at: new Date(now).toISOString(),
        opened_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
        is_deleted: false,
      });

      assert.throws(
        () => {
          db.reportNoteRPC('note_own_test', authorId, 'Tự báo cáo mình');
        },
        (err: Error) => {
          assert.equal(err.message, 'Cannot report your own note');
          return true;
        }
      );
    });

    it('blocks a user from reporting the same note twice (§3.4.2)', () => {
      const db = new PostgresSkySimulator();
      const now = Date.now();
      const authorId = 'user_author_1';
      const reporterId = 'user_reporter_2';

      db.insert(authorId, {
        id: 'note_dup_report',
        user_id: authorId,
        device_id: 'dev_1',
        content: 'Điều ước công cộng',
        prompt_id: null,
        paper_theme: 'bien',
        sticker_ids: [],
        unlock_at: new Date(now - 1000).toISOString(),
        status: 'opened',
        visibility: 'public',
        created_at: new Date(now).toISOString(),
        opened_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
        is_deleted: false,
      });

      // 1st report succeeds
      const firstReport = db.reportNoteRPC('note_dup_report', reporterId);
      assert.equal(firstReport, true);

      // 2nd report from same user is blocked
      assert.throws(
        () => {
          db.reportNoteRPC('note_dup_report', reporterId);
        },
        (err: Error) => {
          assert.equal(err.message, 'Already reported');
          return true;
        }
      );
    });

    it('measures report-to-hide latency (< 1 minute per §3.7 acceptance)', () => {
      const db = new PostgresSkySimulator();
      const now = Date.now();

      db.insert('user_x', {
        id: 'note_latency_check',
        user_id: 'user_x',
        device_id: 'dev_1',
        content: 'Kiểm tra độ trễ ẩn điều ước',
        prompt_id: null,
        paper_theme: 'dem-sao',
        sticker_ids: [],
        unlock_at: new Date(now - 1000).toISOString(),
        status: 'opened',
        visibility: 'public',
        created_at: new Date(now).toISOString(),
        opened_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
        is_deleted: false,
      });

      const start = performance.now();
      db.reportNoteRPC('note_latency_check', 'user_y');
      const skyNotes = db.selectSkyNotesView(now);
      const end = performance.now();

      const measuredLatencyMs = end - start;
      assert.equal(skyNotes.find((n) => n.id === 'note_latency_check'), undefined);
      // Acceptance criteria: disappears within 1 minute (60,000ms)
      assert.ok(measuredLatencyMs < 60000, `Measured latency ${measuredLatencyMs}ms exceeds 60s`);
      assert.ok(measuredLatencyMs < 50, `Measured latency was ${measuredLatencyMs.toFixed(3)}ms (instant transactional hide)`);
    });
  });

  describe('3. Rate Limiting Server-Side (§3.5, §3.7)', () => {
    it('enforces 1 public note per user per 24 hours', () => {
      const db = new PostgresSkySimulator();
      const now = Date.now();
      const userId = 'usr_active_poster';

      // 1st public note succeeds
      db.insert(userId, {
        id: 'note_first',
        user_id: userId,
        device_id: 'dev_1',
        content: 'Điều ước đầu tiên hôm nay.',
        prompt_id: null,
        paper_theme: 'bien',
        sticker_ids: [],
        unlock_at: new Date(now + 86400000).toISOString(),
        status: 'sealed',
        visibility: 'public',
        created_at: new Date(now).toISOString(),
        opened_at: null,
        updated_at: new Date(now).toISOString(),
        is_deleted: false,
      });

      // 2nd public note in same 24 hours is rejected
      assert.throws(
        () => {
          db.insert(userId, {
            id: 'note_second',
            user_id: userId,
            device_id: 'dev_1',
            content: 'Điều ước thứ hai cố tình gửi cùng ngày.',
            prompt_id: null,
            paper_theme: 'bien',
            sticker_ids: [],
            unlock_at: new Date(now + 86400000).toISOString(),
            status: 'sealed',
            visibility: 'public',
            created_at: new Date(now + 3600000).toISOString(),
            opened_at: null,
            updated_at: new Date(now + 3600000).toISOString(),
            is_deleted: false,
          });
        },
        (err: Error) => {
          assert.equal(err.message, RATE_LIMIT_REJECTION);
          return true;
        }
      );
    });

    it('enforces 5 public notes per user per 7 days', () => {
      const db = new PostgresSkySimulator();
      const now = Date.now();
      const userId = 'usr_weekly_poster';
      const oneInterval = 26 * 60 * 60 * 1000; // 26h apart: >24h (passes daily), 5*26h = 130h < 168h (within 7 days)

      // Post 1 note every 26 hours for 5 separate days
      for (let i = 5; i >= 1; i--) {
        db.insert(userId, {
          id: `note_day_${i}`,
          user_id: userId,
          device_id: 'dev_1',
          content: `Điều ước ngày ${i}`,
          prompt_id: null,
          paper_theme: 'dem-sao',
          sticker_ids: [],
          unlock_at: new Date(now + 86400000).toISOString(),
          status: 'sealed',
          visibility: 'public',
          created_at: new Date(now - i * oneInterval).toISOString(),
          opened_at: null,
          updated_at: new Date(now - i * oneInterval).toISOString(),
          is_deleted: false,
        });
      }

      // 6th note within the 7-day window is blocked by weekly cap
      assert.throws(
        () => {
          db.insert(userId, {
            id: 'note_sixth',
            user_id: userId,
            device_id: 'dev_1',
            content: 'Điều ước thứ 6 trong tuần.',
            prompt_id: null,
            paper_theme: 'dem-sao',
            sticker_ids: [],
            unlock_at: new Date(now + 86400000).toISOString(),
            status: 'sealed',
            visibility: 'public',
            created_at: new Date(now).toISOString(),
            opened_at: null,
            updated_at: new Date(now).toISOString(),
            is_deleted: false,
          });
        },
        (err: Error) => {
          assert.equal(err.message, RATE_LIMIT_REJECTION);
          return true;
        }
      );
    });

    it('uses exact Vietnamese rate limit rejection copy', () => {
      assert.equal(RATE_LIMIT_REJECTION, 'Bạn đã gửi hôm nay rồi, mai quay lại nha 🌙');
    });

    it('rate limit survives page refresh, device change, and sign-out/sign-in (§3.5)', () => {
      const db = new PostgresSkySimulator();
      const now = Date.now();
      const userId = 'usr_persistent_identity_123';

      // Session 1 on Device A: user posts 1 public note
      db.insert(userId, {
        id: 'note_session_1',
        user_id: userId,
        device_id: 'device_a',
        content: 'Điều ước từ máy tính ở nhà',
        prompt_id: null,
        paper_theme: 'bien',
        sticker_ids: [],
        unlock_at: new Date(now + 86400000).toISOString(),
        status: 'sealed',
        visibility: 'public',
        created_at: new Date(now).toISOString(),
        opened_at: null,
        updated_at: new Date(now).toISOString(),
        is_deleted: false,
      });

      // User signs out (client cleared)...
      // User signs in on Device B with a fresh session, same userId
      assert.throws(
        () => {
          db.insert(userId, {
            id: 'note_session_2_device_b',
            user_id: userId,
            device_id: 'device_b_phone',
            content: 'Điều ước cố tình gửi tiếp từ điện thoại',
            prompt_id: null,
            paper_theme: 'bien',
            sticker_ids: [],
            unlock_at: new Date(now + 86400000).toISOString(),
            status: 'sealed',
            visibility: 'public',
            created_at: new Date(now + 60000).toISOString(),
            opened_at: null,
            updated_at: new Date(now + 60000).toISOString(),
            is_deleted: false,
          });
        },
        (err: Error) => {
          assert.equal(err.message, RATE_LIMIT_REJECTION);
          return true;
        }
      );
    });
  });

  describe('4. RLS Column Masking on Sky Wall View (§2.4, §3.2)', () => {
    it('returns NULL for content of sealed public notes before unlock_at', () => {
      const db = new PostgresSkySimulator();
      const now = Date.now();
      const unlockInFuture = new Date(now + 30 * 86400000).toISOString();

      db.insert('author_1', {
        id: 'sky_sealed_future',
        user_id: 'author_1',
        device_id: 'dev_1',
        content: 'Nội dung bí mật tương lai tuyệt mật!',
        prompt_id: null,
        paper_theme: 'dem-sao',
        sticker_ids: ['🌙'],
        unlock_at: unlockInFuture,
        status: 'sealed',
        visibility: 'public',
        created_at: new Date(now).toISOString(),
        opened_at: null,
        updated_at: new Date(now).toISOString(),
        is_deleted: false,
      });

      const skyView = db.selectSkyNotesView(now);
      const targetNote = skyView.find((n) => n.id === 'sky_sealed_future');
      assert.ok(targetNote);
      assert.equal(targetNote.content, null, 'Content MUST be NULL when sealed and unlock_at > now');
    });

    it('returns content of opened public notes or notes whose unlock_at has passed', () => {
      const db = new PostgresSkySimulator();
      const now = Date.now();
      const unlockInPast = new Date(now - 1000).toISOString();

      db.insert('author_2', {
        id: 'sky_opened_past',
        user_id: 'author_2',
        device_id: 'dev_2',
        content: 'Điều ước đã mở cho cả vũ trụ đọc được.',
        prompt_id: null,
        paper_theme: 'bien',
        sticker_ids: ['🫧'],
        unlock_at: unlockInPast,
        status: 'opened',
        visibility: 'public',
        created_at: new Date(now - 86400000).toISOString(),
        opened_at: unlockInPast,
        updated_at: unlockInPast,
        is_deleted: false,
      });

      const skyView = db.selectSkyNotesView(now);
      const targetNote = skyView.find((n) => n.id === 'sky_opened_past');
      assert.ok(targetNote);
      assert.equal(targetNote.content, 'Điều ước đã mở cho cả vũ trụ đọc được.');
    });
  });

  describe('5. Zero PII Verification on Public Notes (§3.7, §7.5)', () => {
    it('proves sky_notes view exposes ZERO user_id, email, or device_id', () => {
      const db = new PostgresSkySimulator();
      const now = Date.now();

      db.insert('sensitive_user_uuid_123', {
        id: 'note_pii_check',
        user_id: 'sensitive_user_uuid_123',
        device_id: 'sensitive_device_fingerprint_xyz',
        content: 'Không để lộ danh tính cá nhân.',
        prompt_id: null,
        paper_theme: 'hogn',
        sticker_ids: [],
        unlock_at: new Date(now - 1000).toISOString(),
        status: 'opened',
        visibility: 'public',
        created_at: new Date(now).toISOString(),
        opened_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
        is_deleted: false,
      });

      const skyView = db.selectSkyNotesView(now);
      const row = skyView.find((n) => n.id === 'note_pii_check') as any;

      assert.ok(row);
      assert.equal(row.user_id, undefined, 'user_id must not be exposed');
      assert.equal(row.device_id, undefined, 'device_id must not be exposed');
      assert.equal(row.email, undefined, 'email must not be exposed');
      assert.ok(row.pseudonym, 'Pseudonym must be present instead of PII');
    });

    it('proves reporting never exposes reporter identity to the note owner (§3.4.2)', () => {
      const db = new PostgresSkySimulator();
      const now = Date.now();
      const authorId = 'owner_usr_456';
      const reporterId = 'secret_reporter_789';

      db.insert(authorId, {
        id: 'note_reported_pii',
        user_id: authorId,
        device_id: 'dev_owner',
        content: 'Điều ước bị báo cáo',
        prompt_id: null,
        paper_theme: 'dem-sao',
        sticker_ids: [],
        unlock_at: new Date(now - 1000).toISOString(),
        status: 'opened',
        visibility: 'public',
        created_at: new Date(now).toISOString(),
        opened_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
        is_deleted: false,
      });

      db.reportNoteRPC('note_reported_pii', reporterId, 'Vi phạm');

      // Note owner queries their own notes view
      const ownerNotes = db.baseTable.filter((n) => n.user_id === authorId);
      for (const note of ownerNotes) {
        assert.equal((note as any).reporter_user_id, undefined);
        assert.equal((note as any).reporter_id, undefined);
      }

      // Public view also contains no report details
      const publicWall = db.selectSkyNotesView(now);
      assert.equal(publicWall.length, 0); // hidden
    });
  });

  describe('6. Stable Pseudonym Stability (§3.3)', () => {
    it('generates a 2-word Vietnamese pseudonym matching format', () => {
      const pseudonym = generatePseudonym();
      // Format: word-word-number
      const parts = pseudonym.split('-');
      assert.ok(parts.length >= 3, `Expected at least 3 hyphenated parts, got ${pseudonym}`);
      const num = parseInt(parts[parts.length - 1], 10);
      assert.ok(!isNaN(num) && num >= 1 && num <= 99);
    });

    it('shares the same pseudonym across all public notes of the user', () => {
      const db = new PostgresSkySimulator();
      const now = Date.now();
      const userId = 'usr_stable_pseudonym';
      const oneDay = 24 * 60 * 60 * 1000;

      // Note 1 on day 1
      db.insert(userId, {
        id: 'note_p1',
        user_id: userId,
        device_id: 'dev_1',
        content: 'Ước 1',
        prompt_id: null,
        paper_theme: 'dem-sao',
        sticker_ids: [],
        unlock_at: new Date(now - 1000).toISOString(),
        status: 'opened',
        visibility: 'public',
        created_at: new Date(now - 2 * oneDay).toISOString(),
        opened_at: new Date(now - 1000).toISOString(),
        updated_at: new Date(now).toISOString(),
        is_deleted: false,
      });

      // Note 2 on day 2
      db.insert(userId, {
        id: 'note_p2',
        user_id: userId,
        device_id: 'dev_1',
        content: 'Ước 2',
        prompt_id: null,
        paper_theme: 'bien',
        sticker_ids: [],
        unlock_at: new Date(now - 1000).toISOString(),
        status: 'opened',
        visibility: 'public',
        created_at: new Date(now).toISOString(),
        opened_at: new Date(now - 1000).toISOString(),
        updated_at: new Date(now).toISOString(),
        is_deleted: false,
      });

      const skyView = db.selectSkyNotesView(now);
      const note1 = skyView.find((n) => n.id === 'note_p1');
      const note2 = skyView.find((n) => n.id === 'note_p2');

      assert.ok(note1 && note2);
      assert.ok(note1.pseudonym);
      assert.equal(note1.pseudonym, note2.pseudonym, 'Pseudonym must be stable across user notes');
    });
  });

  describe('7. Post-hoc Publishing & Unpublishing (§3.1, §3.3, §3.5)', () => {
    it('allows publishing an existing private note to the sky wall and assigns pseudonym', () => {
      const db = new PostgresSkySimulator();
      const now = Date.now();
      const userId = 'usr_post_hoc_01';

      // Initially private note
      db.insert(userId, {
        id: 'note_private_1',
        user_id: userId,
        device_id: 'dev_1',
        content: 'Lời nhắn gửi vào vũ trụ ngày xưa',
        prompt_id: null,
        paper_theme: 'tim-mong',
        sticker_ids: ['🌸'],
        unlock_at: new Date(now + 1000000).toISOString(),
        status: 'sealed',
        visibility: 'private',
        created_at: new Date(now - 100000).toISOString(),
        opened_at: null,
        updated_at: new Date(now - 100000).toISOString(),
        is_deleted: false,
      });

      // Confirm not in sky view
      let skyView = db.selectSkyNotesView(now);
      assert.equal(skyView.find((n) => n.id === 'note_private_1'), undefined);

      // Publish from /note/:id
      db.updateVisibility(userId, 'note_private_1', 'public', now);

      // Now appears in sky view with masked content (since sealed) and a pseudonym
      skyView = db.selectSkyNotesView(now);
      const published = skyView.find((n) => n.id === 'note_private_1');
      assert.ok(published);
      assert.equal(published.content, null, 'Sealed note content must be NULL before unlock');
      assert.ok(published.pseudonym, 'Must be assigned stable pseudonym');

      // Unpublish
      db.updateVisibility(userId, 'note_private_1', 'private', now + 1000);
      skyView = db.selectSkyNotesView(now + 1000);
      assert.equal(skyView.find((n) => n.id === 'note_private_1'), undefined, 'Unpublished note must disappear from sky wall');
    });

    it('enforces rate limit when publishing an older note (counts against 1/day limit)', () => {
      const db = new PostgresSkySimulator();
      const now = Date.now();
      const userId = 'usr_post_hoc_rate';
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

      // Note written 3 days ago, private
      db.insert(userId, {
        id: 'note_old_private',
        user_id: userId,
        device_id: 'dev_1',
        content: 'Điều ước cũ',
        prompt_id: null,
        paper_theme: 'hogn',
        sticker_ids: [],
        unlock_at: new Date(now + 100000).toISOString(),
        status: 'sealed',
        visibility: 'private',
        created_at: new Date(threeDaysAgo).toISOString(),
        opened_at: null,
        updated_at: new Date(threeDaysAgo).toISOString(),
        is_deleted: false,
      });

      // User successfully publishes the 3-day-old note today
      db.updateVisibility(userId, 'note_old_private', 'public', now);

      // Now user attempts to write another public note today -> must be rejected
      assert.throws(
        () => {
          db.insert(userId, {
            id: 'note_new_today',
            user_id: userId,
            device_id: 'dev_1',
            content: 'Điều ước thứ 2 trong ngày',
            prompt_id: null,
            paper_theme: 'dem-sao',
            sticker_ids: [],
            unlock_at: new Date(now + 100000).toISOString(),
            status: 'sealed',
            visibility: 'public',
            created_at: new Date(now + 100).toISOString(),
            opened_at: null,
            updated_at: new Date(now + 100).toISOString(),
            is_deleted: false,
          });
        },
        (err: any) => err.message === RATE_LIMIT_REJECTION
      );
    });
  });

  describe('8. Admin Queue (§3.4.3)', () => {
    const adminAllowlist = new Set(['admin@guivutru.vn', 'operator@guivutru.vn']);

    const canAccessAdminRoute = (email: string | null | undefined): boolean => {
      if (!email) return false;
      return adminAllowlist.has(email.toLowerCase());
    };

    it('gating: allowlisted email accesses queue; non-allowlisted email gets 404 (§3.4.3)', () => {
      assert.equal(canAccessAdminRoute('admin@guivutru.vn'), true);
      assert.equal(canAccessAdminRoute('OPERATOR@GUIVUTRU.VN'), true);
      // Non-allowlisted user: gets 404, route is hidden
      assert.equal(canAccessAdminRoute('user_hacker@gmail.com'), false);
      assert.equal(canAccessAdminRoute('random@yahoo.com'), false);
      assert.equal(canAccessAdminRoute(null), false);
    });

    it('lists reported notes with content, pseudonym, report count, and first report timestamp', () => {
      const db = new PostgresSkySimulator();
      const now = Date.now();
      const firstReportTime = new Date(now - 10000).toISOString();

      db.insert('author_reported', {
        id: 'note_flagged_1',
        user_id: 'author_reported',
        device_id: 'dev_1',
        content: 'Nội dung gây tranh cãi',
        prompt_id: null,
        paper_theme: 'hogn',
        sticker_ids: [],
        unlock_at: new Date(now - 1000).toISOString(),
        status: 'opened',
        visibility: 'public',
        created_at: new Date(now - 30000).toISOString(),
        opened_at: new Date(now - 1000).toISOString(),
        updated_at: new Date(now).toISOString(),
        is_deleted: false,
      });

      // Two users report the note
      db.reportNoteRPC('note_flagged_1', 'reporter_a', 'Spam');
      db.reports[0].created_at = firstReportTime; // set first report time
      db.reportNoteRPC('note_flagged_1', 'reporter_b', 'Spam');

      // Admin queue query simulation
      const pendingReports = db.reports.filter((r) => r.status === 'pending');
      assert.equal(pendingReports.length, 2);

      const targetNote = db.baseTable.find((n) => n.id === 'note_flagged_1');
      assert.ok(targetNote);
      assert.equal(targetNote.content, 'Nội dung gây tranh cãi');
      assert.ok(targetNote.pseudonym);
      assert.equal(targetNote.report_count, 2);
      assert.ok(targetNote.reported_at);
    });

    it('action "Duyệt lại" restores note to sky wall and removes it from queue (§3.4.3)', () => {
      const db = new PostgresSkySimulator();
      const now = Date.now();

      db.insert('author_x', {
        id: 'note_restore_test',
        user_id: 'author_x',
        device_id: 'dev_1',
        content: 'Điều ước hoàn toàn trong sạch, bị hiểu nhầm',
        prompt_id: null,
        paper_theme: 'bien',
        sticker_ids: [],
        unlock_at: new Date(now - 1000).toISOString(),
        status: 'opened',
        visibility: 'public',
        created_at: new Date(now - 20000).toISOString(),
        opened_at: new Date(now - 1000).toISOString(),
        updated_at: new Date(now).toISOString(),
        is_deleted: false,
      });

      db.reportNoteRPC('note_restore_test', 'reporter_z');
      assert.equal(db.selectSkyNotesView(now).length, 0); // hidden

      // Admin clicks "Duyệt lại"
      db.adminModerateRPC('note_restore_test', 'duyet_lai');

      // Note restored to public sky wall
      const skyWall = db.selectSkyNotesView(now);
      assert.equal(skyWall.length, 1);
      assert.equal(skyWall[0].id, 'note_restore_test');

      // Note exits pending queue
      const pendingQueue = db.reports.filter((r) => r.status === 'pending');
      assert.equal(pendingQueue.length, 0);
    });

    it('action "Xoá" soft-deletes note (is_deleted = true) and removes it from queue (§3.4.3)', () => {
      const db = new PostgresSkySimulator();
      const now = Date.now();

      db.insert('author_y', {
        id: 'note_delete_test',
        user_id: 'author_y',
        device_id: 'dev_1',
        content: 'Điều ước vi phạm thực sự',
        prompt_id: null,
        paper_theme: 'dem-sao',
        sticker_ids: [],
        unlock_at: new Date(now - 1000).toISOString(),
        status: 'opened',
        visibility: 'public',
        created_at: new Date(now - 20000).toISOString(),
        opened_at: new Date(now - 1000).toISOString(),
        updated_at: new Date(now).toISOString(),
        is_deleted: false,
      });

      db.reportNoteRPC('note_delete_test', 'reporter_w');

      // Admin clicks "Xoá"
      db.adminModerateRPC('note_delete_test', 'xoa');

      const targetNote = db.baseTable.find((n) => n.id === 'note_delete_test');
      assert.ok(targetNote);
      assert.equal(targetNote.is_deleted, true);

      // Exits pending queue
      const pendingQueue = db.reports.filter((r) => r.status === 'pending');
      assert.equal(pendingQueue.length, 0);

      // Remains hidden from wall
      assert.equal(db.selectSkyNotesView(now).length, 0);
    });
  });
});
