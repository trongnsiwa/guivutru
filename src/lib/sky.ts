import { supabase, isSupabaseConfigured } from './supabase.ts';
import type { Note, PaperTheme } from '../types/note.ts';
import { RATE_LIMIT_REJECTION } from './moderation.ts';

export { RATE_LIMIT_REJECTION };

export interface SkyNote {
  id: string;
  pseudonym: string;
  paperTheme: PaperTheme;
  stickerIds: string[];
  unlockAt: number;
  status: 'sealed' | 'opened';
  createdAt: number;
  openedAt: number | null;
  content: string | null; // NULL if sealed before unlock
  seed?: boolean;
  isReported?: boolean;
}

export type SkyFilter = 'moi-nhat' | 'sap-mo' | 'ngau-nhien';

export const SEEDED_SKY_NOTES: SkyNote[] = [
  {
    id: 'seed_sky_01',
    pseudonym: 'mèo-lười-07',
    paperTheme: 'dem-sao',
    stickerIds: ['🌙', '⭐'],
    unlockAt: 1700000000000,
    status: 'opened',
    createdAt: 1690000000000,
    openedAt: 1700000000000,
    content: 'Mong một ngày thức dậy thấy lòng mình an yên như bầu trời sáng sớm.',
    seed: true,
  },
  {
    id: 'seed_sky_02',
    pseudonym: 'sao-băng-12',
    paperTheme: 'tim-mong',
    stickerIds: ['🌸'],
    unlockAt: 1705000000000,
    status: 'opened',
    createdAt: 1695000000000,
    openedAt: 1705000000000,
    content: 'Ước cho mẹ luôn khỏe mạnh, mỗi ngày đều có nụ cười trên môi.',
    seed: true,
  },
  {
    id: 'seed_sky_03',
    pseudonym: 'mây-trôi-44',
    paperTheme: 'bien',
    stickerIds: ['🫧', '🪐'],
    unlockAt: 1710000000000,
    status: 'opened',
    createdAt: 1700000000000,
    openedAt: 1710000000000,
    content: 'Năm sau mình sẽ can đảm bước ra khỏi vùng an toàn.',
    seed: true,
  },
  {
    id: 'seed_sky_04',
    pseudonym: 'gió-bay-19',
    paperTheme: 'dem-sao',
    stickerIds: ['💫'],
    unlockAt: 1712000000000,
    status: 'opened',
    createdAt: 1702000000000,
    openedAt: 1712000000000,
    content: 'Gửi vũ trụ: Mong người ấy cũng đang nhìn lên cùng một vầng trăng này.',
    seed: true,
  },
  {
    id: 'seed_sky_05',
    pseudonym: 'trăng-khuya-88',
    paperTheme: 'hogn',
    stickerIds: ['🎀', '🍀'],
    unlockAt: 1714000000000,
    status: 'opened',
    createdAt: 1704000000000,
    openedAt: 1714000000000,
    content: 'Hy vọng bài thi tốt nghiệp điểm thật cao, vào được trường mình mơ ước.',
    seed: true,
  },
  {
    id: 'seed_sky_06',
    pseudonym: 'hạt-mưa-33',
    paperTheme: 'giay-cu',
    stickerIds: ['🕯️'],
    unlockAt: 1716000000000,
    status: 'opened',
    createdAt: 1706000000000,
    openedAt: 1716000000000,
    content: 'Mong cho những vết thương cũ dần lành lại theo năm tháng.',
    seed: true,
  },
  {
    id: 'seed_sky_07',
    pseudonym: 'nắng-ấm-25',
    paperTheme: 'rung',
    stickerIds: ['🌸', '🍀'],
    unlockAt: 1718000000000,
    status: 'opened',
    createdAt: 1708000000000,
    openedAt: 1718000000000,
    content: 'Một chuyến đi Đà Lạt ngắm sương mù cùng người thương.',
    seed: true,
  },
  {
    id: 'seed_sky_08',
    pseudonym: 'sóng-xanh-61',
    paperTheme: 'bien',
    stickerIds: ['🫧'],
    unlockAt: 1720000000000,
    status: 'opened',
    createdAt: 1710000000000,
    openedAt: 1720000000000,
    content: 'Ước mình có đủ kiên nhẫn để đi hết con đường đã chọn.',
    seed: true,
  },
  {
    id: 'seed_sky_09',
    pseudonym: 'lá-rơi-17',
    paperTheme: 'giay-cu',
    stickerIds: ['☁️'],
    unlockAt: 1722000000000,
    status: 'opened',
    createdAt: 1712000000000,
    openedAt: 1722000000000,
    content: 'Mong sớm tìm thấy công việc mà mỗi sáng thức dậy đều háo hức.',
    seed: true,
  },
  {
    id: 'seed_sky_10',
    pseudonym: 'chim-nhỏ-02',
    paperTheme: 'tim-mong',
    stickerIds: ['🌙'],
    unlockAt: 1724000000000,
    status: 'opened',
    createdAt: 1714000000000,
    openedAt: 1724000000000,
    content: 'Ước có một chú mèo nhỏ cuộn tròn ngủ bên cạnh mỗi đêm mưa.',
    seed: true,
  },
  {
    id: 'seed_sky_11',
    pseudonym: 'đom-đóm-99',
    paperTheme: 'dem-sao',
    stickerIds: ['⭐', '💫'],
    unlockAt: 1726000000000,
    status: 'opened',
    createdAt: 1716000000000,
    openedAt: 1726000000000,
    content: 'Gửi vào vũ trụ ngàn lời cảm ơn vì mình vẫn đang sống và cố gắng.',
    seed: true,
  },
  {
    id: 'seed_sky_12',
    pseudonym: 'hoa-hồng-53',
    paperTheme: 'hogn',
    stickerIds: ['🌸'],
    unlockAt: 1728000000000,
    status: 'opened',
    createdAt: 1718000000000,
    openedAt: 1728000000000,
    content: 'Mong người thân bên cạnh luôn bình an qua mọi bão giông.',
    seed: true,
  },
  {
    id: 'seed_sky_13',
    pseudonym: 'cá-bơi-28',
    paperTheme: 'bien',
    stickerIds: ['🫧'],
    unlockAt: 1730000000000,
    status: 'opened',
    createdAt: 1720000000000,
    openedAt: 1730000000000,
    content: 'Ước cho những đêm mất ngủ sẽ sớm biến thành giấc ngủ say.',
    seed: true,
  },
  {
    id: 'seed_sky_14',
    pseudonym: 'cây-xanh-76',
    paperTheme: 'rung',
    stickerIds: ['🍀'],
    unlockAt: 1732000000000,
    status: 'opened',
    createdAt: 1722000000000,
    openedAt: 1732000000000,
    content: 'Mong một ngày tự tin nói trước đám đông mà không run rẩy.',
    seed: true,
  },
  {
    id: 'seed_sky_15',
    pseudonym: 'mây-hồng-09',
    paperTheme: 'hogn',
    stickerIds: ['🎀'],
    unlockAt: 1734000000000,
    status: 'opened',
    createdAt: 1724000000000,
    openedAt: 1734000000000,
    content: 'Ước tiết kiệm đủ tiền để đưa bố mẹ đi biển một chuyến.',
    seed: true,
  },
  {
    id: 'seed_sky_16',
    pseudonym: 'gió-sớm-31',
    paperTheme: 'giay-cu',
    stickerIds: ['🕯️'],
    unlockAt: 1736000000000,
    status: 'opened',
    createdAt: 1726000000000,
    openedAt: 1736000000000,
    content: 'Gửi lại đây những muộn phiền của tuổi hai mươi.',
    seed: true,
  },
  {
    id: 'seed_sky_17',
    pseudonym: 'sao-sớm-82',
    paperTheme: 'dem-sao',
    stickerIds: ['⭐'],
    unlockAt: 1738000000000,
    status: 'opened',
    createdAt: 1728000000000,
    openedAt: 1738000000000,
    content: 'Mong cho bạn và mình đều không bỏ cuộc giữa chừng.',
    seed: true,
  },
  {
    id: 'seed_sky_18',
    pseudonym: 'trăng-non-14',
    paperTheme: 'tim-mong',
    stickerIds: ['🌙', '🪐'],
    unlockAt: 1740000000000,
    status: 'opened',
    createdAt: 1730000000000,
    openedAt: 1740000000000,
    content: 'Ước được một lần nhìn thấy cực quang ở nơi xa xôi.',
    seed: true,
  },
  {
    id: 'seed_sky_19',
    pseudonym: 'mèo-hiền-55',
    paperTheme: 'dem-sao',
    stickerIds: ['🌙'],
    unlockAt: 1742000000000,
    status: 'opened',
    createdAt: 1732000000000,
    openedAt: 1742000000000,
    content: 'Mong tìm được tri kỷ có thể ngồi im lặng bên nhau mà không thấy gượng gạo.',
    seed: true,
  },
  {
    id: 'seed_sky_20',
    pseudonym: 'nắng-vàng-68',
    paperTheme: 'rung',
    stickerIds: ['🌸', '☀️'],
    unlockAt: 1744000000000,
    status: 'opened',
    createdAt: 1734000000000,
    openedAt: 1744000000000,
    content: 'Gửi điều ước nhỏ bé: ngày mai trời sẽ nắng ấm và lòng sẽ nhẹ tênh.',
    seed: true,
  },
  // A sealed seed note to test locked view on the wall
  {
    id: 'seed_sky_21_sealed',
    pseudonym: 'sao-khuya-91',
    paperTheme: 'dem-sao',
    stickerIds: ['⭐', '🔒'],
    unlockAt: Date.now() + 86400000 * 30, // 30 days in future
    status: 'sealed',
    createdAt: Date.now() - 3600000,
    openedAt: null,
    content: null,
    seed: true,
  },
];

const LOCAL_REPORTED_KEY = 'gvt.reported_notes';

export function getLocalReportedNoteIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_REPORTED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function markNoteAsReportedLocally(noteId: string): void {
  try {
    const set = getLocalReportedNoteIds();
    set.add(noteId);
    localStorage.setItem(LOCAL_REPORTED_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

/**
 * Fetch public notes from the sky wall view (§3.2).
 */
export async function fetchSkyNotes(filter: SkyFilter = 'moi-nhat'): Promise<SkyNote[]> {
  const reportedSet = getLocalReportedNoteIds();

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('sky_notes').select('*');

      if (filter === 'moi-nhat') {
        query = query.order('created_at', { ascending: false });
      } else if (filter === 'sap-mo') {
        query = query
          .eq('status', 'sealed')
          .gt('unlock_at', new Date().toISOString())
          .order('unlock_at', { ascending: true });
      }

      const { data, error } = await query.limit(100);

      if (!error && data && data.length > 0) {
        let results: SkyNote[] = data.map((r) => ({
          id: r.id,
          pseudonym: r.pseudonym || 'người-ẩn-danh',
          paperTheme: (r.paper_theme as PaperTheme) || 'dem-sao',
          stickerIds: Array.isArray(r.sticker_ids) ? r.sticker_ids : [],
          unlockAt: new Date(r.unlock_at).getTime(),
          status: r.status,
          createdAt: new Date(r.created_at).getTime(),
          openedAt: r.opened_at ? new Date(r.opened_at).getTime() : null,
          content: r.content,
          seed: Boolean(r.seed),
        }));

        // Filter out locally reported notes
        results = results.filter((n) => !reportedSet.has(n.id));

        if (filter === 'ngau-nhien') {
          results.sort(() => Math.random() - 0.5);
        }

        return results;
      }
    } catch (err) {
      console.warn('[Sky] Failed to fetch cloud sky notes, falling back to seed:', err);
    }
  }

  // Fallback to seed notes (filtered)
  let results = SEEDED_SKY_NOTES.filter((n) => !reportedSet.has(n.id));

  if (filter === 'sap-mo') {
    results = results
      .filter((n) => n.status === 'sealed' && n.unlockAt > Date.now())
      .sort((a, b) => a.unlockAt - b.unlockAt);
  } else if (filter === 'ngau-nhien') {
    results = [...results].sort(() => Math.random() - 0.5);
  } else {
    results = [...results].sort((a, b) => b.createdAt - a.createdAt);
  }

  return results;
}

/**
 * Fetch current user's public stars for /bau-troi/cua-toi (§3.3).
 */
export async function fetchMySkyNotes(_userId?: string): Promise<SkyNote[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('my_sky_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((r) => ({
          id: r.id,
          pseudonym: r.pseudonym || 'bạn',
          paperTheme: (r.paper_theme as PaperTheme) || 'dem-sao',
          stickerIds: Array.isArray(r.sticker_ids) ? r.sticker_ids : [],
          unlockAt: new Date(r.unlock_at).getTime(),
          status: r.status,
          createdAt: new Date(r.created_at).getTime(),
          openedAt: r.opened_at ? new Date(r.opened_at).getTime() : null,
          content: r.content,
          isReported: Boolean(r.is_reported),
        }));
      }
    } catch {
      // fallback
    }
  }

  // Fallback from localStorage
  try {
    const raw = localStorage.getItem('gvt.notes');
    if (!raw) return [];
    const notes = JSON.parse(raw) as Note[];
    return notes
      .filter((n) => n.visibility === 'public')
      .map((n) => ({
        id: n.id,
        pseudonym: 'bạn',
        paperTheme: n.paperTheme,
        stickerIds: n.stickerIds,
        unlockAt: n.unlockAt,
        status: n.status,
        createdAt: n.createdAt,
        openedAt: n.openedAt,
        content: n.status === 'sealed' && n.unlockAt > Date.now() ? null : n.content,
      }));
  } catch {
    return [];
  }
}

/**
 * Report a public note (§3.4 Layer 2).
 * Hides note locally immediately and notifies backend RPC.
 */
export async function reportSkyNote(
  noteId: string,
  reason: string = 'Inappropriate content'
): Promise<{ success: boolean; message?: string }> {
  // Check if own note in local storage
  try {
    const raw = localStorage.getItem('gvt.notes');
    if (raw) {
      const notes = JSON.parse(raw) as Note[];
      if (notes.some((n) => n.id === noteId)) {
        return { success: false, message: 'Bạn không thể báo cáo điều ước của chính mình' };
      }
    }
  } catch {
    // ignore
  }

  // Check if user already reported this note
  if (getLocalReportedNoteIds().has(noteId)) {
    return { success: false, message: 'Bạn đã báo cáo điều ước này rồi' };
  }

  // 1. Mark reported locally immediately (disappears in 0ms)
  markNoteAsReportedLocally(noteId);

  // 2. Call backend RPC if available
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.rpc('report_note', {
        p_note_id: noteId,
        p_reason: reason,
      });
      if (error) {
        console.warn('[Sky] Report RPC error:', error);
        if (error.message?.includes('own note')) {
          return { success: false, message: 'Bạn không thể báo cáo điều ước của chính mình' };
        }
        if (error.message?.includes('Already reported')) {
          return { success: false, message: 'Bạn đã báo cáo điều ước này rồi' };
        }
      }
    } catch (err) {
      console.warn('[Sky] Report RPC failed:', err);
    }
  }

  return { success: true };
}

/**
 * Check rate limit for publishing public notes (§3.5).
 * 1/day, 5/week. Returns { allowed: true } or rejection message.
 */
export async function checkPublicRateLimit(userId: string): Promise<{ allowed: boolean; message?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    // Client-side local check
    try {
      const raw = localStorage.getItem('gvt.notes');
      if (raw) {
        const notes = JSON.parse(raw) as Note[];
        const now = Date.now();
        const oneDayAgo = now - 86400000;
        const oneWeekAgo = now - 7 * 86400000;

        const publicNotes = notes.filter((n) => n.visibility === 'public' && !n.isDeleted);
        const pastDayCount = publicNotes.filter((n) => n.createdAt >= oneDayAgo).length;
        const pastWeekCount = publicNotes.filter((n) => n.createdAt >= oneWeekAgo).length;

        if (pastDayCount >= 1 || pastWeekCount >= 5) {
          return { allowed: false, message: RATE_LIMIT_REJECTION };
        }
      }
    } catch {
      // safe fallback
    }
    return { allowed: true };
  }

  try {
    const { data, error } = await supabase.rpc('check_public_rate_limit', {
      p_user_id: userId,
    });

    if (!error && data === false) {
      return { allowed: false, message: RATE_LIMIT_REJECTION };
    }
  } catch {
    // ignore
  }

  return { allowed: true };
}
