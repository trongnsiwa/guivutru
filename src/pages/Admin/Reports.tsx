import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

interface ReportedNoteItem {
  id: string;
  note_id: string;
  reason: string;
  created_at: string;
  status: string;
  content: string | null;
  pseudonym: string | null;
  unlock_at: string | null;
}

export function AdminReports() {
  const { user, openLoginModal } = useAuth();
  const [reports, setReports] = useState<ReportedNoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Check admin status and load reports
  const checkAdminAndLoadReports = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        // Check if user is in admin_allowlist
        const { data: allowlistData } = await supabase
          .from('admin_allowlist')
          .select('email')
          .eq('email', user.email)
          .maybeSingle();

        // Check env var or allowlist record
        const envAdmins = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim().toLowerCase());
        const userEmail = (user.email || '').toLowerCase();
        const hasAccess = Boolean(allowlistData) || envAdmins.includes(userEmail);

        setIsAdmin(hasAccess);

        if (hasAccess) {
          // Fetch reported notes
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
                unlock_at
              )
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

          if (!error && data) {
            const mapped: ReportedNoteItem[] = data.map((r: any) => ({
              id: r.id,
              note_id: r.note_id,
              reason: r.reason,
              created_at: r.created_at,
              status: r.status,
              content: r.notes_base?.content || '[Nội dung đã bị ẩn hoặc niêm phong]',
              pseudonym: r.notes_base?.pseudonym || 'Ẩn danh',
              unlock_at: r.notes_base?.unlock_at || null,
            }));
            setReports(mapped);
          }
        }
      } else {
        // Local mode fallback
        setIsAdmin(true);
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

      setReports((prev) => prev.filter((r) => r.note_id !== noteId));
      setToastMessage(action === 'duyet_lai' ? 'Đã duyệt lại và mở lại điều ước ✨' : 'Đã xoá điều ước khỏi vũ trụ 🗑️');
      setToastVisible(true);
    } catch {
      setToastMessage('Có lỗi xảy ra, vui lòng thử lại.');
      setToastVisible(true);
    }
  };

  if (!user) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Shield className="w-12 h-12 text-lavender" />
        <h2 className="font-display text-xl text-text-primary">Khu vực quản trị</h2>
        <p className="font-sans text-xs text-text-secondary max-w-xs">
          Vui lòng đăng nhập bằng tài khoản quản trị để xem hàng đợi báo cáo.
        </p>
        <button
          type="button"
          onClick={openLoginModal}
          className="px-4 py-2 rounded-xl bg-lavender/25 text-lavender-light border border-lavender/40 text-xs font-semibold"
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-400" />
        <h2 className="font-display text-xl text-text-primary">Truy cập bị từ chối</h2>
        <p className="font-sans text-xs text-text-secondary max-w-xs">
          Email {user.email} không nằm trong danh sách quản trị viên bầu trời.
        </p>
        <Link
          to="/bau-troi"
          className="text-xs text-lavender hover:underline"
        >
          ← Quay lại Bầu trời
        </Link>
      </div>
    );
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

        <button
          type="button"
          onClick={checkAdminAndLoadReports}
          className="p-2 rounded-lg hover:bg-bg-soft text-text-muted hover:text-text-primary"
          title="Tải lại"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Report items list */}
      {reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-4 rounded-xl border border-rose-500/20 bg-bg-soft/70 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-lavender font-medium">
                  {report.pseudonym}
                </span>
                <span className="text-text-muted">
                  Báo cáo lúc: {new Date(report.created_at).toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-bg-deep/70 border border-border-soft/60">
                <p className="font-sans text-xs sm:text-sm text-text-primary whitespace-pre-wrap">
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
