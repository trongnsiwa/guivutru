import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone);
    if (isStandalone) return;

    // Check if dismissed
    const dismissed = localStorage.getItem('gvt_install_dismissed');
    if (dismissed === 'true') return;

    // Increment and check visit count (§4.3: prompt on second visit)
    const rawCount = localStorage.getItem('gvt_visit_count');
    const currentCount = rawCount ? parseInt(rawCount, 10) : 0;
    const newCount = currentCount + 1;
    localStorage.setItem('gvt_visit_count', String(newCount));

    // Detect iOS Safari
    const userAgent = navigator.userAgent || '';
    const isIOSDevice = /iPhone|iPad|iPod/i.test(userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    if (newCount >= 2) {
      if (isIOSDevice) {
        setShowPrompt(true);
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (newCount >= 2) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    localStorage.setItem('gvt_install_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <>
      <div
        data-testid="pwa-install-prompt"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 rounded-2xl bg-[#1D1739]/95 backdrop-blur-md border border-border-strong p-4 shadow-glow animate-fade-in text-xs font-sans text-text-primary"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bg-soft border border-border-soft flex items-center justify-center text-lavender shrink-0 shadow-sm">
              <Download className="w-5 h-5 text-star-glow" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-[13px]">
                Cài đặt Gửi Vũ Trụ ✨
              </p>
              <p className="text-text-secondary text-[11px] mt-0.5">
                Mở nhanh từ màn hình chính, xem điều ước offline mọi lúc.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-text-muted hover:text-text-primary p-1 -mr-1 -mt-1 rounded-lg"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-xl text-text-muted hover:text-text-primary transition-colors text-[11px]"
          >
            Để sau
          </button>
          <Button
            variant="primary"
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 text-[11px] flex items-center gap-1.5"
          >
            {isIOS ? <Share className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isIOS ? 'Xem cách thêm' : 'Cài đặt ngay'}</span>
          </Button>
        </div>
      </div>

      {showIOSInstructions && (
        <div
          data-testid="ios-install-modal"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#1F173D] border border-border-strong p-6 text-center space-y-4 shadow-glow animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-lavender/10 border border-lavender/30 flex items-center justify-center mx-auto text-lavender">
              <Share className="w-6 h-6 text-star-glow" />
            </div>
            <h3 className="font-display text-lg text-text-primary">
              Thêm vào Màn hình chính (iOS)
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              1. Nhấn nút <strong>Chia sẻ (Share) ⎋</strong> ở thanh dưới Safari.<br />
              2. Kéo xuống và chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.<br />
              3. Nhấn <strong>Thêm (Add)</strong> ở góc trên bên phải.
            </p>
            <Button
              variant="primary"
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-2 text-xs"
            >
              Đã hiểu
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
