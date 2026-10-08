import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SkyNote, computeStarCoordinates } from '@/lib/sky';
import { PAPER_THEMES } from '@/lib/constants';

export interface SkyCanvasProps {
  notes: SkyNote[];
  featuredNoteId?: string;
  onSelectNote: (note: SkyNote) => void;
}

interface SkyStar {
  note: SkyNote;
  xPercent: number;
  yPercent: number;
  size: number;
  opacity: number;
  glow: boolean;
  color: string;
  isSealed: boolean;
}

export function SkyCanvas({ notes, featuredNoteId, onSelectNote }: SkyCanvasProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // Deterministically compute star coordinates & styles from note.id
  const stars: SkyStar[] = useMemo(() => {
    return notes.map((note) => {
      const isFeatured = featuredNoteId ? note.id === featuredNoteId : false;
      const { xPercent, yPercent } = computeStarCoordinates(
        note.id,
        isFeatured,
        Boolean(featuredNoteId)
      );

      const isSealed = note.status === 'sealed' && note.unlockAt > now;
      const ageMs = Math.max(0, now - note.createdAt);
      // New notes glow brighter for the first 24h, then settle (§3.2)
      const glow = ageMs < ONE_DAY_MS || isFeatured;

      const theme = PAPER_THEMES.find((p) => p.id === note.paperTheme);
      const color = theme?.borderHex || '#C9B6FF';

      // Base size
      let size = isFeatured ? 13 : glow ? 11 : 7.5;
      if (isSealed && !isFeatured) {
        size = Math.max(5, size - 2);
      }

      const opacity = glow ? 1.0 : isSealed ? 0.65 : 0.9;

      return {
        note,
        xPercent,
        yPercent,
        size,
        opacity,
        glow,
        color,
        isSealed,
      };
    });
  }, [notes, featuredNoteId, now]);

  // Subtle constellation lines between nearby stars of the same theme
  const constellationLines = useMemo(() => {
    const lines: Array<{
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
    }> = [];

    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const a = stars[i];
        const b = stars[j];
        if (a.note.paperTheme === b.note.paperTheme) {
          const dx = a.xPercent - b.xPercent;
          const dy = a.yPercent - b.yPercent;
          const dist = Math.hypot(dx, dy);
          if (dist < 18) {
            lines.push({
              id: `${a.note.id}-${b.note.id}`,
              x1: a.xPercent,
              y1: a.yPercent,
              x2: b.xPercent,
              y2: b.yPercent,
              color: a.color,
            });
          }
        }
      }
    }
    return lines;
  }, [stars]);

  const activeStar = stars.find((s) => s.note.id === hoveredId);

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[580px] rounded-3xl border border-border-soft/60 bg-bg-deep/80 backdrop-blur-md overflow-hidden select-none shadow-2xl">
      {/* Background ambient nebula glow */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40" />

      {/* Constellation SVG Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {constellationLines.map((line) => (
          <line
            key={line.id}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke={line.color}
            strokeWidth="0.8"
            strokeOpacity="0.25"
            strokeDasharray="2 3"
          />
        ))}
      </svg>

      {/* Render Stars */}
      {stars.map((star) => {
        const isHovered = hoveredId === star.note.id;

        return (
          <div
            key={star.note.id}
            style={{
              left: `${star.xPercent}%`,
              top: `${star.yPercent}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute z-10 flex items-center justify-center"
          >
            {/* Concentric pulsing ring for glowing notes */}
            {star.glow && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span
                  style={{
                    width: `${star.size * 3}px`,
                    height: `${star.size * 3}px`,
                    borderColor: star.color,
                  }}
                  className="rounded-full border border-lavender/40 animate-ping opacity-60 shrink-0"
                />
              </div>
            )}

            <motion.button
              type="button"
              onClick={() => onSelectNote(star.note)}
              onMouseEnter={() => setHoveredId(star.note.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(star.note.id)}
              onBlur={() => setHoveredId(null)}
              style={{
                width: `${star.size * (isHovered ? 1.4 : 1)}px`,
                height: `${star.size * (isHovered ? 1.4 : 1)}px`,
                backgroundColor: star.color,
                boxShadow: star.glow
                  ? `0 0 14px 4px ${star.color}`
                  : `0 0 8px 1px ${star.color}80`,
                opacity: isHovered ? 1.0 : star.opacity,
              }}
              className="rounded-full transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender shrink-0"
              aria-label={`Ngôi sao của ${star.note.pseudonym}`}
            />
          </div>
        );
      })}

      {/* Floating Hover Tooltip */}
      {activeStar && (
        <div
          style={{
            left: `${Math.min(84, Math.max(16, activeStar.xPercent))}%`,
            top: `${Math.min(88, Math.max(12, activeStar.yPercent - 8))}%`,
            transform: 'translate(-50%, -100%)',
          }}
          className="pointer-events-none absolute z-20 px-3 py-1.5 rounded-lg bg-bg-soft/95 border border-lavender/30 backdrop-blur-md shadow-glow text-xs text-text-primary whitespace-nowrap animate-fade-in"
        >
          <span className="font-mono text-lavender-light font-medium">
            {activeStar.note.pseudonym}
          </span>
          {activeStar.glow && (
            <span className="ml-1.5 text-[10px] text-amber-300 font-sans">
              ✨ Mới hôm nay
            </span>
          )}
          {activeStar.isSealed && (
            <span className="ml-1.5 text-[10px] text-text-muted">🔒 Chưa mở</span>
          )}
        </div>
      )}

      {/* Sky Canvas Legend */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-sans text-text-muted pointer-events-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-lavender shadow-[0_0_6px_#C9B6FF]" />
            <span>Mới &lt;24h</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted opacity-60" />
            <span>Đang niêm phong 🔒</span>
          </span>
        </div>
        <span>Chạm sao để xem</span>
      </div>
    </div>
  );
}
