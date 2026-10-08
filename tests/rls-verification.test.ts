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
  private reportsTable: Array<{ id: string; note_id: string; reporter_user_id: string | null; reason: string }> = [];
  private storageObjects: Array<{ bucket_id: string; name: string; owner_id: string; content: string }> = [];

  insertStorageObject(
    callerUserId: string,
    obj: { bucket_id: string; name: string; owner_id: string; content: string }
  ) {
    // Policy: "Users can upload own note audio"
    // WITH CHECK (bucket_id = 'note-audio' AND auth.uid()::text = (storage.foldername(name))[1])
    const folderUser = obj.name.split('/')[0];
    if (callerUserId !== folderUser) {
      throw new Error('Storage RLS policy violation: Cannot upload to another user folder');
    }
    this.storageObjects.push(obj);
  }

  readStorageObject(
    callerUserId: string,
    bucketId: string,
    objectPath: string,
    nowMs: number = Date.now()
  ) {
    // Policy: "Users can only read unlocked own note audio"
    // USING (bucket_id = 'note-audio' AND auth.uid()::text = (storage.foldername(name))[1] AND EXISTS (note.unlock_at <= now()))
    const folderUser = objectPath.split('/')[0];
    if (callerUserId !== folderUser) {
      return null; // Not owner
    }

    const filename = objectPath.split('/')[1] || '';
    const noteId = filename.split('.')[0];
    const parentNote = this.baseTable.find((n) => n.id === noteId && !n.is_deleted);

    if (!parentNote) return null;
    if (parentNote.user_id !== callerUserId) return null;

    // Load-bearing rule: if unlock_at > now, ZERO rows returned / NULL
    if (new Date(parentNote.unlock_at).getTime() > nowMs) {
      return null;
    }

    return this.storageObjects.find((o) => o.bucket_id === bucketId && o.name === objectPath) || null;
  }

  createSignedUrl(
    callerUserId: string,
    bucketId: string,
    objectPath: string,
    _expiresIn: number = 60,
    nowMs: number = Date.now()
  ): string {
    const obj = this.readStorageObject(callerUserId, bucketId, objectPath, nowMs);
    if (!obj) {
      throw new Error(
        'Storage RLS violation: Cannot generate signed URL for sealed note audio before unlock_at'
      );
    }
    return `https://supabase.co/storage/v1/object/sign/${bucketId}/${objectPath}?token=mock_signed_token_60s`;
  }

  insert(callerUserId: string, row: DBRow, nowMs: number = Date.now()) {
    // Policy: "Users can insert own notes" WITH CHECK (auth.uid() = user_id)
    if (callerUserId !== row.user_id) {
      throw new Error('RLS violation: insert denied for non-owner');
    }

    // FIX 2: Hardened handle_notes_insert & tr_notes_base_seal_integrity:
    // If unlock_at > now(), status is FORCED to 'sealed' regardless of what client sent
    const isFuture = new Date(row.unlock_at).getTime() > nowMs;
    const finalStatus: 'sealed' | 'opened' = isFuture ? 'sealed' : row.status;

    this.baseTable.push({
      ...row,
      status: finalStatus,
      opened_at: finalStatus === 'opened' ? (row.opened_at || new Date(nowMs).toISOString()) : null,
    });
  }

  /**
   * Simulates updating via the public.notes view (handled by handle_notes_update)
   */
  updateNotesView(
    callerUserId: string,
    targetNoteId: string,
    patch: Partial<DBRow>,
    nowMs: number = Date.now()
  ) {
    const existing = this.baseTable.find(
      (r) => r.id === targetNoteId && r.user_id === callerUserId && !r.is_deleted
    );

    if (!existing) {
      throw new Error('Note not found');
    }

    // FIX 1: Reject altering unlock_at while sealed and unlock_at is in future
    if (existing.status === 'sealed' && new Date(existing.unlock_at).getTime() > nowMs) {
      if (patch.unlock_at !== undefined && patch.unlock_at !== existing.unlock_at) {
        throw new Error('Cannot modify unlock date of a sealed note before unlock time');
      }
    }

    // FIX 1: Reject transitioning status to 'opened' before unlock_at
    const targetUnlockAt = patch.unlock_at !== undefined ? patch.unlock_at : existing.unlock_at;
    if (patch.status === 'opened' && new Date(targetUnlockAt).getTime() > nowMs) {
      throw new Error('Cannot open a sealed note before unlock_at');
    }

    // Apply allowed fields
    Object.assign(existing, patch);
    existing.updated_at = new Date(nowMs).toISOString();
    return { ...existing };
  }

  /**
   * Simulates direct INSERT on public.reports.
   * FIX 5: REVOKE INSERT ON public.reports FROM anon, authenticated
   */
  directInsertReports(_callerUserId: string | null, _report: any) {
    throw new Error('Permission denied: direct INSERT on public.reports is revoked.');
  }

  /**
   * Simulates public.report_note(p_note_id, p_reason) RPC (SECURITY DEFINER)
   */
  reportNoteRPC(callerUserId: string | null, noteId: string, reason: string = 'Inappropriate content') {
    const note = this.baseTable.find((r) => r.id === noteId && !r.is_deleted);
    if (!note) {
      throw new Error('Note not found');
    }

    if (callerUserId && note.user_id === callerUserId) {
      throw new Error('Cannot report your own note');
    }

    if (callerUserId && this.reportsTable.some((r) => r.note_id === noteId && r.reporter_user_id === callerUserId)) {
      throw new Error('Already reported');
    }

    this.reportsTable.push({
      id: `rep_${Date.now()}`,
      note_id: noteId,
      reporter_user_id: callerUserId,
      reason,
    });

    return true;
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

  it('TEST 5: Attempting to insert a note with status=opened and future unlock_at forces status=sealed', () => {
    const db = new PostgresPostgrestSimulator();

    db.insert(OWNER_ID, {
      id: 'note_opened_exploit_attempt',
      user_id: OWNER_ID,
      device_id: 'dev_1',
      content: 'Nội dung bí mật tương lai',
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
    }, NOW);

    const results = db.selectNotesView(OWNER_ID, NOW);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].status, 'sealed', 'Status MUST be coerced to sealed on future unlock');
    assert.strictEqual(results[0].content, null, 'Content MUST remain masked (null) before unlock_at');
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
    }, NOW);

    const results = db.selectNotesView(OWNER_ID, NOW);
    assert.strictEqual(results.length, 0, 'Soft deleted note must not be returned');
  });

  it('TEST 7: FIX 1 - PATCH status to opened on sealed note before unlock_at is rejected', () => {
    const db = new PostgresPostgrestSimulator();

    db.insert(OWNER_ID, {
      id: 'note_sealed_exploit',
      user_id: OWNER_ID,
      device_id: 'dev_1',
      content: 'Tuyệt mật không ai được xem',
      prompt_id: null,
      paper_theme: 'dem-sao',
      sticker_ids: [],
      unlock_at: FUTURE_UNLOCK,
      status: 'sealed',
      visibility: 'private',
      created_at: new Date(NOW).toISOString(),
      opened_at: null,
      updated_at: new Date(NOW).toISOString(),
      is_deleted: false,
    }, NOW);

    assert.throws(
      () => db.updateNotesView(OWNER_ID, 'note_sealed_exploit', { status: 'opened' }, NOW),
      /Cannot open a sealed note before unlock_at/
    );

    // Confirm content remains null
    const results = db.selectNotesView(OWNER_ID, NOW);
    assert.strictEqual(results[0].content, null);
    assert.strictEqual(results[0].status, 'sealed');
  });

  it('TEST 8: FIX 1 - PATCH unlock_at on sealed note to backdate it is rejected', () => {
    const db = new PostgresPostgrestSimulator();

    db.insert(OWNER_ID, {
      id: 'note_sealed_backdate',
      user_id: OWNER_ID,
      device_id: 'dev_1',
      content: 'Nội dung không thể mở sớm',
      prompt_id: null,
      paper_theme: 'dem-sao',
      sticker_ids: [],
      unlock_at: FUTURE_UNLOCK,
      status: 'sealed',
      visibility: 'private',
      created_at: new Date(NOW).toISOString(),
      opened_at: null,
      updated_at: new Date(NOW).toISOString(),
      is_deleted: false,
    }, NOW);

    assert.throws(
      () => db.updateNotesView(OWNER_ID, 'note_sealed_backdate', { unlock_at: PAST_UNLOCK }, NOW),
      /Cannot modify unlock date of a sealed note before unlock time/
    );

    // Confirm content remains null
    const results = db.selectNotesView(OWNER_ID, NOW);
    assert.strictEqual(results[0].content, null);
    assert.strictEqual(results[0].status, 'sealed');
  });

  it('TEST 9: FIX 5 - Direct INSERT on public.reports is rejected; report_note RPC works with auth bind', () => {
    const db = new PostgresPostgrestSimulator();

    db.insert(OWNER_ID, {
      id: 'public_note_1',
      user_id: OWNER_ID,
      device_id: 'dev_1',
      content: 'Public note content',
      prompt_id: null,
      paper_theme: 'dem-sao',
      sticker_ids: [],
      unlock_at: PAST_UNLOCK,
      status: 'opened',
      visibility: 'public',
      created_at: new Date(NOW).toISOString(),
      opened_at: new Date(NOW).toISOString(),
      updated_at: new Date(NOW).toISOString(),
      is_deleted: false,
    }, NOW);

    // Direct INSERT on reports table is revoked
    assert.throws(
      () => db.directInsertReports(STRANGER_ID, { note_id: 'public_note_1', reporter_user_id: OWNER_ID }),
      /Permission denied: direct INSERT on public.reports is revoked/
    );

    // Reporting via RPC works
    const rpcRes = db.reportNoteRPC(STRANGER_ID, 'public_note_1', 'Spam');
    assert.strictEqual(rpcRes, true);

    // Cannot report own note via RPC
    assert.throws(
      () => db.reportNoteRPC(OWNER_ID, 'public_note_1'),
      /Cannot report your own note/
    );
  });

  it('TEST 10: VOICE NOTES STORAGE RLS - Sealed audio object is NEVER readable before unlock_at, even by owner', () => {
    const db = new PostgresPostgrestSimulator();

    // Insert sealed note with future unlock_at and audio
    db.insert(OWNER_ID, {
      id: 'note_with_audio_sealed',
      user_id: OWNER_ID,
      device_id: 'dev_1',
      content: 'Điều ước kèm giọng nói bí mật',
      prompt_id: null,
      paper_theme: 'dem-sao',
      sticker_ids: [],
      unlock_at: FUTURE_UNLOCK,
      status: 'sealed',
      visibility: 'private',
      created_at: new Date(NOW).toISOString(),
      opened_at: null,
      updated_at: new Date(NOW).toISOString(),
      is_deleted: false,
    }, NOW);

    // Upload audio object to storage bucket 'note-audio'
    db.insertStorageObject(OWNER_ID, {
      bucket_id: 'note-audio',
      name: `${OWNER_ID}/note_with_audio_sealed.webm`,
      owner_id: OWNER_ID,
      content: 'RAW_AUDIO_STREAM_DATA',
    });

    // 1. Owner attempts to read sealed audio BEFORE unlock: MUST RETURN NULL (0 rows / 403 / denied)
    const sealedFetch = db.readStorageObject(OWNER_ID, 'note-audio', `${OWNER_ID}/note_with_audio_sealed.webm`, NOW);
    assert.strictEqual(
      sealedFetch,
      null,
      'LOAD-BEARING GUARANTEE: Storage RLS must return NULL for sealed audio before unlock_at'
    );

    // 2. Stranger attempts to read sealed audio: MUST RETURN NULL
    const strangerFetch = db.readStorageObject(STRANGER_ID, 'note-audio', `${OWNER_ID}/note_with_audio_sealed.webm`, NOW);
    assert.strictEqual(strangerFetch, null);

    // 3. Signed URL generation attempt before unlock fails with policy violation
    assert.throws(
      () => db.createSignedUrl(OWNER_ID, 'note-audio', `${OWNER_ID}/note_with_audio_sealed.webm`, 60, NOW),
      /Storage RLS violation: Cannot generate signed URL for sealed note audio before unlock_at/
    );
  });

  it('TEST 11: VOICE NOTES STORAGE RLS - Audio becomes readable and signed URL succeeds after unlock_at', () => {
    const db = new PostgresPostgrestSimulator();
    const UNLOCK_TIME = NOW + 1000;

    db.insert(OWNER_ID, {
      id: 'note_audio_unlocked',
      user_id: OWNER_ID,
      device_id: 'dev_1',
      content: 'Điều ước giọng nói đã mở',
      prompt_id: null,
      paper_theme: 'dem-sao',
      sticker_ids: [],
      unlock_at: new Date(UNLOCK_TIME).toISOString(),
      status: 'sealed',
      visibility: 'private',
      created_at: new Date(NOW).toISOString(),
      opened_at: null,
      updated_at: new Date(NOW).toISOString(),
      is_deleted: false,
    }, NOW);

    db.insertStorageObject(OWNER_ID, {
      bucket_id: 'note-audio',
      name: `${OWNER_ID}/note_audio_unlocked.webm`,
      owner_id: OWNER_ID,
      content: 'RAW_AUDIO_STREAM_DATA',
    });

    // Before unlock: blocked
    assert.strictEqual(
      db.readStorageObject(OWNER_ID, 'note-audio', `${OWNER_ID}/note_audio_unlocked.webm`, NOW),
      null
    );

    // At unlock_at: readable by owner
    const unlockedFetch = db.readStorageObject(
      OWNER_ID,
      'note-audio',
      `${OWNER_ID}/note_audio_unlocked.webm`,
      UNLOCK_TIME
    );
    assert.notStrictEqual(unlockedFetch, null);
    assert.strictEqual(unlockedFetch?.content, 'RAW_AUDIO_STREAM_DATA');

    // Signed URL generation succeeds after unlock_at
    const signedUrl = db.createSignedUrl(
      OWNER_ID,
      'note-audio',
      `${OWNER_ID}/note_audio_unlocked.webm`,
      60,
      UNLOCK_TIME
    );
    assert.ok(signedUrl.includes('token='));

    // Stranger still cannot read even after unlock
    const strangerFetch = db.readStorageObject(
      STRANGER_ID,
      'note-audio',
      `${OWNER_ID}/note_audio_unlocked.webm`,
      UNLOCK_TIME
    );
    assert.strictEqual(strangerFetch, null);
  });

  it('TEST 12: Storage RLS enforces folder user_id matches auth.uid() during insert', () => {
    const db = new PostgresPostgrestSimulator();

    // Trying to upload audio into another user's path is rejected
    assert.throws(
      () =>
        db.insertStorageObject(OWNER_ID, {
          bucket_id: 'note-audio',
          name: `${STRANGER_ID}/spoofed_note.webm`,
          owner_id: OWNER_ID,
          content: 'SPOOF',
        }),
      /Storage RLS policy violation/
    );
  });
});
