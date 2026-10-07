import React, { useState } from 'react';
import { CloudUpload, HardDrive, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';

export const SyncPromptModal: React.FC = () => {
  const {
    showSyncPrompt,
    localNotesCount,
    confirmSyncLocalNotes,
    dismissSyncPrompt,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const handleUpload = async () => {
    setLoading(true);
    try {
      const result = await confirmSyncLocalNotes(true);
      if (result.success) {
        if (result.conflictCopiesCount && result.conflictCopiesCount > 0) {
          const c = result.conflictCopiesCount;
          setToastMessage(
            c === 1
              ? 'Đã đồng bộ xong! Mình đã lưu lại 1 bản sao xung đột trên máy này cho bạn nha 🌙'
              : `Đã đồng bộ xong! Mình đã lưu lại ${c} bản sao xung đột trên máy này cho bạn nha 🌙`
          );
        } else {
          setToastMessage('Đã đồng bộ điều ước của bạn lên đám mây thành công ✨');
        }
        setToastVisible(true);
      } else {
        const detail = result.error ? `: ${result.error}` : '';
        setToastMessage(`Không thể đồng bộ điều ước${detail} 🥲`);
        setToastVisible(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setToastMessage(`Không thể đồng bộ điều ước: ${msg} 🥲`);
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeepLocal = () => {
    dismissSyncPrompt();
  };

  return (
    <>
      <Modal
        isOpen={showSyncPrompt}
        onClose={loading ? () => {} : dismissSyncPrompt}
        title="Đồng bộ điều ước lên đám mây?"
      >
        <div className="space-y-4 pt-1 font-sans">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lavender/20 text-lavender">
            <CloudUpload className="h-6 w-6" />
          </div>

          <p className="text-center text-sm text-text-primary font-medium">
            Bạn đang có <span className="text-lavender font-bold">{localNotesCount}</span> điều ước đã lưu trên thiết bị này.
          </p>

          <p className="text-center text-xs text-text-secondary leading-relaxed px-2">
            Bạn có muốn tải các điều ước này lên tài khoản đám mây để xem và đồng bộ trên các thiết bị khác không?
          </p>

          <div className="space-y-2 pt-2">
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={loading}
              className="w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold shadow-glow"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-bg-deep" />
                  <span>Đang tải lên & đồng bộ…</span>
                </>
              ) : (
                <>
                  <CloudUpload className="h-4 w-4" />
                  <span>Tải lên & đồng bộ ✨</span>
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={handleKeepLocal}
              disabled={loading}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-xs text-text-secondary hover:text-text-primary"
            >
              <HardDrive className="h-3.5 w-3.5" />
              <span>Giữ riêng trên máy này (không tải lên)</span>
            </Button>
          </div>
        </div>
      </Modal>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        duration={3500}
      />
    </>
  );
};
