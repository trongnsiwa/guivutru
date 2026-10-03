import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Trash2 } from 'lucide-react';
import { Note } from '@/types/note';
import { CountdownBadge } from './CountdownBadge';
import { formatDate } from '@/lib/date';
import { PAPER_THEMES } from '@/lib/constants';
import { Button } from '@/components/ui/Button';

export interface NoteCardProps {
  note: Note;
  onDelete?: (id: string) => void;
}

export const NoteCard = React.memo(function NoteCard({ note, onDelete }: NoteCardProps) {
  const isSealed = note.status === 'sealed' && Date.now() < note.unlockAt;
  const paper = PAPER_THEMES.find((p) => p.id === note.paperTheme);

  return (
    <div className="rounded-2xl border border-border-soft bg-bg-soft/90 p-4 transition-all hover:border-border-strong space-y-3">
      {/* Top: Theme swatch & name with lock/star icon, stickers, countdown */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-sans text-sm font-medium text-text-secondary flex items-center gap-1.5">
          <span className="text-base select-none">{isSealed ? '🔒' : '✨'}</span>
          <span className="font-semibold text-text-primary">{paper?.name || 'Đêm sao'}</span>
          {note.stickerIds && note.stickerIds.length > 0 && (
            <span className="inline-flex items-center gap-0.5 ml-1">
              {note.stickerIds.slice(0, 2).map((s, i) => (
                <span key={i} className="text-xs select-none">
                  {s}
                </span>
              ))}
            </span>
          )}
        </span>
        <CountdownBadge unlockAt={note.unlockAt} />
      </div>

      {/* Middle: Content preview */}
      <div className="py-1">
        {isSealed ? (
          <div className="py-3 px-2 text-center rounded-xl bg-bg-deep/40 border border-border-soft/40">
            <span className="font-sans text-xs text-text-muted">
              🔒 Nội dung được niêm phong cho đến ngày mở
            </span>
          </div>
        ) : (
          <p className="font-note text-[20px] leading-[1.4] text-text-primary line-clamp-2">
            {note.content}
          </p>
        )}
      </div>

      {/* Bottom: Date & Explicit [Xem] [Xoá] buttons */}
      <div className="flex items-center justify-between border-t border-border-soft/40 pt-3 text-xs font-sans text-text-muted">
        <span>Gửi ngày {formatDate(note.createdAt)}</span>
        <div className="flex items-center gap-2">
          <Link to={`/note/${note.id}`}>
            <Button
              variant="ghost"
              className="text-xs px-3 py-1.5 text-text-primary hover:text-lavender flex items-center gap-1"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Xem</span>
            </Button>
          </Link>
          {onDelete && (
            <Button
              variant="ghost"
              onClick={() => onDelete(note.id)}
              className="text-xs px-3 py-1.5 text-text-muted hover:text-pink hover:border-pink/30 flex items-center gap-1"
              title="Xoá điều ước"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Xoá</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

NoteCard.displayName = 'NoteCard';
export default NoteCard;
