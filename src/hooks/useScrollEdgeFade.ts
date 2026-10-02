import { useEffect, useRef, useState, useCallback } from 'react';

export function useScrollEdgeFade<T extends HTMLElement = HTMLDivElement>() {
  const scrollRef = useRef<T>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const canScrollLeft = scrollLeft > 8;
    const canScrollRight = scrollWidth - clientWidth - scrollLeft > 8;

    setShowLeftFade(canScrollLeft);
    setShowRightFade(canScrollRight);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(checkScroll);
      observer.observe(el);
      if (el.firstElementChild) {
        observer.observe(el.firstElementChild);
      }
    }

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      observer?.disconnect();
    };
  }, [checkScroll]);

  return { scrollRef, showLeftFade, showRightFade, checkScroll };
}
