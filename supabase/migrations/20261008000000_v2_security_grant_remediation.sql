-- ==============================================================================
-- Gửi Vũ Trụ — v2.0 Security Grant Remediation Migration
-- Additive migration: Revokes lingering default Supabase grants on public tables
-- ensuring no grant exists that is not strictly justified by an active RLS policy.
-- ==============================================================================

-- 1. Table: public.notes_base
-- Re-affirm total revocation of direct base table access for anon and authenticated
REVOKE ALL ON public.notes_base FROM anon, authenticated;

-- 2. Table: public.user_pseudonyms
-- Only authenticated users may SELECT and INSERT their own pseudonym.
-- Pseudonyms are immutable (no UPDATE/DELETE). Anon has zero access.
REVOKE ALL ON public.user_pseudonyms FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.user_pseudonyms FROM authenticated;
GRANT SELECT, INSERT ON public.user_pseudonyms TO authenticated;

-- 3. Table: public.reports
-- Submissions happen strictly via public.report_note RPC (SECURITY DEFINER).
-- Direct INSERT, DELETE, etc. are revoked from all client roles.
-- Only authenticated admins can SELECT and UPDATE reports via is_admin() RLS policy.
REVOKE ALL ON public.reports FROM anon;
REVOKE INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.reports FROM authenticated;
GRANT SELECT, UPDATE ON public.reports TO authenticated;

-- 4. Table: public.admin_allowlist
-- Access is strictly internal via public.is_admin() SECURITY DEFINER function.
-- Revoke all permissions from both anon and authenticated to seal the table completely.
REVOKE ALL ON public.admin_allowlist FROM anon, authenticated;

-- 5. Table: public.user_preferences
-- Authenticated users manage their own preferences (SELECT, INSERT, UPDATE).
-- Deletions are forbidden (preferences persist until account deletion cascade).
-- Anon has zero access.
REVOKE ALL ON public.user_preferences FROM anon;
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.user_preferences FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;

-- 6. Table: public.reactions
-- Authenticated users manage their own reactions (SELECT, INSERT, UPDATE, DELETE).
-- Anon has zero access.
REVOKE ALL ON public.reactions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reactions TO authenticated;

-- 7. Views Hardening:
-- Ensure views do not inherit unintended mutation grants
REVOKE ALL ON public.notes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;

REVOKE ALL ON public.my_sky_notes FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.my_sky_notes FROM authenticated;
GRANT SELECT ON public.my_sky_notes TO authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.sky_notes FROM anon, authenticated;
GRANT SELECT ON public.sky_notes TO anon, authenticated;
