-- ==============================================================================
-- Gửi Vũ Trụ — v2.2 "Nhắc nhở & Nhà" (Reminders & Home)
-- Target: Supabase (PostgreSQL + RLS + RPC)
-- ==============================================================================

-- 1. Table for user notification preferences (§4.1)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  zalo_reminders_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  timezone                TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own preferences" ON public.user_preferences;
CREATE POLICY "Users can read own preferences"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;

-- 2. Add idempotency tracking columns to notes_base (§4.1, §4.2)
ALTER TABLE public.notes_base ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
ALTER TABLE public.notes_base ADD COLUMN IF NOT EXISTS zalo_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_notes_base_reminder_pending
  ON public.notes_base(unlock_at, reminder_sent_at)
  WHERE is_deleted = FALSE AND user_id IS NOT NULL;

-- 3. Reactions table (§4.4)
-- Strictly 3 options: 'moon', 'star', 'heart' (🌙, ⭐, 💗)
CREATE TABLE IF NOT EXISTS public.reactions (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  note_id        TEXT NOT NULL REFERENCES public.notes_base(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type  TEXT NOT NULL CHECK (reaction_type IN ('moon', 'star', 'heart')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_note_user_reaction UNIQUE (note_id, user_id)
);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Strict privacy: Reaction rows are NEVER readable by other users (§4.4, §7.5)
DROP POLICY IF EXISTS "Users can view own reaction" ON public.reactions;
CREATE POLICY "Users can view own reaction"
  ON public.reactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reaction" ON public.reactions;
CREATE POLICY "Users can insert own reaction"
  ON public.reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reaction" ON public.reactions;
CREATE POLICY "Users can update own reaction"
  ON public.reactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reaction" ON public.reactions;
CREATE POLICY "Users can delete own reaction"
  ON public.reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reactions TO authenticated;

-- 4. Secure RPC to get author reaction count (§4.4)
-- Constraint: Count is ONLY revealed to the note author IF total > 10.
-- Zero count revealed to public or for count <= 10.
CREATE OR REPLACE FUNCTION public.get_author_reaction_count(p_note_id TEXT)
RETURNS INT AS $$
DECLARE
  v_author_id UUID;
  v_count INT;
BEGIN
  SELECT user_id INTO v_author_id
  FROM public.notes_base
  WHERE id = p_note_id;

  -- Must be the note author
  IF v_author_id IS NULL OR auth.uid() <> v_author_id THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.reactions
  WHERE note_id = p_note_id;

  -- Only show if > 10 per §4.4
  IF v_count > 10 THEN
    RETURN v_count;
  END IF;

  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_author_reaction_count(TEXT) TO authenticated;

-- 5. RPC to toggle / set reaction (§4.4)
CREATE OR REPLACE FUNCTION public.toggle_reaction(
  p_note_id TEXT,
  p_reaction_type TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_existing TEXT;
  v_result TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to react';
  END IF;

  IF p_reaction_type NOT IN ('moon', 'star', 'heart') THEN
    RAISE EXCEPTION 'Invalid reaction type. Only moon, star, heart permitted';
  END IF;

  SELECT reaction_type INTO v_existing
  FROM public.reactions
  WHERE note_id = p_note_id AND user_id = auth.uid();

  IF v_existing = p_reaction_type THEN
    -- Click same reaction: remove it
    DELETE FROM public.reactions
    WHERE note_id = p_note_id AND user_id = auth.uid();
    v_result := NULL;
  ELSE
    -- Upsert new reaction
    INSERT INTO public.reactions (note_id, user_id, reaction_type, updated_at)
    VALUES (p_note_id, auth.uid(), p_reaction_type, timezone('utc'::text, now()))
    ON CONFLICT (note_id, user_id)
    DO UPDATE SET
      reaction_type = EXCLUDED.reaction_type,
      updated_at = timezone('utc'::text, now());
    v_result := p_reaction_type;
  END IF;

  RETURN jsonb_build_object('success', TRUE, 'reaction', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.toggle_reaction(TEXT, TEXT) TO authenticated;
