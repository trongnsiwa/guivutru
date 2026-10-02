import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from './TopBar';
import { Footer } from './Footer';
import { StarField } from '@/components/fx/StarField';
import { FloatingBlobs } from '@/components/fx/FloatingBlobs';
import { NoiseOverlay } from '@/components/fx/NoiseOverlay';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { DEFAULT_EASING } from '@/lib/constants';
import { cn } from '@/lib/cn';

export function PageShell() {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen flex-col bg-bg-deep text-text-primary selection:bg-lavender selection:text-bg-deep">
      {/* Background FX */}
      <StarField />
      <FloatingBlobs />
      <NoiseOverlay />

      {/* Navigation */}
      <TopBar />

      {/* Main Content Area */}
      <main
        className={cn(
          'relative z-10 flex flex-1 flex-col items-center justify-start w-full px-4 pb-6',
          location.pathname === '/' ? 'pt-0' : 'pt-6'
        )}
      >
        <div
          className={cn(
            'w-full flex-1 flex flex-col',
            location.pathname.startsWith('/viet') ? 'max-w-[640px]' : 'max-w-[430px]'
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{
                duration: 0.3,
                ease: DEFAULT_EASING,
              }}
              className="flex-1 flex flex-col"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
