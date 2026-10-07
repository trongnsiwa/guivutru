import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon } from 'lucide-react';
import { Note } from '@/types/note';
import { PAPER_THEMES, DEFAULT_EASING } from '@/lib/constants';

export interface UnlockSequenceProps {
  note: Note;
  onComplete: () => void;
}

export function UnlockSequence({ note, onComplete }: UnlockSequenceProps) {
  const theme = PAPER_THEMES.find((t) => t.id === note.paperTheme) || PAPER_THEMES[0];

  // Haptic feedback on mount (A5)
  useEffect(() => {
    try {
      navigator.vibrate?.(10);
    } catch {
      // safe fallback
    }
  }, []);

  return (
    <div className="relative w-full flex-1 flex flex-col items-center justify-center min-h-[460px] overflow-hidden select-none py-8">
      {/* Skip button top-right */}
      <button
        type="button"
        onClick={onComplete}
        className="absolute top-2 right-4 px-3 py-1.5 rounded-full font-sans text-[13px] text-text-muted hover:text-text-secondary hover:bg-bg-soft/70 transition-colors z-30 cursor-pointer"
        aria-label="Bỏ qua hiệu ứng mở thư"
      >
        <span>Bỏ qua →</span>
      </button>

      {/* Main Orchestrator: ~2.2s total */}
      <motion.div
        initial="initial"
        animate="animate"
        onAnimationComplete={onComplete}
        transition={{ duration: 2.2 }}
        className="relative flex flex-col items-center justify-center w-full"
      >
        {/* Envelope Stage: 0 -> 1.2s */}
        <motion.div
          variants={{
            initial: { opacity: 0, scale: 0.9 },
            animate: {
              opacity: [0, 1, 1, 0.4, 0],
              scale: [0.9, 1, 1, 1.05, 0.95],
              transition: {
                duration: 2.2,
                times: [0, 0.18, 0.55, 0.8, 1],
                ease: DEFAULT_EASING,
              },
            },
          }}
          className="relative w-[220px] h-[150px] flex items-center justify-center mb-6"
        >
          {/* Envelope Back Plate */}
          <div className="absolute inset-0 rounded-2xl bg-bg-soft border-2 border-lavender/40 shadow-glow" />

          {/* Mini NotePaper sliding out upward (600 -> 1100ms) */}
          <motion.div
            variants={{
              initial: { y: 0, opacity: 0 },
              animate: {
                y: [0, 0, -45, -50, -50],
                opacity: [0, 0, 1, 1, 0],
                transition: {
                  duration: 2.2,
                  times: [0, 0.32, 0.55, 0.8, 1],
                  ease: 'easeOut',
                },
              },
            }}
            style={{
              backgroundColor: theme.bgColor,
              borderColor: theme.borderColor,
            }}
            className="absolute z-10 w-[170px] h-[120px] rounded-xl border-2 shadow-md p-3 flex flex-col justify-between overflow-hidden"
          >
            {/* Note paper lines */}
            <div className="space-y-1.5 opacity-40">
              <div className="h-1.5 w-3/4 rounded-full bg-lavender/50" />
              <div className="h-1.5 w-full rounded-full bg-lavender/40" />
              <div className="h-1.5 w-4/5 rounded-full bg-lavender/40" />
            </div>

            <div className="flex items-center gap-1.5 self-end">
              {note.stickerIds && note.stickerIds.length > 0 ? (
                note.stickerIds.slice(0, 2).map((stk, idx) => (
                  <span key={idx} className="text-base leading-none">
                    {stk}
                  </span>
                ))
              ) : (
                <span className="text-xs text-lavender/60 font-note">✨</span>
              )}
            </div>
          </motion.div>

          {/* Envelope Front Pocket (Lower folds) */}
          <svg
            className="absolute inset-0 w-full h-full z-20 pointer-events-none drop-shadow-sm"
            viewBox="0 0 200 140"
            fill="none"
          >
            <path
              d="M 0 0 L 100 75 L 0 140 Z"
              fill="#241b47"
              stroke="#c9b6ff"
              strokeOpacity="0.3"
              strokeWidth="1.5"
            />
            <path
              d="M 200 0 L 100 75 L 200 140 Z"
              fill="#241b47"
              stroke="#c9b6ff"
              strokeOpacity="0.3"
              strokeWidth="1.5"
            />
            <path
              d="M 0 140 L 100 70 L 200 140 Z"
              fill="#1e163d"
              stroke="#c9b6ff"
              strokeOpacity="0.5"
              strokeWidth="1.5"
            />
          </svg>

          {/* Top Flap opening (400 -> 700ms: rotateX -180deg -> 0deg) */}
          <motion.div
            style={{ transformOrigin: 'top center', perspective: 1000 }}
            variants={{
              initial: { rotateX: -180 },
              animate: {
                rotateX: [-180, -180, 0, 0],
                transition: {
                  duration: 2.2,
                  times: [0, 0.22, 0.38, 1],
                  ease: 'easeInOut',
                },
              },
            }}
            className="absolute top-0 inset-x-0 h-[70px] z-30 pointer-events-none"
          >
            <svg className="w-full h-full" viewBox="0 0 200 70" fill="none">
              <path
                d="M 0 0 L 100 68 L 200 0 Z"
                fill="#2b2052"
                stroke="#c9b6ff"
                strokeOpacity="0.6"
                strokeWidth="1.5"
              />
            </svg>
          </motion.div>

          {/* Wax Stamp: cracks and dissolves (300 -> 600ms) */}
          <motion.div
            variants={{
              initial: { scale: 1, opacity: 1 },
              animate: {
                scale: [1, 1, 1.25, 0],
                opacity: [1, 1, 0.9, 0],
                rotate: [0, 0, 15, -20],
                transition: {
                  duration: 2.2,
                  times: [0, 0.18, 0.32, 0.42],
                  ease: DEFAULT_EASING,
                },
              },
            }}
            style={{
              borderColor: theme.borderColor,
            }}
            className="absolute z-40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-bg-deep/90 border-2 text-lavender flex items-center justify-center shadow-glow backdrop-blur-sm"
          >
            <Moon className="w-5 h-5 fill-lavender/40 text-lavender" />
          </motion.div>
        </motion.div>

        {/* Prose line appears: "Bạn của ngày xưa gửi cho bạn một lá thư…" */}
        {/* Visible from ~800ms -> 2000ms */}
        <motion.p
          variants={{
            initial: { opacity: 0, y: 10 },
            animate: {
              opacity: [0, 0, 1, 1, 0],
              y: [10, 10, 0, 0, -8],
              transition: {
                duration: 2.2,
                times: [0, 0.35, 0.48, 0.85, 1],
                ease: 'easeInOut',
              },
            },
          }}
          className="font-display text-[28px] sm:text-[32px] text-star-glow text-center px-4 leading-relaxed"
        >
          Bạn của ngày xưa gửi cho bạn một lá thư…
        </motion.p>
      </motion.div>
    </div>
  );
}

export default UnlockSequence;
