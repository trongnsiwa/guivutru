import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { BookOpen, Info, User, LogIn, LogOut } from 'lucide-react';
import { MeteorShower } from '@/components/fx/MeteorShower';
import { cn } from '@/lib/cn';
import { useAuth } from '@/hooks/useAuth';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface TopBarProps {
  activePath?: string;
}

export const TopBar = React.memo(function TopBar({ activePath = '/' }: TopBarProps) {
  const isToi = activePath === '/toi';
  const isAbout = activePath === '/gioi-thieu';
  const prefersReducedMotion = useReducedMotion();

  const { user, openLoginModal, signOut } = useAuth();
  if (typeof window !== 'undefined') {
    (window as unknown as { __useAuth?: typeof useAuth }).__useAuth = useAuth;
  }
  const [menuOpen, setMenuOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tapTimestampsRef = useRef<number[]>([]);
  const [showMeteorShower, setShowMeteorShower] = useState(false);

  // Update trigger position for portal alignment
  const updateTriggerPosition = useCallback(() => {
    if (triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect());
    }
  }, []);

  const toggleMenu = () => {
    if (!menuOpen) {
      updateTriggerPosition();
    }
    setMenuOpen((prev) => !prev);
  };

  // Keep dropdown aligned on resize or scroll while open
  useEffect(() => {
    if (!menuOpen) return;
    window.addEventListener('resize', updateTriggerPosition);
    window.addEventListener('scroll', updateTriggerPosition, { passive: true });
    return () => {
      window.removeEventListener('resize', updateTriggerPosition);
      window.removeEventListener('scroll', updateTriggerPosition);
    };
  }, [menuOpen, updateTriggerPosition]);

  // Close dropdown on outside click or escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleEasterEggTap = (e: React.MouseEvent) => {
    const now = Date.now();
    tapTimestampsRef.current = tapTimestampsRef.current.filter((t) => now - t <= 3000);
    tapTimestampsRef.current.push(now);

    if (tapTimestampsRef.current.length >= 7) {
      e.preventDefault();
      tapTimestampsRef.current = [];
      setShowMeteorShower(true);
    }
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : null;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-bg-deep/70 border-b border-border-soft/50">
      <div className="mx-auto flex h-16 max-w-[430px] items-center justify-between px-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender"
        >
          {/* 32px circular badge with crescent moon + tiny star */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-soft border border-border-soft shadow-glow group-hover:scale-105 transition-transform text-lavender shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path
                d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"
                fill="var(--bg-deep)"
                stroke="var(--lavender)"
              />
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
              'hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-sans transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender',
              isToi
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
            onClick={handleEasterEggTap}
            className={cn(
              'p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender',
              isAbout && 'text-lavender bg-bg-soft'
            )}
            title="Về Gửi Vũ Trụ"
            aria-label="Về Gửi Vũ Trụ"
          >
            <Info className="h-4 w-4" />
          </Link>

          {/* Account Avatar Button (§2.6) */}
          <div className="relative">
            <button
              ref={triggerRef}
              type="button"
              onClick={toggleMenu}
              aria-label={user ? `Tài khoản (${user.email})` : 'Tài khoản & đồng bộ'}
              aria-expanded={menuOpen}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender cursor-pointer',
                user
                  ? 'bg-lavender/20 border border-lavender/50 text-lavender font-semibold text-xs shadow-glow'
                  : 'bg-bg-soft/80 border border-border-soft hover:border-border-strong text-text-secondary hover:text-text-primary'
              )}
            >
              {user ? (
                <span>{userInitial}</span>
              ) : (
                <User className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Account Menu Dropdown rendered via portal to escape all containing blocks and stacking contexts */}
      {menuOpen && triggerRect && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: triggerRect.bottom + 8,
            right: Math.max(8, window.innerWidth - triggerRect.right),
          }}
          className={cn(
            'w-48 rounded-2xl border border-border-strong bg-[#241B47] p-1.5 shadow-glow backdrop-blur-md z-[100] text-xs font-sans',
            prefersReducedMotion ? 'opacity-100' : 'animate-fade-in'
          )}
        >
          {user ? (
            <>
              <div className="px-3 py-2 border-b border-border-soft/40 mb-1">
                <p className="text-[10px] text-text-muted">Đã đăng nhập</p>
                <p className="font-medium text-text-primary truncate" title={user.email}>
                  {user.email}
                </p>
              </div>

              <Link
                to="/toi"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-text-secondary hover:bg-bg-soft hover:text-text-primary transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5 text-lavender" />
                <span>Góc của tôi</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-text-secondary hover:bg-peach/10 hover:text-peach transition-colors text-left cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Đăng xuất</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/toi"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-text-secondary hover:bg-bg-soft hover:text-text-primary transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5 text-lavender" />
                <span>Góc của tôi</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openLoginModal();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-medium text-lavender hover:bg-lavender/10 transition-colors text-left cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Đăng nhập để đồng bộ</span>
              </button>
            </>
          )}
        </div>,
        document.body
      )}

      {showMeteorShower && (
        <MeteorShower onComplete={() => setShowMeteorShower(false)} />
      )}
    </header>
  );
});

export default TopBar;
