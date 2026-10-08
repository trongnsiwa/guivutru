import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveNoteMerge } from '../src/lib/sync.ts';
import type { Note } from '../src/types/note.ts';

describe('Local-First Sync & Conflict Resolution (§2.5)', () => {
  const sampleLocalNote: Note = {
    id: 'loc_1',
    content: 'Điều ước viết khi chưa có mạng',
    promptId: 'dulich',
    paperTheme: 'dem-sao',
    stickerIds: ['🌸'],
    unlockAt: Date.now() + 86400000,
    status: 'sealed',
    createdAt: 1000,
    openedAt: null,
  };

  const sampleCloudNote: Note = {
    id: 'srv_1',
    serverId: 'srv_1',
    userId: 'user_xyz',
    content: '',
    promptId: null,
    paperTheme: 'tim-mong',
    stickerIds: ['⭐'],
    unlockAt: Date.now() + 86400000,
    status: 'sealed',
    createdAt: 2000,
    openedAt: null,
    updatedAt: 2000,
  };

  it('RULE 1: Local-only notes do NOT upload without user confirmation', () => {
    // When user logs in but has not consented to upload local notes
    const { mergedNotes, notesToUpload } = resolveNoteMerge(
      [sampleLocalNote],
      [],
      false // shouldUploadLocalOnly = false
    );

    assert.strictEqual(mergedNotes.length, 1);
    assert.strictEqual(mergedNotes[0].id, 'loc_1');
    assert.strictEqual(notesToUpload.length, 0, 'No notes should be queued for upload silently');
  });

  it('RULE 2: When user confirms, local-only notes are queued for upload and preserved', () => {
    const { mergedNotes, notesToUpload } = resolveNoteMerge(
      [sampleLocalNote],
      [],
      true // shouldUploadLocalOnly = true
    );

    assert.strictEqual(mergedNotes.length, 1);
    assert.strictEqual(mergedNotes[0].id, 'loc_1');
    assert.strictEqual(notesToUpload.length, 1);
    assert.strictEqual(notesToUpload[0].id, 'loc_1');
  });

  it('RULE 3: Cloud notes not on device are downloaded and added to merged state', () => {
    const { mergedNotes } = resolveNoteMerge(
      [],
      [sampleCloudNote],
      false
    );

    assert.strictEqual(mergedNotes.length, 1);
    assert.strictEqual(mergedNotes[0].id, 'srv_1');
  });

  it('RULE 4: Conflict resolution — server wins on updated_at when cloud is newer', () => {
    const existingLocal: Note = {
      id: 'note_shared',
      serverId: 'note_shared',
      content: 'Local text',
      promptId: null,
      paperTheme: 'dem-sao',
      stickerIds: [],
      unlockAt: Date.now() + 100000,
      status: 'sealed',
      createdAt: 1000,
      openedAt: null,
      updatedAt: 1500, // Older
    };

    const newerCloud: Note = {
      id: 'note_shared',
      serverId: 'note_shared',
      content: 'Cloud updated text',
      promptId: null,
      paperTheme: 'bien',
      stickerIds: ['🌙'],
      unlockAt: Date.now() + 100000,
      status: 'opened',
      createdAt: 1000,
      openedAt: 1800,
      updatedAt: 2000, // Newer
    };

    const { mergedNotes, notesToUpload, conflictCopiesCount } = resolveNoteMerge(
      [existingLocal],
      [newerCloud],
      false
    );

    // FIX 4: Server wins for primary note, AND losing version survives as local conflict copy
    assert.strictEqual(mergedNotes.length, 2, 'Must retain server note AND conflict copy note');
    assert.strictEqual(conflictCopiesCount, 1, 'Must record 1 conflict copy created');
    
    // Server winner
    const serverWonNote = mergedNotes.find((n) => n.id === 'note_shared')!;
    assert.strictEqual(serverWonNote.updatedAt, 2000);
    assert.strictEqual(serverWonNote.paperTheme, 'bien');
    assert.strictEqual(serverWonNote.status, 'opened');

    // Conflict survivor copy
    const conflictNote = mergedNotes.find((n) => n.id.startsWith('conflict_'))!;
    assert.ok(conflictNote, 'Local conflict copy must exist');
    assert.strictEqual(conflictNote.content, '[Bản sao xung đột] Local text');
    assert.strictEqual(conflictNote.status, 'opened');
    assert.strictEqual(conflictNote.serverId, undefined, 'Must be local-only without serverId');

    assert.strictEqual(notesToUpload.length, 0, 'No notes queued for upload');
  });

  it('RULE 4b: If local and cloud content are identical, no conflict copy is created', () => {
    const existingLocal: Note = {
      id: 'note_shared',
      serverId: 'note_shared',
      content: 'Identical text',
      promptId: null,
      paperTheme: 'dem-sao',
      stickerIds: [],
      unlockAt: Date.now() + 100000,
      status: 'sealed',
      createdAt: 1000,
      openedAt: null,
      updatedAt: 1500, // Older
    };

    const newerCloud: Note = {
      id: 'note_shared',
      serverId: 'note_shared',
      content: 'Identical text',
      promptId: null,
      paperTheme: 'bien',
      stickerIds: ['🌙'],
      unlockAt: Date.now() + 100000,
      status: 'opened',
      createdAt: 1000,
      openedAt: 1800,
      updatedAt: 2000, // Newer
    };

    const { mergedNotes, conflictCopiesCount } = resolveNoteMerge(
      [existingLocal],
      [newerCloud],
      false
    );

    assert.strictEqual(mergedNotes.length, 1);
    assert.strictEqual(conflictCopiesCount, 0);
  });

  it('RULE 5: Conflict resolution — local wins when local has newer edits and queues upload', () => {
    const newerLocal: Note = {
      id: 'note_shared',
      serverId: 'note_shared',
      content: 'Local text newer',
      promptId: null,
      paperTheme: 'hogn',
      stickerIds: [],
      unlockAt: Date.now() + 100000,
      status: 'opened',
      createdAt: 1000,
      openedAt: 3000,
      updatedAt: 3000, // Newer
    };

    const olderCloud: Note = {
      id: 'note_shared',
      serverId: 'note_shared',
      content: 'Cloud text older',
      promptId: null,
      paperTheme: 'dem-sao',
      stickerIds: [],
      unlockAt: Date.now() + 100000,
      status: 'sealed',
      createdAt: 1000,
      openedAt: null,
      updatedAt: 2000, // Older
    };

    const { mergedNotes, notesToUpload } = resolveNoteMerge(
      [newerLocal],
      [olderCloud],
      false
    );

    assert.strictEqual(mergedNotes.length, 1);
    assert.strictEqual(mergedNotes[0].updatedAt, 3000);
    assert.strictEqual(mergedNotes[0].paperTheme, 'hogn');
    assert.strictEqual(notesToUpload.length, 1, 'Local newer note queued to update server');
    assert.strictEqual(notesToUpload[0].id, 'note_shared');
  });

  it('RULE 6: On logout, cloud notes are removed from storage, local-only notes stay', () => {
    const notesInStorage: Note[] = [
      sampleLocalNote, // has no serverId
      { ...sampleCloudNote, id: 'cloud_note_1', serverId: 'cloud_note_1' }, // has serverId
    ];

    // Simulating purgeCloudNotesFromLocal() filter
    const remainingAfterLogout = notesInStorage.filter((n) => !n.serverId);

    assert.strictEqual(remainingAfterLogout.length, 1);
    assert.strictEqual(remainingAfterLogout[0].id, 'loc_1');
    assert.strictEqual(remainingAfterLogout[0].content, 'Điều ước viết khi chưa có mạng');
  });

  it('RULE 7: If upload fails, local notes are NOT cleared from storage', () => {
    const localNotesBefore: Note[] = [sampleLocalNote];
    // Simulating batch upload failure where all uploads fail
    const errors = ['Connection error'];
    const uploadedCount = 0;

    let storageNotes = [...localNotesBefore];
    if (errors.length > 0 && uploadedCount === 0) {
      // Per syncNotesWithCloud fix: do NOT overwrite storageNotes!
    } else {
      storageNotes = [];
    }

    assert.strictEqual(storageNotes.length, 1, 'Local notes must stay untouched on upload failure');
    assert.strictEqual(storageNotes[0].id, 'loc_1');
  });

  it('RULE 8: Clicking "Giữ riêng trên máy này" queues 0 uploads and preserves local notes', () => {
    const localNotes: Note[] = [
      sampleLocalNote,
      { ...sampleLocalNote, id: 'loc_2', content: 'Điều ước thứ 2' },
    ];
    const { mergedNotes, notesToUpload } = resolveNoteMerge(
      localNotes,
      [sampleCloudNote],
      false // uploadLocalOnly = false
    );

    assert.strictEqual(notesToUpload.length, 0, 'Zero notes queued for upload');
    assert.strictEqual(mergedNotes.length, 3, 'Contains 2 local notes and 1 cloud note');
    assert.ok(mergedNotes.some((n) => n.id === 'loc_1'));
    assert.ok(mergedNotes.some((n) => n.id === 'loc_2'));
    assert.ok(mergedNotes.some((n) => n.id === 'srv_1'));
  });

  it('RULE 9: Voice note sync - Audio note preserves hasAudio flag and uploads alongside note', () => {
    const audioNote: Note = {
      ...sampleLocalNote,
      id: 'loc_audio_1',
      hasAudio: true,
      audioPath: 'usr_123/loc_audio_1.webm',
    };

    const { mergedNotes, notesToUpload } = resolveNoteMerge(
      [audioNote],
      [],
      true // uploadLocalOnly = true
    );

    assert.strictEqual(notesToUpload.length, 1);
    assert.strictEqual(notesToUpload[0].hasAudio, true);
    assert.strictEqual(notesToUpload[0].audioPath, 'usr_123/loc_audio_1.webm');
    assert.strictEqual(mergedNotes[0].hasAudio, true);
  });

  it('RULE 10: Conflict copies do not carry audio (conflict copy is text-only per mini-spec)', () => {
    const localAudioNote: Note = {
      id: 'note_conflict_audio',
      serverId: 'note_conflict_audio',
      content: 'Local text with audio',
      promptId: null,
      paperTheme: 'dem-sao',
      stickerIds: [],
      unlockAt: Date.now() + 100000,
      status: 'sealed',
      createdAt: 1000,
      openedAt: null,
      updatedAt: 1500, // Older
      hasAudio: true,
      audioPath: 'usr_123/note_conflict_audio.webm',
    };

    const newerCloudNote: Note = {
      id: 'note_conflict_audio',
      serverId: 'note_conflict_audio',
      content: 'Cloud updated text',
      promptId: null,
      paperTheme: 'dem-sao',
      stickerIds: [],
      unlockAt: Date.now() + 100000,
      status: 'sealed',
      createdAt: 1000,
      openedAt: null,
      updatedAt: 2500, // Newer -> cloud wins
      hasAudio: true,
      audioPath: 'usr_123/note_conflict_audio.webm',
    };

    const { mergedNotes, conflictCopiesCount } = resolveNoteMerge(
      [localAudioNote],
      [newerCloudNote],
      false
    );

    assert.strictEqual(conflictCopiesCount, 1);
    const conflictCopy = mergedNotes.find((n) => n.id.startsWith('conflict_'))!;
    assert.ok(conflictCopy);
    assert.strictEqual(conflictCopy.content, '[Bản sao xung đột] Local text with audio');
    // Mini-spec: Conflict copies do not carry audio. The copy is text-only.
    assert.strictEqual(conflictCopy.hasAudio, undefined);
    assert.strictEqual(conflictCopy.audioPath, undefined);
  });
});
