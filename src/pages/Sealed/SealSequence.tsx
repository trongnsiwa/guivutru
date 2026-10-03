import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Moon } from 'lucide-react';
import { Note } from '@/types/note';
import { PAPER_THEMES, DEFAULT_EASING } from '@/lib/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { firePastelConfetti } from '@/components/fx/Confetti';

export interface SealSequenceProps {
  note: Note;
  onComplete: () => void;
}

export function SealSequence({ note, onComplete }: SealSequenceProps) {
  const prefersReducedMotion = useReducedMotion();
  const theme = PAPER_THEMES.find((t) => t.id === note.paperTheme) || PAPER_THEMES[0];
  const confettiFiredRef = useRef(false);

  // If reduced motion, jump directly to success screen
  useEffect(() => {
    if (prefersReducedMotion) {
      onComplete();
    }
  }, [prefersReducedMotion, onComplete]);

  // Trigger confetti around ~1800ms
  useEffect(() => {
    if (prefersReducedMotion) return;

    const timer = setTimeout(() => {
      if (!confettiFiredRef.current) {
        confettiFiredRef.current = true;
        firePastelConfetti(false);
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div className="relative w-full flex-1 flex flex-col items-center justify-center min-h-[500px] overflow-hidden select-none">
      {/* Skip button top-right (appears at 1500ms with fade, Nunito 14px --text-muted) */}
      <motion.button
        type="button"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.3, ease: DEFAULT_EASING }}
        onClick={onComplete}
        className="absolute top-2 right-4 px-3 py-1.5 rounded-full font-sans text-[14px] text-text-muted hover:text-text-secondary hover:bg-bg-soft/70 transition-colors z-30 cursor-pointer"
      >
        <span>Bỏ qua →</span>
      </motion.button>

      {/* Main Orchestrator motion container: 2.5s total duration */}
      <motion.div
        initial="initial"
        animate="animate"
        onAnimationComplete={onComplete}
        transition={{ duration: 2.5 }}
        className="relative flex items-center justify-center w-[260px] h-[220px]"
      >
        {/* Envelope & Contents (Stages 1 - 3: 0 -> 1.4s) */}
        <motion.div
          variants={{
            initial: { scale: 0.6, opacity: 0 },
            animate: {
              scale: [0.6, 1, 1, 0.3],
              opacity: [0, 1, 1, 0],
              transition: {
                duration: 1.4,
                times: [0, 0.28, 0.78, 1],
                ease: DEFAULT_EASING,
              },
            },
          }}
          className="relative w-[200px] h-[140px] flex items-center justify-center"
        >
          {/* Envelope Back Plate (dark purple bg, lavender outline) */}
          <div className="absolute inset-0 rounded-2xl bg-bg-soft border-2 border-lavender/40 shadow-glow" />

          {/* Stage 2: Mini NotePaper (160x120) sliding from below into opening (400 -> 800ms) */}
          <motion.div
            variants={{
              initial: { y: 70, opacity: 0 },
              animate: {
                y: [70, 70, 0, 0],
                opacity: [0, 0, 1, 1],
                transition: {
                  duration: 1.4,
                  times: [0, 0.28, 0.57, 1],
                  ease: 'easeOut',
                },
              },
            }}
            style={{
              backgroundColor: theme.bgColor,
              borderColor: theme.borderColor,
            }}
            className="absolute z-10 w-[160px] h-[120px] rounded-xl border-2 shadow-md p-3 flex flex-col justify-between overflow-hidden"
          >
            {/* Note paper lines */}
            <div className="space-y-1.5 opacity-40">
              <div className="h-1.5 w-3/4 rounded-full bg-lavender/50" />
              <div className="h-1.5 w-full rounded-full bg-lavender/40" />
              <div className="h-1.5 w-4/5 rounded-full bg-lavender/40" />
            </div>

            {/* Note paper stickers preview */}
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
            {/* Left and right inner folds */}
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
            {/* Front bottom pocket */}
            <path
              d="M 0 140 L 100 70 L 200 140 Z"
              fill="#1e163d"
              stroke="#c9b6ff"
              strokeOpacity="0.5"
              strokeWidth="1.5"
            />
          </svg>

          {/* Envelope Top Flap (closes at 600 -> 800ms: rotateX 0 -> -180deg) */}
          <motion.div
            style={{ transformOrigin: 'top center', perspective: 1000 }}
            variants={{
              initial: { rotateX: 0 },
              animate: {
                rotateX: [0, 0, -180, -180],
                transition: {
                  duration: 1.4,
                  times: [0, 0.42, 0.57, 1],
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

          {/* Stage 3: Wax Stamp (circle 48px, note's paperTheme border color, small moon centered) */}
          {/* Fades in at 800ms, pulses 1 -> 1.1 -> 1 at 1000 -> 1400ms */}
          <motion.div
            variants={{
              initial: { scale: 0, opacity: 0 },
              animate: {
                scale: [0, 0, 1, 1.1, 1, 1],
                opacity: [0, 0, 1, 1, 1, 1],
                transition: {
                  duration: 1.4,
                  times: [0, 0.57, 0.71, 0.85, 0.95, 1],
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

        {/* Stage 3 & 4: Star grows (1100 -> 1400ms) and flies up (1400 -> 2100ms) */}
        <motion.div
          variants={{
            initial: { scale: 0, opacity: 0, y: 0, rotate: 0 },
            animate: {
              scale: [0, 0, 1, 1, 0.8],
              opacity: [0, 0, 1, 1, 0],
              y: [0, 0, 0, -500, -500],
              rotate: [0, 0, 0, 25, 25],
              transition: {
                duration: 2.1,
                times: [0, 0.52, 0.67, 1, 1],
                ease: ['easeOut', 'easeOut', 'easeIn', 'easeIn'],
              },
            },
          }}
          className="absolute z-50 pointer-events-none flex items-center justify-center"
        >
          {/* 4-point celestial star with star-glow */}
          <svg
            className="w-12 h-12 text-star fill-star drop-shadow-[0_0_16px_var(--star-glow)]"
            viewBox="0 0 48 48"
          >
            <path d="M 24 0 C 24 10 24 14 34 24 C 24 34 24 38 24 48 C 24 38 24 34 14 24 C 24 14 24 10 24 0 Z" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default SealSequence;
