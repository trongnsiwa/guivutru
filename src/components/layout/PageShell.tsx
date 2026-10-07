import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopBar } from './TopBar';
import { Footer } from './Footer';
import { StarField } from '@/components/fx/StarField';
import { NoiseOverlay } from '@/components/fx/NoiseOverlay';
import { CursorSparkles } from '@/components/fx/CursorSparkles';
import { LoginModal } from '@/components/auth/LoginModal';
import { SyncPromptModal } from '@/components/auth/SyncPromptModal';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { useAuth } from '@/hooks/useAuth';

export function PageShell() {
  const location = useLocation();
  const initAuth = useAuth((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', `https://guivutru.pages.dev${location.pathname}`);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen flex-col bg-bg-deep text-text-primary selection:bg-lavender selection:text-bg-deep">
      {/* Background FX - Persists across routes */}
      <StarField />
      <NoiseOverlay />
      <CursorSparkles />

      {/* Navigation */}
      <TopBar activePath={location.pathname} />

      {/* Main Content Area - Stable dimensions prevent layout thrashing */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-start w-full px-4 pb-6 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-[640px] flex-1 flex flex-col">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.18,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex-1 flex flex-col"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* Modals for Auth & Local-first Sync */}
      <LoginModal />
      <SyncPromptModal />
      <InstallPrompt />

      {/* Screen reader route change announcement */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {location.pathname === '/'
          ? 'Trang chủ Gửi Vũ Trụ'
          : location.pathname.startsWith('/viet/xong')
          ? 'Điều ước đã niêm phong thành công'
          : location.pathname.startsWith('/viet')
          ? 'Viết điều ước'
          : location.pathname.startsWith('/toi')
          ? 'Góc của tôi'
          : location.pathname.startsWith('/note')
          ? 'Chi tiết điều ước'
          : location.pathname.startsWith('/gioi-thieu')
          ? 'Giới thiệu'
          : 'Gửi Vũ Trụ'}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default PageShell;
