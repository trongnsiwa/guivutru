import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchSkyCount } from '@/lib/sky';

export interface SkyCtaCardProps {
  /** Optional initial count override (e.g. for testing or SSR) */
  initialCount?: number | null;
}

/**
 * SkyCtaCard (§4 A3 + A4):
 * Promoted CTA card routing to /bau-troi with live star count.
 *
 * Count rendering ladder:
 * 1. Count > 0  → "{count} vì sao đang chờ" formatted with vi-VN thousand separator.
 * 2. Count = 0  → "Chưa có vì sao nào — hãy là người đầu tiên ✨" (genuine zero).
 * 3. Count null → Subtitle is hidden entirely; card renders title and chevron only.
 */
export function SkyCtaCard({ initialCount }: SkyCtaCardProps = {}) {
  const [count, setCount] = useState<number | null>(initialCount ?? null);

  useEffect(() => {
    if (initialCount !== undefined) {
      setCount(initialCount);
      return;
    }

    let mounted = true;
    fetchSkyCount()
      .then((res) => {
        if (mounted) {
          setCount(res);
        }
      })
      .catch(() => {
        if (mounted) {
          setCount(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [initialCount]);

  const subtitle = useMemo(() => {
    if (count === null) {
      return null;
    }
    if (count === 0) {
      return 'Chưa có vì sao nào — hãy là người đầu tiên ✨';
    }
    return `${count.toLocaleString('vi-VN')} vì sao đang chờ`;
  }, [count]);

  return (
    <Link
      to="/bau-troi"
      className="group flex items-center justify-between w-full max-w-xs mx-auto p-3.5 sm:p-4 rounded-2xl bg-bg-soft/70 border border-lavender/30 hover:border-lavender/60 hover:bg-bg-soft/90 transition-colors select-none text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl select-none shrink-0" aria-hidden="true">
          🌌
        </span>
        <div className="min-w-0 flex flex-col">
          <span className="font-display text-sm sm:text-base text-text-primary group-hover:text-lavender transition-colors truncate">
            Bầu trời điều ước
          </span>
          {subtitle && (
            <span className="text-xs font-sans text-text-muted truncate">
              {subtitle}
            </span>
          )}
        </div>
      </div>
      <svg
        className="w-4 h-4 text-text-muted group-hover:text-lavender transition-colors shrink-0 ml-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default SkyCtaCard;
