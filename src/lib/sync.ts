import type { Note, CloudNoteRow } from '../types/note.ts';
import { cloudRowToNote, noteToCloudRow } from '../types/note.ts';
import { storage } from './storage.ts';
import { supabase, isSupabaseConfigured, getDeviceId } from './supabase.ts';

export interface SyncResult {
  success: boolean;
  uploadedCount: number;
  downloadedCount: number;
  error?: string;
}

/**
 * Returns all local notes that have not yet been synced to the cloud.
 */
export function getLocalOnlyNotes(): Note[] {
  const notes = storage.getNotes();
  return notes.filter((n) => !n.serverId);
}

/**
 * Pure conflict resolution and merge function.
 * Conflict resolution rule per §2.5:
 * Server wins on updated_at, EXCEPT for local notes with no server_id (those are new).
 */
export function resolveNoteMerge(
  localNotes: Note[],
  cloudNotes: Note[],
  shouldUploadLocalOnly: boolean
): {
  mergedNotes: Note[];
  notesToUpload: Note[];
} {
  const cloudById = new Map<string, Note>();
  for (const c of cloudNotes) {
    cloudById.set(c.id, c);
  }

  const merged: Note[] = [];
  const notesToUpload: Note[] = [];
  const processedCloudIds = new Set<string>();

  for (const local of localNotes) {
    const cloudMatch = local.serverId
      ? cloudById.get(local.serverId)
      : cloudById.get(local.id);

    if (!cloudMatch) {
      if (!local.serverId) {
        // Local-only note
        if (shouldUploadLocalOnly) {
          notesToUpload.push(local);
        }
        merged.push(local);
      } else {
        // Had a serverId but no longer on server (deleted on another device)
        // Omit from merged
      }
      continue;
    }

    processedCloudIds.add(cloudMatch.id);

    if (cloudMatch.isDeleted) {
      // Server marked as deleted: remove locally
      continue;
    }

    const localTimestamp = local.updatedAt || local.createdAt || 0;
    const cloudTimestamp = cloudMatch.updatedAt || cloudMatch.createdAt || 0;

    if (cloudTimestamp >= localTimestamp) {
      // Server wins. If cloud content was masked (sealed), retain local content if available.
      const resolvedContent = cloudMatch.content || local.content || '';
      merged.push({
        ...cloudMatch,
        content: resolvedContent,
      });
    } else {
      // Local is newer: keep local and queue for server update
      merged.push(local);
      notesToUpload.push(local);
    }
  }

  // Add remaining cloud notes not present on this device
  for (const cloud of cloudNotes) {
    if (!processedCloudIds.has(cloud.id) && !cloud.isDeleted) {
      merged.push(cloud);
    }
  }

  // Sort descending by createdAt
  merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return { mergedNotes: merged, notesToUpload };
}

/**
 * Fetches all notes belonging to the authenticated user from Supabase.
 */
export async function fetchUserCloudNotes(): Promise<Note[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[Sync] Failed to fetch cloud notes:', error.message);
    throw error;
  }

  if (!data) return [];
  return (data as CloudNoteRow[]).map(cloudRowToNote);
}

/**
 * Uploads a single note to Supabase cloud.
 */
export async function uploadNoteToCloud(note: Note, userId: string): Promise<Note> {
  if (!isSupabaseConfigured || !supabase) return note;

  const deviceId = getDeviceId();
  const row = noteToCloudRow(note, userId, deviceId);

  const { data, error } = await supabase
    .from('notes')
    .upsert(row)
    .select()
    .single();

  if (error) {
    console.warn('[Sync] Failed to upload note to cloud:', error.message);
    throw error;
  }

  if (data) {
    const updated = cloudRowToNote(data as CloudNoteRow);
    // Preserve local content if masked
    if (!updated.content && note.content) {
      updated.content = note.content;
    }
    return updated;
  }

  return { ...note, serverId: note.id, userId, deviceId };
}

/**
 * Soft deletes a note on Supabase cloud.
 */
export async function deleteNoteFromCloud(noteId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    console.warn('[Sync] Failed to delete note from cloud:', error.message);
  }
}

/**
 * Updates a note's open status on Supabase cloud.
 */
export async function openNoteOnCloud(noteId: string): Promise<Note | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  // Try RPC first, fallback to update
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('open_note', { target_note_id: noteId });

  if (!rpcError && rpcData) {
    return cloudRowToNote(rpcData as CloudNoteRow);
  }

  const { data, error } = await supabase
    .from('notes')
    .update({
      status: 'opened',
      opened_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select()
    .single();

  if (error) {
    console.warn('[Sync] Failed to update opened status on cloud:', error.message);
    return null;
  }

  return data ? cloudRowToNote(data as CloudNoteRow) : null;
}

/**
 * Removes all cloud notes from localStorage, preserving local-only notes.
 * Rule per §2.5: "On logout: cloud notes are removed from localStorage; local-only notes stay."
 */
export function purgeCloudNotesFromLocal(): void {
  const currentNotes = storage.getNotes();
  // Keep only notes that have never been uploaded to cloud
  const localOnlyNotes = currentNotes.filter((n) => !n.serverId);
  storage.saveNotes(localOnlyNotes);
}

/**
 * Executes a full sync session.
 */
export async function syncNotesWithCloud(
  userId: string,
  options: { uploadLocalNotes: boolean }
): Promise<SyncResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: true, uploadedCount: 0, downloadedCount: 0 };
  }

  try {
    const cloudNotes = await fetchUserCloudNotes();
    const localNotes = storage.getNotes();

    const { mergedNotes, notesToUpload } = resolveNoteMerge(
      localNotes,
      cloudNotes,
      options.uploadLocalNotes
    );

    let uploadedCount = 0;
    if (options.uploadLocalNotes && notesToUpload.length > 0) {
      for (const note of notesToUpload) {
        try {
          const uploaded = await uploadNoteToCloud(note, userId);
          uploadedCount++;
          // Replace in mergedNotes
          const idx = mergedNotes.findIndex((n) => n.id === note.id);
          if (idx !== -1) {
            mergedNotes[idx] = uploaded;
          }
        } catch (uploadErr) {
          console.warn('[Sync] Failed uploading note during batch sync:', uploadErr);
        }
      }
    }

    storage.saveNotes(mergedNotes);

    return {
      success: true,
      uploadedCount,
      downloadedCount: cloudNotes.length,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      uploadedCount: 0,
      downloadedCount: 0,
      error: message,
    };
  }
}
