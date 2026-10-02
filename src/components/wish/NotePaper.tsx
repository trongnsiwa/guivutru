import { forwardRef, HTMLAttributes } from 'react';
import { PaperTheme } from '@/types/note';
import { cn } from '@/lib/cn';

export interface NotePaperProps extends HTMLAttributes<HTMLDivElement> {
  theme?: PaperTheme;
  content: string;
  stickers?: string[];
  placeholder?: string;
  isSealed?: boolean;
  showFooter?: boolean;
  maxLines?: number;
  contentClassName?: string;
  stickerClassName?: string;
}

const themeTokenStyles: Record<PaperTheme, string> = {
  'dem-sao': 'bg-paper-dem-sao border-border-paper-dem-sao',
  'tim-mong': 'bg-paper-tim-mong border-border-paper-tim-mong',
  hogn: 'bg-paper-hogn border-border-paper-hogn',
  bien: 'bg-paper-bien border-border-paper-bien',
  rung: 'bg-paper-rung border-border-paper-rung',
  'giay-cu': 'bg-paper-giay-cu border-border-paper-giay-cu',
};

export const NotePaper = forwardRef<HTMLDivElement, NotePaperProps>(
  (
    {
      theme,
      content,
      stickers = [],
      placeholder = 'Mình muốn đến Đà Lạt và ở đó mãi mãi…',
      isSealed = false,
      showFooter = true,
      maxLines,
      contentClassName,
      stickerClassName,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full rounded-lg border border-border-soft bg-bg-soft p-5 transition-all shadow-dark overflow-hidden flex flex-col justify-between',
          theme && themeTokenStyles[theme],
          className
        )}
        {...props}
      >
        {/* Subtle paper-grain noise overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay rounded-lg"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />

        {/* Stickers display */}
        {stickers.length > 0 && (
          <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10">
            {stickers.map((stk, i) => (
              <span key={i} className={cn('text-xl filter drop-shadow', stickerClassName)}>
                {stk}
              </span>
            ))}
          </div>
        )}

        {/* Content or Sealed state */}
        <div className="relative z-10 flex-1">
          {isSealed ? (
            <div className="flex h-full min-h-[120px] flex-col items-center justify-center text-center">
              <span className="text-3xl mb-2">🔒</span>
              <p className="font-sans text-sm text-text-secondary">
                Điều ước đã được niêm phong an toàn
              </p>
            </div>
          ) : (
            <p
              className={cn(
                'font-note text-[22px] leading-[1.5] text-text-primary',
                contentClassName,
                maxLines === 2
                  ? 'line-clamp-2 overflow-hidden'
                  : 'whitespace-pre-wrap'
              )}
            >
              {content || <span className="opacity-40">{placeholder}</span>}
            </p>
          )}
        </div>

        {/* Paper footer mark - hidden for mock notes */}
        {showFooter && (
          <div className="relative z-10 mt-3 flex items-center justify-between text-xs text-text-muted font-sans border-t border-border-soft/30 pt-2">
            <span>Gửi Vũ Trụ ✨</span>
            <span>guivutru.pages.dev</span>
          </div>
        )}
      </div>
    );
  }
);

NotePaper.displayName = 'NotePaper';
export default NotePaper;
