import React, { useState } from 'react';
import { CloudUpload, HardDrive } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export const SyncPromptModal: React.FC = () => {
  const {
    showSyncPrompt,
    localNotesCount,
    confirmSyncLocalNotes,
    dismissSyncPrompt,
  } = useAuth();

  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    setLoading(true);
    await confirmSyncLocalNotes(true);
    setLoading(false);
  };

  const handleKeepLocal = async () => {
    setLoading(true);
    await confirmSyncLocalNotes(false);
    setLoading(false);
  };

  return (
    <Modal
      isOpen={showSyncPrompt}
      onClose={dismissSyncPrompt}
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
            className="w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <CloudUpload className="h-4 w-4" />
            <span>Tải lên & đồng bộ ✨</span>
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
  );
};
