import { supabase } from './supabase.ts';

export type ReactionType = 'moon' | 'star' | 'heart';

export const REACTION_GLYPHS: Record<ReactionType, string> = {
  moon: '🌙',
  star: '⭐',
  heart: '💗',
};

export const REACTION_LABELS: Record<ReactionType, string> = {
  moon: 'Mặt trăng',
  star: 'Ngôi sao',
  heart: 'Trái tim',
};

const LOCAL_REACTIONS_KEY = 'gvt_user_reactions';

function getLocalReactionsMap(): Record<string, ReactionType> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_REACTIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalReaction(noteId: string, reaction: ReactionType | null): void {
  if (typeof window === 'undefined') return;
  try {
    const map = getLocalReactionsMap();
    if (reaction) {
      map[noteId] = reaction;
    } else {
      delete map[noteId];
    }
    localStorage.setItem(LOCAL_REACTIONS_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to save reaction locally:', err);
  }
}

/**
 * Gets the current user's reaction for a given note.
 */
export async function getUserReaction(
  noteId: string,
  userId?: string | null
): Promise<ReactionType | null> {
  const localMap = getLocalReactionsMap();
  const localReaction = localMap[noteId] || null;

  if (userId && supabase) {
    try {
      const { data } = await supabase
        .from('reactions')
        .select('reaction_type')
        .eq('note_id', noteId)
        .eq('user_id', userId)
        .maybeSingle();

      if (data?.reaction_type) {
        const cloudReaction = data.reaction_type as ReactionType;
        setLocalReaction(noteId, cloudReaction);
        return cloudReaction;
      }
    } catch {
      // Fallback to local
    }
  }

  return localReaction;
}

/**
 * Sets or toggles a user's reaction on a public note (§4.4).
 * Single reaction per user per note; clicking same reaction unselects it.
 */
export async function toggleUserReaction(
  noteId: string,
  reaction: ReactionType,
  userId?: string | null
): Promise<ReactionType | null> {
  const current = getLocalReactionsMap()[noteId];
  const next: ReactionType | null = current === reaction ? null : reaction;

  // Optimistic update
  setLocalReaction(noteId, next);

  if (userId && supabase) {
    try {
      if (!next) {
        await supabase
          .from('reactions')
          .delete()
          .eq('note_id', noteId)
          .eq('user_id', userId);
      } else {
        await supabase
          .from('reactions')
          .upsert({
            note_id: noteId,
            user_id: userId,
            reaction_type: next,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'note_id,user_id' });
      }
    } catch (err) {
      console.warn('Failed to sync reaction to server:', err);
    }
  }

  return next;
}

/**
 * Checks author reaction count.
 * Per §4.4 constraint: Counts are NOT shown to anyone unless the caller is
 * the note author AND the total reaction count > 10.
 */
export async function getAuthorReactionCount(
  noteId: string,
  isOwnNote: boolean
): Promise<number> {
  if (!isOwnNote) return 0;

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('get_author_reaction_count', {
        p_note_id: noteId,
      });
      if (!error && typeof data === 'number') {
        return data;
      }
    } catch {
      // Return 0
    }
  }

  return 0;
}
