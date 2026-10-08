import { supabase, isSupabaseConfigured } from './supabase.ts';
import { getLocalAudio, saveLocalAudio, deleteLocalAudio } from './audioDb.ts';

export interface AudioUploadResult {
  success: boolean;
  audioPath?: string;
  error?: string;
}

/**
 * Returns supported MIME type for recording.
 * Prefers opus/webm, falls back to mp4/aac on Safari.
 */
export function getSupportedAudioMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return 'audio/webm';
  }

  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=aac',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
  ];

  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }

  return '';
}

/**
 * Uploads an audio blob to Supabase storage bucket 'note-audio'.
 * Path: {user_id}/{note_id}.{ext}
 */
export async function uploadAudioToCloud(
  userId: string,
  noteId: string,
  audioBlob: Blob
): Promise<AudioUploadResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const ext = audioBlob.type.includes('mp4') || audioBlob.type.includes('aac') ? 'mp4' : 'webm';
    const filePath = `${userId}/${noteId}.${ext}`;

    const { error } = await supabase.storage
      .from('note-audio')
      .upload(filePath, audioBlob, {
        contentType: audioBlob.type || (ext === 'mp4' ? 'audio/mp4' : 'audio/webm'),
        upsert: true,
      });

    if (error) {
      console.warn('[Audio] Storage upload failed:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, audioPath: filePath };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[Audio] Storage upload exception:', message);
    return { success: false, error: message };
  }
}

/**
 * Generates a short-lived signed URL (60s) for an unlocked note's audio.
 * For sealed notes (unlock_at > now), the storage policy blocks this or returns error.
 */
export async function getAudioSignedUrl(
  audioPath: string,
  expiresInSeconds: number = 60
): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase || !audioPath) {
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from('note-audio')
      .createSignedUrl(audioPath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      console.warn('[Audio] Failed to create signed URL:', error?.message);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.warn('[Audio] createSignedUrl exception:', err);
    return null;
  }
}

/**
 * Downloads audio blob from cloud (via signed URL) and saves to local IndexedDB.
 */
export async function downloadAudioToLocal(
  noteId: string,
  audioPath: string
): Promise<Blob | null> {
  const signedUrl = await getAudioSignedUrl(audioPath, 60);
  if (!signedUrl) return null;

  try {
    const res = await fetch(signedUrl);
    if (!res.ok) {
      console.warn('[Audio] Failed to fetch signed audio stream:', res.statusText);
      return null;
    }

    const blob = await res.blob();
    await saveLocalAudio(noteId, blob, 0);
    return blob;
  } catch (err) {
    console.warn('[Audio] Exception downloading audio to local:', err);
    return null;
  }
}

export { getLocalAudio, saveLocalAudio, deleteLocalAudio };
