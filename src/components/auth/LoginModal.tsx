import React, { useState } from 'react';
import { Mail, Sparkles, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export const LoginModal: React.FC = () => {
  const {
    showLoginModal,
    closeLoginModal,
    signInWithMagicLink,
    authError,
    authSuccess,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;

    setSubmitting(true);
    setSentMessage(null);

    const res = await signInWithMagicLink(email.trim());
    setSubmitting(false);

    if (res.success) {
      setSentMessage(res.message);
    }
  };

  const handleClose = () => {
    closeLoginModal();
    setEmail('');
    setSentMessage(null);
  };

  return (
    <Modal
      isOpen={showLoginModal}
      onClose={handleClose}
      title="Đăng nhập để đồng bộ"
    >
      <div className="space-y-4 pt-1 font-sans">
        {sentMessage || authSuccess ? (
          <div className="rounded-2xl border border-border-soft bg-bg-soft/70 p-5 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lavender/20 text-lavender">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="font-semibold text-text-primary text-base">
              {sentMessage || 'Mở email để đăng nhập nha 📬'}
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Chúng mình đã gửi một đường dẫn đăng nhập ma thuật tới{' '}
              <span className="text-lavender font-medium">{email}</span>. Bạn mở email rồi nhấn vào link để đăng nhập nha!
            </p>
            <Button
              variant="ghost"
              onClick={handleClose}
              className="mt-2 text-xs py-2 px-4"
            >
              Đã hiểu ✨
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-text-secondary leading-relaxed">
              Nhập email để nhận link đăng nhập một chạm. Không cần mật khẩu, điều ước sẽ được lưu an toàn trên đám mây.
            </p>

            <div className="space-y-1.5">
              <label
                htmlFor="auth-email-input"
                className="block text-xs font-medium text-text-secondary"
              >
                Địa chỉ email
              </label>
              <div className="relative">
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="bancuavutru@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border-soft bg-bg-deep/80 px-3.5 py-2.5 pl-10 text-sm text-text-primary placeholder:text-text-muted focus:border-lavender focus:outline-none focus:ring-1 focus:ring-lavender transition-colors"
                />
                <Mail className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
              </div>
            </div>

            {authError && (
              <div className="flex items-center gap-2 rounded-xl bg-peach/10 border border-peach/30 px-3 py-2 text-xs text-peach">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={submitting}
                className="py-2 px-3 text-xs"
              >
                Để sau
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || !email.trim()}
                className="min-w-[120px] py-2 px-4 text-xs"
              >
                {submitting ? 'Đang gửi…' : 'Gửi link 📬'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
