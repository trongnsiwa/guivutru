export type PaperTheme = 'dem-sao' | 'tim-mong' | 'hogn' | 'bien' | 'rung' | 'giay-cu';

export type NoteStatus = 'sealed' | 'opened';

export interface Note {
  id: string; // nanoid(12) or server id
  content: string; // 5–500 ký tự (null/empty on client if sealed on server)
  promptId: string | null; // e.g. 'dulich' | 'tinhyeu' | null (tự viết)
  paperTheme: PaperTheme;
  stickerIds: string[]; // max 3
  unlockAt: number; // timestamp ms
  status: NoteStatus;
  createdAt: number;
  openedAt: number | null;
  // v2.0 Cloud fields
  userId?: string | null;
  deviceId?: string | null;
  serverId?: string | null;
  updatedAt?: number;
  visibility?: 'private' | 'public';
  isDeleted?: boolean;
  isLocalOnly?: boolean;
}

export interface CloudNoteRow {
  id: string;
  user_id: string;
  device_id: string | null;
  content: string | null;
  prompt_id: string | null;
  paper_theme: string;
  sticker_ids: string[];
  unlock_at: string;
  status: 'sealed' | 'opened';
  visibility: 'private' | 'public';
  created_at: string;
  opened_at: string | null;
  updated_at: string;
  is_deleted: boolean;
}

export function cloudRowToNote(row: CloudNoteRow): Note {
  return {
    id: row.id,
    serverId: row.id,
    userId: row.user_id,
    deviceId: row.device_id,
    content: row.content ?? '',
    promptId: row.prompt_id,
    paperTheme: (row.paper_theme as PaperTheme) || 'dem-sao',
    stickerIds: Array.isArray(row.sticker_ids) ? row.sticker_ids : [],
    unlockAt: new Date(row.unlock_at).getTime(),
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
    openedAt: row.opened_at ? new Date(row.opened_at).getTime() : null,
    updatedAt: new Date(row.updated_at).getTime(),
    visibility: row.visibility,
    isDeleted: row.is_deleted,
    isLocalOnly: false,
  };
}

export function noteToCloudRow(note: Note, userId: string, deviceId?: string | null): Omit<CloudNoteRow, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string } {
  return {
    id: note.serverId || note.id,
    user_id: userId,
    device_id: deviceId || note.deviceId || null,
    content: note.content || null,
    prompt_id: note.promptId,
    paper_theme: note.paperTheme,
    sticker_ids: note.stickerIds,
    unlock_at: new Date(note.unlockAt).toISOString(),
    status: note.status,
    visibility: note.visibility || 'private',
    created_at: note.createdAt ? new Date(note.createdAt).toISOString() : undefined,
    opened_at: note.openedAt ? new Date(note.openedAt).toISOString() : null,
    updated_at: note.updatedAt ? new Date(note.updatedAt).toISOString() : undefined,
    is_deleted: Boolean(note.isDeleted),
  };
}
