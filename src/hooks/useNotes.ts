import { create } from 'zustand';
import { Note } from '@/types/note';
import { storage } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { uploadNoteToCloud, deleteNoteFromCloud, openNoteOnCloud } from '@/lib/sync';
import { useAuth } from './useAuth';

interface NotesState {
  notes: Note[];
  loadNotes: () => void;
  addNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  openNote: (id: string) => Promise<void>;
}

export const useNotes = create<NotesState>((set) => ({
  notes: storage.getNotes(),

  loadNotes: () => {
    set({ notes: storage.getNotes() });
  },

  addNote: async (note: Note) => {
    // 1. Local-first: immediately write to local storage
    storage.addNote(note);
    set({ notes: storage.getNotes() });

    // 2. If logged in and cloud is configured, sync to cloud in background
    const user = useAuth.getState().user;
    if (user && isSupabaseConfigured) {
      try {
        const uploaded = await uploadNoteToCloud(note, user.id);
        storage.updateNote(note.id, {
          serverId: uploaded.serverId || uploaded.id,
          userId: user.id,
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
}));
