import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon, Download, Home, PlusCircle, Loader2 } from 'lucide-react';

import { useWriteStore } from '@/store/useWriteStore';
import { formatDate, getDaysRemaining } from '@/lib/date';
import { exportAndShareCard, preRenderCard, PreRenderedCard } from '@/lib/share';
import { STORAGE_KEYS } from '@/lib/constants';
import { Note } from '@/types/note';

import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { ShareCard } from '@/components/wish/ShareCard';
import { SealSequence } from './SealSequence';

export type ShareState = 'idle' | 'rendering' | 'done' | 'error';

export function Sealed() {
  const navigate = useNavigate();
  const reset = useWriteStore((state) => state.reset);

  const [lastSavedNote] = useState<Note | null>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEYS.LAST_SEALED);
      if (!raw) return null;
      return JSON.parse(raw) as Note;
    } catch {
      return null;
    }
  });

  // Clear lastSealed once mounted so refresh or revisit redirects to /
  useEffect(() => {
    const timer = setTimeout(() => {
      sessionStorage.removeItem(STORAGE_KEYS.LAST_SEALED);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const [isSequenceComplete, setIsSequenceComplete] = useState(false);
  const [shareState, setShareState] = useState<ShareState>('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const shareCardRef = useRef<HTMLDivElement>(null);
  const cachedCardRef = useRef<PreRenderedCard | null>(null);

  // 1. Route Guard: redirect to / if landed directly with no just-saved note
  useEffect(() => {
    if (!lastSavedNote) {
      navigate('/', { replace: true });
    }
  }, [lastSavedNote, navigate]);

  // 2. Pre-render share card silently in the background on mount
  useEffect(() => {
    if (!lastSavedNote || !shareCardRef.current) return;

    preRenderCard(shareCardRef.current)
      .then((cached) => {
        cachedCardRef.current = cached;
      })
      .catch((err) => {
        console.warn('Silent pre-render failed:', err);
      });
  }, [lastSavedNote]);

  if (!lastSavedNote) {
    return null;
  }

  const daysRemaining = getDaysRemaining(lastSavedNote.unlockAt);
  const formattedUnlockDate = formatDate(lastSavedNote.unlockAt);

  const handleDownloadShareCard = async () => {
    if (!shareCardRef.current || shareState === 'rendering') return;

    try {
      if (!cachedCardRef.current) {
        setShareState('rendering');
      }

      const result = await exportAndShareCard(
        shareCardRef.current,
        lastSavedNote.id,
        cachedCardRef.current
      );

      if (result.action !== 'cancelled') {
        setShareState('done');
        setToastMessage('Đã lưu ảnh nha 📸');
        setToastVisible(true);
      } else {
        setShareState('idle');
      }
    } catch (err) {
      console.error(err);
      setShareState('error');
      setToastMessage('Có lỗi rồi, thử lại nha 🥲');
      setToastVisible(true);
    }
  };

  const handleHome = () => {
    reset();
    sessionStorage.removeItem(STORAGE_KEYS.LAST_SEALED);
    navigate('/');
  };

  const handleWriteAnother = () => {
    reset();
    sessionStorage.removeItem(STORAGE_KEYS.LAST_SEALED);
    navigate('/viet');
  };

  const showSuccess = isSequenceComplete;

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center py-6 px-4">
      {/* Hidden 1080x1920 Share Card for PNG generation */}
      <ShareCard ref={shareCardRef} note={lastSavedNote} />

      {!showSuccess ? (
        <SealSequence
          note={lastSavedNote}
          onComplete={() => setIsSequenceComplete(true)}
        />
      ) : (
        /* Success Screen */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="w-full max-w-[420px] mx-auto flex flex-col items-center text-center space-y-6"
        >
          {/* Moon badge 48px */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-lavender/30 blur-xl pointer-events-none" />
            <div className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-bg-soft/80 border border-border-soft text-star-glow shadow-glow">
              <Moon className="h-6 w-6 fill-star-glow/20 text-star-glow" />
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-2">
            <h1 className="font-display font-normal text-[32px] sm:text-[36px] text-text-primary leading-[1.25]">
              Điều ước đã bay lên trời 🔒
            </h1>
            <p className="font-sans font-normal text-[16px] text-text-secondary">
              Vũ trụ sẽ giữ nó giúp bạn.
            </p>
          </div>

          {/* Countdown & Unlock Info */}
          <div className="w-full py-4 px-6 rounded-2xl bg-bg-soft/60 border border-border-soft space-y-1.5">
            <p className="font-sans text-xs text-text-muted">
              Mở lại vào:{' '}
              <span className="font-semibold text-text-primary">
                {formattedUnlockDate}
              </span>
            </p>
            <p className="font-sans text-2xl font-bold text-lavender flex items-center justify-center gap-1.5">
              <span>Còn {daysRemaining} ngày</span>
              <span>🌙</span>
            </p>
          </div>

          {/* Action Buttons (Vertical stack mobile) */}
          <div className="w-full space-y-3 pt-2">
            <Button
              variant="pill"
              onClick={handleDownloadShareCard}
              disabled={shareState === 'rendering'}
              className="w-full py-4 text-base font-semibold shadow-glow flex items-center justify-center gap-2"
            >
              {shareState === 'rendering' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Đang tạo ảnh…</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>Tải share card 📸</span>
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={handleHome}
              className="w-full py-3 text-sm text-text-secondary hover:text-text-primary flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              <span>Về nhà</span>
            </Button>

            <Button
              variant="ghost"
              onClick={handleWriteAnother}
              className="w-full py-3 text-sm text-lavender hover:text-text-primary flex items-center justify-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Viết thêm một điều ước ✨</span>
            </Button>
          </div>
        </motion.div>
      )}

      {/* Toast Feedback */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        duration={3000}
      />
    </div>
  );
}

export default Sealed;
