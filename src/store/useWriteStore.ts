import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PaperTheme } from '@/types/note';
import { MAX_STICKERS } from '@/lib/constants';

export interface WriteState {
  step: number;
  content: string;
  promptId: string | null;
  promptChosen: boolean;
  paperTheme: PaperTheme;
  stickerIds: string[];
  unlockAt: number | null;

  // Actions
  setStep: (step: number) => void;
  setContent: (content: string) => void;
  setPromptId: (promptId: string | null) => void;
  setPromptChosen: (chosen: boolean) => void;
  setPaperTheme: (paperTheme: PaperTheme) => void;
  setStickerIds: (stickerIds: string[]) => void;
  toggleSticker: (sticker: string) => { added: boolean; maxReached: boolean };
  setUnlockAt: (unlockAt: number | null) => void;
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

      reset: () => set(initialState),
    }),
    {
      name: 'gvt-write-flow',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useWriteStore;
