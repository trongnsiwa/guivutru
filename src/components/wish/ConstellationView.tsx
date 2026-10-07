import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Note } from '@/types/note';
import { PAPER_THEMES } from '@/lib/constants';
import { formatDate } from '@/lib/date';

export interface ConstellationViewProps {
  notes: Note[];
}

interface StarNode {
  note: Note;
  index: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  isSealed: boolean;
}

export function ConstellationView({ notes }: ConstellationViewProps) {
  const navigate = useNavigate();
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);

  const VIEW_SIZE = 340;
  const center = VIEW_SIZE / 2;
  const now = Date.now();

  // Deterministically compute star coordinates
  const stars: StarNode[] = notes.map((note, index) => {
    const hash = note.id
      .split('')
      .reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);

    const angle = ((hash % 360) * Math.PI) / 180;
    const radius = 35 + (hash % 115);
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;

    const isSealed = note.status === 'sealed' && now < note.unlockAt;
    const isOpened = !isSealed;

    const theme = PAPER_THEMES.find((p) => p.id === note.paperTheme);
    const color = theme?.borderHex || '#C9B6FF';

    let size = 8;
    if (isSealed) {
      const daysRemaining = Math.max(0, (note.unlockAt - now) / 86400000);
      size = Math.min(8, Math.max(3.5, 8 - (daysRemaining / 365) * 4.5));
    }

    const opacity = isOpened ? 0.95 : 0.55;

    return {
      note,
      index,
      x,
      y,
      size,
      opacity,
      color,
      isSealed,
    };
  });

  // Calculate connection lines between stars of the same theme within 80px
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
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 80) {
          lines.push({
            id: `${a.note.id}-${b.note.id}`,
            x1: a.x,
            y1: a.y,
            x2: b.x,
            y2: b.y,
            color: a.color,
          });
        }
      }
    }
  }

  const activeStar = stars.find((s) => s.note.id === hoveredNoteId);

  return (
    <div className="relative w-full max-w-[420px] mx-auto aspect-square rounded-3xl border border-border-soft bg-bg-soft/40 backdrop-blur-sm p-4 overflow-hidden select-none flex items-center justify-center">
      {/* Background SVG for constellation lines and subtle celestial rings */}
      <svg
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        <circle
          cx={center}
          cy={center}
          r={150}
          fill="none"
          stroke="var(--border-soft)"
          strokeDasharray="4 6"
          strokeWidth="0.8"
          opacity="0.3"
        />
        <circle
          cx={center}
          cy={center}
          r={75}
          fill="none"
          stroke="var(--border-soft)"
          strokeDasharray="2 4"
          strokeWidth="0.6"
          opacity="0.2"
        />

        {/* Faint connection lines */}
        {lines.map((l) => (
          <line
            key={l.id}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={l.color}
            strokeWidth="1.2"
            strokeOpacity="0.3"
            strokeDasharray="2 3"
          />
        ))}
      </svg>

      {/* Interactive accessible list of star buttons */}
      <ul role="list" className="absolute inset-0 w-full h-full m-0 p-0 list-none pointer-events-none">
        {stars.map((s) => {
          const leftPercent = (s.x / VIEW_SIZE) * 100;
          const topPercent = (s.y / VIEW_SIZE) * 100;
          const isHovered = s.note.id === hoveredNoteId;

          const label = `Điều ước #${s.index + 1}, ${
            s.isSealed ? 'đang niêm phong' : 'đã mở'
          }, mở vào ${formatDate(s.note.unlockAt)}`;

          return (
            <li
              key={s.note.id}
              className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
              }}
            >
              <button
                type="button"
                onClick={() => navigate(`/note/${s.note.id}`)}
                onMouseEnter={() => setHoveredNoteId(s.note.id)}
                onMouseLeave={() => setHoveredNoteId(null)}
                onFocus={() => setHoveredNoteId(s.note.id)}
                onBlur={() => setHoveredNoteId(null)}
                aria-label={label}
                className="group relative flex items-center justify-center p-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender cursor-pointer"
              >
                {/* Outer halo on hover or opened */}
                <span
                  className="absolute rounded-full transition-transform"
                  style={{
                    width: `${s.size * 3}px`,
                    height: `${s.size * 3}px`,
                    backgroundColor: s.color,
                    opacity: isHovered ? 0.35 : s.isSealed ? 0.08 : 0.2,
                    transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                    boxShadow: !s.isSealed ? `0 0 10px ${s.color}` : undefined,
                  }}
                />

                {/* Central star dot */}
                <span
                  className="rounded-full relative z-10 transition-transform"
                  style={{
                    width: `${s.size}px`,
                    height: `${s.size}px`,
                    backgroundColor: s.color,
                    opacity: s.opacity,
                    transform: isHovered ? 'scale(1.4)' : 'scale(1)',
                    boxShadow: `0 0 6px ${s.color}`,
                  }}
                />
              </button>
            </li>
          );
        })}
      </ul>

      {/* Tooltip on hover or keyboard focus */}
      {activeStar && (
        <div
          className="absolute bottom-3 inset-x-4 pointer-events-none z-20 flex justify-center animate-fade-in"
          aria-hidden="true"
        >
          <div className="max-w-[280px] px-3.5 py-2 rounded-xl bg-bg-deep/95 border border-border-strong text-center shadow-glow backdrop-blur-md">
            <p className="font-sans text-xs text-text-primary truncate">
              {activeStar.isSealed ? (
                <span className="flex items-center justify-center gap-1.5 text-text-secondary">
                  <span>🔒</span>
                  <span>Mở vào {formatDate(activeStar.note.unlockAt)}</span>
                </span>
              ) : (
                <span className="font-note text-sm text-text-primary">
                  {activeStar.note.content.length > 40
                    ? `${activeStar.note.content.slice(0, 40)}…`
                    : activeStar.note.content}
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConstellationView;
