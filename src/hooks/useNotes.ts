import { create } from 'zustand';
import { Note } from '@/types/note';
import { storage } from '@/lib/storage';

interface NotesState {
  notes: Note[];
  loadNotes: () => void;
  addNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  openNote: (id: string) => void;
}

export const useNotes = create<NotesState>((set) => ({
  notes: storage.getNotes(),
  loadNotes: () => {
    set({ notes: storage.getNotes() });
  },
  addNote: (note: Note) => {
    storage.addNote(note);
    set({ notes: storage.getNotes() });
  },
  deleteNote: (id: string) => {
    storage.deleteNote(id);
    set({ notes: storage.getNotes() });
  },
  openNote: (id: string) => {
    storage.updateNote(id, { status: 'opened', openedAt: Date.now() });
    set({ notes: storage.getNotes() });
  },
}));
