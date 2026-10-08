import { useRef, useEffect, useState } from 'react';
import { YearInReviewCard } from '@/components/wish/YearInReviewCard';
import { computeYearInReview } from '@/lib/yearInReview';
import { exportAndShareCard } from '@/lib/share';
import { Note } from '@/types/note';

const fiveSealedNotes: Note[] = [
  {
    id: 'sealed_secret_1',
    content: 'BÍ MẬT TUYỆT ĐỐI KHÔNG ĐƯỢC LỘ - Note 1',
    promptId: null,
    paperTheme: 'dem-sao',
    stickerIds: ['🌙'],
    unlockAt: Date.now() + 100000000,
    status: 'sealed',
    createdAt: Date.now() - 50000000,
    openedAt: null,
  },
  {
    id: 'sealed_secret_2',
    content: 'BÍ MẬT TUYỆT ĐỐI KHÔNG ĐƯỢC LỘ - Note 2',
    promptId: null,
    paperTheme: 'tim-mong',
    stickerIds: ['⭐'],
    unlockAt: Date.now() + 100000000,
    status: 'sealed',
    createdAt: Date.now() - 40000000,
    openedAt: null,
  },
  {
    id: 'sealed_secret_3',
    content: 'BÍ MẬT TUYỆT ĐỐI KHÔNG ĐƯỢC LỘ - Note 3',
    promptId: null,
    paperTheme: 'bien',
    stickerIds: ['🌸'],
    unlockAt: Date.now() + 100000000,
    status: 'sealed',
    createdAt: Date.now() - 30000000,
    openedAt: null,
  },
  {
    id: 'sealed_secret_4',
    content: 'BÍ MẬT TUYỆT ĐỐI KHÔNG ĐƯỢC LỘ - Note 4',
    promptId: null,
    paperTheme: 'rung',
    stickerIds: ['🍀'],
    unlockAt: Date.now() + 100000000,
    status: 'sealed',
    createdAt: Date.now() - 20000000,
    openedAt: null,
  },
  {
    id: 'sealed_secret_5',
    content: 'BÍ MẬT TUYỆT ĐỐI KHÔNG ĐƯỢC LỘ - Note 5',
    promptId: null,
    paperTheme: 'giay-cu',
    stickerIds: ['🕯️'],
    unlockAt: Date.now() + 100000000,
    status: 'sealed',
    createdAt: Date.now() - 10000000,
    openedAt: null,
  },
];

export function DevYearInReviewCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exportedDataUrl, setExportedDataUrl] = useState<string | null>(null);
  const stats = computeYearInReview(fiveSealedNotes);

  useEffect(() => {
    if (cardRef.current) {
      exportAndShareCard(cardRef.current, 'audit-sealed').then((res) => {
        if (res.dataUrl) {
          setExportedDataUrl(res.dataUrl);
          (window as any).__EXPORTED_PNG_DATA_URL__ = res.dataUrl;
        }
      });
    }
  }, []);

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
      <YearInReviewCard
        ref={cardRef}
        stats={stats}
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
      {exportedDataUrl && (
        <img
          id="exported-img"
          src={exportedDataUrl}
          alt="Exported"
          style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, zIndex: 10 }}
        />
      )}
    </div>
  );
}

export default DevYearInReviewCard;
