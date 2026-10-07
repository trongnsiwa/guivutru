import { supabase } from './supabase.ts';

const PREFIXES = [
  'mèo',
  'sao',
  'mây',
  'gió',
  'trăng',
  'nắng',
  'sóng',
  'lá',
  'chim',
  'cá',
  'đom-đóm',
  'hoa',
  'hạt',
  'rừng',
  'núi',
];

const SUFFIXES = [
  'lười',
  'băng',
  'bay',
  'trôi',
  'khuya',
  'mưa',
  'ấm',
  'xanh',
  'rơi',
  'non',
  'nhỏ',
  'sớm',
  'đêm',
  'hồng',
  'vàng',
  'hiền',
];

export function generatePseudonym(): string {
  const p = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const s = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${p}-${s}-${num}`;
}

const PSEUDONYM_STORAGE_KEY = 'gvt.user_pseudonym';

/**
 * Retrieves the stable pseudonym for a user, or generates and stores one on first public post (§3.3).
 */
export async function getOrCreateUserPseudonym(userId: string): Promise<string> {
  // Check local cache first
  try {
    const cached = localStorage.getItem(`${PSEUDONYM_STORAGE_KEY}.${userId}`);
    if (cached) return cached;
  } catch {
    // ignore
  }

  // Check Supabase if configured
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_pseudonyms')
        .select('pseudonym')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data?.pseudonym) {
        try {
          localStorage.setItem(`${PSEUDONYM_STORAGE_KEY}.${userId}`, data.pseudonym);
        } catch {
          // ignore
        }
        return data.pseudonym;
      }

      // Generate new pseudonym and insert
      const newPseudonym = generatePseudonym();
      const { error: insertError } = await supabase
        .from('user_pseudonyms')
        .insert({ user_id: userId, pseudonym: newPseudonym });

      if (!insertError) {
        try {
          localStorage.setItem(`${PSEUDONYM_STORAGE_KEY}.${userId}`, newPseudonym);
        } catch {
          // ignore
        }
        return newPseudonym;
      }
    } catch {
      // fallback
    }
  }

  // Fallback local generation
  const fallback = generatePseudonym();
  try {
    localStorage.setItem(`${PSEUDONYM_STORAGE_KEY}.${userId}`, fallback);
  } catch {
    // ignore
  }
  return fallback;
}
