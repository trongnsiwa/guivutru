import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export interface ToastProps {
  message: string | null;
  visible: boolean;
  onClose?: () => void;
  duration?: number;
}

export function Toast({ message, visible, onClose, duration = 2500 }: ToastProps) {
  useEffect(() => {
    if (visible && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose, duration]);

  return (
    <AnimatePresence>
      {visible && message && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-pill border border-border-strong bg-bg-elevated/95 backdrop-blur-md px-5 py-2.5 text-sm font-sans font-medium text-text-primary shadow-glow max-w-[90vw] text-center"
        >
          <Sparkles className="h-4 w-4 text-star-glow shrink-0" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
