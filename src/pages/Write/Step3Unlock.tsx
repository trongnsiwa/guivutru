import { UnlockPicker } from '@/components/wish/UnlockPicker';
import { format } from 'date-fns';

export interface Step3UnlockProps {
  unlockAt: number;
  onUnlockAtChange: (timestamp: number) => void;
  visibility?: 'private' | 'public';
  onVisibilityChange?: (visibility: 'private' | 'public') => void;
}

export function Step3Unlock({
  unlockAt,
  onUnlockAtChange,
  visibility = 'private',
  onVisibilityChange,
}: Step3UnlockProps) {
  const formattedDate = format(new Date(unlockAt), 'dd/MM/yyyy');

  return (
    <div className="w-full flex-1 flex flex-col items-center">
      <h1 className="font-display font-normal text-[32px] text-text-primary text-center leading-[1.3] mb-6">
        Bao giờ mở lại?
      </h1>

      <div className="w-full max-w-[420px] space-y-6">
        {/* Quick Chips & Custom Input */}
        <UnlockPicker unlockAt={unlockAt} onChange={onUnlockAtChange} />

        {/* Preview line: Ngày mở: DD/MM/YYYY in Nunito 14px, muted */}
        <div className="rounded-xl border border-border-soft bg-bg-soft/50 py-3.5 px-4 text-center">
          <p className="font-sans text-[14px] text-text-muted">
            <span>Ngày mở: </span>
            <strong className="text-star-glow font-semibold">{formattedDate}</strong>
          </p>
        </div>

        {/* Privacy Section (§3.1) */}
        <div className="space-y-3 pt-2 border-t border-border-soft/60">
          <label className="block text-xs font-semibold text-text-secondary font-sans uppercase tracking-wider">
            Ai được đọc?
          </label>

          <div className="space-y-2.5 font-sans">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border-soft bg-bg-soft/70 cursor-pointer transition-colors hover:border-lavender/40">
              <input
                type="radio"
                name="privacy"
                value="private"
                checked={visibility === 'private'}
                onChange={() => onVisibilityChange?.('private')}
                className="h-4 w-4 accent-lavender cursor-pointer"
              />
              <span className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                <span>Chỉ mình mình</span>
                <span className="text-xs">🔒</span>
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-border-soft bg-bg-soft/70 cursor-pointer transition-colors hover:border-lavender/40">
              <input
                type="radio"
                name="privacy"
                value="public"
                checked={visibility === 'public'}
                onChange={() => onVisibilityChange?.('public')}
                className="h-4 w-4 accent-lavender cursor-pointer"
              />
              <span className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                <span>Ẩn danh trên bầu trời</span>
                <span className="text-xs">🌌</span>
              </span>
            </label>

            {/* Confirmation panel (§3.1) */}
            {visibility === 'public' && (
              <div className="rounded-xl border border-lavender/30 bg-bg-soft/90 p-3.5 text-xs text-text-secondary leading-relaxed animate-fade-in">
                <p className="italic text-lavender-light">
                  &ldquo;Điều ước này sẽ xuất hiện trên Bầu trời điều ước sau khi mở. Không ai biết là của bạn. Bạn có thể xoá bất cứ lúc nào.&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Step3Unlock;

