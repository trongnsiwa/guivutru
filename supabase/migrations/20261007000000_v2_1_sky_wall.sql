-- ==============================================================================
-- Gửi Vũ Trụ — v2.1 "Bầu trời" Sky Wall Schema & Moderation
-- Target: Supabase (PostgreSQL + RLS + RPC)
-- ==============================================================================

-- 1. Table for stable user pseudonyms (§3.3)
CREATE TABLE IF NOT EXISTS public.user_pseudonyms (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudonym   TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_pseudonyms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own pseudonym" ON public.user_pseudonyms;
CREATE POLICY "Users can read own pseudonym"
  ON public.user_pseudonyms
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own pseudonym" ON public.user_pseudonyms;
CREATE POLICY "Users can insert own pseudonym"
  ON public.user_pseudonyms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.user_pseudonyms TO authenticated;

-- 2. Extend notes_base for sky wall (§3.2, §3.3, §3.4)
ALTER TABLE public.notes_base ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.notes_base ADD COLUMN IF NOT EXISTS seed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.notes_base ADD COLUMN IF NOT EXISTS pseudonym TEXT;
ALTER TABLE public.notes_base ADD COLUMN IF NOT EXISTS is_reported BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.notes_base ADD COLUMN IF NOT EXISTS reported_at TIMESTAMPTZ;
ALTER TABLE public.notes_base ADD COLUMN IF NOT EXISTS report_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.notes_base ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notes_base_user_or_seed'
  ) THEN
    ALTER TABLE public.notes_base ADD CONSTRAINT notes_base_user_or_seed CHECK (seed = TRUE OR user_id IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notes_base_visibility ON public.notes_base(visibility, is_reported) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_notes_base_pseudonym ON public.notes_base(pseudonym);

-- 3. Reports table (§3.4 Layer 2 & 3)
CREATE TABLE IF NOT EXISTS public.reports (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  note_id           TEXT NOT NULL REFERENCES public.notes_base(id) ON DELETE CASCADE,
  reporter_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason            TEXT NOT NULL DEFAULT 'Inappropriate content',
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a report" ON public.reports;
CREATE POLICY "Anyone can submit a report"
  ON public.reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

GRANT INSERT ON public.reports TO anon, authenticated;

-- 4. Admin allowlist table (§3.4 Layer 3)
CREATE TABLE IF NOT EXISTS public.admin_allowlist (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_allowlist
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Admins can view reports" ON public.reports;
CREATE POLICY "Admins can view reports"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports"
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, UPDATE ON public.reports TO authenticated;

-- 5. Rate Limiting Check Function (§3.5)
CREATE OR REPLACE FUNCTION public.check_public_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_day_count INT;
  v_week_count INT;
BEGIN
  -- 1 public note per user per day
  SELECT count(*) INTO v_day_count
  FROM public.notes_base
  WHERE user_id = p_user_id
    AND visibility = 'public'
    AND is_deleted = FALSE
    AND COALESCE(published_at, created_at) >= (timezone('utc'::text, now()) - interval '24 hours');

  IF v_day_count >= 1 THEN
    RETURN FALSE;
  END IF;

  -- 5 public notes per user per week
  SELECT count(*) INTO v_week_count
  FROM public.notes_base
  WHERE user_id = p_user_id
    AND visibility = 'public'
    AND is_deleted = FALSE
    AND COALESCE(published_at, created_at) >= (timezone('utc'::text, now()) - interval '7 days');

  IF v_week_count >= 5 THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_public_rate_limit(UUID) TO authenticated;

-- 6. Report RPC Function (§3.4 Layer 2)
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

  -- 3. Insert report record
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

-- 7. Admin moderation actions (§3.4 Layer 3)
CREATE OR REPLACE FUNCTION public.admin_moderate_note(
  p_note_id TEXT,
  p_action TEXT -- 'duyet_lai' (restore) or 'xoa' (delete)
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  IF p_action = 'duyet_lai' THEN
    -- Restore note to public sky
    UPDATE public.notes_base
    SET is_reported = FALSE
    WHERE id = p_note_id;

    UPDATE public.reports
    SET status = 'reviewed'
    WHERE note_id = p_note_id;

  ELSIF p_action = 'xoa' THEN
    -- Soft-delete note
    UPDATE public.notes_base
    SET is_deleted = TRUE,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_note_id;

    UPDATE public.reports
    SET status = 'reviewed'
    WHERE note_id = p_note_id;
  ELSE
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_moderate_note(TEXT, TEXT) TO authenticated;

-- 8. Public Sky Wall View (§3.2, §3.7)
-- Zero PII: explicitly excludes user_id, device_id, email!
-- Sealed content masked: returns NULL if status = 'sealed' AND unlock_at > now()
CREATE OR REPLACE VIEW public.sky_notes WITH (security_invoker = false) AS
SELECT
  id,
  pseudonym,
  paper_theme,
  sticker_ids,
  unlock_at,
  status,
  created_at,
  opened_at,
  seed,
  CASE
    WHEN status = 'sealed' AND unlock_at > timezone('utc'::text, now()) THEN NULL
    ELSE content
  END AS content
FROM public.notes_base
WHERE visibility = 'public'
  AND is_deleted = FALSE
  AND is_reported = FALSE;

GRANT SELECT ON public.sky_notes TO anon, authenticated;

-- 9. User's Own Sky Notes View for /bau-troi/cua-toi (§3.3)
CREATE OR REPLACE VIEW public.my_sky_notes WITH (security_invoker = false) AS
SELECT
  id,
  pseudonym,
  paper_theme,
  sticker_ids,
  unlock_at,
  status,
  created_at,
  opened_at,
  CASE
    WHEN status = 'sealed' AND unlock_at > timezone('utc'::text, now()) THEN NULL
    ELSE content
  END AS content,
  is_reported
FROM public.notes_base
WHERE user_id = auth.uid()
  AND visibility = 'public'
  AND is_deleted = FALSE;

GRANT SELECT ON public.my_sky_notes TO authenticated;

-- 10. Update notes view and triggers to support pseudonym & seed
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
  is_deleted,
  pseudonym,
  seed,
  published_at
FROM public.notes_base
WHERE auth.uid() = user_id AND is_deleted = FALSE;

-- 10. Content Pre-filter Bad Words Check (§3.4 Layer 1)
CREATE OR REPLACE FUNCTION public.check_bad_words(p_content TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_normalized TEXT;
BEGIN
  IF p_content IS NULL OR length(trim(p_content)) = 0 THEN
    RETURN FALSE;
  END IF;

  v_normalized := lower(p_content);
  -- Match Vietnamese & English profanities and evasion patterns
  IF v_normalized ~* '\m(dm|dmm|đm|đmm|vcl|vl|vkl|cl|clgt|cmm|cặc|cak|cac|lồn|lon|loz|lz|buồi|buoi|dái|đụ|địt|dit|djt|đĩ|điếm|fuck|fucking|phuck|fuk|shit|bitch|asshole|bastard|dick|pussy|cunt|whore|slut|motherfucker|nigger|faggot)\M'
     OR v_normalized ~* '(du má|đụ má|dit me|địt mẹ|djt me|con đĩ|gái đĩ|con di|chó đẻ|cho de|khốn nạn|khon nan|ngu lồn|mặt lồn|hãm lồn)'
     OR v_normalized ~* '(f\s*u\s*c\s*k|s\s*h\s*i\s*t|b\s*i\s*t\s*c\s*h|đ\s*m|d\s*m|v\s*l|c\s*l|c\s*ặ\s*c|l\s*ồ\s*n)' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.handle_notes_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_user_pseudonym TEXT;
BEGIN
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
    COALESCE(NEW.status, 'sealed'),
    COALESCE(NEW.visibility, 'private'),
    NEW.pseudonym,
    COALESCE(NEW.seed, FALSE),
    NEW.published_at,
    COALESCE(NEW.created_at, timezone('utc'::text, now())),
    NEW.opened_at,
    COALESCE(NEW.updated_at, timezone('utc'::text, now())),
    COALESCE(NEW.is_deleted, FALSE)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger & function for note update (including post-hoc publishing §3.1)
CREATE OR REPLACE FUNCTION public.handle_notes_update()
RETURNS TRIGGER AS $$
DECLARE
  v_user_pseudonym TEXT;
BEGIN
  -- Pre-filter and Rate-limit checks if user transitions from private to public (§3.4, §3.5)
  IF NEW.visibility = 'public' AND OLD.visibility = 'private' THEN
    -- Layer 1: Bad words pre-filter (§3.4)
    IF public.check_bad_words(COALESCE(NEW.content, (SELECT content FROM public.notes_base WHERE id = OLD.id))) THEN
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

-- 11. Curated Seed Notes (§3.2, ~20 notes)
INSERT INTO public.notes_base (
  id, user_id, device_id, content, prompt_id, paper_theme, sticker_ids, unlock_at, status, visibility, pseudonym, seed, created_at, opened_at, is_deleted
) VALUES
  ('seed_sky_01', NULL, 'seed', 'Mong một ngày thức dậy thấy lòng mình an yên như bầu trời sáng sớm.', NULL, 'dem-sao', ARRAY['🌙', '⭐'], '2023-11-15T00:00:00Z', 'opened', 'public', 'mèo-lười-07', TRUE, '2023-07-20T00:00:00Z', '2023-11-15T00:00:00Z', FALSE),
  ('seed_sky_02', NULL, 'seed', 'Ước cho mẹ luôn khỏe mạnh, mỗi ngày đều có nụ cười trên môi.', NULL, 'tim-mong', ARRAY['🌸'], '2024-01-12T00:00:00Z', 'opened', 'public', 'sao-băng-12', TRUE, '2023-09-15T00:00:00Z', '2024-01-12T00:00:00Z', FALSE),
  ('seed_sky_03', NULL, 'seed', 'Năm sau mình sẽ can đảm bước ra khỏi vùng an toàn.', NULL, 'bien', ARRAY['🫧', '🪐'], '2024-03-10T00:00:00Z', 'opened', 'public', 'mây-trôi-44', TRUE, '2023-11-01T00:00:00Z', '2024-03-10T00:00:00Z', FALSE),
  ('seed_sky_04', NULL, 'seed', 'Gửi vũ trụ: Mong người ấy cũng đang nhìn lên cùng một vầng trăng này.', NULL, 'dem-sao', ARRAY['💫'], '2024-04-01T00:00:00Z', 'opened', 'public', 'gió-bay-19', TRUE, '2023-12-01T00:00:00Z', '2024-04-01T00:00:00Z', FALSE),
  ('seed_sky_05', NULL, 'seed', 'Hy vọng bài thi tốt nghiệp điểm thật cao, vào được trường mình mơ ước.', NULL, 'hogn', ARRAY['🎀', '🍀'], '2024-04-20T00:00:00Z', 'opened', 'public', 'trăng-khuya-88', TRUE, '2024-01-01T00:00:00Z', '2024-04-20T00:00:00Z', FALSE),
  ('seed_sky_06', NULL, 'seed', 'Mong cho những vết thương cũ dần lành lại theo năm tháng.', NULL, 'giay-cu', ARRAY['🕯️'], '2024-05-15T00:00:00Z', 'opened', 'public', 'hạt-mưa-33', TRUE, '2024-01-20T00:00:00Z', '2024-05-15T00:00:00Z', FALSE),
  ('seed_sky_07', NULL, 'seed', 'Ước gì được cùng bạn thân đi Đà Lạt ngắm bình minh một lần nữa.', NULL, 'rung', ARRAY['🌸', '🍀'], '2024-06-01T00:00:00Z', 'opened', 'public', 'nắng-ấm-25', TRUE, '2024-02-10T00:00:00Z', '2024-06-01T00:00:00Z', FALSE),
  ('seed_sky_08', NULL, 'seed', 'Tự dặn lòng: Chậm một chút cũng không sao, miễn là không dừng lại.', NULL, 'dem-sao', ARRAY['⭐'], '2024-06-20T00:00:00Z', 'opened', 'public', 'sóng-xanh-56', TRUE, '2024-03-01T00:00:00Z', '2024-06-20T00:00:00Z', FALSE),
  ('seed_sky_09', NULL, 'seed', 'Mong tìm được công việc khiến mình mỉm cười mỗi sáng thức giấc.', NULL, 'bien', ARRAY['🪐'], '2024-07-01T00:00:00Z', 'opened', 'public', 'lá-rơi-04', TRUE, '2024-03-15T00:00:00Z', '2024-07-01T00:00:00Z', FALSE),
  ('seed_sky_10', NULL, 'seed', 'Cảm ơn bản thân vì đã kiên trì suốt những tháng ngày chông chênh vừa qua.', NULL, 'tim-mong', ARRAY['🌸', '🎀'], '2024-07-15T00:00:00Z', 'opened', 'public', 'chim-non-91', TRUE, '2024-04-01T00:00:00Z', '2024-07-15T00:00:00Z', FALSE),
  ('seed_sky_11', NULL, 'seed', 'Ước một góc ban công ngập nắng và những chậu hoa nhỏ nở rộ.', NULL, 'rung', ARRAY['🍀'], '2024-08-01T00:00:00Z', 'opened', 'public', 'cá-nhỏ-62', TRUE, '2024-04-20T00:00:00Z', '2024-08-01T00:00:00Z', FALSE),
  ('seed_sky_12', NULL, 'seed', 'Mong một người đủ dịu dàng bước đến và ôm lấy những mệt mỏi của mình.', NULL, 'hogn', ARRAY['🎀'], '2024-08-20T00:00:00Z', 'opened', 'public', 'đom-đóm-sớm-17', TRUE, '2024-05-01T00:00:00Z', '2024-08-20T00:00:00Z', FALSE),
  ('seed_sky_13', NULL, 'seed', 'Năm nay nhất định sẽ đi biển ngắm hoàng hôn đỏ rực một chiều mùa hạ.', NULL, 'bien', ARRAY['🫧'], '2024-09-01T00:00:00Z', 'opened', 'public', 'hoa-đêm-73', TRUE, '2024-05-15T00:00:00Z', '2024-09-01T00:00:00Z', FALSE),
  ('seed_sky_14', NULL, 'seed', 'Gửi chính mình: Đừng quá khắt khe, bạn đã làm rất tốt rồi.', NULL, 'giay-cu', ARRAY['🕯️', '💫'], '2024-09-15T00:00:00Z', 'opened', 'public', 'núi-hiền-50', TRUE, '2024-06-01T00:00:00Z', '2024-09-15T00:00:00Z', FALSE),
  ('seed_sky_15', NULL, 'seed', 'Ước gì gia đình mình luôn bình an, sum vầy bên mâm cơm ấm cúng.', NULL, 'dem-sao', ARRAY['🌙'], '2024-10-01T00:00:00Z', 'opened', 'public', 'mèo-vàng-39', TRUE, '2024-06-20T00:00:00Z', '2024-10-01T00:00:00Z', FALSE),
  ('seed_sky_16', NULL, 'seed', 'Mong một chuyến đi xa thật dài ngày để lòng nhẹ bớt những lo toan.', NULL, 'rung', ARRAY['🍀', '🪐'], '2024-10-15T00:00:00Z', 'opened', 'public', 'sao-hồng-84', TRUE, '2024-07-01T00:00:00Z', '2024-10-15T00:00:00Z', FALSE),
  ('seed_sky_17', NULL, 'seed', 'Năm sau sẽ học thêm một ngoại ngữ mới và tự tin trò chuyện.', NULL, 'tim-mong', ARRAY['🌸'], '2024-11-01T00:00:00Z', 'opened', 'public', 'mây-ấm-28', TRUE, '2024-07-15T00:00:00Z', '2024-11-01T00:00:00Z', FALSE),
  ('seed_sky_18', NULL, 'seed', 'Hy vọng dự án ấp ủ bấy lâu sẽ gặt hái kết quả ngọt ngào.', NULL, 'dem-sao', ARRAY['⭐', '💫'], '2024-11-20T00:00:00Z', 'opened', 'public', 'gió-mưa-66', TRUE, '2024-08-01T00:00:00Z', '2024-11-20T00:00:00Z', FALSE),
  ('seed_sky_19', NULL, 'seed', 'Mong cho những ai đang cô đơn tối nay đều tìm thấy một vì sao an ủi.', NULL, 'bien', ARRAY['🫧', '🌙'], '2024-12-01T00:00:00Z', 'opened', 'public', 'trăng-non-15', TRUE, '2024-08-15T00:00:00Z', '2024-12-01T00:00:00Z', FALSE),
  ('seed_sky_20', NULL, 'seed', 'Ước một ly trà ấm, một cuốn sách hay và một buổi tối không bận lòng.', NULL, 'giay-cu', ARRAY['🕯️'], '2024-12-15T00:00:00Z', 'opened', 'public', 'nắng-sớm-99', TRUE, '2024-09-01T00:00:00Z', '2024-12-15T00:00:00Z', FALSE),
  ('seed_sky_21', NULL, 'seed', 'Điều ước này được giữ kín trong tim cho đến năm 2030.', NULL, 'dem-sao', ARRAY['🌙', '⭐'], '2030-01-01T00:00:00Z', 'sealed', 'public', 'đom-đóm-đêm-01', TRUE, '2024-10-01T00:00:00Z', NULL, FALSE)
ON CONFLICT (id) DO NOTHING;
