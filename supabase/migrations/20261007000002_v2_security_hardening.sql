-- ==============================================================================
-- Gửi Vũ Trụ — v2.0 Security Hardening Migration
-- Supersedes previous triggers and policies to eliminate security audit findings:
-- 1. FIX 1: Prevent premature unsealing via UPDATE & enforce immutable unlock date on sealed notes
-- 2. FIX 2: Prevent premature unsealing via INSERT with future unlock_at
-- 3. FIX 5: Prevent report spoofing by revoking direct INSERT on public.reports
-- ==============================================================================

-- 1. Table-level BEFORE trigger on public.notes_base enforcing temporal seal integrity
CREATE OR REPLACE FUNCTION public.tr_check_note_seal_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- FIX 2: During INSERT, if unlock_at is in the future, enforce sealed status
  IF TG_OP = 'INSERT' THEN
    IF NEW.unlock_at > timezone('utc'::text, now()) THEN
      NEW.status := 'sealed';
    END IF;
    RETURN NEW;
  END IF;

  -- FIX 1: During UPDATE on notes_base:
  IF TG_OP = 'UPDATE' THEN
    -- Rule 1.1: Cannot alter unlock_at while note is sealed and currently locked
    IF OLD.status = 'sealed' AND OLD.unlock_at > timezone('utc'::text, now()) THEN
      IF NEW.unlock_at IS DISTINCT FROM OLD.unlock_at THEN
        RAISE EXCEPTION 'Cannot modify unlock date of a sealed note before unlock time';
      END IF;
    END IF;

    -- Rule 1.2: Cannot transition to 'opened' while unlock_at is in the future
    IF NEW.status = 'opened' AND NEW.unlock_at > timezone('utc'::text, now()) THEN
      RAISE EXCEPTION 'Cannot open a sealed note before unlock_at';
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_notes_base_seal_integrity ON public.notes_base;
CREATE TRIGGER tr_notes_base_seal_integrity
  BEFORE INSERT OR UPDATE ON public.notes_base
  FOR EACH ROW
  EXECUTE FUNCTION public.tr_check_note_seal_integrity();

-- 2. Hardened handle_notes_insert() for public.notes view
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
    IF public.check_bad_words(NEW.content) THEN
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

-- 3. Hardened handle_notes_update() for public.notes view
CREATE OR REPLACE FUNCTION public.handle_notes_update()
RETURNS TRIGGER AS $$
DECLARE
  v_user_pseudonym TEXT;
  v_current_note public.notes_base%ROWTYPE;
BEGIN
  -- Fetch current note to verify ownership and seal integrity
  SELECT * INTO v_current_note
  FROM public.notes_base
  WHERE id = OLD.id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Note not found';
  END IF;

  -- FIX 1: Reject any update altering unlock_at while note is sealed and unlock_at is in the future
  IF v_current_note.status = 'sealed' AND v_current_note.unlock_at > timezone('utc'::text, now()) THEN
    IF NEW.unlock_at IS NOT NULL AND NEW.unlock_at IS DISTINCT FROM v_current_note.unlock_at THEN
      RAISE EXCEPTION 'Cannot modify unlock date of a sealed note before unlock time';
    END IF;
  END IF;

  -- FIX 1: Reject any update attempting to transition status to 'opened' before unlock_at
  IF NEW.status = 'opened' AND COALESCE(NEW.unlock_at, v_current_note.unlock_at) > timezone('utc'::text, now()) THEN
    RAISE EXCEPTION 'Cannot open a sealed note before unlock_at';
  END IF;

  -- Pre-filter and Rate-limit checks if user transitions from private to public (§3.4, §3.5)
  IF NEW.visibility = 'public' AND OLD.visibility = 'private' THEN
    IF public.check_bad_words(COALESCE(NEW.content, v_current_note.content)) THEN
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

-- 4. FIX 5: Revoke direct INSERT on public.reports to eliminate spoofing vector
REVOKE INSERT ON public.reports FROM anon, authenticated;
DROP POLICY IF EXISTS "Anyone can submit a report" ON public.reports;

-- Ensure report_note RPC strictly binds reporter_user_id to auth.uid()
CREATE OR REPLACE FUNCTION public.report_note(
  p_note_id TEXT,
  p_reason TEXT DEFAULT 'Inappropriate content'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_note_owner UUID;
BEGIN
  -- Look up note owner
  SELECT user_id INTO v_note_owner
  FROM public.notes_base
  WHERE id = p_note_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Note not found';
  END IF;

  -- 1. A user cannot report their own note (§3.4.2)
  IF auth.uid() IS NOT NULL AND v_note_owner IS NOT NULL AND auth.uid() = v_note_owner THEN
    RAISE EXCEPTION 'Cannot report your own note';
  END IF;

  -- 2. A user cannot report the same note twice (§3.4.2)
  IF auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.reports
    WHERE note_id = p_note_id AND reporter_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Already reported';
  END IF;

  -- 3. Insert report record with verified auth.uid()
  INSERT INTO public.reports (note_id, reporter_user_id, reason, status)
  VALUES (p_note_id, auth.uid(), COALESCE(p_reason, 'Inappropriate content'), 'pending');

  -- 4. Immediately hide note pending review per §3.4
  UPDATE public.notes_base
  SET is_reported = TRUE,
      reported_at = timezone('utc'::text, now()),
      report_count = report_count + 1
  WHERE id = p_note_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.report_note(TEXT, TEXT) TO anon, authenticated;

-- 5. Revoke direct base table mutations from clients (must go through view)
REVOKE ALL ON public.notes_base FROM anon, authenticated;
