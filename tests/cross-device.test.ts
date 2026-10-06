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
});
