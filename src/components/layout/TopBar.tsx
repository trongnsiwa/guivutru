import { Link, useLocation } from 'react-router-dom';
import { Moon, BookOpen } from 'lucide-react';
import { cn } from '@/lib/cn';

export function TopBar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-bg-deep/70 border-b border-border-soft/50">
      <div className="mx-auto flex h-16 max-w-[430px] items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          {/* 32px circular badge with crescent moon + tiny star */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-soft border border-border-soft shadow-glow group-hover:scale-105 transition-transform text-lavender shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Crescent moon with dark purple fill */}
              <path
                d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"
                fill="var(--bg-deep)"
                stroke="var(--lavender)"
              />
              {/* Tiny star */}
              <path
                d="M19 4v3M20.5 5.5h-3"
                stroke="var(--star-glow)"
                strokeWidth="1.6"
              />
            </svg>
          </div>

          <span className="font-display font-normal text-[30px] text-text-primary tracking-[0.01em] leading-[1] flex items-center gap-1.5 whitespace-nowrap">
            <span>Gửi Vũ Trụ</span>
            <span className="text-star-glow text-base">✨</span>
          </span>
        </Link>

        {/* Navigation actions */}
        <div className="flex items-center gap-1.5">
          <Link
            to="/toi"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-sans transition-colors',
              location.pathname === '/toi'
                ? 'bg-lavender/20 text-lavender font-semibold'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-soft'
            )}
            title="Góc của tôi"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Góc của tôi</span>
          </Link>

          <Link
            to="/gioi-thieu"
            className={cn(
              'p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-soft transition-colors',
              location.pathname === '/gioi-thieu' && 'text-lavender bg-bg-soft'
            )}
            title="Về Gửi Vũ Trụ"
          >
            <Moon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
