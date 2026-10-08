import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Note, PaperTheme } from '@/types/note';
import { MAX_STICKERS, STORAGE_KEYS } from '@/lib/constants';

export interface WriteState {
  step: number;
  content: string;
  promptId: string | null;
  promptChosen: boolean;
  paperTheme: PaperTheme;
  stickerIds: string[];
  unlockAt: number | null;
  visibility: 'private' | 'public';
  lastSavedNote: Note | null;
  sessionActive: boolean;
  hasAudio: boolean;
  audioBlob: Blob | null;
  audioDuration: number;

  // Actions
  setStep: (step: number) => void;
  setContent: (content: string) => void;
  setPromptId: (promptId: string | null) => void;
  setPromptChosen: (chosen: boolean) => void;
  setPaperTheme: (paperTheme: PaperTheme) => void;
  setStickerIds: (stickerIds: string[]) => void;
  toggleSticker: (sticker: string) => { added: boolean; maxReached: boolean };
  setUnlockAt: (unlockAt: number | null) => void;
  setVisibility: (visibility: 'private' | 'public') => void;
  setLastSavedNote: (note: Note | null) => void;
  setSessionActive: (active: boolean) => void;
  setAudio: (blob: Blob, duration: number) => void;
  clearAudio: () => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  content: '',
  promptId: null,
  promptChosen: false,
  paperTheme: 'dem-sao' as PaperTheme,
  stickerIds: [] as string[],
  unlockAt: null,
  visibility: 'private' as const,
  lastSavedNote: null as Note | null,
  sessionActive: false,
  hasAudio: false,
  audioBlob: null as Blob | null,
  audioDuration: 0,
};

export const useWriteStore = create<WriteState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step: number) => set({ step }),

      setContent: (content: string) => set({ content }),

      setPromptId: (promptId: string | null) => set({ promptId }),

      setPromptChosen: (promptChosen: boolean) => set({ promptChosen }),

      setPaperTheme: (paperTheme: PaperTheme) => set({ paperTheme }),

      setStickerIds: (stickerIds: string[]) =>
        set({ stickerIds: stickerIds.slice(0, MAX_STICKERS) }),

      toggleSticker: (sticker: string) => {
        const { stickerIds } = get();
        if (stickerIds.includes(sticker)) {
          set({ stickerIds: stickerIds.filter((s) => s !== sticker) });
          return { added: false, maxReached: false };
        }
        if (stickerIds.length >= MAX_STICKERS) {
          return { added: false, maxReached: true };
        }
        set({ stickerIds: [...stickerIds, sticker] });
        return { added: true, maxReached: false };
      },

      setUnlockAt: (unlockAt: number | null) => set({ unlockAt }),

      setVisibility: (visibility: 'private' | 'public') => set({ visibility }),

      setLastSavedNote: (lastSavedNote: Note | null) => set({ lastSavedNote }),

      setSessionActive: (sessionActive: boolean) => set({ sessionActive }),
      
      setAudio: (blob: Blob, duration: number) =>
        set({ hasAudio: true, audioBlob: blob, audioDuration: duration }),

      clearAudio: () =>
        set({ hasAudio: false, audioBlob: null, audioDuration: 0 }),

      reset: () => set(initialState),
    }),
    {
      name: STORAGE_KEYS.WRITE,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => {
        // Exclude audioBlob (raw Blob object) from sessionStorage JSON serialization
        const { audioBlob: _, ...rest } = state;
        return rest;
      },
    }
  )
);

export default useWriteStore;
