-- ==============================================================================
-- Gửi Vũ Trụ — v2.0 "Đám mây" Cloud Schema & RLS Policies
-- Target: Supabase (PostgreSQL + Auth + Row-Level Security)
-- ==============================================================================

-- 1. Base table storing notes
CREATE TABLE IF NOT EXISTS public.notes_base (
  id              TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id       TEXT,
  content         TEXT,
  prompt_id       TEXT,
  paper_theme     TEXT NOT NULL DEFAULT 'dem-sao',
  sticker_ids     TEXT[] NOT NULL DEFAULT '{}',
  unlock_at       TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'sealed' CHECK (status IN ('sealed', 'opened')),
  visibility      TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  opened_at       TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_notes_base_user_id ON public.notes_base(user_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_notes_base_unlock_at ON public.notes_base(unlock_at);

-- Enable Row Level Security on the base table
ALTER TABLE public.notes_base ENABLE ROW LEVEL SECURITY;

-- Base Table RLS Policies:
-- Users can only modify their own rows.
DROP POLICY IF EXISTS "Users can insert own notes" ON public.notes_base;
CREATE POLICY "Users can insert own notes"
  ON public.notes_base
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notes" ON public.notes_base;
CREATE POLICY "Users can update own notes"
  ON public.notes_base
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes_base;
CREATE POLICY "Users can delete own notes"
  ON public.notes_base
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Restrict direct SELECT on base table from anon & authenticated.
-- All client reads must go through the public.notes view to enforce §2.4.
REVOKE SELECT ON public.notes_base FROM anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.notes_base TO authenticated;

-- ==============================================================================
-- 2. Public view 'notes' with §2.4 Load-Bearing Security Rule:
-- Content returns NULL when status = 'sealed' AND unlock_at > now(),
-- for EVERY caller including the note's owner.
-- ==============================================================================
CREATE OR REPLACE VIEW public.notes WITH (security_invoker = false) AS
SELECT
  id,
  user_id,
  device_id,
  CASE
    WHEN status = 'sealed' AND unlock_at > timezone('utc'::text, now()) THEN NULL
    ELSE content
  END AS content,
  prompt_id,
  paper_theme,
  sticker_ids,
  unlock_at,
  status,
  visibility,
  created_at,
  opened_at,
  updated_at,
  is_deleted
FROM public.notes_base
WHERE auth.uid() = user_id AND is_deleted = FALSE;

-- Grant access on the view to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;

-- ==============================================================================
-- 3. INSTEAD OF triggers for full CRUD via PostgREST / Supabase JS Client
-- ==============================================================================

-- INSERT Trigger
CREATE OR REPLACE FUNCTION public.handle_notes_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notes_base (
    id,
    user_id,
    device_id,
    content,
    prompt_id,
    paper_theme,
    sticker_ids,
    unlock_at,
    status,
    visibility,
    created_at,
    opened_at,
    updated_at,
    is_deleted
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()::text),
    auth.uid(),
    NEW.device_id,
    NEW.content,
    NEW.prompt_id,
    COALESCE(NEW.paper_theme, 'dem-sao'),
    COALESCE(NEW.sticker_ids, '{}'),
    NEW.unlock_at,
    COALESCE(NEW.status, 'sealed'),
    COALESCE(NEW.visibility, 'private'),
    COALESCE(NEW.created_at, timezone('utc'::text, now())),
    NEW.opened_at,
    COALESCE(NEW.updated_at, timezone('utc'::text, now())),
    COALESCE(NEW.is_deleted, FALSE)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notes_insert ON public.notes;
CREATE TRIGGER tr_notes_insert
  INSTEAD OF INSERT ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_notes_insert();

-- UPDATE Trigger
CREATE OR REPLACE FUNCTION public.handle_notes_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.notes_base SET
    device_id = COALESCE(NEW.device_id, device_id),
    content = COALESCE(NEW.content, content),
    prompt_id = COALESCE(NEW.prompt_id, prompt_id),
    paper_theme = COALESCE(NEW.paper_theme, paper_theme),
    sticker_ids = COALESCE(NEW.sticker_ids, sticker_ids),
    unlock_at = COALESCE(NEW.unlock_at, unlock_at),
    status = COALESCE(NEW.status, status),
    visibility = COALESCE(NEW.visibility, visibility),
    opened_at = COALESCE(NEW.opened_at, opened_at),
    updated_at = timezone('utc'::text, now()),
    is_deleted = COALESCE(NEW.is_deleted, is_deleted)
  WHERE id = OLD.id AND user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notes_update ON public.notes;
CREATE TRIGGER tr_notes_update
  INSTEAD OF UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_notes_update();

-- DELETE Trigger (Soft Delete)
CREATE OR REPLACE FUNCTION public.handle_notes_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.notes_base
  SET is_deleted = TRUE,
      updated_at = timezone('utc'::text, now())
  WHERE id = OLD.id AND user_id = auth.uid();
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notes_delete ON public.notes;
CREATE TRIGGER tr_notes_delete
  INSTEAD OF DELETE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_notes_delete();

-- ==============================================================================
-- 4. RPC function to open an eligible note
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.open_note(target_note_id TEXT)
RETURNS public.notes AS $$
DECLARE
  v_result public.notes;
BEGIN
  UPDATE public.notes_base
  SET status = 'opened',
      opened_at = COALESCE(opened_at, timezone('utc'::text, now())),
      updated_at = timezone('utc'::text, now())
  WHERE id = target_note_id
    AND user_id = auth.uid()
    AND unlock_at <= timezone('utc'::text, now())
    AND is_deleted = FALSE;

  SELECT * INTO v_result FROM public.notes WHERE id = target_note_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
