import { UnlockPicker } from '@/components/wish/UnlockPicker';
import { formatDate } from '@/lib/date';

export interface Step3UnlockProps {
  unlockAt: number;
  onUnlockAtChange: (timestamp: number) => void;
}

export function Step3Unlock({ unlockAt, onUnlockAtChange }: Step3UnlockProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-display text-2xl font-normal text-text-primary">
          Bao giờ mở lại? 🔒
        </h2>
        <p className="font-sans text-xs text-text-secondary">
          Hãy cho điều ước chút thời gian để vũ trụ lắng nghe.
        </p>
      </div>

      <UnlockPicker unlockAt={unlockAt} onChange={onUnlockAtChange} />

      <div className="rounded-md border border-border-soft bg-bg-soft/70 p-4 text-center">
        <span className="text-xs text-text-muted font-sans">Ngày mở dự kiến:</span>
        <p className="font-sans font-semibold text-lg text-star-glow mt-1">
          {formatDate(unlockAt)}
        </p>
      </div>

      <div className="space-y-2 pt-2 border-t border-border-soft">
        <label className="text-xs font-semibold text-text-secondary font-sans">Ai được đọc?</label>
        <div className="space-y-2 text-sm font-sans">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked readOnly className="accent-lavender" />
            <span>Chỉ mình mình 🔒</span>
          </label>
          <label className="flex items-center gap-2 opacity-50 cursor-not-allowed">
            <input type="radio" disabled />
            <span>Ẩn danh trên bầu trời (sắp có ở v2)</span>
          </label>
        </div>
      </div>
    </div>
  );
}
