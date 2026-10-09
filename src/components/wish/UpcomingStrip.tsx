import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchSkyNotes, pickUpcomingNotes, formatCountdownDays } from '@/lib/sky';
import type { SkyNote } from '@/lib/sky';
import { PAPER_THEMES } from '@/lib/constants';

export interface UpcomingStripProps {
  initialNotes?: SkyNote[];
}

export function UpcomingStrip({ initialNotes }: UpcomingStripProps = {}) {
  const [notes, setNotes] = useState<SkyNote[] | null>(initialNotes ?? null);
  const [loading, setLoading] = useState(!initialNotes);

  useEffect(() => {
    if (initialNotes !== undefined) {
      setNotes(initialNotes);
      setLoading(false);
      return;
    }

    let mounted = true;
    fetchSkyNotes('sap-mo')
      .then((data) => {
        if (mounted) {
          setNotes(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setNotes([]);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [initialNotes]);

  const upcomingNotes = useMemo(() => {
    if (!notes || notes.length === 0) return [];
    return pickUpcomingNotes(notes, Date.now(), 3);
  }, [notes]);

  // Fail silent (§3 rule 2, §4 A2): if 0 upcoming notes or error, render null
  if (loading || upcomingNotes.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-xs mx-auto space-y-2 select-none">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-xl sm:text-2xl font-display text-text-primary">
          Sắp mở
        </h2>
        <p className="text-[11px] font-sans text-text-muted">
          Một điều ước của ai đó sắp đến ngày mở.
        </p>
      </div>

      <div className="flex flex-col gap-1.5" role="list">
        {upcomingNotes.map((note) => {
          const theme = PAPER_THEMES.find((p) => p.id === note.paperTheme);
          const themeName = theme?.name || 'Đêm sao';
          const countdown = formatCountdownDays(note.unlockAt, Date.now());

          return (
            <Link
              key={note.id}
              to="/bau-troi"
              role="listitem"
              className="group flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border-soft/60 bg-bg-soft/50 hover:bg-bg-soft/80 hover:border-lavender/40 transition-colors text-xs font-sans text-text-secondary hover:text-text-primary"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm select-none" aria-hidden="true">
                  ⏳
                </span>
                <span className="font-medium text-text-primary">
                  {countdown}
                </span>
                <span className="text-text-muted">·</span>
                <span className="text-text-secondary">
                  {themeName}
                </span>
              </div>
              <span
                className="text-text-muted group-hover:text-lavender transition-colors text-xs"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
