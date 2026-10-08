import { forwardRef, HTMLAttributes } from 'react';
import { PaperTheme } from '@/types/note';
import { cn } from '@/lib/cn';
import { getNoteTimeMetadata } from '@/lib/date';

export interface NotePaperProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  paperTheme?: PaperTheme;
  theme?: PaperTheme; // alias
  content: string;
  stickerIds?: string[];
  stickers?: string[]; // alias
  placeholder?: string;
  isSealed?: boolean;
  showFooter?: boolean;
  createdAt?: number;
  maxLines?: number;
  mode?: 'edit' | 'preview';
  onContentChange?: (val: string) => void;
  autoFocus?: boolean;
  textareaRef?: React.Ref<HTMLTextAreaElement>;
  maxLength?: number;
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
      paperTheme,
      theme,
      content,
      stickerIds,
      stickers = [],
      placeholder = 'Vũ trụ đang chờ nghe bạn nói…',
      isSealed = false,
      showFooter = false,
      createdAt,
      maxLines,
      mode = 'preview',
      onContentChange,
      autoFocus = false,
      textareaRef,
      maxLength = 500,
      contentClassName,
      stickerClassName,
      className,
      ...props
    },
    ref
  ) => {
    const activeTheme = paperTheme || theme || 'dem-sao';
    const activeStickers = stickerIds || stickers;
    const noteCreatedAt = createdAt || Date.now();
    const { glyph, timeStr } = getNoteTimeMetadata(noteCreatedAt);
    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full rounded-[28px] border border-border-soft bg-bg-soft py-[32px] px-[28px] transition-all shadow-dark overflow-hidden flex flex-col justify-between',
          themeTokenStyles[activeTheme],
          className
        )}
        {...props}
      >
        {/* Subtle paper-grain noise overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay rounded-[28px]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />

        {/* Stickers display in corner (top-right, staggered) */}
        {activeStickers.length > 0 && (
          <div className="absolute top-4 right-4 flex items-center -space-x-1 z-20 pointer-events-none">
            {activeStickers.map((stk, i) => (
              <span
                key={i}
                className={cn('text-[28px] filter drop-shadow select-none transform hover:scale-110 transition-transform', stickerClassName)}
              >
                {stk}
              </span>
            ))}
          </div>
        )}

        {/* Content or Sealed state */}
        <div className="relative z-10 flex-1 w-full">
          {isSealed ? (
            <div className="flex h-full min-h-[140px] flex-col items-center justify-center text-center">
              <span className="text-3xl mb-2">🔒</span>
              <p className="font-sans text-sm text-text-secondary">
                Điều ước đã được niêm phong an toàn
              </p>
            </div>
          ) : mode === 'edit' ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onContentChange?.(e.target.value)}
              autoFocus={autoFocus}
              placeholder={placeholder}
              maxLength={maxLength}
              rows={4}
              className={cn(
                'w-full bg-transparent resize-none border-none border-0 outline-none ring-0 ring-offset-0 shadow-none p-0',
                'focus:border-none focus:outline-none focus:ring-0 focus:shadow-none',
                'focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none',
                'font-note text-[26px] sm:text-[28px] leading-[1.5] text-text-primary placeholder:text-text-muted rounded-none min-h-[160px] sm:min-h-[180px]',
                contentClassName
              )}
            />
          ) : (
            <p
              className={cn(
                'font-note text-[26px] sm:text-[28px] leading-[1.5] text-text-primary',
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

        {/* Paper footer mark */}
        {showFooter && (
          <div className="relative z-10 mt-3 flex items-center justify-between text-xs text-text-muted font-sans border-t border-border-soft/30 pt-2">
            <span className="flex items-center gap-1.5">
              <span className="select-none">{glyph}</span>
              <span>{timeStr}</span>
            </span>
            <span>Gửi Vũ Trụ ✨</span>
          </div>
        )}
      </div>
    );
  }
);

NotePaper.displayName = 'NotePaper';
export default NotePaper;
