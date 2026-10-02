import { Lock, Clock } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';

export interface CountdownBadgeProps {
  unlockAt: number;
}

export function CountdownBadge({ unlockAt }: CountdownBadgeProps) {
  const { days, hours, isUnlocked } = useCountdown(unlockAt);

  if (isUnlocked) {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-mint/15 px-2.5 py-1 text-xs font-semibold text-mint border border-mint/30">
        <Clock className="h-3 w-3" />
        <span>Đã đến ngày mở ✨</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-lavender/15 px-2.5 py-1 text-xs font-semibold text-lavender border border-lavender/30">
      <Lock className="h-3 w-3" />
      <span>
        Còn {days > 0 ? `${days} ngày` : `${hours} giờ`} nữa 🔒
      </span>
    </span>
  );
}
