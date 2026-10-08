# 🌌 GỬI VŨ TRỤ — Landing Refactor: "The Sky Is Real"

> Save as `LANDING.md` in the repo root. Feed alongside `SPEC.md`, `HANDOFF.md`, `POLISH.md`, and `V2.md`.
>
> This is a **planning artifact**. No code is written until §12 (Open Decisions) is signed off.

---

## 0. Purpose & Scope

The homepage is the last surface in the product that still behaves like a single-player app. Every other route now participates in the shared cosmos: `/bau-troi` renders live anonymous stars, `/toi` renders a personal constellation, `/note/:id` enforces the sealed-content rule. `/` alone still shows three hardcoded mock cards and a text link.

**Goal:** make `/` feel like a window onto a living sky, without adding a feature, a dependency, or a moderation surface.

**In scope:** a live, tap-through preview of the public wall; an "sắp mở" anticipation strip; a live star count; a promoted sky CTA card. Plus the shared-helper extraction needed to do it without duplicating the star-position math.

**Out of scope (do not build):** reactions on the landing page, inline UGC text on the landing DOM, realtime/live-push updates, auto-rotating carousels, presence indicators, new npm dependencies, new DB migrations (unless §12 D4 is approved).

---

## 1. Current State — Evidence Read

| Surface      | File                                                   | Behavior today                                                                                                                                                                                                        |
| ------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landing      | `src/pages/Landing.tsx`                                | `React.memo`. Hero → CTA → `MockNoteStack` (3 static cards) → nostalgia strip (private notes only) → 3-steps. Sky is a plain text link.                                                                               |
| Mock stack   | `src/components/wish/MockNoteStack.tsx`                | 3 layered `NotePaper`s, front card floats via CSS `float-gentle`. Content hardcoded.                                                                                                                                  |
| Public wall  | `src/pages/Sky/SkyCanvas.tsx`                          | Real stars, deterministic hash positions, framer-motion `motion.button` per star, hover tooltip, legend. Used by `/bau-troi` and `/bau-troi/cua-toi`.                                                                 |
| Wall data    | `src/lib/sky.ts`                                       | `fetchSkyNotes(filter)` — filters `'moi-nhat' \| 'sap-mo' \| 'ngau-nhien'`. `.limit(100)`. Falls back to `SEEDED_SKY_NOTES` (21 entries) when Supabase is unconfigured, errors, or returns 0 rows.                    |
| Note modal   | `src/pages/Sky/SkyNoteModal.tsx`                       | Sealed → `"Điều ước này chưa đến ngày mở 🔒"`. Opened → content. Includes reactions + report flow.                                                                                                                    |
| DB view      | `supabase/migrations/20261007000000_v2_1_sky_wall.sql` | `public.sky_notes` exposes `id, pseudonym, paper_theme, sticker_ids, unlock_at, status, created_at, opened_at, seed, content` with content masked when sealed. **Zero PII.** `GRANT SELECT … TO anon, authenticated`. |
| Personal map | `src/components/wish/ConstellationView.tsx`            | 340px square, `/toi` toggle via `usePrefs` (`gvt.prefs`, `version: 1`, `toiView`).                                                                                                                                    |

**The gap:** the landing page has access to all of this and uses none of it.

**Why it matters:** `/` is the only page in the sitemap (`public/sitemap.xml`) that carries social proof, and `robots.txt` explicitly `Disallow`s `/bau-troi`. If the shared cosmos is going to sell the product, it has to do it on `/`.

---

## 2. Locked Constraints & Guardrails

Inherited from `HANDOFF.md` §2, `AGENTS.md`, `POLISH.md` §2, and `V2.md` §7. Repeated here because every item below is load-bearing for this pass.

| #   | Constraint                                                    | Consequence for this work                                                                                                                                                       |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Sealed content never enters the DOM** — not even hidden.    | Preview renders star metadata only. Sealed stars show pseudonym + theme + countdown. Content only inside `SkyNoteModal`, only when `status = 'opened'` or `unlock_at <= now()`. |
| 2   | **Lighthouse mobile Performance ≥ 90 on `/` is a hard gate.** | Preview mounts _after_ LCP via idle callback. Reserved-height skeleton → zero CLS. No framer-motion per star. No second full-bleed canvas.                                      |
| 3   | **Only animate `transform` + `opacity`.**                     | Preview twinkle = opacity/scale only. No layout properties.                                                                                                                     |
| 4   | **`prefers-reduced-motion` on every animation.**              | Static star field, no twinkle, no entrance drift, no strip entrance.                                                                                                            |
| 5   | **No hardcoded hex in components.**                           | Reuse `PAPER_THEMES[].borderHex` via CSS vars, as `SkyCanvas` already does.                                                                                                     |
| 6   | **No PII on public notes.**                                   | Already enforced by the `sky_notes` view. Do not widen the select list.                                                                                                         |
| 7   | **All user-facing copy is Vietnamese, `mình/bạn` tone.**      | No `tôi`, `quý khách`, `người dùng`, `Vui lòng`.                                                                                                                                |
| 8   | **No new npm dependencies without explicit approval.**        | Everything needed already ships.                                                                                                                                                |
| 9   | **Zustand selectors return primitives or use `useShallow`.**  | Landing already does this; keep it.                                                                                                                                             |
| 10  | **Route transitions: opacity only, ≤200ms.**                  | Unchanged — the preview is inside a route, not a route itself.                                                                                                                  |
| 11  | **Moderation protects the homepage.**                         | Posture A (§12 D1) keeps UGC text out of `/`. Reported + deleted notes are already excluded by the view.                                                                        |

---

## 3. Non-Negotiable Rules For This Pass

1. **Metadata in, content out.** The landing page never renders note text, sealed or opened. Tap-through only.
2. **Fail silent, never fail fake.** If `fetchSkyNotes` or the count query fails, hide the module. Never render a placeholder number, never render a stale count as if live.
3. **One canvas rule.** `StarField` remains the only `fixed inset-0` canvas. The preview is a contained, bounded box.
4. **Reserve the height before you fill it.** Every async module ships a skeleton with the exact final height.
5. **Don't regress the shipped wall.** `SkyCanvas` is live on `/bau-troi` and `/bau-troi/cua-toi`. Any shared-code extraction must be verified on both routes afterward.
6. **Reuse the existing modal.** `SkyNoteModal` already enforces the sealed mask, own-note detection, reaction gating, and the report flow. Do not fork it.
7. **Don't commit or push.** Leave the tree dirty for human review.

---

## 4. The Recommended Bundle — Bundle A

**Name:** "The sky is real."
**Estimated effort:** ~1 day solo.
**Deliverable:** one report covering A1–A4. Do not split.

### Target layout

```
┌──────────────────────────────────────┐
│  🌙  (float + glow pulse, unchanged)  │
│                                       │
│       Vũ trụ ơi,                      │  ← Ingrid Darling, unchanged
│       mình muốn…                      │
│                                       │
│   Note lại điều mình muốn. Niêm       │
│   phong. Rồi để vũ trụ lo phần còn    │
│   lại.                                │
│                                       │
│      [ Viết điều ước ✨ ]              │  ← primary CTA, unchanged
│                                       │
│  ┌─────────────────────────────────┐  │
│  │ 🌌  Bầu trời điều ước            │  │  ← A4: card, not text link
│  │ 1.284 vì sao · Xem bầu trời →   │  │  ← A3: live count
│  └─────────────────────────────────┘  │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │   ·    ✦        ·               │  │  ← A1: LiveSkyPreview
│  │  ·   ·    ✦   ·    ·            │  │     (replaces MockNoteStack)
│  │      ·    ·        ✦            │  │     tap star → SkyNoteModal
│  │                                 │  │
│  │  ✦ Mới <24h   🔒 Chưa mở        │  │     legend
│  └─────────────────────────────────┘  │
│                                       │
│  Sắp mở                               │  ← A2: UpcomingStrip
│  ┌─────────────────────────────────┐  │
│  │ ⏳  3 ngày nữa · Đêm sao         │  │
│  │ ⏳ 11 ngày nữa · Biển đêm        │  │
│  └─────────────────────────────────┘  │
│                                       │
│      3 bước gửi điều ước              │  ← unchanged
│       1 ── 2 ── 3                     │
└──────────────────────────────────────┘
```

### Section order rationale

The funnel stays intact: hero → primary CTA → social proof → anticipation → how-it-works. The sky modules sit **below** the primary CTA, so they never compete with conversion. The sky card (A4) is a secondary path, not a replacement.

---

### A1. `LiveSkyPreview` — live wall preview

**Replaces:** `MockNoteStack` on `/`.
**New file:** `src/components/wish/LiveSkyPreview.tsx`.

**Behavior**

- Fetches via existing `fetchSkyNotes('moi-nhat')`.
- Renders up to **12 stars** (see selection rule below) in a contained box, deterministic positions from the same hash as `SkyCanvas`.
- Tap/click/keyboard-activate a star → opens the **existing** `SkyNoteModal` inline. No navigation.
- Sealed stars: dimmer, smaller, no glow ring, locked styling. Opened: brighter, glow if `<24h`.
- Hover (desktop) → pseudonym tooltip, matching `SkyCanvas`.
- Legend row at the bottom: `✦ Mới <24h` · `🔒 Chưa mở`, plus `"Chạm sao để xem"`.
- Footer link below the box: `Xem toàn bộ bầu trời →` → `/bau-troi`.

**Star selection rule (deterministic, pure, testable)**

```
pickPreviewNotes(notes, limit = 12):
  1. sort by createdAt desc
  2. take the first `limit`
  3. if the result contains zero sealed notes AND the source contains at least
     one sealed note, swap the last slot for the most recent sealed note
```

This guarantees the 🔒 affordance is always visible when the wall has sealed notes, without randomizing (so the preview is stable across reloads — same property as `ConstellationView`).

**Deliberate differences from `SkyCanvas`**

| Aspect              | `SkyCanvas` (wall)                                | `LiveSkyPreview` (landing)                                         |
| ------------------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| Star element        | `motion.button` (framer-motion)                   | Plain `<button>`, CSS twinkle only                                 |
| Size                | `aspect-[4/3] sm:aspect-[16/10]`, `max-h-[580px]` | `aspect-[4/3]`, `max-h-[320px]`                                    |
| Star count          | All notes                                         | Capped at 12                                                       |
| Constellation lines | Yes                                               | No — too dense at this size, and adds SVG work on the indexed page |
| Hover tooltip       | Yes                                               | Yes (pseudonym only, no "Mới hôm nay" badge)                       |
| Mount               | On route load                                     | After LCP, via idle callback                                       |

**Implementation notes**

- Do **not** import `SkyCanvas`. It lives in the Sky route chunk and pulls framer-motion into the landing chunk. Write a lean component.
- Twinkle: one `@keyframes` in `src/styles/globals.css`, driven by a per-star `--star-delay` / `--star-duration` CSS var. Compositor-only.
- Accessibility: keep the `<ul role="list">` + `<li><button>` structure with `aria-label` — at 12 stars the tab order is acceptable. Each label: `Điều ước ẩn danh #N, [đang niêm phong | đã mở], mở vào [date]`. Pseudonyms are **not** required in the label (they add noise); they're available in the tooltip and modal.
- Reduced motion: no twinkle, no glow pulse. Static positions and brightness still convey sealed vs opened.

---

### A2. `UpcomingStrip` — anticipation module

**New file:** `src/components/wish/UpcomingStrip.tsx`.

**Behavior**

- Calls `fetchSkyNotes('sap-mo')` — the filter already exists and already sorts by `unlockAt` ascending, sealed-only, future-only.
- Renders up to **3** rows: `⏳ {N} ngày nữa · {paperTheme.name}`.
- Each row navigates to `/bau-troi` (not `/note/:id` — the note is sealed and belongs to someone else; the wall is the correct destination).
- If `< 1` upcoming note → render nothing. No reserved space, no empty state.

**Copy**

- Section heading: `Sắp mở`
- Row: `3 ngày nữa · Đêm sao`
- Sub-line (optional, static): `Một điều ước của ai đó sắp đến ngày mở.`

**Known quirk to handle:** `SEEDED_SKY_NOTES` contains `seed_sky_21_sealed` whose `unlockAt` is computed as `Date.now() + 86400000 * 30` at **module evaluation**. In the seed-fallback path this row will always read "30 ngày nữa". Acceptable, but flag it in the report.

**Reduced motion:** static, no entrance stagger.

---

### A3. Live star count

**Where:** inside the A4 sky card.

**Copy:** `{count} vì sao đang chờ` — one number, one query.

**Query**

```ts
supabase.from('sky_notes').select('*', { count: 'exact', head: true });
```

This is a `HEAD` request — no rows transferred. It works logged-out because `sky_notes` is granted to `anon`. No migration needed.

**Fallback ladder**

1. Count resolves → show `{count} vì sao đang chờ`.
2. Count fails, times out (>2s), or Supabase is unconfigured → **hide the counter entirely** and render the card without it: `Bầu trời điều ước — Xem bầu trời →`.
3. Never show `0 vì sao` unless the count genuinely resolved to 0.

**Deliberately excluded from v1:** the `· 96 mở hôm nay` half. It needs a second filtered count query for marginal gain. See §10 O3.

---

### A4. Promoted sky CTA card

**Replaces:** the plain text link `<Link to="/bau-troi">Bầu trời điều ước 🌙</Link>` in `src/pages/Landing.tsx`.

**Shape:** bordered card, `rounded-2xl`, `bg-bg-soft/70`, `border-lavender/30`, left icon `🌌`, title `Bầu trời điều ước`, subtitle line = A3 count, right chevron. Full-width within the existing `max-w-xs` CTA column. Static — no animation beyond the standard hover treatment.

**Why a card:** the current text link is invisible at a glance. A card with a live number teaches the mechanic and gives the sky a fair shot at the click.

---

## 5. Implementation Details

### New files

| Path                                     | Purpose                                                                    |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| `src/components/wish/LiveSkyPreview.tsx` | A1. Contained, capped, CSS-twinkle star preview with tap-through.          |
| `src/components/wish/UpcomingStrip.tsx`  | A2. Top-3 soonest-unlocking public notes.                                  |
| `src/components/wish/SkyCtaCard.tsx`     | A3 + A4. Card with live count and graceful degradation.                    |
| `tests/landing-sky.test.ts`              | Pure-logic tests: `pickPreviewNotes`, `pickUpcomingNotes`, count fallback. |

### Modified files

| Path                          | Change                                                                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/Landing.tsx`       | Swap `MockNoteStack` → `LiveSkyPreview`; swap text link → `SkyCtaCard`; insert `UpcomingStrip`; add idle-mount gate and reserved-height skeletons. |
| `src/lib/sky.ts`              | Add `fetchSkyCount(): Promise<number \| null>` (returns `null` on any failure). Add pure helpers `pickPreviewNotes` and `pickUpcomingNotes`.       |
| `src/styles/globals.css`      | Add one `@keyframes star-twinkle` for the preview, respecting reduced motion via the existing pattern.                                             |
| `tests/sky-centering.test.ts` | **Optional but recommended** — switch from inline re-implementation of `mixHash` to importing the extracted helper (see risk R1).                  |

### Pure helpers to extract (testable without DOM)

```ts
// src/lib/sky.ts

export function pickPreviewNotes(notes: SkyNote[], limit = 12): SkyNote[];
export function pickUpcomingNotes(notes: SkyNote[], nowMs: number, limit = 3): SkyNote[];
export function formatCountdownDays(unlockAt: number, nowMs: number): string; // "3 ngày nữa"
```

The existing test suite runs on Node with `--experimental-strip-types` and no DOM (`tests/sky.test.ts`, `tests/sky-centering.test.ts`). Keeping the interesting logic in pure functions is what makes A1 and A2 verifiable.

### Mount gating (the perf-critical part)

```tsx
// Landing.tsx — sketch
const [skyReady, setSkyReady] = useState(false);

useEffect(() => {
  const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(() => setSkyReady(true));
    return () => (window as any).cancelIdleCallback?.(id);
  }
  const t = setTimeout(() => setSkyReady(true), 200);
  return () => clearTimeout(t);
}, []);
```

Until `skyReady`, render a skeleton with the **exact final height**:

```tsx
<div
  className='w-full max-w-xs mx-auto aspect-[4/3] max-h-[320px] rounded-3xl border border-border-soft/40 bg-bg-soft/20'
  aria-hidden='true'
/>
```

This is what keeps CLS at zero. Do not skip it.

### Reduced motion

Resolve once via `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and pass down, or reuse whatever pattern `CursorSparkles` uses. The preview renders static positions either way — only the twinkle and the entrance fade are gated.

---

## 6. Prerequisites — Verify Before Starting

Do not begin until every row is confirmed.

| #   | Check                                                                     | How to verify                                                | If it fails                               |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------- |
| 1   | Baseline Lighthouse mobile recorded for `/`                               | `scratch/baseline-landing-lighthouse.json`, median of 3 runs | Record it first. No exceptions.           |
| 2   | `sky_notes` is `SELECT`-granted to `anon`                                 | Query `sky_notes` from a logged-out client                   | Fix grants before building A3             |
| 3   | `fetchSkyNotes()` returns ≥1 note logged-out on prod                      | Network tab on `/bau-troi`                                   | Decide seed-fallback posture (§12 D2)     |
| 4   | `/bau-troi` still `Disallow`ed in `robots.txt`, absent from `sitemap.xml` | Read both files                                              | Do not proceed — fix SEO posture first    |
| 5   | `SkyNoteModal` renders correctly when opened outside `/bau-troi`          | Manual check                                                 | Refactor the modal's props, don't fork it |
| 6   | `SkyCanvas` renders unchanged on `/bau-troi` and `/bau-troi/cua-toi`      | Visual + console check                                       | Snapshot before you touch anything shared |
| 7   | `npm run build` and `npm test` pass clean on current `main`               | Run both                                                     | Fix first                                 |

---

## 7. Acceptance Criteria

**A1 — LiveSkyPreview**

- [ ] `/` renders real stars from `fetchSkyNotes`, not `MockNoteStack`.
- [ ] Capped at 12 stars; same `note.id` → same position as on `/bau-troi`.
- [ ] Tapping a star opens `SkyNoteModal` inline; no navigation.
- [ ] A sealed star never exposes content — in the DOM, the tooltip, or the modal.
- [ ] Keyboard: every star is reachable and activatable; labels are descriptive.
- [ ] Reduced motion → static field, no twinkle.
- [ ] `MockNoteStack` still renders when `fetchSkyNotes` returns `[]` or throws.
- [ ] `MockNoteStack.tsx` is **not** deleted (still the fallback).

**A2 — UpcomingStrip**

- [ ] Shows up to 3 soonest-unlocking sealed public notes.
- [ ] Order is `unlockAt` ascending.
- [ ] Zero matches → nothing rendered, zero reserved height.
- [ ] Countdown strings are correct at boundaries: 1 day, 0 days (today), 30 days.

**A3 — Live count**

- [ ] Count renders when the query succeeds.
- [ ] Count **hidden entirely** on failure, timeout, or unconfigured Supabase.
- [ ] No `0 vì sao` unless the query genuinely returned 0.

**A4 — Sky CTA card**

- [ ] Replaces the text link; still routes to `/bau-troi`.
- [ ] Degrades to a count-less variant when A3 fails.
- [ ] Visible focus ring; `aria-label` present.

**Global**

- [ ] Lighthouse mobile `/` Performance ≥ 90 (median of 3).
- [ ] CLS on `/` ≤ 0.01 after fonts settle.
- [ ] `npm run build` clean; `npm test` green.
- [ ] `/bau-troi` and `/bau-troi/cua-toi` visually unchanged.

---

## 8. Perf Budget & Measurement Plan

| Metric                      | Baseline       | Gate                  | How measured                                      |
| --------------------------- | -------------- | --------------------- | ------------------------------------------------- |
| Lighthouse mobile Perf `/`  | record in §6.1 | **≥ 90**              | Median of 3, simulated 4G                         |
| CLS `/`                     | record         | ≤ 0.01                | Lighthouse + manual scroll                        |
| LCP `/`                     | record         | No regression > 100ms | Lighthouse median of 3                            |
| TBT `/`                     | record         | No regression > 50ms  | Lighthouse                                        |
| Extra network calls on `/`  | 0              | ≤ 2                   | DevTools (1 × `sky_notes` select, 1 × head count) |
| Landing chunk size (gzip)   | record         | No increase > 4KB     | `dist/assets` inspection                          |
| Preview stars in DOM        | n/a            | ≤ 12 buttons          | DevTools node count                               |
| Long tasks > 50ms after LCP | 0              | 0                     | Performance panel, 4× CPU throttle                |

**If Perf drops below 90:** the first lever is the idle-mount delay (push to 500ms), the second is dropping the preview to 8 stars, the third is cutting A2. Do not cut A1 — it's the point of the pass.

---

## 9. Risks & Mitigations

| ID  | Risk                                                                   | Likelihood | Impact | Mitigation                                                                                                                                                                                 |
| --- | ---------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | Extracting the hash helper from `SkyCanvas` regresses the shipped wall | Low        | High   | The math is already pinned by `tests/sky-centering.test.ts`. Snapshot `/bau-troi` before and after. Alternative: duplicate the 15-line hash in `LiveSkyPreview` and unify in a later pass. |
| R2  | Preview pushes `/` below the Lighthouse 90 gate                        | Medium     | High   | Idle-mount + skeleton + CSS-only twinkle + 12-star cap. Measurement plan in §8. Hard revert if it fails.                                                                                   |
| R3  | Second network call on the indexed page slows LCP                      | Medium     | Medium | Both calls fire in the same post-LCP idle callback, in parallel. Count is `HEAD` only.                                                                                                     |
| R4  | Empty or tiny wall makes `/` look dead                                 | Medium     | Medium | Existing seed fallback (`SEEDED_SKY_NOTES`, 21 entries) already covers it. Confirm posture in §12 D2.                                                                                      |
| R5  | Live UGC on `/` widens the moderation blast radius                     | Low        | Medium | Posture A (§12 D1) keeps all UGC text out of `/`. The `sky_notes` view already excludes `is_reported` and `is_deleted`.                                                                    |
| R6  | `SkyNoteModal` has undocumented coupling to the Sky route              | Low        | Medium | Verify in §6.5 before building. If coupled, lift the coupling — don't fork.                                                                                                                |
| R7  | Users tap a star expecting their own note                              | Low        | Low    | Card copy says `Bầu trời điều ước`; the "góc trời của bạn" affordance stays on `/toi`.                                                                                                     |

---

## 10. Optional Add-ons — Deferred, Not In Bundle A

| ID     | Idea                                                                                 | Why deferred                                                                                                                      | Effort |
| ------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **O1** | "Vừa có người gửi…" rotating pseudonym ticker                                        | Adds a timer + a motion element on the indexed page. Ship only after Bundle A's perf is proven stable.                            | S      |
| **O2** | Ambient drift entrance for preview stars (once per session, `transform`-only, 600ms) | Nice, but the preview already moves. Marginal gain, real perf risk.                                                               | S      |
| **O3** | `· 96 mở hôm nay` second counter                                                     | Second filtered count query for a number nobody acts on.                                                                          | S      |
| **O4** | Personal constellation echo (miniature `ConstellationView` above 3-steps)            | Strong idea, but it's a second module in the same pass. Ship Bundle A, then evaluate.                                             | M      |
| **O5** | "Điều ước của bạn đang ở đây" pin — highlight your own star in the preview           | Closes the seal→landing loop. Needs `useNotes` on `/` and a post-navigation flag.                                                 | M      |
| **O6** | Daily prompt aggregate ("Hôm nay vũ trụ đang nghe nhiều nhất: …")                    | Requires an aggregate query and a defensible threshold. Thin data at current volume.                                              | M      |
| **O7** | Supabase Realtime for live star appearance                                           | New channel, new connection, RLS review, and a perpetual socket on the landing page. Directly conflicts with §8's network budget. | L      |

---

## 11. Deliberately Excluded

Listed so future sessions don't re-litigate.

| Item                                  | Why excluded                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| Reactions on landing stars            | Requires login (§4.4) and surfaces counts. Wrong context for a marketing page.                |
| Inline opened-note text on `/`        | Puts UGC in the indexed DOM, makes `/` a moderation surface, and breaks §3 rule 1. Posture A. |
| Auto-rotating carousel of notes       | Motion-sickness risk, constant rAF, perf-gate risk.                                           |
| Fake presence ("X người đang online") | We don't have that data. Implying it is dishonest and off-tone.                               |
| Replacing `MockNoteStack` entirely    | It's the correct offline/empty fallback. Keep it.                                             |
| New canvas layer for the preview      | `StarField` is the only full-bleed canvas. The preview is a bounded box.                      |
| New DB migration for stats            | The existing `sky_notes` grant covers a `HEAD` count. Revisit only if §12 D4 is approved.     |
| Realtime updates                      | See O7.                                                                                       |

---

## 12. Open Decisions — Must Be Signed Off Before Implementation

| #      | Decision                                                                                                                | Recommended                                                                                         | Override |
| ------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------- |
| **D1** | **UGC posture on the indexed homepage** — A (metadata-only), B (opened content inline), or C (seeds only)?              | **A — metadata-only.** Lowest perf/SEO/moderation risk; Bundle A is designed for it.                | —        |
| **D2** | **Empty-wall behavior** — when the real wall has < 5 notes, show seed notes, `MockNoteStack`, or a "be the first" CTA?  | **Seed notes** — matches `V2.md` §3.2 and is already what `fetchSkyNotes` does.                     | —        |
| **D3** | **Scope** — Bundle A only, or Bundle A + O4 (personal constellation echo)?                                              | **A only.** Ship, measure, then decide on O4 with real numbers.                                     | —        |
| **D4** | **Counter query** — client-side `HEAD` count (no migration) or a `get_sky_stats()` RPC (one migration, one round trip)? | **Client-side `HEAD`.** No migration for a number this small.                                       | —        |
| **D5** | **Extract the shared hash helper now (R1) or duplicate the math?**                                                      | **Extract now** — `tests/sky-centering.test.ts` already pins the math, so there's a regression net. | —        |
| **D6** | **Preview star cap** — 12 or 8?                                                                                         | **12**, dropping to 8 if §8 perf gates fail.                                                        | —        |
| **D7** | **Should the preview omit constellation lines?**                                                                        | **Omit.** Too dense at 320px and adds SVG work to the indexed page.                                 | —        |

---

## 13. Execution Order

1. **Verify §6 prerequisites.** Stop if any fail.
2. **Snapshot** `/bau-troi` and `/bau-troi/cua-toi` (before-state for R1).
3. **Extract pure helpers** into `src/lib/sky.ts` (`pickPreviewNotes`, `pickUpcomingNotes`, `formatCountdownDays`, `fetchSkyCount`). Add `tests/landing-sky.test.ts`. Run `npm test`.
4. **If D5 = extract:** move `mixHash` + position math to a shared helper, update `SkyCanvas` to consume it, update `tests/sky-centering.test.ts` to import it. Re-verify both Sky routes against the step-2 snapshot.
5. **Build `LiveSkyPreview`** (A1). Verify sealed masking in DOM, tooltip, and modal.
6. **Build `UpcomingStrip`** (A2).
7. **Build `SkyCtaCard`** (A3 + A4) with the failure ladder.
8. **Wire into `Landing.tsx`** with the idle-mount gate and reserved-height skeletons.
9. **Run `npm run build` + `npm test`.** Fix everything.
10. **Lighthouse mobile, median of 3, on `/`.** Compare against baseline. If Perf < 90, apply the §8 lever ladder.
11. **Reduced-motion pass** — verify every new animated element.
12. **Report** using §14. Do not commit.

---

## 14. Report Template

```
# Landing Refactor Report — Bundle A

## Prerequisites check
- [each §6 row, PASS/FAIL, evidence]

## Files changed
- [path] — [one-line description]

## New tests
- [test name, what it pins, PASS/FAIL]
- `npm test` output

## Item-by-item
### A1 LiveSkyPreview
- What changed
- Raw evidence: DOM node count, sealed-masking proof (DOM dump showing no content),
  star-position determinism (same id on / and /bau-troi)
- PASS / FAIL
- Notes

### A2 UpcomingStrip
- ... (include the seed_sky_21_sealed 30-day quirk observation)

### A3 Live count
- ... (include proof of the failure ladder: simulated network failure → counter hidden)

### A4 Sky CTA card
- ...

## Lighthouse mobile — before → after
| Route | Perf | A11y | Best Practices | SEO | CLS | LCP | TBT |
|---|---|---|---|---|---|---|---|
| / | ... | ... | ... | ... | ... | ... | ... |
| /bau-troi | ... | ... | ... | ... | ... | ... | ... |
| /bau-troi/cua-toi | ... | ... | ... | ... | ... | ... | ... |

## Bundle size delta
- Landing chunk gzip: [before] → [after]

## Network calls added on /
- [count, payload, timing relative to LCP]

## Sky route regression check
- [/bau-troi before/after snapshot diff — "no change" or details]

## Reduced-motion verification
- [each animated element, confirm static fallback]

## Decisions made on my own
- [list]

## Blockers
- [list or "none"]

## Artifacts
- [paths to screenshots, Lighthouse JSON, DOM dumps, measurement logs]
```

---

## 15. What This Document Deliberately Excludes

| Item                                                    | Why                                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Reactions, comments, or any engagement metric on `/`    | Wrong context; requires login; surfaces counts.                                 |
| Any inline note text on `/`                             | Posture A. Keeps `/` clean for SEO and out of the moderation surface.           |
| Realtime / WebSocket / polling                          | Conflicts with the §8 network budget. See O7.                                   |
| A new full-bleed canvas                                 | `StarField` owns that.                                                          |
| New npm dependencies                                    | Nothing needed is missing.                                                      |
| DB migrations                                           | The existing `sky_notes` grant covers the count.                                |
| Changes to `/bau-troi`, `/toi`, or `/note/:id` behavior | Bundle A is additive to `/` only. Shared-code extraction is the sole exception. |
| Personalization, accounts, or greeting copy on `/`      | Considered in `POLISH.md` §9 and deferred there. Still deferred.                |

---

**End of LANDING.md.** Do not begin implementation until §12 is signed off. Report after the pass using §14. Do not commit. 🌙
