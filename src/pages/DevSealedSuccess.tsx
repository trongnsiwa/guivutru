import { useEffect, useState } from 'react';
import { Sealed } from '@/pages/Sealed';
import { Note } from '@/types/note';
import { STORAGE_KEYS } from '@/lib/constants';

const testNote: Note = {
  id: 'test-dalat-123',
  content: 'Điều ước của tớ ở Đà Lạt 🌸 — ĐẶC BIỆT Ở CHỖ ĐÓ',
  promptId: null,
  paperTheme: 'tim-mong',
  stickerIds: ['🌙', '⭐', '🌸'],
  unlockAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  status: 'sealed',
  createdAt: Date.now(),
  openedAt: null,
};

export function DevSealedSuccess() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.LAST_SEALED, JSON.stringify(testNote));
    setReady(true);
  }, []);

  if (!ready) return null;

  return <Sealed />;
}

export default DevSealedSuccess;
