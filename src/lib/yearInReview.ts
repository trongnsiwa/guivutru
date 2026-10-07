import type { Note } from '../types/note.ts';

export interface YearInReviewStats {
  isEligible: boolean; // Requires >= 5 notes per §4.5
  notesWritten: number;
  wordsSent: number;
  moonsWatched: number;
  featuredWish: Note | null;
  firstNoteDate: number | null;
  daysSinceFirstNote: number;
}

export function computeYearInReview(notes: Note[]): YearInReviewStats {
  const activeNotes = notes.filter((n) => !n.isDeleted);
  const isEligible = activeNotes.length >= 5;

  if (activeNotes.length === 0) {
    return {
      isEligible: false,
      notesWritten: 0,
      wordsSent: 0,
      moonsWatched: 0,
      featuredWish: null,
      firstNoteDate: null,
      daysSinceFirstNote: 0,
    };
  }

  // 1. Notes written
  const notesWritten = activeNotes.length;

  // 2. Words sent (sum of words in all notes)
  const wordsSent = activeNotes.reduce((total, note) => {
    const text = note.content || '';
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    return total + wordCount;
  }, 0);

  // 3. Moons watched (count of distinct unlock date calendar days)
  const unlockDays = new Set(
    activeNotes.map((n) => new Date(n.unlockAt).toISOString().slice(0, 10))
  );
  const moonsWatched = unlockDays.size;

  // 4. First note date & days since
  const sortedByDate = [...activeNotes].sort((a, b) => a.createdAt - b.createdAt);
  const firstNote = sortedByDate[0];
  const firstNoteDate = firstNote ? firstNote.createdAt : null;
  const daysSinceFirstNote = firstNoteDate
    ? Math.max(0, Math.floor((Date.now() - firstNoteDate) / (1000 * 60 * 60 * 24)))
    : 0;

  // 5. Featured wish ("điều ước của năm")
  // Only opened notes with content are eligible. Sealed notes must NEVER be selected (§2.4).
  const openedNotes = activeNotes.filter((n) => n.status === 'opened' && Boolean(n.content));
  const featuredWish = openedNotes.length > 0
    ? openedNotes.reduce((best, curr) => {
        if (!best) return curr;
        const lenCurr = (curr.content || '').length;
        const lenBest = (best.content || '').length;
        return lenCurr > lenBest ? curr : best;
      }, openedNotes[0])
    : null;

  return {
    isEligible,
    notesWritten,
    wordsSent,
    moonsWatched,
    featuredWish,
    firstNoteDate,
    daysSinceFirstNote,
  };
}
