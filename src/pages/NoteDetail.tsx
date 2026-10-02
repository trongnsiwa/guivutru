import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Calendar, Sparkles } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { NotePaper } from '@/components/wish/NotePaper';
import { CountdownBadge } from '@/components/wish/CountdownBadge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/date';

export function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notes } = useNotes();
  const note = notes.find((n) => n.id === id);

  if (!note) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center py-12 space-y-4">
        <p className="font-sans font-semibold text-lg text-text-primary">
          Không tìm thấy điều ước này 🥲
        </p>
        <p className="font-sans text-xs text-text-secondary">
          Có thể điều ước đã bị xoá hoặc liên kết không chính xác.
        </p>
        <Button variant="ghost" onClick={() => navigate('/toi')}>
          ← Quay lại góc của tôi
        </Button>
      </div>
    );
  }

  const isSealed = note.status === 'sealed' && Date.now() < note.unlockAt;

  return (
    <div className="flex flex-1 flex-col py-2 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/toi"
          className="flex items-center gap-1.5 text-xs font-sans text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Góc của tôi</span>
        </Link>
        <CountdownBadge unlockAt={note.unlockAt} />
      </div>

      <div className="relative">
        <NotePaper
          theme={note.paperTheme}
          content={isSealed ? '' : note.content}
          stickers={note.stickerIds}
          isSealed={isSealed}
        />
      </div>

      <div className="rounded-md border border-border-soft bg-bg-soft/50 p-4 space-y-2 text-xs font-sans text-text-secondary">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-text-muted" />
            <span>Ngày gửi:</span>
          </span>
          <span className="font-semibold text-text-primary">
            {formatDate(note.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-text-muted" />
            <span>Ngày mở:</span>
          </span>
          <span className="font-semibold text-star-glow">
            {formatDate(note.unlockAt)}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Link to="/viet" className="flex-1">
          <Button variant="primary" className="w-full flex items-center justify-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            <span>Viết điều ước mới</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default NoteDetail;
