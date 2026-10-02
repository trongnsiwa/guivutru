import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { MockNoteStack } from '@/components/wish/MockNoteStack';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function Landing() {
  const prefersReducedMotion = useReducedMotion();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const handleShowSkyToast = () => {
    setToastMessage('Vũ trụ đang xếp sao, chờ xíu nha 🌙');
    setToastVisible(true);
  };

  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => {
        setToastVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastVisible]);

  return (
    <div className="flex flex-1 flex-col items-center text-center w-full pt-[48px]">
      {/* Hero Section */}
      <div className="flex flex-col items-center">
        {/* Floating Moon with soft outer glow pulse */}
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  y: [-4, 4, -4],
                }
          }
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
          className="relative inline-flex items-center justify-center"
        >
          {/* Outer glow pulse: opacity 0.4 -> 0.7 -> 0.4, 3s */}
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    opacity: [0.4, 0.7, 0.4],
                    scale: [0.95, 1.1, 0.95],
                  }
            }
            transition={
              prefersReducedMotion
                ? undefined
                : {
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
            }
            className="absolute inset-0 rounded-full bg-lavender/30 blur-xl pointer-events-none"
          />

          {/* Moon badge */}
          <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-bg-soft/80 border border-border-soft text-star-glow shadow-glow">
            <Moon className="h-8 w-8 fill-star-glow/20" />
          </div>
        </motion.div>

        {/* Hero Title & Subtitle */}
        <div className="mt-5 flex flex-col items-center">
          <h1 className="font-display font-normal text-[62px] sm:text-[78px] text-text-primary tracking-normal leading-[1.05] overflow-visible">
            <span>Vũ trụ ơi,</span>
            <br />
            <span className="text-lavender">mình muốn…</span>
          </h1>

          <p className="mt-4 font-sans font-normal text-[16px] sm:text-[17px] text-text-secondary max-w-[340px] mx-auto leading-relaxed">
            <span>Note lại điều mình muốn. Niêm phong.</span>
            <br />
            <span>Rồi để vũ trụ lo phần còn lại.</span>
          </p>
        </div>
      </div>

      {/* CTA Group */}
      <div className="mt-8 w-full max-w-xs flex flex-col items-center">
        <Link to="/viet" className="block w-full">
          <Button
            variant="pill"
            className="w-full font-sans font-semibold text-[16px] py-4 px-8 rounded-pill"
          >
            <span>Viết điều ước ✨</span>
          </Button>
        </Link>

        {/* Secondary link: 20px gap from Primary CTA */}
        <button
          type="button"
          onClick={handleShowSkyToast}
          className="mt-[20px] text-text-muted hover:text-text-secondary text-[14px] font-sans font-normal transition-colors cursor-pointer bg-transparent border-none p-0 inline-flex items-center justify-center gap-1"
        >
          <span>Bầu trời điều ước — sắp mở 🌙</span>
        </button>
      </div>

      {/* MockNoteStack: 64px gap from Secondary link */}
      <div className="mt-[64px] w-full">
        <MockNoteStack />
      </div>

      {/* 3-Step Section: 80px mobile / 120px desktop gap from MockNoteStack, 96px gap to footer */}
      <div className="mt-[80px] sm:mt-[120px] mb-[96px] w-full max-w-xs flex flex-col items-center">
        <h2 className="font-display font-normal text-[36px] sm:text-[44px] text-text-primary mb-[32px] text-center tracking-normal leading-[1.3]">
          3 bước gửi điều ước
        </h2>

        <div className="flex items-center justify-center gap-6 text-center w-full">
          {/* Step 1 */}
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border-soft/60 font-sans font-semibold text-[18px] text-lavender bg-bg-soft/30">
              1
            </span>
            <span className="font-sans text-[15px] font-medium text-text-secondary flex items-center gap-1">
              <span>Viết</span>
              <span className="text-xs">✍️</span>
            </span>
          </div>

          <div className="h-px w-6 bg-border-soft/40 -mt-[30px]" />

          {/* Step 2 */}
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border-soft/60 font-sans font-semibold text-[18px] text-lavender bg-bg-soft/30">
              2
            </span>
            <span className="font-sans text-[15px] font-medium text-text-secondary flex items-center gap-1">
              <span>Niêm phong</span>
              <span className="text-xs">🔒</span>
            </span>
          </div>

          <div className="h-px w-6 bg-border-soft/40 -mt-[30px]" />

          {/* Step 3 */}
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border-soft/60 font-sans font-semibold text-[18px] text-lavender bg-bg-soft/30">
              3
            </span>
            <span className="font-sans text-[15px] font-medium text-text-secondary flex items-center gap-1">
              <span>Chờ</span>
              <span className="text-xs">🌙</span>
            </span>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}

export default Landing;
