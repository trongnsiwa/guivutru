import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle, Trash2, RefreshCw, ArrowUpDown } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { NotFound } from '@/pages/NotFound';

interface ReportedNoteItem {
  id: string;
  note_id: string;
  reason: string;
  created_at: string;
  first_reported_at: string;
  report_count: number;
  status: string;
  content: string | null;
  pseudonym: string | null;
  unlock_at: string | null;
}

export function AdminReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportedNoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<'count' | 'time'>('count');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Check admin status against email allowlist (§3.4 Layer 3)
  const checkAdminAndLoadReports = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        // Query admin_allowlist table
        const { data: allowlistData } = await supabase
          .from('admin_allowlist')
          .select('email')
          .eq('email', user.email)
          .maybeSingle();

        const envAdmins = (import.meta.env.VITE_ADMIN_EMAILS || '')
          .split(',')
          .map((e: string) => e.trim().toLowerCase());
        const userEmail = (user.email || '').toLowerCase();
        const hasAccess = Boolean(allowlistData) || envAdmins.includes(userEmail);

        setIsAdmin(hasAccess);

        if (hasAccess) {
          // Fetch pending reported notes
          const { data, error } = await supabase
            .from('reports')
            .select(`
              id,
              note_id,
              reason,
              created_at,
              status,
              notes_base:note_id (
                content,
                pseudonym,
                unlock_at,
                report_count,
                reported_at
              )
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

          if (!error && data) {
            // Group by note_id to present one queue entry per note
            const byNote = new Map<string, ReportedNoteItem>();

            for (const r of data as any[]) {
              const noteId = r.note_id;
              const noteBase = r.notes_base;
              const existing = byNote.get(noteId);

              if (!existing) {
                byNote.set(noteId, {
                  id: r.id,
                  note_id: noteId,
                  reason: r.reason,
                  created_at: r.created_at,
                  first_reported_at: noteBase?.reported_at || r.created_at,
                  report_count: Math.max(1, noteBase?.report_count || 1),
                  status: r.status,
                  content: noteBase?.content || '[Nội dung đã bị ẩn hoặc niêm phong]',
                  pseudonym: noteBase?.pseudonym || 'Ẩn danh',
                  unlock_at: noteBase?.unlock_at || null,
                });
              } else {
                existing.report_count = Math.max(existing.report_count + 1, noteBase?.report_count || 1);
                if (new Date(r.created_at) < new Date(existing.first_reported_at)) {
                  existing.first_reported_at = r.created_at;
                }
              }
            }

            setReports(Array.from(byNote.values()));
          }
        }
      } else {
        // Fallback for local development if email set
        const envAdmins = (import.meta.env.VITE_ADMIN_EMAILS || '')
          .split(',')
          .map((e: string) => e.trim().toLowerCase());
        const userEmail = (user.email || '').toLowerCase();
        const hasAccess = envAdmins.includes(userEmail);
        setIsAdmin(hasAccess);
        setReports([]);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminAndLoadReports();
  }, [user]);

  const handleModerate = async (noteId: string, action: 'duyet_lai' | 'xoa') => {
    try {
      if (supabase) {
        const { error } = await supabase.rpc('admin_moderate_note', {
          p_note_id: noteId,
          p_action: action,
        });

        if (error) {
          // Fallback direct updates if RPC not deployed yet
          if (action === 'duyet_lai') {
            await supabase.from('notes_base').update({ is_reported: false }).eq('id', noteId);
          } else {
            await supabase.from('notes_base').update({ is_deleted: true }).eq('id', noteId);
          }
          await supabase.from('reports').update({ status: 'reviewed' }).eq('note_id', noteId);
        }
      }

      // After actioned, note exits queue immediately
      setReports((prev) => prev.filter((r) => r.note_id !== noteId));
      setToastMessage(
        action === 'duyet_lai'
          ? 'Đã duyệt lại và mở lại điều ước trên bầu trời ✨'
          : 'Đã xoá điều ước khỏi vũ trụ 🗑️'
      );
      setToastVisible(true);
    } catch {
      setToastMessage('Có lỗi xảy ra, vui lòng thử lại.');
      setToastVisible(true);
    }
  };

  // Sort reports
  const sortedReports = useMemo(() => {
    const list = [...reports];
    if (sortBy === 'count') {
      return list.sort((a, b) => b.report_count - a.report_count);
    }
    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [reports, sortBy]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16" aria-live="polite">
        <p className="font-display text-2xl text-star-glow animate-pulse">
          Chờ vũ trụ một chút nha…
        </p>
      </div>
    );
  }

  // Non-allowlisted users get a 404, not a 403 — do not reveal route exists (§3.4.3)
  if (!user || isAdmin !== true) {
    return <NotFound />;
  }

  return (
    <div className="w-full flex-1 flex flex-col max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-soft">
        <div className="flex items-center gap-3">
          <Link
            to="/bau-troi"
            className="p-1.5 rounded-lg hover:bg-bg-soft text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display text-xl text-text-primary flex items-center gap-2">
              <span>Hàng đợi kiểm duyệt báo cáo</span>
              <Shield className="w-4 h-4 text-lavender" />
            </h1>
            <p className="font-sans text-xs text-text-secondary">
              Quản lý các điều ước bị người dùng gắn cờ vi phạm (§3.4 Layer 3)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Simple sort by report count (§3.4.3) */}
          <button
            type="button"
            onClick={() => setSortBy((prev) => (prev === 'count' ? 'time' : 'count'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-soft/80 border border-border-soft text-xs font-sans text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-lavender" />
            <span>{sortBy === 'count' ? 'Số lần báo cáo' : 'Mới nhất'}</span>
          </button>

          <button
            type="button"
            onClick={checkAdminAndLoadReports}
            className="p-2 rounded-lg hover:bg-bg-soft text-text-muted hover:text-text-primary"
            title="Tải lại"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Report items list */}
      {sortedReports.length > 0 ? (
        <div className="space-y-4">
          {sortedReports.map((report) => (
            <div
              key={report.note_id}
              className="p-4 rounded-xl border border-rose-500/20 bg-bg-soft/70 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lavender font-medium">
                    {report.pseudonym}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-semibold border border-rose-500/30">
                    {report.report_count} báo cáo
                  </span>
                </div>
                <span className="text-text-muted text-[11px]">
                  Báo cáo lần đầu: {new Date(report.first_reported_at).toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-bg-deep/70 border border-border-soft/60">
                <p className="font-sans text-xs sm:text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                  {report.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-rose-300 font-sans">
                  Lý do: {report.reason}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleModerate(report.note_id, 'duyet_lai')}
                    className="py-1 px-3 text-xs border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    <span>Duyệt lại</span>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => handleModerate(report.note_id, 'xoa')}
                    className="py-1 px-3 text-xs border-rose-500/40 text-rose-300 hover:bg-rose-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    <span>Xoá</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center space-y-3 rounded-2xl border border-border-soft/40 bg-bg-soft/20">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
          <p className="font-sans text-sm text-text-muted">
            Không có báo cáo nào đang chờ duyệt. Bầu trời thanh bình! 🌙
          </p>
        </div>
      )}

      {/* Toast */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        duration={2500}
      />
    </div>
  );
}

export default AdminReports;
