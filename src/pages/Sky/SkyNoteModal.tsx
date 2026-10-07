import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag, Sparkles, Lock } from 'lucide-react';
import { SkyNote } from '@/lib/sky';
import { PAPER_THEMES } from '@/lib/constants';
import { format } from 'date-fns';

export interface SkyNoteModalProps {
  note: SkyNote | null;
  isOpen: boolean;
  onClose: () => void;
  onReport: (noteId: string) => Promise<void>;
}

export function SkyNoteModal({ note, isOpen, onClose, onReport }: SkyNoteModalProps) {
  const [reporting, setReporting] = useState(false);
  const [showConfirmReport, setShowConfirmReport] = useState(false);

  if (!note) return null;

  const now = Date.now();
  const isSealed = note.status === 'sealed' && note.unlockAt > now;
  const paper = PAPER_THEMES.find((p) => p.id === note.paperTheme) || PAPER_THEMES[0];
  const formattedUnlockDate = format(new Date(note.unlockAt), 'dd/MM/yyyy');
  const formattedCreateDate = format(new Date(note.createdAt), 'dd/MM/yyyy');

  const handleConfirmReport = async () => {
    setReporting(true);
    try {
      await onReport(note.id);
      setShowConfirmReport(false);
      onClose();
    } finally {
      setReporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-bg-deep/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            style={{
              backgroundColor: paper.bgHex,
              borderColor: `${paper.borderHex}40`,
            }}
            className="relative z-10 w-full max-w-md rounded-2xl border p-6 shadow-glow text-text-primary overflow-hidden"
          >
            {/* Header: Pseudonym, Stickers, Close */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/10 text-star-glow text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <span className="font-mono text-xs sm:text-sm font-medium tracking-wide text-lavender-light">
                  {note.pseudonym}
                </span>
                {note.stickerIds && note.stickerIds.length > 0 && (
                  <span className="inline-flex items-center gap-0.5 ml-1 select-none">
                    {note.stickerIds.map((s, idx) => (
                      <span key={idx} className="text-sm">
                        {s}
                      </span>
                    ))}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Note Content Body */}
            <div className="my-6 min-h-[110px] flex flex-col justify-center">
              {isSealed ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-muted">
                    <Lock className="w-5 h-5 text-lavender" />
                  </div>
                  <p className="font-sans text-sm sm:text-base font-medium text-text-secondary">
                    Điều ước này chưa đến ngày mở 🔒
                  </p>
                  <p className="font-sans text-xs text-text-muted">
                    Ngày mở: {formattedUnlockDate}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="font-sans text-[15px] sm:text-base leading-relaxed text-text-primary whitespace-pre-wrap">
                    {note.content || '...'}
                  </p>
                  <div className="flex items-center justify-between pt-2 text-[11px] font-sans text-text-muted border-t border-white/5">
                    <span>Gửi: {formattedCreateDate}</span>
                    <span>Mở: {formattedUnlockDate}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with small report link (§3.4 Layer 2) */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
              <span className="font-sans text-text-muted text-[11px]">
                {note.seed ? 'Điều ước từ vũ trụ' : 'Ẩn danh trên bầu trời'}
              </span>

              {!showConfirmReport ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmReport(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-sans text-text-muted hover:text-rose-400 transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  <Flag className="w-3 h-3" />
                  <span>Báo cáo</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 animate-fade-in">
                  <span className="text-[11px] text-rose-300">Ẩn điều ước này?</span>
                  <button
                    type="button"
                    onClick={handleConfirmReport}
                    disabled={reporting}
                    className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 text-[11px] font-semibold"
                  >
                    {reporting ? 'Đang ẩn...' : 'Xác nhận'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmReport(false)}
                    className="text-[11px] text-text-muted hover:text-text-primary px-1"
                  >
                    Huỷ
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
