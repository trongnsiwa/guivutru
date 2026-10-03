# 🎨 GỬI VŨ TRỤ — Polish & Cosmos Roadmap

> Save as `POLISH.md` in the repo root. Feed alongside `SPEC.md` and `HANDOFF.md` at the start of every session.
>
> This document supersedes any conflicting guidance in HANDOFF.md §5 that is not explicitly about performance, deploy, or Phase 2/3/4 completion.

---

## 0. Purpose & Scope

This is a **two-phase polish pass** that upgrades the emotional and visual quality of Gửi Vũ Trụ without adding v2 features, new user-facing concepts, or new dependencies.

**Guiding principle:** polish makes the app feel alive at its emotional peaks (writing, sealing, unlocking, returning) and quiet everywhere else.

**Out of scope (do not build):**

- Login, accounts, backend, sync
- `/bau-troi` public wall
- Email/Zalo reminders
- Ambient audio or sound effects
- `.ics` calendar downloads
- Dynamic OG images per note
- Interactive parallax (mouse/touch tracking)
- WebGL / three.js / heavy shader work
- Onboarding tours or coach marks
- Multi-language, PWA, premium tier

---

## 1. Prerequisites (verify before starting Phase A)

Do not begin Phase A until every item below is confirmed:

| #   | Check                                                                                | How to verify                                                                         |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| 1   | Phase 2 share card fix verified on live (non-blank PNG, no `cssRules` SecurityError) | Run the live /viet/xong export; open the PNG; check console                           |
| 2   | Phase 3 (`/toi` delete-confirm, `/note/:id` opened-state, `useNotes` perf) is merged | Inspect source; confirm delete modal exists; confirm `/note/:id` transition on unlock |
| 3   | Phase 4 (light mode, a11y, meta, Lighthouse ≥90 mobile) is merged                    | Run Lighthouse mobile on live `/`, `/viet`, `/toi`                                    |
| 4   | `HANDOFF.md` open bugs P-04, P-05, P-06 are closed or explicitly deferred            | Read HANDOFF.md §4                                                                    |
| 5   | Baseline Lighthouse mobile scores recorded for all three routes                      | Save to `scratch/baseline-lighthouse.json`                                            |

**If any prerequisite fails, STOP.** Report which one and do not start Phase A.

---

## 2. Locked Constraints (never violate)

Inherited from `HANDOFF.md` §2 and `AGENTS.md`:

1. All user-facing copy is Vietnamese, `mình/bạn` tone. Never `tôi`, `quý khách`, `người dùng`.
2. All code, comments, identifiers in English.
3. Never hardcode hex in components — use Tailwind tokens or CSS vars.
4. Removed fonts must not return: Baloo 2, Be Vietnam Pro, Caveat, Fredoka, Varela Round, Fraunces, Quicksand, Comfortaa, Kalam.
5. Ingrid Darling never below 24px.
6. Respect `prefers-reduced-motion` on every animation.
7. Only animate `transform` + `opacity`. Never `width`, `height`, `top`, `left`.
8. Route transitions: opacity only, ≤200ms.
9. Zustand selectors return primitives or use `useShallow`.
10. **Lighthouse mobile Performance ≥90 is a hard constraint.** Any change that drops it below 90 must be reverted or reworked.
11. Only `localStorage` and `sessionStorage`. No network calls at runtime.
12. Never render sealed note content into the DOM (not even hidden).
13. No new npm dependencies without explicit approval.

---

## 3. Phase A — Atmosphere & Emotion

**Goal:** the app feels alive at its emotional peaks. Cosmos background is replaced. Notes carry time-and-place metadata. Unlocking is a moment, not a state change.

**Estimated effort:** 2–3 days solo.
**Deliverable:** one report covering A1–A7. Do not split.

---

### A1. Cosmos Background Replacement

**Why:** the current `StarField` is a monochrome twinkle. "Real motion cosmos" is the single most-requested polish item.

**File:** `src/components/fx/StarField.tsx` (rewrite), `src/components/fx/FloatingBlobs.tsx` (retire).

**Implementation:**

- **Three parallax layers.** Far (60% of stars, size 0.6–1px, drift 0.02px/frame), mid (30%, 1–1.5px, 0.05px/frame), near (10%, 1.5–2.5px, 0.12px/frame). Each layer drifts in a fixed direction; direction differs per layer to create depth.
- **Color variance.** Instead of monochrome `#E6D7FF`, sample each star from a small palette weighted toward white with occasional warm (`#FFE9A8`) and cool (`#A5D8FF`) accents. Roughly 85% white / 8% warm / 7% cool.
- **Shooting stars.** Rare and randomized. Target 1–3 per 60 seconds of active session. Each is a short streak (60–120px) with a fading tail, 400–700ms duration. Never during reduced motion.
- **Nebula layer.** Paint once at mount to an offscreen `OffscreenCanvas` (or a hidden `<canvas>`) at reduced resolution (e.g. 1/4 DPR). Two soft radial gradients — one lavender-tinted upper-left, one pink-tinted lower-right. Blit per frame with a very slow transform (0.005px/frame) so it feels alive without recomputing.
- **Retire `FloatingBlobs`.** The nebula replaces it. Remove the component file and every import.
- **Keep and preserve:** single rAF loop, `document.visibilitychange` pause, DPR cap at 2, `prefers-reduced-motion` freeze frame (draw one static frame, do not loop).
- **Light mode:** render a static minimal field — no drift, no shooting stars, no nebula. Just a light sprinkle of pale stars on `--bg-deep: #fffbf5`.
- **Performance budget:** the new `StarField` must not drop Lighthouse mobile Performance below 90 on any route. Record before/after.

**Acceptance:**

- Cosmos renders with visible parallax depth on `/` in dark mode.
- Nebula drifts imperceptibly but measurably (measure two frames 1s apart).
- No FPS regression vs the old `StarField` at 4x CPU throttle.
- Reduced motion → single static frame, no rAF loop running.
- Light mode → static pale field, no motion.
- `FloatingBlobs.tsx` deleted; no imports remain.

---

### A2. Cursor Sparkles on Write Textarea

**Why:** `CursorSparkles.tsx` already exists as a stub. Wiring it up makes Step 2 feel magic.

**File:** `src/components/fx/CursorSparkles.tsx`.

**Implementation:**

- Component accepts a `targetRef: RefObject<HTMLElement>` prop.
- On `mousemove` within the target, spawn a pastel mote at cursor position. Motes fade and drift up 8–12px over 400ms, then remove from DOM.
- Max 12 motes alive at once. Hard cap to prevent DOM bloat.
- Colors from the existing pastel palette: lavender, pink, mint, peach, sky, star-glow.
- **Desktop only.** Disable if `('ontouchstart' in window)` or `navigator.maxTouchPoints > 0`.
- **Reduced motion:** disable entirely.
- Mount only in `Step2Content` on the `NotePaper` edit-mode textarea wrapper.

**Acceptance:**

- Typing in Step 2 shows trailing motes on desktop.
- No motes on mobile or touch devices.
- No motes under reduced motion.
- DOM node count in the textarea wrapper stays bounded (measure with 500 keystrokes).

---

### A3. Time-and-Place Metadata on Notes

**Why:** every note currently looks the same. Metadata makes each one feel anchored to a specific moment.

**Files:** `src/lib/date.ts` (extend), `src/components/wish/NoteCard.tsx`, `src/components/wish/NotePaper.tsx`, `src/components/wish/ShareCard.tsx`, `src/types/note.ts`.

**Implementation:**

- **Poetic hour suffix.** Extend `formatDate` (or add `formatWriteTime`) to return a two-part string: `HH:mm` plus a Vietnamese hour label:
  - 00:00–04:59 → `đêm khuya`
  - 05:00–07:59 → `sáng sớm`
  - 08:00–11:59 → `buổi sáng`
  - 12:00–13:59 → `buổi trưa`
  - 14:00–17:59 → `buổi chiều`
  - 18:00–21:59 → `buổi tối`
  - 22:00–23:59 → `đêm muộn`
- **Real moon phase.** Add `getMoonPhase(timestamp: number): MoonPhase` to `src/lib/date.ts`. Use a truncated Meeus algorithm — deterministic, no external API. Return one of: `new | waxing-crescent | first-quarter | waxing-gibbous | full | waning-gibbous | last-quarter | waning-crescent`.
- **Moon phase glyph.** Map each phase to a small Unicode moon (🌑🌒🌓🌔🌕🌖🌗🌘). Display alongside the timestamp.
- **Where it appears:**
  - `NoteCard`: replace the current `formatDate(note.createdAt)` line with `formatWriteTime` + moon glyph.
  - `NotePaper` footer (when `showFooter`): show moon glyph + poetic time.
  - `ShareCard` bottom section: add moon glyph next to "Niêm phong ngày…". Keep the date itself.
- **Data model:** do **not** add fields to `Note`. Compute all metadata from `createdAt` at render time. This keeps old notes compatible and avoids migrations.

**Acceptance:**

- Every note card shows "HH:mm [label]" and a moon glyph.
- Moon phase is deterministic: same `createdAt` → same phase every render.
- Share card displays the moon glyph without breaking the existing layout.
- Spot-check 4 test timestamps across different phases against an external reference (e.g. timeanddate.com). Report the four results.

---

### A4. The Unlock Ritual on `/note/:id`

**Why:** the unlock moment is the emotional climax of the entire product and currently wasted.

**Files:** `src/pages/NoteDetail.tsx`, new `src/pages/NoteDetail/UnlockSequence.tsx` (or inline if small).

**Implementation:**

- On `/note/:id` mount, if `note.status === 'sealed'` **and** `Date.now() >= note.unlockAt`, treat this as a first-visit unlock:
  1. Render an `UnlockSequence` overlay instead of the sealed or opened state.
  2. Sequence (total ~2.2s):
     - Envelope fades in (400ms), reusing the visual language of `SealSequence` but inverted (seal → envelope → open).
     - Wax seal cracks and fades (300ms).
     - One line of prose appears in Ingrid Darling, 28–32px: _"Bạn của ngày xưa gửi cho bạn một lá thư…"_
     - Note content fades in underneath the prose (600ms).
     - Prose fades out (400ms).
  3. Call `useNotes.openNote(id)` **once** on mount via `useRef` guard, not on every render.
- **Reduced motion:** skip the sequence entirely, call `openNote` once, render the opened state immediately. Prose still appears for 1.5s as a static overlay, then fades.
- **Not-first-visit:** if `note.status === 'opened'`, render the opened state directly with no sequence.
- **`/toi` badge:** in `NoteCard`, if `note.status === 'sealed'` and `Date.now() >= note.unlockAt` and the note has not been viewed since unlock, show a small pill: `Đã mở được rồi ✨`. Suppress after first view (track via a new `gvt.viewedUnlocks` array in localStorage, keyed by note id).

**Acceptance:**

- Fresh sealed note + past unlock date → sequence plays once, then content is visible.
- Reloading the same note → no sequence, content visible.
- Reduced motion → no sequence, content visible, prose shown static then fades.
- `openNote` is called exactly once per unlock. Verify by logging.
- `/toi` shows the badge on unlocked-unviewed notes, hides it after viewing.

---

### A5. Haptics on Seal and Unlock

**Why:** one line, real payoff on Android. No settings UI needed.

**Files:** `src/pages/Write/index.tsx`, `src/pages/NoteDetail.tsx`.

**Implementation:**

- Call `navigator.vibrate?.(10)` immediately on:
  - Click of "Niêm phong 🔒" in Step 3 (before navigation)
  - Mount of `UnlockSequence` (before the sequence begins)
- Silent no-op where unsupported (iOS, desktop). Do not feature-detect; just optional-chain.
- Do **not** add a settings toggle. Haptics is not a "feature" worth a control.

**Acceptance:**

- On Android Chrome, sealing and unlocking produce a 10ms buzz. Report the test device.
- On iOS Safari and desktop, no error thrown, no visible effect.

---

### A6. Empty State Illustration + Microcopy Sweep

**Why:** the current empty state is an emoji. A small illustration is warmer and on-brand.

**Files:** `src/pages/MyCorner.tsx` (empty state), all pages (microcopy).

**Implementation:**

- **Empty state illustration.** Replace 🥺 with an inline SVG: a soft sky gradient with one pale star that breathes (opacity 0.4 → 0.8 → 0.4, 3s loop). Reduced motion → static. Size ~120×120. Use existing tokens.
- **Microcopy sweep.** Read every user-facing string in `src/` and verify:
  - Xưng `mình/bạn`. No `tôi`, `bạn` (as subject), `quý khách`, `người dùng`.
  - Warm, not corporate. No "Vui lòng", "Xin hãy".
  - Error toasts beyond the current generic ones get specificity where the error is knowable:
    - `localStorage` write failure → `"Không lưu được rồi, thử lại nha 🥲"`
    - Invalid content → already handled by zod messages, verify no drift.
  - Loading states that show only a spinner get a short prose line.
- **Audit output:** list every string you changed, before → after.

**Acceptance:**

- Empty state shows the SVG, not the emoji.
- Reduced motion → no breathing animation.
- Microcopy audit list attached to the report.

---

### A7. Easter Egg — TopBar Moon Meteor Shower

**Why:** cheap, delightful, discoverable by curious users, tweetable.

**Files:** `src/components/layout/TopBar.tsx`, new `src/components/fx/MeteorShower.tsx`.

**Implementation:**

- The TopBar moon link (`/gioi-thieu`) tracks taps in a `useRef` counter.
- On the 7th tap within 3 seconds: prevent navigation, trigger `MeteorShower`.
- `MeteorShower`: full-screen fixed overlay, 6–10 meteors crossing diagonally over ~3 seconds, then auto-unmount. Pure CSS or single rAF loop. Respects reduced motion (silent no-op).
- After the shower, reset the counter. Subsequent 7 taps can re-trigger.

**Acceptance:**

- 7 taps → meteor shower plays, no navigation to `/gioi-thieu`.
- Single tap → navigates normally.
- Reduced motion → 7 taps do nothing, no navigation, no error.
- Shower self-cleans (no orphaned DOM nodes, no rAF left running).

---

## 4. Phase B — Artifacts & Archive

**Goal:** the archive becomes a place to wander, not just a list. The share card becomes an artifact worth keeping.

**Prerequisite:** Phase A is fully merged and verified. Do not start Phase B until then.

**Estimated effort:** 1.5–2 days solo.
**Deliverable:** one report covering B1–B3.

---

### B1. Constellation View on `/toi`

**Why:** the archive is currently a generic list. Turning it into a map of stars closes the loop between the product's theme and its purpose.

**Files:** `src/pages/MyCorner.tsx`, new `src/components/wish/ConstellationView.tsx`, `src/hooks/usePrefs.ts` (new).

**Implementation:**

- **Toggle** at the top of `/toi`: two small chips, `Danh sách` and `Bầu trời`. Default `Danh sách`. Selected chip persists to `gvt.prefs` (see B3 for storage helper).
- **Constellation rendering:**
  - Fixed-aspect SVG or canvas area, e.g. 340×340 on mobile, larger on desktop.
  - Each note is a star. Position derived deterministically from `note.id`:
    ```
    const hash = (id) => id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0)
    const angle = (hash(id) % 360) * Math.PI / 180
    const radius = 40 + (hash(id) % 120)
    const x = center + Math.cos(angle) * radius
    const y = center + Math.sin(angle) * radius
    ```
  - Star size: smaller if unlock is far, larger as unlock approaches. Clamp to 3–10px.
  - Star brightness: dim for sealed, bright for opened.
  - Star color: use the paper theme's `borderHex` for a subtle per-note identity.
  - Faint connection lines between stars that are close (distance < 80px) and from the same paper theme.
- **Interaction:** tap a star → navigate to `/note/:id`. Hover (desktop) → tooltip with truncated content or "🔒" if sealed.
- **Reduced motion:** no twinkle, no drift, no connection-line animation. Static positions and brightness still convey meaning.
- **Accessibility:** wrap in `<ul role="list">` with each star as a focusable `<li><button>`. Screen readers announce `Điều ước #N, [sealed/opened], mở vào [date]`. The list view remains the accessible default.

**Acceptance:**

- Toggle works and persists across reload.
- Same `note.id` → same star position every time.
- Opened vs sealed is visually distinguishable.
- Reduced motion → static, functional.
- Keyboard navigation reaches every star.
- No layout shift when toggling back to the list.

---

### B2. QR Code on the Share Card

**Why:** a shared PNG with a scannable link turns the card into a growth loop.

**Files:** `src/components/wish/ShareCard.tsx`, new `src/lib/qr.ts`.

**Implementation:**

- **Library decision:** do not add an npm dependency. Implement a minimal QR generator inline, OR pre-generate the QR at build time and ship it as a static SVG at `public/qr-guivutru.svg` since the URL is fixed (`https://guivutru.pages.dev`).
  - **Preferred:** static SVG. Zero runtime cost, zero bundle cost, deterministic. Generate once with any QR tool and commit it.
- **Placement:** bottom-right of the share card, below the date section. Size ~140×140 at 1080×1920. Margin from card edge: 120px, matching existing padding.
- **Style:** monochrome in `--lavender` on transparent, or on the paper theme's `bgColor` if contrast requires it. Verify scannability by exporting and testing with a phone camera.
- **Label:** small line above or below: `quét để gửi điều ước của bạn` in Nunito 22px, `--text-muted`.
- **Do not** put the QR in the story-safe area or overlapping the wordmark.

**Acceptance:**

- QR renders in the exported PNG.
- Scanning the QR with a phone camera opens `https://guivutru.pages.dev`.
- QR does not overlap the wordmark, note body, date, or watermark.
- Contrast check: QR scans in both bright and dim conditions.

---

### B3. "Ngày này năm xưa" Strip on Landing

**Why:** a nostalgia loop that makes return visits feel alive.

**Files:** `src/pages/Landing.tsx`, `src/hooks/useNotes.ts` (extend for a lookup), `src/hooks/usePrefs.ts`.

**Implementation:**

- On Landing mount, query `gvt.notes` for any note whose `createdAt` falls on today's calendar day (month + day) in a prior year.
- If one or more match, render a single strip above the "3 bước" section:
  - `N năm trước, bạn đã gửi một điều ước.` where `N` is the earliest match's age.
  - Tap → navigate to `/note/:id` of the earliest match.
- Only ever show one strip. Do not list multiple matches.
- Strip styling: horizontal card, subtle lavender left border, small moon glyph, `font-sans` 15px.
- **Reduced motion:** static, no entrance animation.
- **Empty case:** no strip, no reserved space.

**Acceptance:**

- With a note from a prior year matching today → strip shows, tap navigates.
- With no matching note → nothing renders, no empty reserved height.
- Strip disappears after the user navigates and returns (no persistence needed; it re-evaluates on each mount).

---

## 5. Preferences Storage (`gvt.prefs`)

Both B1 and future polish items need a preferences store. Implement once.

**File:** new `src/hooks/usePrefs.ts`.

**Shape:**

```ts
interface Prefs {
  toiView: 'list' | 'sky';
}
```

**Rules:**

- Stored in `localStorage` under `gvt.prefs`.
- Default: `{ toiView: 'list' }`.
- Versioned: if the stored shape doesn't match, reset to defaults.
- Must not throw on corrupt data; wrap in try/catch and reset.

Add the key to `STORAGE_KEYS` in `src/lib/constants.ts` as `PREFS: 'gvt.prefs'`.

---

## 6. Execution Order

1. **Verify §1 prerequisites.** Stop if any fail.
2. **Implement Phase A** (A1 → A7) as one pass. Run `npm run build` + Lighthouse mobile before reporting.
3. **Report Phase A** using the template in §7. Attach: baseline vs post Lighthouse, cosmos screenshots, one exported share card with moon glyph.
4. **Wait for approval.** Do not start Phase B until Phase A is signed off.
5. **Implement Phase B** (B1 → B3) as one pass.
6. **Report Phase B** using the template in §7.
7. **Update `HANDOFF.md`** to reflect the new state. Move completed items into §3. Close any bugs resolved by these phases.

---

## 7. Report Template (use for both phases)

```
# Phase [A|B] Report

## Prerequisites check
- [list each prerequisite, PASS/FAIL, evidence]

## Files changed
- [path] — [one-line description]

## Item-by-item
### [A1 | B1 | etc.]
- What changed
- Raw evidence (measurements, screenshots, hashes)
- PASS / FAIL
- Notes

## Lighthouse mobile (before → after)
| Route | Perf | A11y | Best Practices | SEO |
|---|---|---|---|---|
| / | ... | ... | ... | ... |
| /viet | ... | ... | ... | ... |
| /toi | ... | ... | ... | ... |

## Reduced-motion verification
- [list each animated element, confirm it respects the preference]

## Decisions made on my own
- [list]

## Blockers
- [list or "none"]

## Artifacts
- [paths to screenshots, exported PNGs, measurement logs]
```

---

## 8. Non-Negotiable Rules

1. **Verify, then change.** Do not touch code before §1 prerequisites pass.
2. **One phase at a time.** Do not interleave A and B.
3. **Report raw evidence.** FPS numbers, byte counts, hash outputs — not "looks smooth".
4. **Lighthouse ≥90 mobile is a gate.** If any Phase A or B change drops it below 90, revert and rework before reporting.
5. **No new dependencies.** If a task seems to require one, stop and ask.
6. **No v2 features.** If it's not in this document, it's not in this pass.
7. **Reduced motion is not optional.** Every animation listed must have a static fallback.
8. **Do not commit or push.** Leave the tree dirty. The human reviews and commits.
9. **If something in this document is ambiguous, ask before implementing.** Do not guess.

---

## 9. What This Document Deliberately Excludes

Listed so future sessions don't re-litigate:

| Item                                       | Why excluded                                                               |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| Ambient audio / sound effects              | Feature, not polish. Needs settings UI, asset pipeline, autoplay handling. |
| Interactive mouse/touch parallax on cosmos | Motion sickness on mobile, breaks reduced-motion posture.                  |
| WebGL / three.js cosmos                    | Doubles perf risk for zero visible gain over a tuned canvas.               |
| `.ics` reminder download                   | Genuinely valuable but a new user concept. Defer to v1.1.                  |
| Story-format share card variant            | 1080×1920 already fits Stories with safe-area. No need.                    |
| Dynamic OG per note                        | Requires edge worker. v2.                                                  |
| Onboarding tour                            | Landing already pitches in 5 seconds. A tour would slow it.                |
| Mood chips on Step 1                       | Considered; deferred. Additive metadata is already covered by A3.          |
| Personalized landing greeting              | Considered; deferred. Cheap but low-impact vs the rest of Phase A.         |

---

**End of POLISH.md.** Follow §6 execution order. Report after each phase. Do not proceed to Phase B without sign-off.
