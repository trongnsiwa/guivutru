import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { storage } from '../src/lib/storage.ts';
import type { Note } from '../src/types/note.ts';
import { STORAGE_KEYS } from '../src/lib/constants.ts';

// Mock localStorage in Node environment
class MockLocalStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

describe('Offline / No-Account Behavior (§2.5 & §2.7 Acceptance)', () => {
  // Inject mock localStorage
  const mockStorage = new MockLocalStorage();
  // @ts-expect-error global polyfill for node
  globalThis.localStorage = mockStorage;

  it('OFFLINE 1: App initializes with empty notes list when offline', () => {
    mockStorage.clear();
    const notes = storage.getNotes();
    assert.deepStrictEqual(notes, []);
  });

  it('OFFLINE 2: User can create and seal note fully offline with no credentials', () => {
    mockStorage.clear();

    const offlineNote: Note = {
      id: 'local_offline_123',
      content: 'Ước mơ không cần mạng internet',
      promptId: 'uocmo',
      paperTheme: 'dem-sao',
      stickerIds: ['🌙'],
      unlockAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      status: 'sealed',
      createdAt: Date.now(),
      openedAt: null,
    };

    storage.addNote(offlineNote);

    const saved = storage.getNotes();
    assert.strictEqual(saved.length, 1);
    assert.strictEqual(saved[0].id, 'local_offline_123');
    assert.strictEqual(saved[0].content, 'Ước mơ không cần mạng internet');
    assert.strictEqual(saved[0].status, 'sealed');

    // Confirm stored in standard v1 key
    const raw = mockStorage.getItem(STORAGE_KEYS.NOTES);
    assert.ok(raw);
    assert.ok(raw.includes('local_offline_123'));
  });

  it('OFFLINE 3: User can open unlocked note offline', () => {
    storage.updateNote('local_offline_123', {
      status: 'opened',
      openedAt: Date.now(),
    });

    const note = storage.getNoteById('local_offline_123');
    assert.ok(note);
    assert.strictEqual(note?.status, 'opened');
    assert.ok(note?.openedAt);
  });

  it('OFFLINE 4: User can delete note offline', () => {
    storage.deleteNote('local_offline_123');
    const remaining = storage.getNotes();
    assert.strictEqual(remaining.length, 0);
  });
});
