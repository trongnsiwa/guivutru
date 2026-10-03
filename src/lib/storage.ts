import { Note } from '@/types/note';
import { STORAGE_KEYS } from './constants';

export const storage = {
  getNotes(): Note[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (!data) return [];
      const list = JSON.parse(data) as Note[];
      return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (err) {
      console.error('Failed to load notes from localStorage:', err);
      return [];
    }
  },

  saveNotes(notes: Note[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch (err) {
      console.error('Failed to save notes to localStorage:', err);
    }
  },

  addNote(note: Note): void {
    const notes = storage.getNotes();
    notes.unshift(note);
    storage.saveNotes(notes);
  },

  getNoteById(id: string): Note | undefined {
    const notes = storage.getNotes();
    return notes.find((n) => n.id === id);
  },

  deleteNote(id: string): void {
    const notes = storage.getNotes().filter((n) => n.id !== id);
    storage.saveNotes(notes);
  },

  updateNote(id: string, updates: Partial<Note>): void {
    const notes = storage.getNotes().map((n) => {
      if (n.id === id) {
        return { ...n, ...updates };
      }
      return n;
    });
    storage.saveNotes(notes);
  },
};
