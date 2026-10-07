import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Calendar, Sparkles, Share2, Loader2, Check } from 'lucide-react';
import { motion } from 'framer-motion';

import { useNotes } from '@/hooks/useNotes';
import { NotePaper } from '@/components/wish/NotePaper';
import { CountdownBadge } from '@/components/wish/CountdownBadge';
import { ShareCard } from '@/components/wish/ShareCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/date';
import { exportAndShareCard } from '@/lib/share';
import { STORAGE_KEYS } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { getOrCreateUserPseudonym } from '@/lib/pseudonym';
import { checkPublicRateLimit, RATE_LIMIT_REJECTION } from '@/lib/sky';
import { validateContentModeration, BAD_WORD_REJECTION } from '@/lib/moderation';
import { UnlockSequence } from './NoteDetail/UnlockSequence';

export function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Audit: select note and actions with focused selectors
  const note = useNotes((s) => s.notes.find((n) => n.id === id));
  const openNote = useNotes((s) => s.openNote);
  const updateNoteVisibility = useNotes((s) => s.updateNoteVisibility);

  const [isSharing, setIsSharing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const shareCardRef = useRef<HTMLDivElement>(null);
  const hasAutoOpenedRef = useRef(false);

  // First-visit unlock check (note was sealed and unlockAt has passed)
  const isFirstVisitUnlockRef = useRef(
    note ? note.status === 'sealed' && Date.now() >= note.unlockAt : false
  );
  const [isUnlocking, setIsUnlocking] = useState(isFirstVisitUnlockRef.current);

  // Transition to opened state if unlock date has passed and still sealed (once on mount)
  useEffect(() => {
    if (
      note &&
      note.status === 'sealed' &&
      Date.now() >= note.unlockAt &&
      !hasAutoOpenedRef.current
    ) {
      hasAutoOpenedRef.current = true;
      console.log('[NoteDetail] Unlocking note once:', note.id);
      openNote(note.id);

      try {
        const raw = localStorage.getItem(STORAGE_KEYS.VIEWED_UNLOCKS);
        const viewed: string[] = raw ? JSON.parse(raw) : [];
        if (!viewed.includes(note.id)) {
          viewed.push(note.id);
          localStorage.setItem(STORAGE_KEYS.VIEWED_UNLOCKS, JSON.stringify(viewed));
        }
      } catch {
        // safe fallback
      }
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

  if (isUnlocking) {
    return (
      <div className="flex flex-1 flex-col py-2 space-y-6">
        <UnlockSequence
          note={note}
          onComplete={() => setIsUnlocking(false)}
        />
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

  const handlePublish = async () => {
    try {
      setIsPublishing(true);

      // Acceptance: Publishing requires login (§3.7)
      const user = useAuth.getState().user;
      if (!user) {
        setShowPublishModal(false);
        setToastMessage('Đăng nhập để chia sẻ lên bầu trời nha 🌙');
        setToastVisible(true);
        useAuth.getState().openLoginModal();
        return;
      }

      // Layer 1: Pre-filter bad words (§3.4)
      if (note.content) {
        const modRes = await validateContentModeration(note.content);
        if (!modRes.allowed) {
          setShowPublishModal(false);
          setToastMessage(modRes.message || BAD_WORD_REJECTION);
          setToastVisible(true);
          return;
        }
      }

      // Layer 3.5: Rate limiting check (1/day, 5/week) (§3.5)
      const rateCheck = await checkPublicRateLimit(user.id);
      if (!rateCheck.allowed) {
        setShowPublishModal(false);
        setToastMessage(rateCheck.message || RATE_LIMIT_REJECTION);
        setToastVisible(true);
        return;
      }

      // Stable pseudonym per user (§3.3)
      const assignedPseudonym = await getOrCreateUserPseudonym(user.id);

      await updateNoteVisibility(note.id, 'public', assignedPseudonym);
      setShowPublishModal(false);
      setToastMessage('Đã chia sẻ lên Bầu trời ✨');
      setToastVisible(true);
    } catch (err: unknown) {
      setShowPublishModal(false);
      const isRateLimited = err instanceof Error && err.message.includes('Bạn đã gửi hôm nay rồi');
      const msg = isRateLimited
        ? RATE_LIMIT_REJECTION
        : 'Không thể chia sẻ lúc này, thử lại sau nha 🥲';
      setToastMessage(msg);
      setToastVisible(true);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      setIsPublishing(true);
      await updateNoteVisibility(note.id, 'private');
      setToastMessage('Đã chuyển về chỉ mình mình 🔒');
      setToastVisible(true);
    } catch {
      setToastMessage('Có lỗi xảy ra, thử lại sau nha 🥲');
      setToastVisible(true);
    } finally {
      setIsPublishing(false);
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
          isSealed
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.97 }
        }
        animate={
          isSealed
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

      {/* Public / Sky Wall Visibility Control (§3.1, §3.3) */}
      <div className="rounded-2xl border border-border-soft bg-bg-soft/60 p-4 space-y-3 font-sans">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2.5">
            <span className="text-lg select-none mt-0.5">
              {note.visibility === 'public' ? '🌌' : '🔒'}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-text-primary">
                  {note.visibility === 'public' ? 'Ẩn danh trên Bầu trời' : 'Chỉ mình mình'}
                </p>
                {note.visibility === 'public' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-lavender/15 text-lavender-light border border-lavender/30">
                    <Sparkles className="h-3 w-3 text-star-glow" />
                    <span>{note.pseudonym || 'bạn'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                {note.visibility === 'public'
                  ? isSealed
                    ? 'Ngôi sao được hiển thị ẩn danh trên Bầu trời (nội dung vẫn được bảo mật cho đến ngày mở).'
                    : 'Điều ước đang toả sáng trên Bầu trời để mọi người cùng chia sẻ.'
                  : 'Điều ước này được giữ kín riêng tư, chưa xuất hiện trên Bầu trời.'}
              </p>
            </div>
          </div>

          {note.visibility === 'public' ? (
            <Button
              variant="ghost"
              onClick={handleUnpublish}
              disabled={isPublishing}
              className="text-xs text-text-muted hover:text-text-primary border border-border-soft/60 hover:border-border-soft px-3 py-1.5"
            >
              {isPublishing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span>Gỡ khỏi Bầu trời</span>
              )}
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setShowPublishModal(true)}
              disabled={isPublishing}
              className="text-xs text-lavender hover:text-lavender-light border border-lavender/30 hover:border-lavender/60 px-3 py-1.5 flex items-center gap-1.5"
            >
              <span>Chia sẻ lên Bầu trời</span>
              <span>🌌</span>
            </Button>
          )}
        </div>
      </div>

      {/* Publish Confirmation Modal (§3.1) */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Đưa điều ước lên Bầu trời ✨"
      >
        <div className="space-y-4 pt-1">
          <p className="text-sm font-sans text-text-secondary leading-relaxed italic">
            &ldquo;Điều ước này sẽ xuất hiện trên Bầu trời điều ước sau khi mở. Không ai biết là của bạn. Bạn có thể xoá bất cứ lúc nào.&rdquo;
          </p>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              variant="ghost"
              onClick={() => setShowPublishModal(false)}
              disabled={isPublishing}
            >
              Huỷ
            </Button>
            <Button
              variant="pill"
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-5 shadow-glow"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  <span>Đang gửi…</span>
                </>
              ) : (
                <span>Đồng ý chia sẻ</span>
              )}
            </Button>
          </div>
        </div>
      </Modal>

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
