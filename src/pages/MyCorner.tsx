import { Link } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { NoteCard } from '@/components/wish/NoteCard';
import { Button } from '@/components/ui/Button';

export function MyCorner() {
  const { notes, deleteNote } = useNotes();

  return (
    <div className="flex flex-1 flex-col py-2 space-y-6">
      <div className="flex items-center justify-between border-b border-border-soft pb-4">
        <div>
          <h1 className="font-display text-2xl font-normal text-text-primary flex items-center gap-1.5">
            <span>Góc của tôi</span>
            <Sparkles className="h-5 w-5 text-star-glow" />
          </h1>
          <p className="font-sans text-xs text-text-secondary mt-0.5">
            {notes.length > 0
              ? `${notes.length} điều ước đang chờ`
              : 'Nơi lưu giữ những điều ước đã niêm phong'}
          </p>
        </div>

        <Link to="/viet">
          <Button variant="primary" className="text-xs px-3 py-2 flex items-center gap-1">
            <Plus className="h-4 w-4" />
            <span>Viết mới</span>
          </Button>
        </Link>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center py-12 space-y-4">
          <span className="text-5xl">🥺</span>
          <div className="space-y-1">
            <p className="font-sans font-semibold text-lg text-text-primary">
              Chưa có gì ở đây hết á 🥺
            </p>
            <p className="font-sans text-xs text-text-secondary">
              Viết điều đầu tiên để gửi gắm vào vũ trụ nha?
            </p>
          </div>
          <Link to="/viet">
            <Button variant="pill" className="text-sm">
              <span>Viết điều ước ngay ✨</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onDelete={deleteNote} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyCorner;
