import { forwardRef } from 'react';
import { YearInReviewStats } from '@/lib/yearInReview';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/cn';

export interface YearInReviewCardProps {
  stats: YearInReviewStats;
  style?: React.CSSProperties;
  className?: string;
}

export const YearInReviewCard = forwardRef<HTMLDivElement, YearInReviewCardProps>(
  ({ stats, style, className }, ref) => {
    const wish = stats.featuredWish;

    return (
      <div
        ref={ref}
        data-share-card="true"
        data-testid="year-in-review-card"
        style={{
          position: 'fixed',
          left: -9999,
          top: 0,
          width: 1080,
          height: 1920,
          backgroundColor: '#0F0A24',
          borderColor: '#2D2254',
          zIndex: -100,
          pointerEvents: 'none',
          ...style,
        }}
        className={cn(
          'year-in-review-card flex flex-col items-center justify-between text-center select-none overflow-hidden relative box-border border-[16px] text-text-primary',
          className
        )}
      >
        {/* Paper grain noise overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />

        {/* Outer decorative borders */}
        <div className="absolute inset-8 border-2 border-lavender/30 rounded-[40px] pointer-events-none" />
        <div className="absolute inset-12 border border-star-glow/20 rounded-[34px] pointer-events-none" />

        {/* Top 200px: Header & wordmark */}
        <div className="pt-[140px] flex flex-col items-center justify-center z-10 space-y-4">
          <div className="w-[100px] h-[100px] rounded-full bg-lavender/15 border border-lavender/40 flex items-center justify-center shadow-glow">
            <span className="text-[52px]">🌙</span>
          </div>
          <h1 className="font-display font-normal text-[48px] text-star-glow tracking-normal leading-tight">
            Năm Đầu Tiên Gửi Vũ Trụ ✨
          </h1>
          <p className="font-sans text-[26px] text-text-secondary tracking-wide">
            Hành trình gửi gắm những ước nguyện lên các vì sao
          </p>
        </div>

        {/* Middle: 3 Stats Cards */}
        <div className="w-full px-[100px] z-10 flex flex-col gap-[36px]">
          <div className="grid grid-cols-3 gap-[28px]">
            {/* Stat 1 */}
            <div className="rounded-[28px] bg-bg-soft/80 border border-border-soft p-[36px] flex flex-col items-center text-center shadow-sm">
              <span className="text-[36px] mb-2">📜</span>
              <span className="font-display text-[64px] font-bold text-lavender leading-none">
                {stats.notesWritten}
              </span>
              <span className="font-sans text-[22px] text-text-secondary mt-2">
                Điều ước đã gửi
              </span>
            </div>

            {/* Stat 2 */}
            <div className="rounded-[28px] bg-bg-soft/80 border border-border-soft p-[36px] flex flex-col items-center text-center shadow-sm">
              <span className="text-[36px] mb-2">✍️</span>
              <span className="font-display text-[64px] font-bold text-star-glow leading-none">
                {stats.wordsSent}
              </span>
              <span className="font-sans text-[22px] text-text-secondary mt-2">
                Con chữ tâm tình
              </span>
            </div>

            {/* Stat 3 */}
            <div className="rounded-[28px] bg-bg-soft/80 border border-border-soft p-[36px] flex flex-col items-center text-center shadow-sm">
              <span className="text-[36px] mb-2">🌔</span>
              <span className="font-display text-[64px] font-bold text-peach leading-none">
                {stats.moonsWatched}
              </span>
              <span className="font-sans text-[22px] text-text-secondary mt-2">
                Tuần trăng dõi theo
              </span>
            </div>
          </div>

          {/* Featured wish ("Điều ước của năm") */}
          <div className="rounded-[32px] bg-white/5 border border-lavender/30 p-[48px] text-center flex flex-col items-center space-y-4">
            <span className="font-sans text-[22px] uppercase tracking-widest text-star-glow font-semibold">
              ✦ Điều ước của năm ✦
            </span>
            <p
              className="font-note font-normal text-[48px] leading-[1.4] text-text-primary px-4 max-h-[340px] overflow-hidden"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              "{wish?.content?.trim() || 'Mong tâm hồn luôn bình yên giữa vũ trụ bao la.'}"
            </p>
            {wish?.stickerIds && wish.stickerIds.length > 0 && (
              <div className="flex items-center justify-center gap-3 pt-2 text-[48px]">
                {wish.stickerIds.map((s, idx) => (
                  <span key={idx}>{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom 140px: Watermark & QR */}
        <div className="w-full px-[120px] pb-[130px] flex items-end justify-between z-10 text-left">
          <div className="flex flex-col items-start gap-2">
            <p className="font-sans font-semibold text-[28px] text-text-primary flex items-center gap-3">
              <span>🌙</span>
              <span>
                {stats.firstNoteDate
                  ? `Khởi đầu từ ngày ${formatDate(stats.firstNoteDate)}`
                  : 'Gửi gắm ước nguyện'}
              </span>
            </p>
            <p className="font-sans font-normal text-[24px] text-text-muted">
              guivutru.pages.dev
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-6 py-4">
            <span className="font-display text-[26px] text-lavender">Gửi Vũ Trụ ✨</span>
          </div>
        </div>
      </div>
    );
  }
);
