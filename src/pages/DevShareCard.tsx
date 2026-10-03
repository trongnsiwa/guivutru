import { ShareCard } from '@/components/wish/ShareCard';
import { Note } from '@/types/note';

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

export function DevShareCard() {
  return (
    <div style={{ width: 1080, height: 1920, position: 'relative', overflow: 'hidden', margin: 0, padding: 0 }}>
      <style>{`
        html, body, #root {
          width: 1080px !important;
          height: 1920px !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
      `}</style>
      <ShareCard
        note={testNote}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          zIndex: 1,
          pointerEvents: 'auto',
        }}
      />
    </div>
  );
}

export default DevShareCard;
