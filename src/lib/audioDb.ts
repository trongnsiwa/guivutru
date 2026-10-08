/**
 * IndexedDB storage for local-only note audio recordings.
 *
 * Schema:
 * Database: "gvt_audio_db" (version 1)
 * Object Store: "audio_clips"
 * Primary Key: "noteId" (string)
 * Record: {
 *   noteId: string;
 *   blob: Blob;
 *   mimeType: string;
 *   durationSeconds: number;
 *   createdAt: number;
 * }
 */

const DB_NAME = 'gvt_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_clips';

export interface LocalAudioRecord {
  noteId: string;
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
  createdAt: number;
}

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not available'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'noteId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalAudio(
  noteId: string,
  blob: Blob,
  durationSeconds: number
): Promise<void> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: LocalAudioRecord = {
        noteId,
        blob,
        mimeType: blob.type || 'audio/webm',
        durationSeconds,
        createdAt: Date.now(),
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[AudioDB] Failed to save local audio clip:', err);
  }
}

export async function getLocalAudio(noteId: string): Promise<LocalAudioRecord | null> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(noteId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[AudioDB] Failed to retrieve local audio clip:', err);
    return null;
  }
}

export async function deleteLocalAudio(noteId: string): Promise<void> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(noteId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[AudioDB] Failed to delete local audio clip:', err);
  }
}
