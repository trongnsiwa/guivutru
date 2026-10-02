import { motion } from 'framer-motion';
import { NotePaper } from './NotePaper';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function MockNoteStack() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[380px] mx-auto h-[195px] sm:h-[205px]">
      {/* Card 3 (Back, mostly hidden, bottom-right peek) */}
      <div
        className="absolute inset-x-0 h-[155px] sm:h-[165px] pointer-events-none opacity-40 origin-bottom-right"
        style={{
          top: '24px',
          left: '12px',
          transform: 'rotate(-6deg)',
          zIndex: 10,
        }}
        aria-hidden="true"
      >
        <NotePaper
          content=""
          showFooter={false}
          className="h-full min-h-0 bg-bg-soft border border-border-soft rounded-lg shadow-sm py-[32px] px-[28px]"
        />
      </div>

      {/* Card 2 (Middle, behind, bottom-right peek) */}
      <div
        className="absolute inset-x-0 h-[155px] sm:h-[165px] opacity-70 origin-bottom-right"
        style={{
          top: '12px',
          left: '8px',
          transform: 'rotate(5deg)',
          zIndex: 20,
        }}
        aria-hidden="true"
      >
        <NotePaper
          content="Năm sau, mình sẽ học giỏi hơn."
          stickers={['⭐']}
          showFooter={false}
          maxLines={2}
          contentClassName="text-[26px] sm:text-[28px] leading-[1.5]"
          stickerClassName="text-[28px]"
          className="h-full min-h-0 bg-bg-soft border border-border-soft rounded-lg shadow-sm py-[32px] px-[28px]"
        />
      </div>

      {/* Card 1 (Front, fully readable, visual anchor, floats) */}
      <motion.div
        className="absolute inset-x-0 h-[155px] sm:h-[165px]"
        style={{
          top: 0,
          left: 0,
          transform: 'rotate(1deg)',
          zIndex: 30,
        }}
        animate={
          prefersReducedMotion
            ? { y: 0 }
            : {
                y: [0, -6, 0],
              }
        }
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }
        }
      >
        <NotePaper
          content="Mình muốn đến Đà Lạt và ở đó mãi mãi…"
          stickers={['🌸']}
          showFooter={false}
          maxLines={2}
          contentClassName="text-[26px] sm:text-[28px] leading-[1.5]"
          stickerClassName="text-[28px]"
          className="h-full min-h-0 bg-bg-soft border border-border-soft rounded-lg shadow-dark py-[32px] px-[28px]"
        />
      </motion.div>
    </div>
  );
}

export default MockNoteStack;
