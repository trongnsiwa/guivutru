export type PaperTheme = 'dem-sao' | 'tim-mong' | 'hogn' | 'bien' | 'rung' | 'giay-cu';

export type NoteStatus = 'sealed' | 'opened';

export interface Note {
  id: string; // nanoid(12)
  content: string; // 5–500 ký tự
  promptId: string | null; // e.g. 'dulich' | 'tinhyeu' | null (tự viết)
  paperTheme: PaperTheme;
  stickerIds: string[]; // max 3
  unlockAt: number; // timestamp ms
  status: NoteStatus;
  createdAt: number;
  openedAt: number | null;
}
