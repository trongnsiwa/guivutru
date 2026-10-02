import { Link } from 'react-router-dom';
import { Trash2, ExternalLink } from 'lucide-react';
import { Note } from '@/types/note';
import { CountdownBadge } from './CountdownBadge';
import { formatDate } from '@/lib/date';
import { PAPER_THEMES } from '@/lib/constants';

export interface NoteCardProps {
  note: Note;
  onDelete?: (id: string) => void;
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  const isSealed = note.status === 'sealed';
  const paper = PAPER_THEMES.find((p) => p.id === note.paperTheme);

  return (
    <div className="rounded-md border border-border-soft bg-bg-soft/90 p-4 transition-all hover:border-border-strong">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-sans text-sm font-medium text-text-secondary flex items-center gap-1.5">
          <span>{paper?.name || 'Đêm sao'}</span>
          {note.stickerIds.slice(0, 2).map((s, i) => (
            <span key={i} className="text-xs">
              {s}
            </span>
          ))}
        </span>
        <CountdownBadge unlockAt={note.unlockAt} />
      </div>

      <div className="py-2">
        {isSealed ? (
          <div className="py-3 text-center rounded bg-bg-deep/40 border border-border-soft/40">
            <span className="font-sans text-xs text-text-muted">
              🔒 Nội dung được niêm phong cho đến ngày mở
            </span>
          </div>
        ) : (
          <p className="font-note text-[19px] leading-[1.5] text-text-primary line-clamp-2">
            {note.content}
          </p>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-border-soft/40 pt-3 text-xs font-sans text-text-muted">
        <span>Gửi ngày {formatDate(note.createdAt)}</span>
        <div className="flex items-center gap-2">
          <Link
            to={`/note/${note.id}`}
            className="flex items-center gap-1 text-lavender hover:underline"
          >
            <span>Chi tiết</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(note.id)}
              className="text-text-muted hover:text-pink p-1 transition-colors"
              title="Xoá điều ước"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NoteCard;
