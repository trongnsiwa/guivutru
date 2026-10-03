import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Calendar, Sparkles, Share2, Loader2, Check } from 'lucide-react';
import { motion } from 'framer-motion';

import { useNotes } from '@/hooks/useNotes';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { NotePaper } from '@/components/wish/NotePaper';
import { CountdownBadge } from '@/components/wish/CountdownBadge';
import { ShareCard } from '@/components/wish/ShareCard';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/date';
import { exportAndShareCard } from '@/lib/share';

export function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  // Audit: select note and openNote action with focused selector
  const note = useNotes((s) => s.notes.find((n) => n.id === id));
  const openNote = useNotes((s) => s.openNote);

  const [isSharing, setIsSharing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const shareCardRef = useRef<HTMLDivElement>(null);
  const hasAutoOpenedRef = useRef(false);

  // Transition to opened state if unlock date has passed and still sealed (once on mount)
  useEffect(() => {
    if (
      note &&
      note.status === 'sealed' &&
      Date.now() >= note.unlockAt &&
      !hasAutoOpenedRef.current
    ) {
      hasAutoOpenedRef.current = true;
      openNote(note.id);
    }
  }, [note, openNote]);

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

  const handleShare = async () => {
    if (!shareCardRef.current || isSharing) return;
    try {
      setIsSharing(true);
      const res = await exportAndShareCard(shareCardRef.current, note.id);
      if (res.action !== 'cancelled') {
        setToastMessage('Đã lưu ảnh nha 📸');
        setToastVisible(true);
      }
    } catch (err) {
      console.error('Export card error:', err);
      setToastMessage('Có lỗi khi tạo ảnh, thử lại nha 🥲');
      setToastVisible(true);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col py-2 space-y-6">
      {/* Off-screen ShareCard mounted ONLY when opened to guarantee sealed content is NEVER in DOM */}
      {!isSealed && (
        <ShareCard ref={shareCardRef} note={note} />
      )}

      {/* Top Navigation & Status */}
      <div className="flex items-center justify-between">
        <Link
          to="/toi"
          className="flex items-center gap-1.5 text-xs font-sans text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Góc của tôi</span>
        </Link>
        <CountdownBadge unlockAt={note.unlockAt} />
      </div>

      {/* Note Paper Container with Fade + Scale Animation */}
      <motion.div
        key={isSealed ? 'sealed' : 'opened'}
        initial={
          prefersReducedMotion || isSealed
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.97 }
        }
        animate={
          prefersReducedMotion || isSealed
            ? { opacity: 1 }
            : { opacity: 1, scale: 1 }
        }
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <NotePaper
          theme={note.paperTheme}
          content={isSealed ? '' : note.content}
          stickers={note.stickerIds}
          isSealed={isSealed}
        />
      </motion.div>

      {/* Dates Card */}
      <div className="rounded-2xl border border-border-soft bg-bg-soft/60 p-4 space-y-2.5 text-xs font-sans text-text-secondary">
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
            {isSealed ? (
              <Lock className="h-3.5 w-3.5 text-text-muted" />
            ) : (
              <Check className="h-3.5 w-3.5 text-mint" />
            )}
            <span>{isSealed ? 'Mở lại vào:' : 'Ngày mở:'}</span>
          </span>
          <span className={`font-semibold ${isSealed ? 'text-star-glow' : 'text-mint'}`}>
            {formatDate(note.openedAt || note.unlockAt)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        {!isSealed && (
          <Button
            variant="pill"
            onClick={handleShare}
            disabled={isSharing}
            className="flex-1 py-3 text-sm flex items-center justify-center gap-2 shadow-glow"
          >
            {isSharing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang tạo ảnh…</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                <span>Chia sẻ</span>
              </>
            )}
          </Button>
        )}

        <Link to="/viet" className={isSealed ? 'w-full' : 'flex-1'}>
          <Button
            variant={isSealed ? 'primary' : 'ghost'}
            className="w-full py-3 text-sm flex items-center justify-center gap-2 shadow-glow"
          >
            <Sparkles className="h-4 w-4" />
            <span>Viết điều mới</span>
          </Button>
        </Link>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        duration={3000}
      />
    </div>
  );
}

export default NoteDetail;
