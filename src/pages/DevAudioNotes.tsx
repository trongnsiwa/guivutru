import { useState } from 'react';
import { NotePaper } from '@/components/wish/NotePaper';
import { AudioPlayer } from '@/components/wish/AudioPlayer';
import { CountdownBadge } from '@/components/wish/CountdownBadge';
import { Toast } from '@/components/ui/Toast';
import { Note } from '@/types/note';

export function DevNoteDetailSealed() {
  const [note] = useState<Note>({
    id: 'dev_audio_sealed',
    content: '',
    promptId: null,
    paperTheme: 'dem-sao',
    stickerIds: ['🌙'],
    unlockAt: Date.now() + 100000000,
    status: 'sealed',
    createdAt: Date.now() - 1000000,
    openedAt: null,
    hasAudio: true,
  });

  return (
    <div className="w-full max-w-[420px] mx-auto space-y-4 py-4 px-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-sans text-text-secondary">← Góc của tôi</span>
        <CountdownBadge unlockAt={note.unlockAt} />
      </div>

      <AudioPlayer
        noteId={note.id}
        isSealed={true}
        audioPath={note.audioPath}
      />

      <NotePaper
        theme={note.paperTheme}
        content=""
        stickers={note.stickerIds}
        isSealed={true}
      />
    </div>
  );
}

export function DevNoteDetailOpened() {
  const [note] = useState<Note>({
    id: 'dev_audio_opened',
    content: 'Nghe giọng nói mình gửi vào vũ trụ nhé ✨',
    promptId: null,
    paperTheme: 'dem-sao',
    stickerIds: ['🌙', '⭐'],
    unlockAt: Date.now() - 1000,
    status: 'opened',
    createdAt: Date.now() - 1000000,
    openedAt: Date.now() - 500,
    hasAudio: true,
  });

  return (
    <div className="w-full max-w-[420px] mx-auto space-y-4 py-4 px-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-sans text-text-secondary">← Góc của tôi</span>
        <CountdownBadge unlockAt={note.unlockAt} />
      </div>

      <AudioPlayer
        noteId={note.id}
        isSealed={false}
        audioPath={note.audioPath}
      />

      <NotePaper
        theme={note.paperTheme}
        content={note.content}
        stickers={note.stickerIds}
        isSealed={false}
      />
    </div>
  );
}

export function DevToastPreview() {
  const [toast, setToast] = useState<string | null>(
    'Đã đồng bộ xong! Mình đã lưu lại 1 bản sao xung đột trên máy này cho bạn nha 🌙'
  );

  return (
    <div className="w-full max-w-[420px] mx-auto py-20 px-4 text-center">
      <h1 className="text-xl font-display text-text-primary mb-4">Sync Conflict Toast Preview</h1>
      <button
        onClick={() =>
          setToast('Đã đồng bộ xong! Mình đã lưu lại 1 bản sao xung đột trên máy này cho bạn nha 🌙')
        }
        className="px-4 py-2 rounded-full bg-lavender/20 text-lavender border border-lavender/40 text-sm"
      >
        Hiện lại thông báo
      </button>
      <Toast message={toast} visible={!!toast} onClose={() => setToast(null)} />
    </div>
  );
}
