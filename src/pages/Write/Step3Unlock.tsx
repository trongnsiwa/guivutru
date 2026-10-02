import { UnlockPicker } from '@/components/wish/UnlockPicker';
import { format } from 'date-fns';

export interface Step3UnlockProps {
  unlockAt: number;
  onUnlockAtChange: (timestamp: number) => void;
}

export function Step3Unlock({ unlockAt, onUnlockAtChange }: Step3UnlockProps) {
  const formattedDate = format(new Date(unlockAt), 'dd/MM/yyyy');

  return (
    <div className="w-full flex flex-col items-center">
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

        {/* Privacy Section */}
        <div className="space-y-3 pt-2 border-t border-border-soft/60">
          <label className="block text-xs font-semibold text-text-secondary font-sans uppercase tracking-wider">
            Ai được đọc?
          </label>

          <div className="space-y-2.5 font-sans">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border-soft bg-bg-soft/70 cursor-pointer transition-colors hover:border-lavender/40">
              <input
                type="radio"
                name="privacy"
                checked
                readOnly
                className="h-4 w-4 accent-lavender cursor-pointer"
              />
              <span className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                <span>Chỉ mình mình</span>
                <span className="text-xs">🔒</span>
              </span>
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-border-soft/40 bg-bg-soft/30 opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="privacy"
                  disabled
                  className="h-4 w-4 cursor-not-allowed"
                />
                <span className="text-sm font-normal text-text-secondary">
                  Ẩn danh trên bầu trời
                </span>
              </div>
              <span className="text-[11px] font-mono text-text-muted bg-bg-deep/60 px-2 py-0.5 rounded border border-border-soft/30">
                sắp có
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Step3Unlock;
