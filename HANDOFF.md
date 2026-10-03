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
| **Hosting**        | Cloudflare Pages (not yet deployed)                       |
| **Status**         | Write flow done. Seal/share halfway. Perf blocked.        |
| **Last worked on** | 2026-10-03                                                |

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

### 🟡 Phase 2 — Seal + Share (`/viet/xong`) (partial)

- `SealSequence` component: envelope → seal → star → fly up
- Confetti via `canvas-confetti`, pastel palette, top 60% viewport
- Success screen: heading, sub, countdown, 3 action buttons
- Skip button at 1.5s
- Share card render target 1080×1920, export via `html-to-image`
- Pre-render on mount for iOS share sheet
- **NOT verified end-to-end.** No screenshot of final success state or exported PNG received.
- **NOT verified:** diacritic rendering in exported PNG
- **NOT verified:** iOS Safari share behavior

### 🔴 Phase 3 — Performance (in progress, blocked)

- First optimization pass applied (route transitions, will-change, etc.)
- Still laggy on route changes. Diagnostic prompt issued but no report back yet.

---

## 4. Known Issues / Open Bugs

| ID   | Issue                                                                    | Priority | Status             |
| ---- | ------------------------------------------------------------------------ | -------- | ------------------ |
| P-01 | Route transitions laggy, not smooth                                      | 🔴 P0    | Diagnostic pending |
| P-02 | Suspected: StarField re-mounts per navigation                            | 🔴 P0    | Unconfirmed        |
| P-03 | Suspected: Zustand selectors returning new objects → full-tree re-render | 🔴 P0    | Unconfirmed        |
| P-04 | Share card PNG not verified with Vietnamese diacritics                   | 🟡 P1    | Pending            |
| P-05 | iOS Safari share sheet not verified                                      | 🟡 P1    | Pending            |
| P-06 | Success screen not verified visually                                     | 🟡 P1    | Pending            |
| P-07 | Confetti performance on low-end devices not measured                     | 🟢 P2    | Pending            |
| P-08 | Light mode not fully tested                                              | 🟢 P2    | Pending            |

---

## 5. What's Next (Priority Order)

### 🎯 IMMEDIATE — Fix performance (P-01 to P-03)

**Action:** Run the deep diagnostic prompt. Require raw numbers back:

- FPS during route change at 4x CPU throttle (target ≥58)
- Long tasks > 50ms (target 0)
- Heap growth per nav (target ≤500KB)
- Component re-render count (hero + mock notes render ONCE)
- StarField mount count per route change (target 1, not N)

**Common root causes to check first:**

1. StarField is DOM-based with N animated elements → convert to single `<canvas>` with one rAF loop
2. StarField lives inside pages instead of root layout → move to `<RootLayout>` above `<Outlet />`
3. Zustand selector returns new object each render → wrap with `useShallow`
4. `AnimatePresence mode="wait"` blocking paint → consider removing entirely

**Do not accept fixes without measurements.**

---

### 🎯 THEN — Finish Phase 2 (Seal + Share)

**Action:** Verify end-to-end:

- [ ] Full flow: Step 3 → seal animation → success screen → download PNG
- [ ] Open PNG in Preview app, confirm Vietnamese diacritics:
      `Điều ước của tớ ở Đà Lạt 🌸 — ĐẶC BIỆT Ở CHỖ ĐÓ`
- [ ] Test iOS Safari: `navigator.share` with pre-rendered blob
- [ ] Test Chrome desktop: download works
- [ ] Reduced-motion: skip animation, success screen still appears
- [ ] Direct nav to `/viet/xong` → redirects to `/`
- [ ] Send back: success screenshot + exported PNG sample

---

### 🎯 THEN — Phase 3: `/toi` (Góc của tôi)

**Action:** Build the note list page.

**Spec (from SPEC.md §4.4):**

- Read from `localStorage["gvt.notes"]`
- Sort newest first
- Each `NoteCard` shows: paper theme swatch, countdown badge, "Xem" + "Xoá" buttons
- Empty state: _"Chưa có gì ở đây hết á 🥺 Viết điều đầu tiên nha?"_ + CTA
- Delete with confirmation modal
- Route `/note/:id` with 2 states:
  - Sealed: blurred content, countdown overlay, lock icon
  - Opened: content visible, fade-in animation, "Chia sẻ" + "Viết điều mới"
- **Security rule:** do NOT render sealed content into the DOM (not even hidden)
- Countdown hook `useCountdown(unlockAt)` → days/hours/mins/secs

---

### 🎯 THEN — Phase 4: Polish

- Light mode toggle (verify all pages)
- Accessibility audit: focus rings, aria-labels, contrast ≥ 4.5
- Lighthouse mobile ≥ 90
- OG image meta tags verified
- SEO meta tags

---

### 🎯 THEN — Phase 5: Deploy

- Push to GitHub
- Connect Cloudflare Pages → `dist/` output
- `NODE_VERSION=20` env var
- `public/_redirects` verify: `/* /index.html 200`
- Enable Cloudflare Web Analytics
- Test on `guivutru.pages.dev`
- Real-device test: Chrome Android + Safari iOS

---

## 6. Deferred to v2 (out of scope)

- Login / accounts (magic link)
- Supabase backend + sync
- `/bau-troi` public wall of stars
- Email/Zalo reminders on unlock day
- Moderation (bad-word filter, report, rate limit)
- Reactions on public notes
- Multi-language (EN toggle)
- PWA / offline mode
- Premium tier (paper packs, sticker packs)

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
6. Respect prefers-reduced-motion on every animation.
7. Only animate transform + opacity. Never width, height, top, left.
8. Route transitions: opacity only, ≤200ms.
9. Zustand selectors must return primitives or use useShallow.
10. Do not build v2 features without an explicit go-ahead.

CURRENT BLOCKER
Route transitions are laggy. Run the deep diagnostic prompt FIRST — do not
guess, do not apply generic fixes. Measure FPS, long tasks, heap growth,
re-render counts, and StarField mount count. Report raw numbers before
fixing anything.

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
2. Read `SPEC.md` (product truth) and `HANDOFF.md` (this file — state truth)
3. Open `http://localhost:5173` — confirm landing renders, no console errors
4. Navigate to `/viet` — confirm write flow works
5. Navigate to `/viet/xong` — confirm seal flow works
6. **Then** paste the deep diagnostic prompt into Antigravity
7. Do not touch code until you have the performance report

---

## 9. Files of Interest

| File                              | Purpose                                          |
| --------------------------------- | ------------------------------------------------ |
| `SPEC.md`                         | Product spec — source of truth for features      |
| `HANDOFF.md`                      | This file — current state, open bugs, next steps |
| `README.md`                       | Public-facing repo readme                        |
| `src/store/useWriteStore.ts`      | Write flow state (Zustand + sessionStorage)      |
| `src/lib/constants.ts`            | Paper themes, prompts, stickers                  |
| `src/lib/share.ts`                | PNG export via html-to-image                     |
| `src/lib/schemas.ts`              | Zod validation                                   |
| `src/components/fx/StarField.tsx` | ⚠️ Suspected perf culprit                        |
| `src/pages/Write/`                | 3-step write flow                                |
| `src/pages/Sealed/`               | Seal animation + success screen                  |
| `tailwind.config.ts`              | Design tokens                                    |
| `public/_redirects`               | Cloudflare Pages SPA fallback                    |

---

**Pause point:** Performance diagnostic pending. Resume by running the deep diagnostic prompt and reporting raw numbers before applying fixes. 🌙
