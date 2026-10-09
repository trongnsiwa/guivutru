import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchSkyNotes,
  reportSkyNote,
  computeStarCoordinates,
  pickPreviewNotes,
  mixHash,
} from '@/lib/sky';
import type { SkyNote } from '@/lib/sky';
import { PAPER_THEMES } from '@/lib/constants';
import { formatDate } from '@/lib/date';

// Lazy-load modal so framer-motion stays out of the landing preview module graph
const SkyNoteModal = lazy(() =>
  import('@/pages/Sky/SkyNoteModal').then((m) => ({ default: m.SkyNoteModal }))
);

export interface LiveSkyPreviewProps {
  initialNotes?: SkyNote[];
}

interface PreviewStar {
  note: SkyNote;
  xPercent: number;
  yPercent: number;
  size: number;
  opacity: number;
  glow: boolean;
  color: string;
  isSealed: boolean;
  ariaLabel: string;
  duration: number;
  delay: number;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function LiveSkyPreview({ initialNotes }: LiveSkyPreviewProps = {}) {
  const [notes, setNotes] = useState<SkyNote[] | null>(initialNotes ?? null);
  const [loading, setLoading] = useState(!initialNotes);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<SkyNote | null>(null);

  useEffect(() => {
    if (initialNotes !== undefined) {
      setNotes(initialNotes);
      setLoading(false);
      return;
    }

    let mounted = true;
    fetchSkyNotes('moi-nhat')
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

  // Capped at 12 stars per selection rule (§4 A1)
  const previewNotes = useMemo(() => {
    if (!notes || notes.length === 0) return [];
    return pickPreviewNotes(notes, 12);
  }, [notes]);

  const stars: PreviewStar[] = useMemo(() => {
    const now = Date.now();

    return previewNotes.map((note, index) => {
      const isSealed = note.status === 'sealed' && note.unlockAt > now;
      const ageMs = Math.max(0, now - note.createdAt);

      // Glow only applies to opened stars <24h (§4 A1)
      const glow = !isSealed && ageMs < ONE_DAY_MS;

      const { xPercent, yPercent } = computeStarCoordinates(note.id, false, false);

      const theme = PAPER_THEMES.find((p) => p.id === note.paperTheme);
      const color = theme?.borderHex || '#C9B6FF';

      // Sizing: sealed is smaller with no glow ring; opened is brighter
      const size = glow ? 9 : isSealed ? 5 : 7;
      const opacity = glow ? 1.0 : isSealed ? 0.55 : 0.85;

      // Deterministic CSS twinkle timing per star from hash
      const rawHash = note.id
        .split('')
        .reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
      const hash = mixHash(rawHash);
      const duration = 2.4 + ((hash % 16) / 10); // 2.4s - 3.9s
      const delay = ((hash >>> 8) % 25) / 10; // 0.0s - 2.4s

      // Accessible label: "Điều ước ẩn danh #N, [đang niêm phong | đã mở], mở vào [date]"
      const formattedDate = formatDate(note.unlockAt);
      const statusText = isSealed ? 'đang niêm phong' : 'đã mở';
      const ariaLabel = `Điều ước ẩn danh #${index + 1}, ${statusText}, mở vào ${formattedDate}`;

      return {
        note,
        xPercent,
        yPercent,
        size,
        opacity,
        glow,
        color,
        isSealed,
        ariaLabel,
        duration,
        delay,
      };
    });
  }, [previewNotes]);

  const handleReport = async (noteId: string) => {
    try {
      await reportSkyNote(noteId);
    } finally {
      setSelectedNote(null);
      setNotes((prev) => (prev ? prev.filter((n) => n.id !== noteId) : []));
    }
  };

  // Fail silent, never fail fake (§3 rule 2): render null if empty or failed
  if (loading || previewNotes.length === 0) {
    return null;
  }

  const activeStar = stars.find((s) => s.note.id === hoveredId);

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* Contained box: aspect-[4/3] max-h-[320px] */}
      <div className="relative w-full aspect-[4/3] max-h-[320px] rounded-3xl border border-border-soft/60 bg-bg-deep/80 backdrop-blur-md overflow-hidden select-none shadow-2xl">
        {/* Ambient nebula glow */}
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40" />

        {/* Accessible star button list */}
        <ul
          role="list"
          className="absolute inset-0 w-full h-full m-0 p-0 list-none pointer-events-none"
        >
          {stars.map((star) => {
            const isHovered = hoveredId === star.note.id;

            return (
              <li
                key={star.note.id}
                className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${star.xPercent}%`,
                  top: `${star.yPercent}%`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedNote(star.note)}
                  onMouseEnter={() => setHoveredId(star.note.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(star.note.id)}
                  onBlur={() => setHoveredId(null)}
                  aria-label={star.ariaLabel}
                  className="group relative flex items-center justify-center p-2 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender shrink-0"
                >
                  {/* Concentric pulsing ring only for glow (<24h opened) stars */}
                  {star.glow && (
                    <span
                      style={{
                        width: `${star.size * 2.8}px`,
                        height: `${star.size * 2.8}px`,
                        borderColor: star.color,
                      }}
                      className="absolute rounded-full border border-lavender/40 animate-ping opacity-50 shrink-0 pointer-events-none"
                    />
                  )}

                  {/* Core star element with CSS twinkle */}
                  <span
                    style={{
                      width: `${star.size}px`,
                      height: `${star.size}px`,
                      backgroundColor: star.color,
                      boxShadow: star.glow
                        ? `0 0 10px 2px ${star.color}`
                        : star.isSealed
                        ? 'none'
                        : `0 0 6px 1px ${star.color}60`,
                      opacity: isHovered ? 1.0 : star.opacity,
                      ['--star-duration' as string]: `${star.duration}s`,
                      ['--star-delay' as string]: `${star.delay}s`,
                      ['--star-base-op' as string]: `${star.opacity}`,
                      ['--star-peak-op' as string]: `${
                        star.glow ? 1.0 : star.isSealed ? 0.75 : 0.95
                      }`,
                    }}
                    className={`rounded-full shrink-0 transition-transform group-hover:scale-125 ${
                      !star.isSealed ? 'animate-star-twinkle' : ''
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>

        {/* Hover tooltip (pseudonym only, no "Mới hôm nay" badge) */}
        {activeStar && (
          <div
            style={{
              left: `${Math.min(84, Math.max(16, activeStar.xPercent))}%`,
              top: `${Math.min(88, Math.max(12, activeStar.yPercent - 8))}%`,
              transform: 'translate(-50%, -100%)',
            }}
            className="absolute z-20 pointer-events-none px-2.5 py-1 rounded-full bg-bg-elevated/95 border border-lavender/40 text-[11px] font-sans font-medium text-star shadow-glow backdrop-blur-md whitespace-nowrap"
          >
            {activeStar.note.pseudonym}
          </div>
        )}

        {/* Legend row */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-sans text-text-muted pointer-events-none select-none">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1">
              <span className="text-amber-300">✦</span>
              <span>Mới &lt;24h</span>
            </span>
            <span className="flex items-center gap-1">
              <span>🔒</span>
              <span>Chưa mở</span>
            </span>
          </div>
          <span className="text-[10px] text-text-muted/80">Chạm sao để xem</span>
        </div>
      </div>

      {/* Footer link below the box */}
      <div className="mt-3 text-center">
        <Link
          to="/bau-troi"
          className="inline-flex items-center gap-1.5 text-xs font-sans text-lavender hover:text-lavender-light hover:underline transition-colors"
        >
          <span>Xem toàn bộ bầu trời</span>
          <span>→</span>
        </Link>
      </div>

      {/* Modal on star activation */}
      {selectedNote && (
        <Suspense fallback={null}>
          <SkyNoteModal
            note={selectedNote}
            isOpen={Boolean(selectedNote)}
            onClose={() => setSelectedNote(null)}
            onReport={handleReport}
          />
        </Suspense>
      )}
    </div>
  );
}
