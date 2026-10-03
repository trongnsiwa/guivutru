import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopBar } from './TopBar';
import { Footer } from './Footer';
import { StarField } from '@/components/fx/StarField';
import { FloatingBlobs } from '@/components/fx/FloatingBlobs';
import { NoiseOverlay } from '@/components/fx/NoiseOverlay';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function PageShell() {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen flex-col bg-bg-deep text-text-primary selection:bg-lavender selection:text-bg-deep">
      {/* Background FX - Persists across routes */}
      <StarField />
      <FloatingBlobs />
      <NoiseOverlay />

      {/* Navigation */}
      <TopBar activePath={location.pathname} />

      {/* Main Content Area - Stable dimensions prevent layout thrashing */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-start w-full px-4 pb-6">
        <div className="w-full max-w-[640px] flex-1 flex flex-col">
          <motion.div
            key={location.pathname}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.18,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex-1 flex flex-col"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default PageShell;
