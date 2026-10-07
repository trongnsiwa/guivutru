import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveNoteMerge } from '../src/lib/sync.ts';
import type { Note } from '../src/types/note.ts';

describe('Cross-Device Sync Simulation (§2.7 Acceptance)', () => {
  it('Device A uploads note -> Device B downloads and sees the same note', () => {
    // 1. Cloud server state initially empty
    let cloudServerNotes: Note[] = [];

    // 2. Device A creates a sealed note
    const deviceANotes: Note[] = [
      {
        id: 'note_from_device_a',
        serverId: 'note_from_device_a',
        content: 'Điều ước viết trên điện thoại A',
        promptId: 'uocmo',
        paperTheme: 'dem-sao',
        stickerIds: ['🌙'],
        unlockAt: Date.now() + 1000000,
        status: 'sealed',
        createdAt: 1000,
        openedAt: null,
        updatedAt: 1000,
      },
    ];

    // Device A uploads to cloud
    cloudServerNotes = [...deviceANotes];

    // 3. Device B starts empty
    const deviceBInitialNotes: Note[] = [];

    // Device B syncs with cloud
    const { mergedNotes: deviceBSynced } = resolveNoteMerge(
      deviceBInitialNotes,
      cloudServerNotes,
      false
    );

    // Verify Device B now sees note from Device A
    assert.strictEqual(deviceBSynced.length, 1);
    assert.strictEqual(deviceBSynced[0].id, 'note_from_device_a');
    assert.strictEqual(deviceBSynced[0].paperTheme, 'dem-sao');
    assert.strictEqual(deviceBSynced[0].status, 'sealed');
  });

  it('Device B opens unlocked note -> Device A syncs and sees note opened', () => {
    // 1. Existing note on cloud
    const existingCloudNote: Note = {
      id: 'capsule_note',
      serverId: 'capsule_note',
      content: 'Nội dung điều ước',
      promptId: null,
      paperTheme: 'bien',
      stickerIds: ['⭐'],
      unlockAt: 500,
      status: 'sealed',
      createdAt: 100,
      openedAt: null,
      updatedAt: 100,
    };

    let cloudServerNotes = [existingCloudNote];

    // 2. Device B opens the note after unlockAt passes
    const deviceBOpenedNote: Note = {
      ...existingCloudNote,
      status: 'opened',
      openedAt: 600,
      updatedAt: 600, // Newer timestamp
    };

    // Device B uploads update to cloud
    cloudServerNotes = [deviceBOpenedNote];

    // 3. Device A has the older local version
    const deviceALocalNotes: Note[] = [existingCloudNote];

    // Device A syncs
    const { mergedNotes: deviceASynced } = resolveNoteMerge(
      deviceALocalNotes,
      cloudServerNotes,
      false
    );

    assert.strictEqual(deviceASynced.length, 1);
    assert.strictEqual(deviceASynced[0].status, 'opened');
    assert.strictEqual(deviceASynced[0].openedAt, 600);
    assert.strictEqual(deviceASynced[0].updatedAt, 600);
  });

  it('Device A (2 local notes) + Device B (3 local notes) -> both sync -> 5 notes exist on both devices', () => {
    // Device A starts with 2 local-only notes (no serverId)
    const deviceALocal: Note[] = [
      {
        id: 'devA_1',
        content: 'Điều ước 1 từ A',
        promptId: null,
        paperTheme: 'dem-sao',
        stickerIds: [],
        unlockAt: 5000,
        status: 'sealed',
        createdAt: 1000,
        openedAt: null,
      },
      {
        id: 'devA_2',
        content: 'Điều ước 2 từ A',
        promptId: null,
        paperTheme: 'bien',
        stickerIds: [],
        unlockAt: 5000,
        status: 'sealed',
        createdAt: 1100,
        openedAt: null,
      },
    ];

    // Device B starts with 3 local-only notes (no serverId)
    const deviceBLocal: Note[] = [
      {
        id: 'devB_1',
        content: 'Điều ước 1 từ B',
        promptId: null,
        paperTheme: 'tim-mong',
        stickerIds: [],
        unlockAt: 5000,
        status: 'sealed',
        createdAt: 1200,
        openedAt: null,
      },
      {
        id: 'devB_2',
        content: 'Điều ước 2 từ B',
        promptId: null,
        paperTheme: 'rung',
        stickerIds: [],
        unlockAt: 5000,
        status: 'sealed',
        createdAt: 1300,
        openedAt: null,
      },
      {
        id: 'devB_3',
        content: 'Điều ước 3 từ B',
        promptId: null,
        paperTheme: 'giay-cu',
        stickerIds: [],
        unlockAt: 5000,
        status: 'sealed',
        createdAt: 1400,
        openedAt: null,
      },
    ];

    // 1. Device A syncs and uploads its 2 notes to cloud
    let cloudNotes: Note[] = [];
    const syncA1 = resolveNoteMerge(deviceALocal, cloudNotes, true);
    assert.strictEqual(syncA1.notesToUpload.length, 2);
    // Simulate server upload assigning serverId
    cloudNotes = syncA1.notesToUpload.map((n) => ({ ...n, serverId: n.id, updatedAt: n.createdAt }));
    const deviceAPostSync = cloudNotes;

    // 2. Device B syncs with cloud, uploading its 3 notes and downloading A's 2 notes
    const syncB = resolveNoteMerge(deviceBLocal, cloudNotes, true);
    assert.strictEqual(syncB.notesToUpload.length, 3);
    const uploadedFromB = syncB.notesToUpload.map((n) => ({ ...n, serverId: n.id, updatedAt: n.createdAt }));
    cloudNotes = [...cloudNotes, ...uploadedFromB];

    // Device B resolves final state
    const deviceBFinal = resolveNoteMerge(deviceBLocal, cloudNotes, false).mergedNotes;
    assert.strictEqual(deviceBFinal.length, 5, 'Device B must have all 5 notes');
    assert.ok(deviceBFinal.every((n) => n.serverId !== undefined), 'All notes must have serverId');

    // 3. Device A syncs again with updated cloud
    const deviceAFinal = resolveNoteMerge(deviceAPostSync, cloudNotes, false).mergedNotes;
    assert.strictEqual(deviceAFinal.length, 5, 'Device A must have all 5 notes');
    assert.ok(deviceAFinal.every((n) => n.serverId !== undefined), 'All notes must have serverId');
  });

  it('Conflict case: same note modified on both devices -> server wins on updated_at, losing version preserved as local conflict copy', () => {
    const originalNote: Note = {
      id: 'shared_note_01',
      serverId: 'shared_note_01',
      content: 'Nội dung ban đầu',
      promptId: null,
      paperTheme: 'dem-sao',
      stickerIds: [],
      unlockAt: 1000,
      status: 'opened',
      createdAt: 500,
      openedAt: 1000,
      updatedAt: 1000,
    };

    // Device A modified it locally (older timestamp)
    const deviceALocal: Note = {
      ...originalNote,
      content: 'Bản sửa đổi của Thiết bị A',
      updatedAt: 1500,
    };

    // Device B modified it on server (newer timestamp)
    const serverNote: Note = {
      ...originalNote,
      content: 'Bản sửa đổi của Thiết bị B',
      updatedAt: 2000,
    };

    const { mergedNotes, conflictCopiesCount } = resolveNoteMerge(
      [deviceALocal],
      [serverNote],
      false
    );

    // FIX 4: 2 notes must exist: server won note + local conflict copy
    assert.strictEqual(mergedNotes.length, 2);
    assert.strictEqual(conflictCopiesCount, 1);

    const winningNote = mergedNotes.find((n) => n.id === 'shared_note_01')!;
    assert.strictEqual(winningNote.content, 'Bản sửa đổi của Thiết bị B', 'Server version wins');

    const conflictCopy = mergedNotes.find((n) => n.id.startsWith('conflict_'))!;
    assert.strictEqual(conflictCopy.content, '[Bản sao xung đột] Bản sửa đổi của Thiết bị A', 'Losing version preserved');
    assert.strictEqual(conflictCopy.serverId, undefined, 'Conflict copy stays local only');
  });

  it('Edge cases: 0 local / 100 local / 0 server / 100 server combinations', () => {
    const makeNote = (id: string, isServer: boolean): Note => ({
      id,
      serverId: isServer ? id : undefined,
      content: `Note ${id}`,
      promptId: null,
      paperTheme: 'dem-sao',
      stickerIds: [],
      unlockAt: 5000,
      status: 'sealed',
      createdAt: 1000,
      openedAt: null,
    });

    const notes100Local = Array.from({ length: 100 }, (_, i) => makeNote(`loc_${i}`, false));
    const notes100Server = Array.from({ length: 100 }, (_, i) => makeNote(`srv_${i}`, true));

    // Combo 1: 0 local, 0 server
    const c1 = resolveNoteMerge([], [], true);
    assert.strictEqual(c1.mergedNotes.length, 0);
    assert.strictEqual(c1.notesToUpload.length, 0);

    // Combo 2: 0 local, 100 server
    const c2 = resolveNoteMerge([], notes100Server, true);
    assert.strictEqual(c2.mergedNotes.length, 100);
    assert.strictEqual(c2.notesToUpload.length, 0);

    // Combo 3: 100 local, 0 server (with upload consent)
    const c3 = resolveNoteMerge(notes100Local, [], true);
    assert.strictEqual(c3.mergedNotes.length, 100);
    assert.strictEqual(c3.notesToUpload.length, 100);

    // Combo 4: 100 local, 100 server (disjoint)
    const c4 = resolveNoteMerge(notes100Local, notes100Server, false);
    assert.strictEqual(c4.mergedNotes.length, 200);
  });
});

