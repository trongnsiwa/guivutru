import { useRef, useState } from 'react';
import { Download, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { YearInReviewCard } from './YearInReviewCard';
import { YearInReviewStats } from '@/lib/yearInReview';
import { exportAndShareCard } from '@/lib/share';

interface YearInReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: YearInReviewStats;
}

export function YearInReviewModal({ isOpen, onClose, stats }: YearInReviewModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    try {
      const res = await exportAndShareCard(cardRef.current, 'nam-qua-cung-vu-tru');
      if (res.success) {
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to export Year in Review card:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nhìn lại một năm qua ✨">
      <div className="space-y-5 text-text-primary" data-testid="year-in-review-modal">
        {/* Hidden full-res 1080x1920 DOM node for high-res PNG generation */}
        <YearInReviewCard ref={cardRef} stats={stats} />

        {/* Header summary */}
        <div className="text-center space-y-1">
          <p className="font-sans text-xs text-text-secondary">
            Cảm ơn bạn đã đồng hành cùng các vì sao suốt chặng đường qua.
          </p>
        </div>

        {/* Mobile-friendly preview card */}
        <div className="rounded-2xl bg-[#17122D] border border-border-strong p-4 space-y-4 shadow-sm">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-bg-soft/70 p-2.5 border border-border-soft">
              <span className="block text-lg font-bold text-lavender font-display">
                {stats.notesWritten}
              </span>
              <span className="text-[10px] text-text-muted">Điều ước</span>
            </div>
            <div className="rounded-xl bg-bg-soft/70 p-2.5 border border-border-soft">
              <span className="block text-lg font-bold text-star-glow font-display">
                {stats.wordsSent}
              </span>
              <span className="text-[10px] text-text-muted">Con chữ</span>
            </div>
            <div className="rounded-xl bg-bg-soft/70 p-2.5 border border-border-soft">
              <span className="block text-lg font-bold text-peach font-display">
                {stats.moonsWatched}
              </span>
              <span className="text-[10px] text-text-muted">Tuần trăng</span>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-3 border border-border-soft/60 space-y-1">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-star-glow block">
              ✦ Điều ước của năm ✦
            </span>
            {stats.featuredWish ? (
              <p className="font-note text-sm text-text-primary line-clamp-3 italic">
                "{stats.featuredWish.content || '...'}"
              </p>
            ) : (
              <p className="font-sans text-xs text-text-secondary flex items-center justify-center gap-1.5 py-1">
                <span className="select-none">🔒</span>
                <span>Các điều ước đang được niêm phong cẩn thận.</span>
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-soft/40">
          <Button variant="ghost" onClick={onClose} className="text-xs px-3">
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={exporting}
            className="text-xs px-4 py-2 flex items-center gap-1.5 shadow-glow"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Đã lưu ảnh!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>{exporting ? 'Đang tạo ảnh...' : 'Lưu ảnh thẻ (1080p)'}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
