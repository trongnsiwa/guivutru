import { create } from 'zustand';
import { Note } from '@/types/note';
import { storage } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { uploadNoteToCloud, deleteNoteFromCloud, openNoteOnCloud, updateNoteVisibilityOnCloud } from '@/lib/sync';
import { uploadAudioToCloud, deleteLocalAudio } from '@/lib/audio';
import { useAuth } from './useAuth';

interface NotesState {
  notes: Note[];
  loadNotes: () => void;
  addNote: (note: Note, audioBlob?: Blob) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  openNote: (id: string) => Promise<void>;
  updateNoteVisibility: (id: string, visibility: 'private' | 'public', pseudonym?: string) => Promise<void>;
}

export const useNotes = create<NotesState>((set) => ({
  notes: storage.getNotes(),

  loadNotes: () => {
    set({ notes: storage.getNotes() });
  },

  addNote: async (note: Note, audioBlob?: Blob) => {
    // 1. Local-first: immediately write to local storage
    storage.addNote(note);
    set({ notes: storage.getNotes() });

    // 2. If logged in and cloud is configured, sync to cloud in background
    const user = useAuth.getState().user;
    if (user && isSupabaseConfigured) {
      try {
        let noteToUpload = note;
        if (note.hasAudio && audioBlob) {
          const uploadRes = await uploadAudioToCloud(user.id, note.id, audioBlob);
          if (uploadRes.success && uploadRes.audioPath) {
            noteToUpload = { ...note, audioPath: uploadRes.audioPath };
          }
        }

        const uploaded = await uploadNoteToCloud(noteToUpload, user.id);
        storage.updateNote(note.id, {
          serverId: uploaded.serverId || uploaded.id,
          userId: user.id,
          audioPath: noteToUpload.audioPath,
          updatedAt: uploaded.updatedAt || Date.now(),
        });
        set({ notes: storage.getNotes() });
      } catch (err) {
        console.warn('[useNotes] Background cloud upload failed:', err);
      }
    }
  },

  deleteNote: async (id: string) => {
    const existing = storage.getNoteById(id);
    storage.deleteNote(id);
    await deleteLocalAudio(id);
    set({ notes: storage.getNotes() });

    const user = useAuth.getState().user;
    if (user && isSupabaseConfigured && existing) {
      const targetId = existing.serverId || existing.id;
      try {
        await deleteNoteFromCloud(targetId);
      } catch (err) {
        console.warn('[useNotes] Cloud delete failed:', err);
      }
    }
  },

  openNote: async (id: string) => {
    const existing = storage.getNoteById(id);
    const openedAt = Date.now();
    storage.updateNote(id, { status: 'opened', openedAt });
    set({ notes: storage.getNotes() });

    const user = useAuth.getState().user;
    if (user && isSupabaseConfigured && existing) {
      const targetId = existing.serverId || existing.id;
      try {
        const cloudNote = await openNoteOnCloud(targetId);
        // If the note was sealed and now unlocked, cloud returns the unmasked content
        if (cloudNote?.content && !existing.content) {
          storage.updateNote(id, { content: cloudNote.content });
          set({ notes: storage.getNotes() });
        }
      } catch (err) {
        console.warn('[useNotes] Cloud open failed:', err);
      }
    }
  },

  updateNoteVisibility: async (id: string, visibility: 'private' | 'public', pseudonym?: string) => {
    const existing = storage.getNoteById(id);
    const now = Date.now();
    const updates: Partial<Note> = {
      visibility,
      ...(visibility === 'public' ? { pseudonym, publishedAt: now } : {}),
    };

    // 1. Update locally
    storage.updateNote(id, updates);
    set({ notes: storage.getNotes() });

    // 2. Sync to cloud if user is authenticated
    const user = useAuth.getState().user;
    if (user && isSupabaseConfigured) {
      const currentNote = storage.getNoteById(id);
      if (!currentNote) return;

      const targetId = currentNote.serverId || currentNote.id;
      if (existing?.serverId) {
        try {
          await updateNoteVisibilityOnCloud(targetId, visibility, pseudonym);
        } catch (err) {
          console.warn('[useNotes] Cloud visibility update failed:', err);
          throw err;
        }
      } else {
        // Note was local-only; upload full record with new visibility
        try {
          const uploaded = await uploadNoteToCloud(currentNote, user.id);
          storage.updateNote(id, {
            serverId: uploaded.serverId || uploaded.id,
            userId: user.id,
            updatedAt: uploaded.updatedAt || Date.now(),
          });
          set({ notes: storage.getNotes() });
        } catch (err) {
          console.warn('[useNotes] Cloud note upload failed:', err);
          throw err;
        }
      }
    }
  },
}));
