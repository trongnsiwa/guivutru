import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { User, RefreshCw, Plus } from 'lucide-react';
import { SkyCanvas } from './SkyCanvas';
import { SkyNoteModal } from './SkyNoteModal';
import { fetchSkyNotes, reportSkyNote, SkyNote, SkyFilter } from '@/lib/sky';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';

export function Sky() {
  const [notes, setNotes] = useState<SkyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SkyFilter>('moi-nhat');
  const [selectedNote, setSelectedNote] = useState<SkyNote | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const { user, openLoginModal } = useAuth();

  const loadSkyData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSkyNotes(filter);
      setNotes(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadSkyData();
  }, [loadSkyData]);

  // Instant local hide on report (§3.4 Layer 2: "One report hides the note pending review")
  const handleReportNote = async (noteId: string) => {
    const res = await reportSkyNote(noteId);
    if (!res.success) {
      setToastMessage(res.message || 'Không thể báo cáo điều ước này');
      setToastVisible(true);
      return;
    }
    // Disappear in 0ms locally
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    setToastMessage('Đã báo cáo điều ước này. Cảm ơn bạn đã giữ gìn bầu trời 🌙');
    setToastVisible(true);
  };

  const filteredNotes = useMemo(() => {
    const list = [...notes];
    if (filter === 'moi-nhat') {
      return list.sort((a, b) => b.createdAt - a.createdAt);
    }
    if (filter === 'sap-mo') {
      const now = Date.now();
      // Notes unlocking soonest in the future
      return list
        .filter((n) => n.status === 'sealed' && n.unlockAt > now)
        .sort((a, b) => a.unlockAt - b.unlockAt);
    }
    if (filter === 'ngau-nhien') {
      return list.sort((a, b) => a.id.localeCompare(b.id));
    }
    return list;
  }, [notes, filter]);

  return (
    <div className="w-full flex-1 flex flex-col items-center max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Page Header */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display font-medium text-2xl sm:text-3xl text-text-primary">
              Bầu trời điều ước
            </h1>
            <span className="text-xl">🌌</span>
          </div>
          <p className="font-sans text-xs sm:text-sm text-text-secondary">
            Những vì sao gửi vào không gian, ẩn danh và lấp lánh theo năm tháng.
          </p>
        </div>

        {/* Actions: My Sky link & Write wish (Bug 2 fix: whitespace-nowrap prevents multi-line wrap) */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {user ? (
            <Link
              to="/bau-troi/cua-toi"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-lavender/30 bg-bg-soft/70 hover:bg-bg-soft text-lavender-light text-xs font-sans whitespace-nowrap transition-colors"
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Chòm sao của tôi</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={openLoginModal}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-border-soft bg-bg-soft/50 hover:bg-bg-soft text-text-muted hover:text-text-primary text-xs font-sans whitespace-nowrap transition-colors"
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Xem chòm sao</span>
            </button>
          )}

          <Link
            to="/viet"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-lavender/20 hover:bg-lavender/30 border border-lavender/40 text-lavender-light text-xs font-medium font-sans whitespace-nowrap transition-colors shadow-glow"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Gửi ước nguyện</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar (§3.2: Mới nhất / Sắp mở / Ngẫu nhiên) */}
      <div className="w-full flex items-center justify-between gap-2 border-b border-border-soft/60 pb-3">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setFilter('moi-nhat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
              filter === 'moi-nhat'
                ? 'bg-lavender/25 text-lavender-light border border-lavender/40 shadow-glow'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-soft/60'
            }`}
          >
            Mới nhất
          </button>
          <button
            type="button"
            onClick={() => setFilter('sap-mo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
              filter === 'sap-mo'
                ? 'bg-lavender/25 text-lavender-light border border-lavender/40 shadow-glow'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-soft/60'
            }`}
          >
            Sắp mở
          </button>
          <button
            type="button"
            onClick={() => setFilter('ngau-nhien')}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
              filter === 'ngau-nhien'
                ? 'bg-lavender/25 text-lavender-light border border-lavender/40 shadow-glow'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-soft/60'
            }`}
          >
            Ngẫu nhiên
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-sans text-text-muted">
          <span>{filteredNotes.length} vì sao</span>
          <button
            type="button"
            onClick={loadSkyData}
            title="Tải lại bầu trời"
            className="p-1 rounded-md hover:bg-bg-soft text-text-muted hover:text-text-primary transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Interactive Sky Canvas */}
      <div className="w-full">
        <SkyCanvas
          notes={filteredNotes}
          featuredNoteId={filter === 'moi-nhat' ? filteredNotes[0]?.id : undefined}
          onSelectNote={(n) => setSelectedNote(n)}
        />
      </div>

      {/* Sky Note Detail Modal */}
      <SkyNoteModal
        note={selectedNote}
        isOpen={Boolean(selectedNote)}
        onClose={() => setSelectedNote(null)}
        onReport={handleReportNote}
      />

      {/* Toast Feedback */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        duration={3000}
      />
    </div>
  );
}

export default Sky;
