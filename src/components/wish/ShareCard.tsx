import { forwardRef } from 'react';
import { Note } from '@/types/note';
import { PAPER_THEMES } from '@/lib/constants';
import { formatDate, getNoteTimeMetadata } from '@/lib/date';
import { cn } from '@/lib/cn';

export interface ShareCardProps {
  note: Note;
  style?: React.CSSProperties;
  className?: string;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ note, style, className }, ref) => {
    const theme = PAPER_THEMES.find((t) => t.id === note.paperTheme) || PAPER_THEMES[0];

    return (
      <div
        ref={ref}
        data-share-card="true"
        style={{
          position: 'fixed',
          left: -9999,
          top: 0,
          width: 1080,
          height: 1920,
          backgroundColor: theme.bgColor,
          borderColor: theme.borderColor,
          zIndex: -100,
          pointerEvents: 'none',
          ...style,
        }}
        className={cn(
          'share-card flex flex-col items-center justify-between text-center select-none overflow-hidden relative box-border border-[16px]',
          className
        )}
      >
      {/* Subtle paper-grain noise overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* Decorative inner border */}
      <div
        className="absolute inset-8 border-2 border-border-strong/30 rounded-[36px] pointer-events-none"
        style={{ borderColor: theme.borderColor }}
      />

      {/* Top 120px: wordmark */}
      <div className="pt-[120px] flex flex-col items-center justify-center z-10">
        <span className="font-display font-normal text-[36px] text-lavender tracking-normal leading-tight">
          Gửi Vũ Trụ ✨
        </span>
      </div>

      {/* Middle: Content (vertical center) + Sticker row 48px below */}
      <div className="flex-1 flex flex-col items-center justify-center px-[120px] w-full z-10 my-auto">
        <p
          className={cn(
            'font-note font-normal text-[64px] leading-[1.4] text-center break-words w-full',
            note.content?.trim() ? 'text-text-primary' : 'text-text-muted opacity-60'
          )}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 8,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            wordBreak: 'break-word',
          }}
        >
          {note.content?.trim() || 'Điều ước của bạn'}
        </p>

        {note.stickerIds && note.stickerIds.length > 0 && (
          <div className="flex items-center justify-center gap-[24px] mt-[48px]">
            {note.stickerIds.map((stk, idx) => (
              <span key={idx} className="text-[96px] leading-none inline-block select-none">
                {stk}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom 120px: Date & watermark (left), QR code & label (right) */}
      <div className="w-full px-[120px] pb-[120px] flex items-end justify-between z-10 text-left">
        <div className="flex flex-col items-start gap-3">
          <p className="font-sans font-semibold text-[28px] text-text-primary flex items-center gap-2.5">
            <span>{getNoteTimeMetadata(note.createdAt).glyph}</span>
            <span>Niêm phong ngày {formatDate(note.createdAt)}</span>
          </p>
          <p className="font-sans font-normal text-[24px] text-text-muted">
            guivutru.pages.dev
          </p>
        </div>

        {/* B2: QR Code in bottom-right (140x140 at 1080x1920) */}
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-[140px] h-[140px] p-2.5 rounded-2xl bg-bg-soft/80 border border-border-soft flex items-center justify-center shadow-sm">
            <img
              src="/qr-guivutru.svg"
              alt="Mã QR gửi điều ước"
              width={120}
              height={120}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-sans text-[22px] text-text-muted whitespace-nowrap">
            quét để gửi điều ước của bạn
          </span>
        </div>
      </div>
    </div>
  );
});

ShareCard.displayName = 'ShareCard';

export default ShareCard;
