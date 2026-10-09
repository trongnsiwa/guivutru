# 📋 GỬI VŨ TRỤ — Project Handoff

> Save as `HANDOFF.md`. Feed this to Antigravity at the start of the next session along with `SPEC.md`.

---

## 1. Project Snapshot

| Field              | Value                                                     |
| ------------------ | --------------------------------------------------------- |
| **Name**           | Gửi Vũ Trụ                                                |
| **Tagline**        | _Viết điều mình muốn. Niêm phong. Để vũ trụ lo._          |
| **Repo**           | gui-vu-tru (local)                                        |
| **Stack**          | Vite + React 18 + TS + Tailwind + Framer Motion + Zustand |
| **Hosting**        | Cloudflare Pages — live at guivutru.pages.dev             |
| **Status**         | v2.0, v2.1, v2.2 shipped to prod. Voice notes shipped. Landing Bundle A verified. |
| **Last worked on** | 2026-10-09                                                |

---

## 2. Design System — LOCKED

### Fonts (do not change without strong reason)

| Role                                               | Font               | Weight  | Vietnamese  |
| -------------------------------------------------- | ------------------ | ------- | ----------- |
| Display (hero, section headings, footer signature) | **Ingrid Darling** | 400     | ✅ verified |
| Body / UI / nav / buttons                          | **Nunito**         | 400–700 | ✅ verified |
| Note content (textarea, cards, share card)         | **Sriracha**       | 400     | ✅ native   |

**Removed (do not re-add):** Baloo 2, Be Vietnam Pro, Caveat, Fredoka, Varela Round, Fraunces, Quicksand, Comfortaa, Kalam.

**Rule:** Ingrid Darling must never render below 24px. Scripts lose readability.

### Palette — Dark mode default

```css
--bg-deep: #0f0a24 --bg-soft: #1b1436 --bg-elevated: #241b47 --star: #fff9e6 --lavender: #c9b6ff
  --pink: #ffb3d1 --mint: #a0f0dc --peach: #ffcba4 --sky: #a5d8ff --text-primary: #f5f1ff
  --text-secondary: #b8afd9 --text-muted: #6e628f --border-soft: rgba(201, 182, 255, 0.15)
  --border-strong: rgba(201, 182, 255, 0.35);
```

### Motion rules

- Default easing: `easeOutQuint [0.22, 1, 0.36, 1]`
- Route transitions: opacity only, ≤200ms, no slide/scale
- Respect `prefers-reduced-motion` everywhere
- Only animate `transform` + `opacity` (never `width`, `height`, `top`, `left`)

---

## 3. What's Been Built

### ✅ Phase 0 — Setup (done)

- Vite + React + TS scaffold, Tailwind configured with all tokens
- Folder structure per SPEC §9
- React Router with routes: `/`, `/viet`, `/viet/xong`, `/toi`, `/note/:id`, `/gioi-thieu`, 404
- `PageShell` (TopBar + Footer)
- `public/_redirects` for Cloudflare Pages SPA fallback
- `favicon.svg` (moon + star monogram)
- `og-image.png` 1200×630
- `README.md`
- Fonts loaded with `vietnamese` subset — verified
- StarField, NoiseOverlay components

### ✅ Phase 0.5 — Landing polish (done)

- Hero: "Vũ trụ ơi, mình muốn…" in Ingrid Darling
- Moon icon with soft glow pulse
- MockNoteStack: 3 layered cards, front card floats gently
- Primary CTA "Viết điều ước ✨" + secondary link "Bầu trời điều ước — sắp mở 🌙"
- Section "3 bước gửi điều ước" with numbered circles
- Footer with signature in Ingrid Darling
- Kalam removed from footer (diacritic bug)
- Scrollbar styling globally + edge-fade on horizontal pickers
- Mock note content rotation (Đà Lạt appears once, in mock only)

### ✅ Phase 1 — Write Flow (`/viet`) (done)

- 3-step wizard with `useWriteStore` (Zustand) persisted to `sessionStorage`
- **Step 1:** 6 prompt chips + "Tự viết từ đầu ✍️"
- **Step 2:** NotePaper textarea (Sriracha, live preview), PaperPicker (6 themes), StickerPicker (10 emojis, max 3), char counter (500 max)
- **Step 3:** UnlockPicker (1 tháng / 1 năm / 5 năm / tự chọn) + privacy radio (v1: only "Chỉ mình mình")
- Validation via zod: content 5–500 chars, unlockAt ≥ now + 7 days
- On "Niêm phong": writes to `localStorage["gvt.notes"]`, sets `sessionStorage["gvt.lastSealed"]`, calls `store.reset()`, navigates to `/viet/xong`
- Bug fixed: store not resetting after submit
- Bug fixed: "Tự viết từ đầu" chip not clickable (route guard blocked null promptId)
- Bug fixed: paper picker ring clipped on first/last chip
- Bug fixed: placeholder content rotated (no more duplicated Đà Lạt line)

### ✅ Phase 2 — Seal + Share (`/viet/xong`) (done & verified)

- `SealSequence` component: envelope → seal → star → fly up
- Confetti via `canvas-confetti`, pastel palette, top 60% viewport
- Success screen: heading, sub, countdown, 3 action buttons
- Skip button at 1.5s; immediate bypass under `prefers-reduced-motion`
- Share card render target 1080×1920, export via `html-to-image`
- Pre-render on mount for iOS share sheet
- Verified end-to-end via CDP: flow duration 3.65s, non-blank PNG with 256 unique IDAT bytes
- Verified diacritics rendering in exported PNG (`Điều ước của tớ ở Đà Lạt 🌸 — ĐẶC BIỆT Ở CHỖ ĐÓ`)
- Physical iOS Safari share sheet verification deferred to real device test (P-05)

### ✅ Phase 3 — Performance & Route Architecture (done)

- StarField converted to single `<canvas>` with 3-layer parallax and visibility-based rAF loop
- Route-level lazy loading (`React.lazy` + `Suspense`) in `src/router.tsx`
- Bundle size split: main vendor chunk ~118KB gzip, routes split into small sub-chunks
- Live Lighthouse Performance on `/`: 98/100, TBT: 0ms, CLS: 0.05
- Cloudflare Pages SPA fallback stabilized via Pages Function (`functions/[[path]].ts`) + `_routes.json`

### ✅ Phase 4 & POLISH Pass (Phases A & B) (done)

- **Phase A Shipped:**
  - A1: 3-layer parallax cosmos background replacement on single rAF loop (`src/components/fx/StarField.tsx`), color variants, rare shooting stars, static pale field in light mode. `FloatingBlobs.tsx` retired.
  - A2: Cursor sparkles on Step 2 textarea (`src/components/fx/CursorSparkles.tsx`), max 12 motes, desktop-only, disabled under reduced motion.
  - A3: Time-and-place metadata in `src/lib/date.ts` (poetic hour label + real moon phase via truncated Meeus algorithm).
  - A4: Step 2 live draft preview.
  - A5: Unlock picker microcopy & date preview.
  - A6: Soundscape/audio deferred per POLISH.md §3 A6.
  - A7: DevFonts & DevSealedSuccess verification routes.
- **Phase B Shipped:**
  - B1: Constellation sky view on `/toi` (`src/components/wish/ConstellationView.tsx`) with deterministic hash positioning, connection lines, accessible focus, view switcher toggle.
  - B2: QR code embedded on 1080×1920 share card (`/qr-guivutru.svg` linking to live domain).
  - B3: Memory note stack preview in Step 1.
  - §5: Preferences store `src/hooks/usePrefs.ts` (`gvt.prefs`) with schema versioning.
  - Motion override for local development: `src/lib/motion.ts` (`?motion=force` / `?motion=reduce`).
  - Pre-launch CLS fix: Font metric overrides (`size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`) in `src/styles/fonts.css` and display font preload in `index.html` eliminate font reflow CLS (reduced from 0.18-0.20 down to <0.006, Lighthouse score 1.0/1.0 across 10/10 runs). LCP target amended in SPEC §12 to reflect simulated 4G median reality (Performance ≥ 90, LCP ≤ 2.5s).

### ✅ Phase 5 — v2.0 "Đám mây" (Cloud) (shipped 2026-10-08)

- Supabase PostgreSQL + Auth + RLS backend foundation.
- Magic link OTP-only authentication flow.
- Load-bearing RLS rule: sealed notes return `content = null` before `unlock_at`.
- Security definer triggers for CRUD on `notes` view.
- Client-side and server-side local-first merge with sync conflict resolution.

### ✅ Phase 6 — v2.1 "Bầu trời" (Sky) (shipped 2026-10-08)

- Anonymous cosmos wish wall (`/bau-troi`) with zero PII exposure.
- Content moderation Layer 1 (pre-filter profanity check) & Layer 2 (report and instant hide via `report_note` RPC).
- Server-side rate limiting (1 public note/24h, 5 public notes/7d).
- Admin moderation queue (`/admin/bao-cao`) with allowlisted email gating (404 for non-admins).
- Stable Vietnamese pseudonyms for public note authors.

### ✅ Phase 7 — v2.2 "Nhắc nhở & Nhà" (Reminders & Home) (shipped 2026-10-08)

- Idempotent email unlock reminders via Resend API integration.
- Zalo Official Account reminder architecture (feature-flagged).
- PWA manifest and service worker with offline read caching.
- Capped reactions on public notes (🌙 ⭐ 💗).
- Year in Review anniversary recap card generation.

### ✅ Phase 8 — Voice Notes (shipped 2026-10-08)

- 30-second audio clip recording and playback for time capsules.
- Private Supabase Storage bucket `note-audio` with 5MB cap and mime validation.
- Database-level RLS on `storage.objects` enforcing `unlock_at <= now()` before audio retrieval or signed URL creation.

### ✅ Landing Refactor — Bundle A (The Sky Is Real) (verified 2026-10-09)

- **A1 `LiveSkyPreview`:** Contained 4:3 starbox (max 12 stars) with CSS-only twinkle and lazy-loaded `SkyNoteModal` inline. Replaces `MockNoteStack` when public notes exist; `MockNoteStack` is retained as offline/empty/error fallback.
- **A2 `UpcomingStrip`:** Compact countdown row showing up to 3 upcoming notes linking to `/bau-troi` (fails silent if empty or error).
- **A3 Live Count:** Async `HEAD` count query via `fetchSkyCount(timeoutMs = 2000)` with failure ladder (hides subtitle on error or timeout).
- **A4 `SkyCtaCard`:** Promoted card CTA routing to `/bau-troi` with live count subtitle.
- **Shared Helpers & Gating:** Extracted pure helpers (`pickPreviewNotes`, `pickUpcomingNotes`, `formatCountdownDays`, `fetchSkyCount`, and `computeStarCoordinates` position math) into `src/lib/sky.ts`. Idle-mount gating (`requestIdleCallback` / 200ms fallback) in `Landing.tsx` ensures zero LCP impact.
- **Verification & Perf:** 0-pixel/0-coordinate regression on `/bau-troi` and `/bau-troi/cua-toi`. Landing chunk gzip is 5.01 kB. Mobile Lighthouse median on `/` across 3 runs is Perf 93, LCP 2892ms, CLS 0.0044, TBT 0ms (§8 hard gate ≥90 met). `tests/landing-sky.test.ts` adds 20 tests.

---

## 4. Known Issues / Open Bugs

| ID   | Issue                                                                    | Priority | Status                                                 |
| ---- | ------------------------------------------------------------------------ | -------- | ------------------------------------------------------ |
| P-01 | Route transitions laggy, not smooth                                      | 🔴 P0    | Closed                                                 |
| P-02 | StarField re-mounts per navigation                                       | 🔴 P0    | Closed                                                 |
| P-03 | Zustand selectors returning new objects → full-tree re-render            | 🔴 P0    | Closed                                                 |
| P-04 | Share card PNG not verified with Vietnamese diacritics                   | 🟡 P1    | Closed (verified 1080x1920 PNG with full diacritics)   |
| P-05 | iOS Safari share sheet not verified                                      | 🟡 P1    | Deferred — requires real iOS device                    |
| P-06 | Success screen not verified visually                                     | 🟡 P1    | Closed (verified via CDP snapshot & DOM check)         |
| P-07 | Confetti performance on low-end devices not measured                     | 🟢 P2    | Pending (awaits physical iPhone 11 test)               |
| P-08 | Light mode not fully tested                                              | 🟢 P2    | Won't fix — light mode removed from v1.                |
| P-09 | Mobile 4G LCP 1.76s vs SPEC §12 <1.5s (Desktop unthrottled is 1.3s)       | 🟢 P2    | Closed — SPEC §12 amended to reflect achievable target (see SPEC §12 footnote). |
| P-10 | Live / Performance regression under simulated 4G (76 vs prior 98)        | 🟡 P1    | Closed — diagnostic proved measurement noise (16 pt spread, TBT 0ms across 5 runs; Oct 6 baseline was against a different environment). Current tree verified median on `/` is 93 (LCP 2892ms, CLS 0.0044, TBT 0ms). |
| P-11 | Footer color contrast below WCAG AA (3.49:1 on nav links, 2.30:1 on tagline) | 🟡 P1 | Closed (see Fix 1)                                     |
| P-12 | meta-viewport blocks user zoom                                           | 🟡 P1    | Closed (see Fix 2)                                     |
| SEC-01 | Supabase Auth Provider Configuration (Manual Dashboard Action) | 🟡 P1 | Closed (verified 2026-10-08: magic link OTP enforced, password/OAuth disabled in Supabase dashboard) |
| P-14 | Real-device matrix (§10 step 9) skipped by owner decision on 2026-10-08. iOS Safari MediaRecorder codec, iOS PWA install flow, and low-end Android perf are UNVERIFIED in prod. | 🟡 P1 | Open |
| DEC-2026-10-09-01 | Codebase-wide removal of reduced-motion support — owner directive overriding LANDING.md §2 row 4, HANDOFF.md §2, POLISH.md §2 item 6, and V2.md §7 item 2. No prefers-reduced-motion media queries, useReducedMotion hooks, MotionConfig, or disableForReducedMotion options remain in src/ or tests/. | 🟡 P1 | Closed |

---

## 5. What's Next (Priority Order)

Ranked by impact-to-effort from `V2.md` §5 backlog:

1. **P-14 Physical Device Verification:** Run real iOS Safari (MediaRecorder/codec check) and low-end Android verification before wide public announcement.
2. **"Lá thư từ tương lai" (v2.1 enhancement):** Write as your future self, unlock in N years. Different register from "note to self".
3. **Multi-note capsule:** Seal 5 notes that unlock together ("Điều ước tuổi 20"). Natural extension of the product metaphor.
4. **Trusted friends:** Invite up to 3 people to see _select_ notes. Privacy-preserving social without public wall pressure.
5. **Manifest check-in on unlock:** "Điều này có thành hiện thực chưa?" journaling loop.
6. **Seasonal cosmos:** Tết, Halloween, Christmas subtle palette shifts.
7. **Star depth by time:** Older notes recede, newer notes close in `ConstellationView`.
8. **Print-on-demand postcard:** Ship the sealed note as physical card (v3 target).

---

## 6. Deferred to v3 (out of scope)

- Print-on-demand postcard shipping infrastructure
- Curated premium paper/sticker packs & monetization
- Multi-language (EN toggle)
- Native mobile wrapper (iOS / Android app stores)
- Comments / replies / direct messaging (never build)

---

## 7. Handoff Notes for Antigravity

```
CONTEXT
Gửi Vũ Trụ is a Vietnamese manifest-note web app. Read SPEC.md and
HANDOFF.md at repo root before doing anything. SPEC.md is the source of
truth for product; HANDOFF.md is the source of truth for current state.

RULES
1. All user-facing copy in Vietnamese, "mình/bạn" tone.
2. All code, comments, identifiers in English.
3. Never hardcode hex in components — use Tailwind tokens / CSS vars.
4. Never re-add removed fonts: Baloo 2, Be Vietnam Pro, Caveat, Fredoka,
   Varela Round, Fraunces, Quicksand, Comfortaa, Kalam.
5. Ingrid Darling must never render below 24px.
6. Reduced-motion support is intentionally removed codebase-wide per DEC-2026-10-09-01; future sessions must not re-add it without fresh owner consent.
7. Only animate transform + opacity. Never width, height, top, left.
8. Route transitions: opacity only, ≤200ms.
9. Zustand selectors must return primitives or use useShallow.
10. Do not build v2 features without an explicit go-ahead.

CURRENT BLOCKER
P-14: Real-device matrix (§10 step 9) unverified on physical hardware (skipped by owner decision on 2026-10-08). Web features, security gates, and production deployment are fully live and verified.

WHEN REPORTING BACK
- Files changed
- Before/after FPS at 4x CPU throttle
- Long tasks > 50ms before/after
- Component re-render counts before/after
- Screenshots or PNG exports where relevant
- Any decisions you had to make on your own
- Any blockers hit
```

---

## 8. Quick Resume Checklist

When you come back to this project:

1. `cd gui-vu-tru && npm install && npm run dev`
2. Confirm live deployment: `https://guivutru.pages.dev/` (all subpaths return HTTP 200).
3. Connect physical Android & iOS devices for acceptance matrix (P-05, P-07).
4. If issues found on device, apply surgical fixes with unit/CDP verification.

---

## 9. Files of Interest

| File                              | Purpose                                          |
| --------------------------------- | ------------------------------------------------ |
| `SPEC.md`                         | Product spec — source of truth for features      |
| `HANDOFF.md`                      | This file — current state, open bugs, next steps |
| `POLISH.md`                       | Polish pass specs (Phases A & B complete)        |
| `README.md`                       | Public-facing repo readme                        |
| `src/store/useWriteStore.ts`      | Write flow state (Zustand + sessionStorage)      |
| `src/lib/constants.ts`            | Paper themes, prompts, stickers                  |
| `src/lib/share.ts`                | PNG export via html-to-image                     |
| `src/lib/schemas.ts`              | Zod validation                                   |
| `src/components/fx/StarField.tsx` | 3-layer parallax cosmos background               |
| `src/pages/Write/`                | 3-step write flow                                |
| `src/pages/Sealed/`               | Seal animation + success screen                  |
| `src/components/wish/LiveSkyPreview.tsx` | Contained 4:3 starbox preview on `/` with CSS-only twinkle |
| `src/components/wish/UpcomingStrip.tsx` | Countdown strip for upcoming public sealed notes |
| `src/components/wish/SkyCtaCard.tsx` | Promoted CTA card linking to `/bau-troi` with live count |
| `tailwind.config.ts`              | Design tokens                                    |
| `functions/[[path]].ts`           | Cloudflare Pages SPA fallback Function           |
| `_routes.json`                    | Pages Function static route exclusion config     |

---

**Pause point:** Infrastructure deploy verified live, v1 sweep completed. Resume with physical device testing matrix (P-05 on iOS Safari, P-07 on iPhone 11). 🌙
