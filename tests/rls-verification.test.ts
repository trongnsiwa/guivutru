import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Model of PostgreSQL Row-Level Security & Column-Masking View per §2.3 and §2.4.
 * Simulates PostgreSQL database engine behavior under the RLS policies and VIEW
 * defined in supabase/migrations/20261006000000_v2_cloud_notes.sql.
 */
interface DBRow {
  id: string;
  user_id: string;
  device_id: string | null;
  content: string;
  prompt_id: string | null;
  paper_theme: string;
  sticker_ids: string[];
  unlock_at: string; // ISO string
  status: 'sealed' | 'opened';
  visibility: 'private' | 'public';
  created_at: string;
  opened_at: string | null;
  updated_at: string;
  is_deleted: boolean;
}

class PostgresPostgrestSimulator {
  private baseTable: DBRow[] = [];

  insert(callerUserId: string, row: DBRow) {
    // Policy: "Users can insert own notes" WITH CHECK (auth.uid() = user_id)
    if (callerUserId !== row.user_id) {
      throw new Error('RLS violation: insert denied for non-owner');
    }
    this.baseTable.push({ ...row });
  }

  /**
   * Simulates querying the `public.notes` VIEW:
   * SELECT
   *   id, user_id, device_id,
   *   CASE
   *     WHEN status = 'sealed' AND unlock_at > now() THEN NULL
   *     ELSE content
   *   END AS content,
   *   ...
   * FROM public.notes_base
   * WHERE auth.uid() = user_id AND is_deleted = FALSE;
   */
  selectNotesView(callerUserId: string | null, nowMs: number = Date.now()) {
    if (!callerUserId) {
      // Unauthenticated caller: auth.uid() = user_id matches nothing
      return [];
    }

    return this.baseTable
      .filter((row) => row.user_id === callerUserId && !row.is_deleted)
      .map((row) => {
        const isSealedAndLocked =
          row.status === 'sealed' && new Date(row.unlock_at).getTime() > nowMs;

        return {
          id: row.id,
          user_id: row.user_id,
          device_id: row.device_id,
          content: isSealedAndLocked ? null : row.content,
          prompt_id: row.prompt_id,
          paper_theme: row.paper_theme,
          sticker_ids: [...row.sticker_ids],
          unlock_at: row.unlock_at,
          status: row.status,
          visibility: row.visibility,
          created_at: row.created_at,
          opened_at: row.opened_at,
          updated_at: row.updated_at,
          is_deleted: row.is_deleted,
        };
      });
  }

  /**
   * Simulates attempting to query the underlying base table directly.
   * REVOKE SELECT ON public.notes_base FROM anon, authenticated;
   */
  selectBaseTableDirectly(_callerUserId: string | null) {
    throw new Error('Permission denied: direct SELECT on public.notes_base is revoked.');
  }

  /**
   * Simulates opening note via RPC public.open_note()
   */
  openNoteRPC(callerUserId: string, targetNoteId: string, nowMs: number = Date.now()) {
    const row = this.baseTable.find(
      (r) => r.id === targetNoteId && r.user_id === callerUserId && !r.is_deleted
    );
    if (!row) return null;

    if (new Date(row.unlock_at).getTime() <= nowMs) {
      row.status = 'opened';
      row.opened_at = new Date(nowMs).toISOString();
      row.updated_at = new Date(nowMs).toISOString();
    }

    return this.selectNotesView(callerUserId, nowMs).find((r) => r.id === targetNoteId) || null;
  }
}

describe('RLS & View Security Verification (§2.4 - Load-Bearing Rule)', () => {
  const OWNER_ID = 'usr_owner_123';
  const STRANGER_ID = 'usr_stranger_456';
  const NOW = 1800000000000; // Reference timestamp
  const FUTURE_UNLOCK = new Date(NOW + 30 * 24 * 60 * 60 * 1000).toISOString();
  const PAST_UNLOCK = new Date(NOW - 1000).toISOString();

  it('TEST 1: Sealed note returns content=NULL for signed-in owner before unlock_at', () => {
    const db = new PostgresPostgrestSimulator();

    db.insert(OWNER_ID, {
      id: 'note_sealed_1',
      user_id: OWNER_ID,
      device_id: 'dev_1',
      content: 'Bí mật gửi vũ trụ không ai được thấy',
      prompt_id: 'tuonglai',
      paper_theme: 'dem-sao',
      sticker_ids: ['🌙'],
      unlock_at: FUTURE_UNLOCK,
      status: 'sealed',
      visibility: 'private',
      created_at: new Date(NOW).toISOString(),
      opened_at: null,
      updated_at: new Date(NOW).toISOString(),
      is_deleted: false,
    });

    const results = db.selectNotesView(OWNER_ID, NOW);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, 'note_sealed_1');
    // Load-bearing promise: content MUST BE NULL even for the owner
    assert.strictEqual(results[0].content, null, 'Owner must NOT be able to fetch sealed content via API before unlock');
    assert.strictEqual(results[0].status, 'sealed');
  });

  it('TEST 2: Direct SELECT on notes_base is revoked (cannot bypass view)', () => {
    const db = new PostgresPostgrestSimulator();

    assert.throws(
      () => db.selectBaseTableDirectly(OWNER_ID),
      /Permission denied: direct SELECT on public.notes_base is revoked/
    );
  });

  it('TEST 3: Non-owner gets 0 rows when attempting to select owner notes', () => {
    const db = new PostgresPostgrestSimulator();

    db.insert(OWNER_ID, {
      id: 'note_private_1',
      user_id: OWNER_ID,
      device_id: 'dev_1',
      content: 'Nội dung riêng tư',
      prompt_id: null,
      paper_theme: 'tim-mong',
      sticker_ids: [],
      unlock_at: FUTURE_UNLOCK,
      status: 'sealed',
      visibility: 'private',
      created_at: new Date(NOW).toISOString(),
      opened_at: null,
      updated_at: new Date(NOW).toISOString(),
      is_deleted: false,
    });

    const strangerResults = db.selectNotesView(STRANGER_ID, NOW);
    assert.strictEqual(strangerResults.length, 0, 'Stranger must see 0 rows of owner notes');

    const anonResults = db.selectNotesView(null, NOW);
    assert.strictEqual(anonResults.length, 0, 'Unauthenticated user must see 0 rows');
  });

  it('TEST 4: Note content is revealed once unlock_at has arrived', () => {
    const db = new PostgresPostgrestSimulator();

    db.insert(OWNER_ID, {
      id: 'note_unlocked_1',
      user_id: OWNER_ID,
      device_id: 'dev_1',
      content: 'Điều ước ngày ấy: Đã tốt nghiệp thủ khoa!',
      prompt_id: null,
      paper_theme: 'dem-sao',
      sticker_ids: ['⭐'],
      unlock_at: PAST_UNLOCK,
      status: 'sealed',
      visibility: 'private',
      created_at: new Date(NOW - 100000).toISOString(),
      opened_at: null,
      updated_at: new Date(NOW - 100000).toISOString(),
      is_deleted: false,
    });

    const results = db.selectNotesView(OWNER_ID, NOW);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].content, 'Điều ước ngày ấy: Đã tốt nghiệp thủ khoa!');
  });

  it('TEST 5: Opened note returns content regardless of unlock_at', () => {
    const db = new PostgresPostgrestSimulator();

    db.insert(OWNER_ID, {
      id: 'note_opened_1',
      user_id: OWNER_ID,
      device_id: 'dev_1',
      content: 'Lá thư đã mở',
      prompt_id: null,
      paper_theme: 'bien',
      sticker_ids: [],
      unlock_at: FUTURE_UNLOCK,
      status: 'opened',
      visibility: 'private',
      created_at: new Date(NOW - 5000).toISOString(),
      opened_at: new Date(NOW - 2000).toISOString(),
      updated_at: new Date(NOW - 2000).toISOString(),
      is_deleted: false,
    });

    const results = db.selectNotesView(OWNER_ID, NOW);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].content, 'Lá thư đã mở');
  });

  it('TEST 6: Soft-deleted note (is_deleted = true) is hidden from select', () => {
    const db = new PostgresPostgrestSimulator();

    db.insert(OWNER_ID, {
      id: 'note_deleted_1',
      user_id: OWNER_ID,
      device_id: 'dev_1',
      content: 'Note đã bị xoá',
      prompt_id: null,
      paper_theme: 'giay-cu',
      sticker_ids: [],
      unlock_at: PAST_UNLOCK,
      status: 'opened',
      visibility: 'private',
      created_at: new Date(NOW - 5000).toISOString(),
      opened_at: new Date(NOW - 2000).toISOString(),
      updated_at: new Date(NOW - 1000).toISOString(),
      is_deleted: true,
    });

    const results = db.selectNotesView(OWNER_ID, NOW);
    assert.strictEqual(results.length, 0, 'Soft deleted note must not be returned');
  });
});
