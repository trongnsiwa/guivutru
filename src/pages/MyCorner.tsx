import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { NoteCard } from '@/components/wish/NoteCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Note } from '@/types/note';

export function MyCorner() {
  const notes = useNotes((s) => s.notes);
  const deleteNote = useNotes((s) => s.deleteNote);

  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel action by default when modal opens
  useEffect(() => {
    if (noteToDelete) {
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [noteToDelete]);

  const handleDeleteRequest = useCallback((id: string) => {
    const target = notes.find((n) => n.id === id);
    if (target) {
      setNoteToDelete(target);
    }
  }, [notes]);

  const handleConfirmDelete = () => {
    if (noteToDelete) {
      deleteNote(noteToDelete.id);
      setNoteToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setNoteToDelete(null);
  };

  return (
    <div className="flex flex-1 flex-col py-2 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border-soft pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-normal text-text-primary flex items-center gap-1.5">
            <span>Góc của tôi</span>
            <Sparkles className="h-5 w-5 text-star-glow" />
          </h1>
          <p className="font-sans text-xs sm:text-sm text-text-secondary mt-0.5">
            {notes.length > 0
              ? `${notes.length} điều ước đang chờ`
              : 'Nơi lưu giữ những điều ước đã niêm phong'}
          </p>
        </div>

        <Link to="/viet">
          <Button variant="primary" className="text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-glow">
            <Plus className="h-4 w-4" />
            <span>Viết điều ước mới</span>
          </Button>
        </Link>
      </div>

      {/* Empty State vs List */}
      {notes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center py-16 space-y-4">
          <span className="text-5xl select-none">🥺</span>
          <div className="space-y-1">
            <p className="font-sans font-semibold text-lg text-text-primary">
              Chưa có gì ở đây hết á 🥺
            </p>
            <p className="font-sans text-xs sm:text-sm text-text-secondary">
              Viết điều đầu tiên để gửi gắm vào vũ trụ nha?
            </p>
          </div>
          <Link to="/viet">
            <Button variant="pill" className="text-sm shadow-glow">
              <span>Viết điều ước ngay ✨</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onDelete={handleDeleteRequest} />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!noteToDelete}
        onClose={handleCancelDelete}
        title="Xoá điều ước này?"
      >
        <div className="space-y-4">
          <p className="font-sans text-sm text-text-secondary leading-relaxed">
            Bạn có chắc muốn xoá điều ước này không? Vũ trụ sẽ không còn giữ điều ước này giúp bạn nữa nha.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-soft/40">
            <Button
              ref={cancelBtnRef}
              variant="ghost"
              onClick={handleCancelDelete}
              className="text-xs px-4 py-2 text-text-secondary hover:text-text-primary focus:ring-2 focus:ring-lavender"
            >
              Để mình giữ lại
            </Button>

            <Button
              variant="primary"
              onClick={handleConfirmDelete}
              className="text-xs px-4 py-2 bg-pink/20 hover:bg-pink/30 text-pink border border-pink/40 hover:border-pink/60 shadow-none"
            >
              Xoá điều ước
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default MyCorner;
