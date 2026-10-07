import { useState, useEffect } from 'react';
import {
  ReactionType,
  REACTION_GLYPHS,
  REACTION_LABELS,
  getUserReaction,
  toggleUserReaction,
  getAuthorReactionCount,
} from '@/lib/reactions';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';

interface NoteReactionsProps {
  noteId: string;
  isOwnNote?: boolean;
}

export function NoteReactions({ noteId, isOwnNote = false }: NoteReactionsProps) {
  const user = useAuth((s) => s.user);
  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(null);
  const [authorCount, setAuthorCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    getUserReaction(noteId, user?.id).then((r) => {
      if (mounted) setActiveReaction(r);
    });

    if (isOwnNote) {
      getAuthorReactionCount(noteId, true).then((cnt) => {
        if (mounted) setAuthorCount(cnt);
      });
    }

    return () => {
      mounted = false;
    };
  }, [noteId, user?.id, isOwnNote]);

  const handleSelect = async (type: ReactionType) => {
    const next = await toggleUserReaction(noteId, type, user?.id);
    setActiveReaction(next);
  };

  const reactionOptions: ReactionType[] = ['moon', 'star', 'heart'];

  return (
    <div className="flex items-center justify-between gap-2 pt-2.5 pb-3 border-t border-white/5" data-testid="note-reactions">
      <div className="flex items-center gap-1.5" role="group" aria-label="Cảm xúc điều ước">
        {reactionOptions.map((type) => {
          const isSelected = activeReaction === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => handleSelect(type)}
              aria-label={REACTION_LABELS[type]}
              aria-pressed={isSelected}
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-base transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lavender',
                isSelected
                  ? 'bg-lavender/25 scale-110 shadow-glow border border-lavender/40'
                  : 'bg-white/5 hover:bg-white/10 hover:scale-105 opacity-80 hover:opacity-100 border border-transparent'
              )}
            >
              <span>{REACTION_GLYPHS[type]}</span>
            </button>
          );
        })}
      </div>

      {/* Author-only count if > 10 (§4.4) */}
      {isOwnNote && authorCount > 10 && (
        <span
          data-testid="author-reaction-count"
          className="text-[11px] font-sans text-star-glow bg-star-glow/10 border border-star-glow/20 px-2 py-0.5 rounded-full animate-fade-in"
        >
          {authorCount} cảm xúc ✨
        </span>
      )}
    </div>
  );
}
