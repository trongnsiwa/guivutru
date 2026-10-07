import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Lock, Unlock, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchMySkyNotes, SkyNote } from '@/lib/sky';
import { getOrCreateUserPseudonym } from '@/lib/pseudonym';
import { SkyCanvas } from './SkyCanvas';
import { SkyNoteModal } from './SkyNoteModal';

export function MySky() {
  const { user, openLoginModal } = useAuth();
  const [notes, setNotes] = useState<SkyNote[]>([]);
  const [pseudonym, setPseudonym] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<SkyNote | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [myNotes, userPseudonym] = await Promise.all([
          fetchMySkyNotes(user!.id),
          getOrCreateUserPseudonym(user!.id),
        ]);
        if (isMounted) {
          setNotes(myNotes);
          setPseudonym(userPseudonym);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3" aria-live="polite">
        <p className="font-display text-xl text-star-glow animate-pulse">
          Đang gom các vì sao…
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-bg-soft/70 border border-lavender/30 flex items-center justify-center text-2xl">
          🌌
        </div>
        <h2 className="font-display text-xl sm:text-2xl text-text-primary">
          Chòm sao của bạn
        </h2>
        <p className="font-sans text-xs sm:text-sm text-text-secondary max-w-xs">
          Đăng nhập để xem những vì sao bạn đã gửi lên bầu trời vũ trụ dưới danh xưng ẩn danh.
        </p>
        <button
          type="button"
          onClick={openLoginModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-lavender/25 text-lavender-light border border-lavender/40 hover:bg-lavender/35 transition-colors text-sm font-medium shadow-glow"
        >
          <LogIn className="w-4 h-4" />
          <span>Đăng nhập</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between">
        <Link
          to="/bau-troi"
          className="inline-flex items-center gap-1.5 text-xs font-sans text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Bầu trời</span>
        </Link>

        {pseudonym && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lavender/15 border border-lavender/30 text-xs font-mono text-lavender-light">
            <Sparkles className="w-3 h-3 text-star-glow" />
            <span>{pseudonym}</span>
          </div>
        )}
      </div>

      <div className="w-full text-center space-y-1">
        <h1 className="font-display text-2xl sm:text-3xl text-text-primary">
          Chòm sao của bạn
        </h1>
        <p className="font-sans text-xs sm:text-sm text-text-secondary">
          {notes.length > 0
            ? `Bạn đã gửi ${notes.length} điều ước lên bầu trời ẩn danh.`
            : 'Bạn chưa có vì sao nào trên bầu trời. Hãy gửi một điều ước nhé!'}
        </p>
      </div>

      {/* Sky Canvas for user's notes */}
      {notes.length > 0 ? (
        <div className="w-full space-y-6">
          <SkyCanvas
            notes={notes}
            onSelectNote={(n) => setSelectedNote(n)}
          />

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {notes.map((note) => {
              const isSealed = note.status === 'sealed' && note.unlockAt > Date.now();
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className="p-4 rounded-xl border border-border-soft bg-bg-soft/50 hover:bg-bg-soft/80 transition-all cursor-pointer space-y-2 text-left"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-lavender-light flex items-center gap-1">
                      {isSealed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-star-glow" />}
                      <span>{isSealed ? 'Đang niêm phong' : 'Đã mở'}</span>
                    </span>
                    <span className="text-text-muted">
                      {new Date(note.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-text-primary line-clamp-2">
                    {note.content || 'Điều ước đang được niêm phong 🔒'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="w-full py-16 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl border border-border-soft/40 bg-bg-soft/20">
          <span className="text-4xl">✨</span>
          <p className="font-sans text-sm text-text-muted">
            Chưa có vì sao nào trong chòm sao này.
          </p>
          <Link
            to="/viet"
            className="px-4 py-2 rounded-xl bg-lavender/20 border border-lavender/30 text-lavender-light text-xs font-medium hover:bg-lavender/30 transition-colors"
          >
            Viết điều ước ngay
          </Link>
        </div>
      )}

      {/* Modal detail */}
      <SkyNoteModal
        note={selectedNote}
        isOpen={Boolean(selectedNote)}
        onClose={() => setSelectedNote(null)}
        onReport={async () => {
          // Own note report not typical, but handles gracefully
        }}
      />
    </div>
  );
}

export default MySky;
