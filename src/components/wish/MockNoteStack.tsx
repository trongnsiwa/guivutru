import React from 'react';
import { NotePaper } from './NotePaper';
import { useReducedMotion } from '@/hooks/useReducedMotion';

function MockNoteStackComponent() {
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
          content="Mình muốn một ngày nào đó được sống chậm lại."
          stickers={['⭐']}
          showFooter={false}
          maxLines={2}
          contentClassName="text-[26px] sm:text-[28px] leading-[1.5]"
          stickerClassName="text-[28px]"
          className="h-full min-h-0 bg-bg-soft border border-border-soft rounded-lg shadow-sm py-[32px] px-[28px]"
        />
      </div>

      {/* Card 1 (Front, fully readable, visual anchor, floats via CSS on compositor) */}
      <div
        className="absolute inset-x-0 h-[155px] sm:h-[165px]"
        style={{
          top: 0,
          left: 0,
          transform: 'rotate(1deg)',
          zIndex: 30,
          willChange: prefersReducedMotion ? undefined : 'transform',
          animation: prefersReducedMotion ? undefined : 'float-gentle 4s ease-in-out infinite',
        }}
      >
        <NotePaper
          content="Năm sau, mình sẽ đi Đà Lạt một mình."
          stickers={['🌸']}
          showFooter={false}
          maxLines={2}
          contentClassName="text-[26px] sm:text-[28px] leading-[1.5]"
          stickerClassName="text-[28px]"
          className="h-full min-h-0 bg-bg-soft border border-border-soft rounded-lg shadow-dark py-[32px] px-[28px]"
        />
      </div>
    </div>
  );
}

export const MockNoteStack = React.memo(MockNoteStackComponent);
export default MockNoteStack;
