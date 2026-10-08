-- ==============================================================================
-- Gửi Vũ Trụ — v2.0 Voice Notes (Audio Clips) Storage & RLS Hardening
-- Bucket: 'note-audio' (Private)
-- Path: {user_id}/{note_id}.{ext}
-- ==============================================================================

-- 1. Extend notes_base and notes view with has_audio and audio_path
ALTER TABLE public.notes_base ADD COLUMN IF NOT EXISTS has_audio BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.notes_base ADD COLUMN IF NOT EXISTS audio_path TEXT;

CREATE INDEX IF NOT EXISTS idx_notes_base_has_audio ON public.notes_base(has_audio) WHERE has_audio = TRUE;

-- Update notes view
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
  pseudonym,
  has_audio,
  audio_path,
  seed,
  published_at,
  created_at,
  opened_at,
  updated_at,
  is_deleted
FROM public.notes_base
WHERE auth.uid() = user_id AND is_deleted = FALSE;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;

-- Update handle_notes_insert() to copy has_audio and audio_path
CREATE OR REPLACE FUNCTION public.handle_notes_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_user_pseudonym TEXT;
  v_forced_status TEXT;
BEGIN
  -- FIX 2: Server-side status enforcement - never trust client status on future unlock dates
  IF NEW.unlock_at > timezone('utc'::text, now()) THEN
    v_forced_status := 'sealed';
  ELSE
    v_forced_status := COALESCE(NEW.status, 'sealed');
  END IF;

  -- Pre-filter and Rate-limit checks if user is publishing publicly (§3.4, §3.5)
  IF NEW.visibility = 'public' AND COALESCE(NEW.seed, FALSE) = FALSE THEN
    -- Layer 1: Bad words pre-filter (§3.4)
    IF NEW.content IS NOT NULL AND public.check_bad_words(NEW.content) THEN
      RAISE EXCEPTION 'Viết lại nhẹ nhàng hơn nha, vũ trụ nghe hết á 🌙';
    END IF;

    -- Rate-limit check (§3.5)
    IF NOT public.check_public_rate_limit(auth.uid()) THEN
      RAISE EXCEPTION 'Bạn đã gửi hôm nay rồi, mai quay lại nha 🌙';
    END IF;

    -- Look up or assign stable pseudonym
    SELECT pseudonym INTO v_user_pseudonym
    FROM public.user_pseudonyms
    WHERE user_id = auth.uid();

    IF v_user_pseudonym IS NOT NULL THEN
      NEW.pseudonym := v_user_pseudonym;
    END IF;

    NEW.published_at := timezone('utc'::text, now());
  END IF;

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
    pseudonym,
    has_audio,
    audio_path,
    seed,
    published_at,
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
    v_forced_status,
    COALESCE(NEW.visibility, 'private'),
    NEW.pseudonym,
    COALESCE(NEW.has_audio, FALSE),
    NEW.audio_path,
    COALESCE(NEW.seed, FALSE),
    NEW.published_at,
    COALESCE(NEW.created_at, timezone('utc'::text, now())),
    CASE WHEN v_forced_status = 'opened' THEN COALESCE(NEW.opened_at, timezone('utc'::text, now())) ELSE NULL END,
    COALESCE(NEW.updated_at, timezone('utc'::text, now())),
    COALESCE(NEW.is_deleted, FALSE)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_notes_update() to copy has_audio and audio_path
CREATE OR REPLACE FUNCTION public.handle_notes_update()
RETURNS TRIGGER AS $$
DECLARE
  v_user_pseudonym TEXT;
  v_current_note public.notes_base%ROWTYPE;
BEGIN
  SELECT * INTO v_current_note
  FROM public.notes_base
  WHERE id = OLD.id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Note not found';
  END IF;

  -- Reject any update altering unlock_at while note is sealed and unlock_at is in the future
  IF v_current_note.status = 'sealed' AND v_current_note.unlock_at > timezone('utc'::text, now()) THEN
    IF NEW.unlock_at IS NOT NULL AND NEW.unlock_at IS DISTINCT FROM v_current_note.unlock_at THEN
      RAISE EXCEPTION 'Cannot modify unlock date of a sealed note before unlock time';
    END IF;
  END IF;

  -- Reject any update attempting to transition status to 'opened' before unlock_at
  IF NEW.status = 'opened' AND COALESCE(NEW.unlock_at, v_current_note.unlock_at) > timezone('utc'::text, now()) THEN
    RAISE EXCEPTION 'Cannot open a sealed note before unlock_at';
  END IF;

  -- Pre-filter and Rate-limit checks if user transitions from private to public (§3.4, §3.5)
  IF NEW.visibility = 'public' AND OLD.visibility = 'private' THEN
    IF COALESCE(NEW.content, v_current_note.content) IS NOT NULL AND public.check_bad_words(COALESCE(NEW.content, v_current_note.content)) THEN
      RAISE EXCEPTION 'Viết lại nhẹ nhàng hơn nha, vũ trụ nghe hết á 🌙';
    END IF;

    IF NOT public.check_public_rate_limit(auth.uid()) THEN
      RAISE EXCEPTION 'Bạn đã gửi hôm nay rồi, mai quay lại nha 🌙';
    END IF;

    SELECT pseudonym INTO v_user_pseudonym
    FROM public.user_pseudonyms
    WHERE user_id = auth.uid();

    IF v_user_pseudonym IS NOT NULL THEN
      NEW.pseudonym := v_user_pseudonym;
    END IF;

    NEW.published_at := timezone('utc'::text, now());
  END IF;

  UPDATE public.notes_base SET
    device_id = COALESCE(NEW.device_id, device_id),
    content = COALESCE(NEW.content, content),
    prompt_id = COALESCE(NEW.prompt_id, prompt_id),
    paper_theme = COALESCE(NEW.paper_theme, paper_theme),
    sticker_ids = COALESCE(NEW.sticker_ids, sticker_ids),
    unlock_at = COALESCE(NEW.unlock_at, unlock_at),
    status = COALESCE(NEW.status, status),
    visibility = COALESCE(NEW.visibility, visibility),
    pseudonym = COALESCE(NEW.pseudonym, pseudonym, (SELECT pseudonym FROM public.user_pseudonyms WHERE user_id = auth.uid())),
    has_audio = COALESCE(NEW.has_audio, has_audio),
    audio_path = COALESCE(NEW.audio_path, audio_path),
    published_at = COALESCE(NEW.published_at, published_at),
    opened_at = CASE
      WHEN COALESCE(NEW.status, status) = 'opened' THEN COALESCE(NEW.opened_at, opened_at, timezone('utc'::text, now()))
      ELSE opened_at
    END,
    updated_at = timezone('utc'::text, now()),
    is_deleted = COALESCE(NEW.is_deleted, is_deleted)
  WHERE id = OLD.id AND user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create private storage bucket 'note-audio'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'note-audio',
  'note-audio',
  FALSE,
  5242880, -- 5MB limit (30s audio is ~300KB-800KB)
  ARRAY['audio/webm', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/x-m4a']
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['audio/webm', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/x-m4a'];

-- 3. Storage RLS Policies for 'note-audio'
-- Path convention: {user_id}/{note_id}.{ext}
-- Helper extractors:
-- (storage.foldername(name))[1] = user_id
-- (regexp_match(storage.filename(name), '^([^\.]+)'))[1] = note_id

-- INSERT Policy: Authenticated user can upload audio for their own note to {user_id}/{note_id}.{ext}
DROP POLICY IF EXISTS "Users can upload own note audio" ON storage.objects;
CREATE POLICY "Users can upload own note audio"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'note-audio' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    EXISTS (
      SELECT 1 FROM public.notes_base nb
      WHERE nb.id = (regexp_match(storage.filename(name), '^([^\.]+)'))[1]
        AND nb.user_id = auth.uid()
        AND nb.is_deleted = FALSE
    )
  );

-- UPDATE Policy: Authenticated user can update audio for their own note
DROP POLICY IF EXISTS "Users can update own note audio" ON storage.objects;
CREATE POLICY "Users can update own note audio"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'note-audio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'note-audio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- DELETE Policy: Authenticated user can delete their own note audio
DROP POLICY IF EXISTS "Users can delete own note audio" ON storage.objects;
CREATE POLICY "Users can delete own note audio"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'note-audio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- SELECT Policy: LOAD-BEARING RULE for note audio:
-- User can only read their own audio, AND ONLY WHEN unlock_at <= now()!
-- If the note is sealed and unlock_at > now(), storage.objects SELECT returns ZERO rows.
DROP POLICY IF EXISTS "Users can only read unlocked own note audio" ON storage.objects;
CREATE POLICY "Users can only read unlocked own note audio"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'note-audio' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    EXISTS (
      SELECT 1 FROM public.notes_base nb
      WHERE nb.id = (regexp_match(storage.filename(name), '^([^\.]+)'))[1]
        AND nb.user_id = auth.uid()
        AND nb.unlock_at <= timezone('utc'::text, now())
        AND nb.is_deleted = FALSE
    )
  );
