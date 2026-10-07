import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Sparkles, List, Compass } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { usePrefs } from '@/hooks/usePrefs';
import { NoteCard } from '@/components/wish/NoteCard';
import { ConstellationView } from '@/components/wish/ConstellationView';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { Note } from '@/types/note';
import { cn } from '@/lib/cn';
import { computeYearInReview } from '@/lib/yearInReview';
import { YearInReviewModal } from '@/components/wish/YearInReviewModal';
import { updateEmailReminderPreference } from '@/lib/reminders';

export function MyCorner() {
  const notes = useNotes((s) => s.notes);
  const deleteNote = useNotes((s) => s.deleteNote);
  const { prefs, updatePrefs } = usePrefs();

  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showYearInReview, setShowYearInReview] = useState(false);

  const yearStats = useMemo(() => computeYearInReview(notes), [notes]);

  useEffect(() => {
    if (searchParams.get('unsubscribe') === 'email') {
      updateEmailReminderPreference(false);
      setToastMsg('Đã tắt email nhắc nhở cho tài khoản của bạn 🌙');
      searchParams.delete('unsubscribe');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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

      {/* View Switcher Chips (B1) & Year in Review (§4.5) */}
      {notes.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5 pb-1">
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs text-text-muted">Chế độ xem:</span>
            <div className="inline-flex items-center rounded-full p-0.5 bg-bg-soft/70 border border-border-soft">
              <button
                type="button"
                onClick={() => updatePrefs({ toiView: 'list' })}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender',
                  prefs.toiView === 'list'
                    ? 'bg-lavender text-bg-deep font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
                aria-pressed={prefs.toiView === 'list'}
              >
                <List className="h-3.5 w-3.5" />
                <span>Danh sách</span>
              </button>
              <button
                type="button"
                onClick={() => updatePrefs({ toiView: 'sky' })}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender',
                  prefs.toiView === 'sky'
                    ? 'bg-lavender text-bg-deep font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
                aria-pressed={prefs.toiView === 'sky'}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Bầu trời ✨</span>
              </button>
            </div>
          </div>

          {yearStats.isEligible && (
            <button
              type="button"
              data-testid="year-in-review-btn"
              onClick={() => setShowYearInReview(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans bg-star-glow/10 border border-star-glow/30 text-star-glow hover:bg-star-glow/20 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Nhìn lại năm qua ✨</span>
            </button>
          )}
        </div>
      )}

      {/* Empty State vs View Switch */}
      {notes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center py-16 space-y-4">
          <div className="relative w-[120px] h-[120px] flex items-center justify-center select-none" aria-hidden="true">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="empty-sky" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--sky)" stopOpacity="0.25" />
                  <stop offset="60%" stopColor="var(--lavender)" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="var(--bg-deep)" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="60" cy="60" r="54" fill="url(#empty-sky)" />
              {/* 4-point breathing pale star */}
              <path
                d="M 60 28 C 60 44 60 50 76 60 C 60 70 60 76 60 92 C 60 76 60 70 44 60 C 60 50 60 44 60 28 Z"
                fill="var(--star)"
                className="animate-star-breathe origin-center"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="font-sans font-semibold text-lg text-text-primary">
              Chưa có điều ước nào ở đây cả ✨
            </p>
            <p className="font-sans text-xs sm:text-sm text-text-secondary">
              Gửi một điều ước đầu tiên vào vũ trụ cùng mình nha?
            </p>
          </div>
          <Link to="/viet">
            <Button variant="pill" className="text-sm shadow-glow">
              <span>Viết điều ước ngay ✨</span>
            </Button>
          </Link>
        </div>
      ) : prefs.toiView === 'sky' ? (
        <ConstellationView notes={notes} />
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
            Vũ trụ sẽ không còn giữ điều ước này giúp bạn nữa, mình có chắc muốn xoá không?
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

      {/* Year in Review Modal (§4.5) */}
      <YearInReviewModal
        isOpen={showYearInReview}
        onClose={() => setShowYearInReview(false)}
        stats={yearStats}
      />

      {/* Unsubscribe Toast Notification */}
      <Toast message={toastMsg || ''} visible={!!toastMsg} onClose={() => setToastMsg(null)} />
    </div>
  );
}

export default MyCorner;
