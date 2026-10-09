import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Moon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MockNoteStack } from '@/components/wish/MockNoteStack';
import { LiveSkyPreview } from '@/components/wish/LiveSkyPreview';
import { UpcomingStrip } from '@/components/wish/UpcomingStrip';
import { SkyCtaCard } from '@/components/wish/SkyCtaCard';
import { useNotes } from '@/hooks/useNotes';
import { Note } from '@/types/note';
import { cn } from '@/lib/cn';
import { fetchSkyNotes, pickUpcomingNotes } from '@/lib/sky';
import type { SkyNote } from '@/lib/sky';

function LandingComponent() {
  // Mark hero animated on first session visit so return visits are instant
  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('gvt.heroAnimated')) {
      sessionStorage.setItem('gvt.heroAnimated', 'true');
    }
  }, []);

  const notes = useNotes((s) => s.notes);

  // Mount gating (§5): hold sky preview, upcoming strip, and CTA count behind idle callback
  const [skyReady, setSkyReady] = useState(false);
  const [skyNotes, setSkyNotes] = useState<SkyNote[] | null>(null);
  const [skyNotesLoaded, setSkyNotesLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('skeleton')) {
      return;
    }
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(() => setSkyReady(true), { timeout: 1000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setSkyReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Shared fetch for LiveSkyPreview and UpcomingStrip (§13 Step 8)
  useEffect(() => {
    if (!skyReady) return;
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('empty')) {
      setSkyNotes([]);
      setSkyNotesLoaded(true);
      return;
    }
    let mounted = true;
    fetchSkyNotes('moi-nhat')
      .then((data) => {
        if (mounted) {
          setSkyNotes(data);
          setSkyNotesLoaded(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setSkyNotes([]);
          setSkyNotesLoaded(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, [skyReady]);

  const upcomingNotes = useMemo(() => {
    if (!skyNotes || skyNotes.length === 0) return [];
    return pickUpcomingNotes(skyNotes, Date.now(), 3);
  }, [skyNotes]);

  // B3: "Ngày này năm xưa" nostalgia match from a prior year
  const priorYearMatch = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();
    const currentYear = today.getFullYear();

    const matches: Array<{ note: Note; yearsAgo: number }> = [];

    for (const note of notes) {
      if (!note.createdAt) continue;
      const d = new Date(note.createdAt);
      if (
        d.getFullYear() < currentYear &&
        d.getMonth() === currentMonth &&
        d.getDate() === currentDate
      ) {
        matches.push({
          note,
          yearsAgo: currentYear - d.getFullYear(),
        });
      }
    }

    if (matches.length === 0) return null;
    matches.sort((a, b) => (a.note.createdAt || 0) - (b.note.createdAt || 0));
    return matches[0];
  }, [notes]);

  return (
    <div className="flex flex-1 flex-col items-center text-center w-full pt-[48px]">
      {/* Hero Section */}
      <div className="flex flex-col items-center">
        {/* Floating Moon with soft outer glow pulse */}
        <div
          style={{
            willChange: 'transform',
            animation: 'moon-float 6s ease-in-out infinite',
          }}
          className="relative inline-flex items-center justify-center"
        >
          {/* Outer glow pulse: opacity 0.4 -> 0.7 -> 0.4, 3s */}
          <div
            style={{
              willChange: 'transform, opacity',
              animation: 'glow-pulse 3s ease-in-out infinite',
            }}
            className="absolute inset-0 rounded-full bg-lavender/30 blur-xl pointer-events-none"
          />

          {/* Moon badge */}
          <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-bg-soft/80 border border-border-soft text-star-glow shadow-glow">
            <Moon className="h-8 w-8 fill-star-glow/20" />
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="mt-5 flex flex-col items-center">
          <h1 className="font-display font-normal text-[62px] sm:text-[78px] text-text-primary tracking-normal leading-[1.05] overflow-visible">
            <span>Vũ trụ ơi,</span>
            <br />
            <span className="text-lavender">mình muốn…</span>
          </h1>

          <p className="mt-4 font-sans font-normal text-[16px] sm:text-[17px] text-text-secondary max-w-[340px] mx-auto leading-relaxed">
            <span>Note lại điều mình muốn. Niêm phong.</span>
            <br />
            <span>Rồi để vũ trụ lo phần còn lại.</span>
          </p>
        </div>
      </div>

      {/* CTA Group */}
      <div className="mt-8 w-full max-w-xs flex flex-col items-center">
        <Link to="/viet" className="block w-full">
          <Button
            variant="pill"
            className="w-full font-sans font-semibold text-[16px] py-4 px-8 rounded-pill"
          >
            <span>Viết điều ước ✨</span>
          </Button>
        </Link>

        {/* Secondary promoted sky CTA card (§4 A3 + A4) */}
        <div className="mt-4 w-full">
          {skyReady ? (
            <SkyCtaCard />
          ) : (
            <div
              className="w-full h-[62px] rounded-2xl bg-bg-soft/30 border border-border-soft/40"
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {/* Sky Preview Section (§4 A1, replaces MockNoteStack) */}
      <div className="mt-12 w-full max-w-xs mx-auto">
        {!skyReady || !skyNotesLoaded ? (
          <div
            className="w-full aspect-[4/3] max-h-[320px] rounded-3xl border border-border-soft/40 bg-bg-soft/20"
            aria-hidden="true"
          />
        ) : skyNotes && skyNotes.length > 0 ? (
          <LiveSkyPreview initialNotes={skyNotes} />
        ) : (
          <MockNoteStack />
        )}
      </div>

      {/* UpcomingStrip (§4 A2, inserted between preview and 3 steps) */}
      {skyReady && upcomingNotes.length > 0 && (
        <div className="mt-8 w-full max-w-xs mx-auto">
          <UpcomingStrip initialNotes={skyNotes ?? undefined} />
        </div>
      )}

      {/* B3: "Ngày này năm xưa" nostalgia strip (rendered only when prior-year note exists) */}
      {priorYearMatch && (
        <Link
          to={`/note/${priorYearMatch.note.id}`}
          className={cn(
            'w-full max-w-xs mt-10 -mb-4 p-3.5 rounded-2xl bg-bg-soft/80 hover:bg-bg-elevated/90 border border-border-soft border-l-[3px] border-l-lavender shadow-sm flex items-center justify-between gap-3 text-left transition-all hover:scale-[1.01] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender',
            'animate-fade-in'
          )}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base select-none">🌙</span>
            <span className="font-sans text-[15px] text-text-primary group-hover:text-lavender transition-colors">
              {priorYearMatch.yearsAgo} năm trước, bạn đã gửi một điều ước.
            </span>
          </div>
          <span className="text-xs text-text-muted group-hover:text-text-secondary transition-colors shrink-0">
            Xem lại →
          </span>
        </Link>
      )}

      {/* 3-Step Section: 80px mobile / 120px desktop gap, 96px gap to footer */}
      <div
        style={{ contain: 'layout paint' }}
        className="mt-[80px] sm:mt-[120px] mb-[96px] w-full max-w-xs flex flex-col items-center [contain:layout_paint]"
      >
        <h2 className="font-display font-normal text-[36px] sm:text-[44px] text-text-primary mb-[32px] text-center tracking-normal leading-[1.3]">
          3 bước gửi điều ước
        </h2>

        <div className="flex items-center justify-center gap-6 text-center w-full">
          {/* Step 1 */}
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border-soft/60 font-sans font-semibold text-[18px] text-lavender bg-bg-soft/30">
              1
            </span>
            <span className="font-sans text-[15px] font-medium text-text-secondary flex items-center gap-1">
              <span>Viết</span>
              <span className="text-xs">✍️</span>
            </span>
          </div>

          <div className="h-px w-6 bg-border-soft/40 -mt-[30px]" />

          {/* Step 2 */}
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border-soft/60 font-sans font-semibold text-[18px] text-lavender bg-bg-soft/30">
              2
            </span>
            <span className="font-sans text-[15px] font-medium text-text-secondary flex items-center gap-1">
              <span>Niêm phong</span>
              <span className="text-xs">🔒</span>
            </span>
          </div>

          <div className="h-px w-6 bg-border-soft/40 -mt-[30px]" />

          {/* Step 3 */}
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border-soft/60 font-sans font-semibold text-[18px] text-lavender bg-bg-soft/30">
              3
            </span>
            <span className="font-sans text-[15px] font-medium text-text-secondary flex items-center gap-1">
              <span>Chờ</span>
              <span className="text-xs">🌙</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Landing = React.memo(LandingComponent);
export default Landing;
