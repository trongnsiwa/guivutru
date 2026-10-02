import { ReactNode, forwardRef, useImperativeHandle, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollEdgeFade } from '@/hooks/useScrollEdgeFade';

export interface ScrollRowProps {
  children: ReactNode;
  className?: string;
  wrapperClassName?: string;
  /** Optional gap between items, defaults to 12px (gap-3) */
  gapClassName?: string;
}

export interface ScrollRowHandle {
  element: HTMLDivElement | null;
  scrollTo: (options: ScrollToOptions) => void;
  checkScroll: () => void;
}

export const ScrollRow = forwardRef<ScrollRowHandle, ScrollRowProps>(
  ({ children, className, wrapperClassName, gapClassName = 'gap-3' }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const { scrollRef, showLeftFade, showRightFade, checkScroll } = useScrollEdgeFade<HTMLDivElement>();

    useImperativeHandle(ref, () => ({
      element: scrollRef.current,
      scrollTo: (opts) => scrollRef.current?.scrollTo(opts),
      checkScroll,
    }));

    // Support dev/test query param ?scroll=mid or ?scroll=end
    useEffect(() => {
      if (typeof window !== 'undefined' && scrollRef.current) {
        const params = new URLSearchParams(window.location.search);
        const scrollPos = params.get('scroll');
        if (scrollPos === 'mid') {
          scrollRef.current.scrollLeft = 140;
          checkScroll();
        } else if (scrollPos === 'end') {
          scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
          checkScroll();
        }
      }
    }, [checkScroll, scrollRef]);

    return (
      <div className={cn('relative w-full', wrapperClassName)}>
        {/* Left edge fade */}
        <div
          className={cn(
            'absolute -left-2 top-0 bottom-0 w-12 pointer-events-none z-10 bg-gradient-to-r from-[var(--bg-deep)] to-transparent',
            prefersReducedMotion ? 'duration-0' : 'transition-opacity duration-200',
            showLeftFade ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden="true"
        />

        {/* Scroll container with 8px horizontal padding and -8px negative margin */}
        <div
          ref={scrollRef}
          className={cn(
            'no-scrollbar overflow-x-auto overflow-y-hidden flex items-center py-2 px-2 -mx-2 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]',
            gapClassName,
            className
          )}
        >
          {children}
        </div>

        {/* Right edge fade */}
        <div
          className={cn(
            'absolute -right-2 top-0 bottom-0 w-12 pointer-events-none z-10 bg-gradient-to-r from-transparent to-[var(--bg-deep)]',
            prefersReducedMotion ? 'duration-0' : 'transition-opacity duration-200',
            showRightFade ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden="true"
        />
      </div>
    );
  }
);

ScrollRow.displayName = 'ScrollRow';

export default ScrollRow;
