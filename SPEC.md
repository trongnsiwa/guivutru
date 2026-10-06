# 📘 GỬI VŨ TRỤ — Full Project Spec

> Save this whole file as `SPEC.md` in your repo root. Feed it to Antigravity at the start of each session so it always has context.

---

## 0. Project Meta

| Field           | Value                                                       |
| --------------- | ----------------------------------------------------------- |
| **Tên dự án**   | Gửi Vũ Trụ                                                  |
| **Tagline**     | _"Viết điều mình muốn. Niêm phong. Để vũ trụ lo."_          |
| **Ngôn ngữ**    | Tiếng Việt (mặc định), chuẩn bị i18n cho EN                 |
| **Đối tượng**   | Gen Z Việt 16–28, thích journaling, manifest, aesthetic     |
| **Nền tảng**    | Web mobile-first, SPA                                       |
| **Theme**       | Dark mode mặc định ("bầu trời đêm"), light mode là tuỳ chọn |
| **Hosting**     | Cloudflare Pages (free tier)                                |
| **Domain**      | `guivutru.pages.dev` (miễn phí)                             |
| **Build style** | Solo dev + Antigravity AI agent                             |
| **v1 scope**    | Không login, không backend, lưu `localStorage`              |

---

## 1. Brand Identity

### 1.1 Tên & ý nghĩa

- **Gửi Vũ Trụ** — hành động gửi đi, không phải "lưu lại".
- Logo chữ: "Gửi Vũ Trụ" viết tay, có dấu **✨** hoặc **🌙** nhỏ ở cuối.
- Có thể dùng monogram **GVT** cho favicon (trên nền tím đêm).

### 1.2 Tone of voice

- Xưng **mình / bạn**, không dùng "tôi", "quý khách", "người dùng".
- Câu ngắn. Có emoji vừa phải (1–2 mỗi block, không spam).
- Ngôn ngữ Gen Z nhẹ: _"á"_, _"nha"_, _"hết"_, _"xỉu"_ — nhưng không lố.
- Tránh: corporate speak, "vui lòng", "quý khách vui lòng".

### 1.3 Microcopy mẫu

| Vị trí         | Copy                                                                  |
| -------------- | --------------------------------------------------------------------- |
| Hero           | _Vũ trụ ơi, mình muốn…_                                               |
| Hero sub       | _Note lại điều mình muốn. Niêm phong. Rồi để vũ trụ lo phần còn lại._ |
| CTA chính      | _Viết điều ước ✨_                                                    |
| CTA phụ        | _Xem bầu trời_                                                        |
| Placeholder    | _Mình muốn đến Đà Lạt và ở đó mãi mãi…_                               |
| Sau khi submit | _Điều ước đã bay lên trời 🔒_                                         |
| Empty state    | _Chưa có gì ở đây hết á 🥺_                                           |
| Unlock day     | _Bạn của ngày xưa gửi cho bạn một lá thư…_                            |
| Lỗi mạng       | _Vũ trụ đang bận xíu, thử lại nha 🥲_                                 |
| Nút mở note    | _Mở điều ước_                                                         |
| Còn khoá       | _Còn {n} ngày nữa mới mở được 🔒_                                     |

---

## 2. Design System

### 2.1 Palette — Dark Mode (mặc định, "bầu trời đêm")

```css
/* Nền */
--bg-deep: #0f0a24; /* nền chính */
--bg-soft: #1b1436; /* card, section */
--bg-elevated: #241b47; /* modal, popover */

/* Sao & ánh sáng */
--star: #fff9e6;
--star-glow: #ffe9a8;

/* Accent */
--lavender: #c9b6ff; /* primary */
--pink: #ffb3d1; /* secondary */
--mint: #a0f0dc; /* success */
--peach: #ffcba4; /* warning soft */
--sky: #a5d8ff; /* info */

/* Chữ */
--text-primary: #f5f1ff;
--text-secondary: #b8afd9;
--text-muted: #6e628f;

/* Viền */
--border-soft: rgba(201, 182, 255, 0.15);
--border-strong: rgba(201, 182, 255, 0.35);
```

### 2.2 Palette — Light Mode (tuỳ chọn, phase 8)

```css
--bg-deep: #fffbf5;
--bg-soft: #fff4e6;
--bg-elevated: #ffffff;
--text-primary: #3a3352;
--text-secondary: #6e628f;
--lavender: #b39dff;
--pink: #ffb3d1;
```

### 2.3 Typography

Tất cả font **PHẢI có subset `vietnamese`**. Kiểm tra bằng chuỗi test:
`Điều ước của tớ ở Đà Lạt 🌸 — ĐẶC BIỆT`

| Vai trò            | Font               | Weight  | Size    |
| ------------------ | ------------------ | ------- | ------- |
| Display (hero)     | **Baloo 2**        | 700–800 | 40–56px |
| Heading            | **Baloo 2**        | 600     | 24–32px |
| Body               | **Be Vietnam Pro** | 400–500 | 15–17px |
| UI / Button        | **Be Vietnam Pro** | 600     | 15–16px |
| Handwriting accent | **Caveat**         | 600     | 20–28px |
| Code / nhỏ         | **Be Vietnam Pro** | 400     | 13px    |

Load qua `next/font` hoặc `@fontsource` với `subsets: ['vietnamese', 'latin']`.

### 2.4 Spacing & Radius

```
Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96
Radius:        sm=12, md=20, lg=28, xl=36, pill=999
Shadow (dark): 0 8px 32px rgba(201, 182, 255, 0.12)
Shadow (glow): 0 0 40px rgba(201, 182, 255, 0.25)
```

### 2.5 Iconography & Doodles

- Dùng **SVG inline**, stroke 1.5–2px, đầu tròn.
- Bộ doodle cần có: sparkle ✨, sao ⭐, tim 💗, mũi tên cong, gạch chân tay, mây, mặt trăng, phong bì, sticker washi.
- Sticker set: 🌙 ⭐ 💫 🪐 ☁️ 🌸 🍀 🫧 🎀 🕯️

### 2.6 Texture

- Overlay noise: SVG feTurbulence, opacity 4%, blend `overlay`.
- Star field: 80–150 sao nhỏ, animate twinkle lệch pha.

---

## 3. Information Architecture

```
/                    → Landing
/viet                → Write flow (3 bước)
   ├─ step 1: Chọn mẫu câu
   ├─ step 2: Viết + chọn giấy/sticker
   └─ step 3: Chọn ngày mở + quyền riêng tư
/viet/xong           → Seal + confetti + share card
/toi                 → "Góc của tôi" — danh sách note
/note/[id]           → Chi tiết note (sealed hoặc opened)
/gioi-thieu          → Về Gửi Vũ Trụ
```

**v2 (chưa build):** `/bau-troi` (public wall of stars), `/mo/[token]` (mở từ email).

---

## 4. Page Specs

### 4.1 `/` — Landing

**Mục tiêu:** 5 giây để user hiểu + bấm CTA.

**Layout (mobile-first 390px):**

```
┌──────────────────────────┐
│  [logo nhỏ GVT]          │  ← top bar, 48px, transparent
│                          │
│      🌙 (float)          │
│   Vũ trụ ơi,             │  ← Baloo 2, 44px
│   mình muốn…             │
│                          │
│   Note lại điều mình     │  ← Be Vietnam Pro, 16px
│   muốn. Niêm phong.      │
│   Rồi để vũ trụ lo.      │
│                          │
│   [ Viết điều ước ✨ ]   │  ← CTA chính, pill, gradient
│   [ Xem bầu trời ]       │  ← CTA phụ, ghost (disabled v1, tooltip "sắp có")
│                          │
│   ── mock note cards ──  │  ← 3 note cards xếp chồng, xoay nhẹ
│                          │
│   ── 3 bước ──           │
│   1️⃣ Viết  2️⃣ Niêm phong  3️⃣ Chờ
│                          │
│   ── footer ──           │
└──────────────────────────┘
```

**Animations:**

- Hero text: fade + slide-up stagger 100ms.
- Sao nền: twinkle lệch pha, 2–4s cycle.
- Mock note cards: float lên xuống 6px, 4s ease-in-out infinite.
- CTA: hover scale 1.03, tap scale 0.97.

**Assets cần:**

- `public/star-field.svg` (hoặc generate bằng JS)
- `public/mock-note-1.png`, `mock-note-2.png`, `mock-note-3.png`

---

### 4.2 `/viet` — Write Flow

**Nguyên tắc:** 1 màn hình = 1 câu hỏi. Không scroll. Progress dots ở trên.

#### Step 1 — Chọn mẫu câu

```
┌──────────────────────────┐
│  ← [1]─[2]─[3]           │  ← progress
│                          │
│  Hôm nay bạn muốn        │
│  gửi gì lên trời?        │
│                          │
│  [ Mình muốn đến ___ ]   │  ← chip, tap → điền vào step 2
│  [ Năm sau, mình sẽ ___ ]│
│  [ Mình mong một ngày ]  │
│  [ Mình sẽ không còn __ ]│
│  [ Người mình muốn gặp ] │
│  [ Tự viết từ đầu ✍️ ]   │
│                          │
└──────────────────────────┘
```

#### Step 2 — Viết + chọn giấy

```
┌──────────────────────────┐
│  ← [1]─[2]─[3]           │
│                          │
│  ┌────────────────────┐  │
│  │ Mình muốn đến Đà   │  │  ← textarea, 500 char max
│  │ Lạt và ở đó mãi    │  │     font Caveat 24px
│  │ mãi…               │  │
│  └────────────────────┘  │
│                    128/500│
│                          │
│  Chọn giấy:              │
│  ○ ○ ○ ○ ○ ○             │  ← 6 paper themes
│                          │
│  Dán sticker:            │
│  🌙 ⭐ 💫 🪐 ☁️ 🌸 🍀     │  ← tap to toggle, max 3
│                          │
│         [ Tiếp → ]       │
└──────────────────────────┘
```

**Paper themes (dark mode):**
| ID | Tên | Màu nền | Viền |
|---|---|---|---|
| `dem-sao` | Đêm sao | `#1B1436` | `#C9B6FF` |
| `tim-mong` | Tím mộng | `#241B47` | `#C9B6FF` |
| `hogn` | Hồng phấn | `#3A1F3D` | `#FFB3D1` |
| `bien` | Biển đêm | `#0F2036` | `#A5D8FF` |
| `rung` | Rừng khuya | `#122A22` | `#A0F0DC` |
| `giay-cu` | Giấy cũ | `#2B2320` | `#FFCBA4` |

#### Step 3 — Ngày mở + riêng tư

```
┌──────────────────────────┐
│  ← [1]─[2]─[3]           │
│                          │
│  Bao giờ mở lại?         │
│                          │
│  [ 1 tháng ] [ 1 năm ]   │  ← chip nhanh
│  [ 5 năm ]  [ Tự chọn 📅 ]│
│                          │
│  Ngày mở: 01/10/2027     │
│                          │
│  Ai được đọc?            │
│  ● Chỉ mình mình         │
│  ○ Ẩn danh trên bầu trời │  ← v2, disabled v1
│                          │
│      [ Niêm phong 🔒 ]   │
└──────────────────────────┘
```

**Validation:**

- Content: 5–500 ký tự, trim whitespace.
- Unlock date: tối thiểu 7 ngày kể từ hôm nay.
- Nếu unlock < 7 ngày → toast: _"Cho vũ trụ chút thời gian nha, ít nhất 7 ngày 🌙"_

---

### 4.3 `/viet/xong` — Seal & Share

**Flow:**

1. Phong bì xuất hiện, note bay vào (400ms).
2. Phong bì niêm phong → biến thành ngôi sao (600ms).
3. Sao bay lên trời, nhoè dần (500ms).
4. Confetti pastel rơi (1.5s).
5. Hiện màn "Điều ước đã bay lên trời 🔒"
6. Nút: **Tải share card** + **Về nhà** + **Viết thêm**

**Share card (1080×1920 PNG):**

- Nền: paper theme user chọn.
- Nội dung note (font Caveat).
- Góc dưới: logo "Gửi Vũ Trụ ✨" + `guivutru.pages.dev`.
- Export bằng `html-to-image`.

---

### 4.4 `/toi` — Góc của tôi

```
┌──────────────────────────┐
│  Góc của tôi ✨          │
│  3 điều ước đang chờ    │
│                          │
│  ┌────────────────────┐  │
│  │ 🔒 Đêm sao          │  │
│  │ Còn 342 ngày        │  │
│  │ 01/10/2027          │  │
│  │ [Xem]  [Xoá]        │  │
│  └────────────────────┘  │
│  ... (list)              │
│                          │
│  [ + Viết điều ước mới ] │
└──────────────────────────┘
```

**Empty state:** _"Chưa có gì ở đây hết á 🥺 Viết điều đầu tiên nha?"_ + CTA.

**Sort:** mới nhất trước.

---

### 4.5 `/note/[id]` — Chi tiết

**Trạng thái sealed:**

- Note bị blur (backdrop-blur 12px).
- Overlay: 🔒 + countdown + nút "Nhắc mình khi mở" (v2).
- **KHÔNG** render text vào DOM (dù v1 không cần bảo mật cao, giữ thói quen tốt).

**Trạng thái opened:**

- Note mở, animation fade + scale.
- Hiện ngày viết + ngày mở.
- Nút: **Chia sẻ** + **Viết điều mới**.

---

## 5. Component Library

```
components/
├── ui/
│   ├── Button.tsx          // variant: primary | ghost | pill | icon
│   ├── Chip.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Toast.tsx
│   ├── ProgressDots.tsx
│   ├── Textarea.tsx
│   └── Tooltip.tsx
├── wish/
│   ├── NoteCard.tsx        // hiển thị note trong list
│   ├── NotePaper.tsx       // paper + content, dùng trong write + share
│   ├── PaperPicker.tsx
│   ├── StickerPicker.tsx
│   ├── PromptChips.tsx
│   ├── UnlockPicker.tsx
│   └── CountdownBadge.tsx
├── fx/
│   ├── StarField.tsx       // canvas hoặc SVG
│   ├── NoiseOverlay.tsx
│   ├── Confetti.tsx        // dùng canvas-confetti
│   ├── CursorSparkles.tsx  // optional, chỉ desktop
│   └── FloatingBlobs.tsx
└── layout/
    ├── TopBar.tsx
    ├── Footer.tsx
    └── PageShell.tsx
```

---

## 6. Data Model (localStorage v1)

```ts
// key: "gvt.notes"    → Note[]
// key: "gvt.version"  → "1"
// key: "gvt.theme"    → "dark" | "light"

type PaperTheme = 'dem-sao' | 'tim-mong' | 'hogn' | 'bien' | 'rung' | 'giay-cu';

type NoteStatus = 'sealed' | 'opened';

interface Note {
  id: string; // nanoid(12)
  content: string; // 5–500 ký tự
  promptId: string | null; // 'dulich' | 'tinhyeu' | null (tự viết)
  paperTheme: PaperTheme;
  stickerIds: string[]; // max 3
  unlockAt: number; // timestamp ms
  status: NoteStatus;
  createdAt: number;
  openedAt: number | null;
}
```

**Khi migrate lên backend (v2):** giữ nguyên shape, thêm `user_id`, `visibility`, `server_id`.

---

## 7. Animation Spec

Dùng **Framer Motion**. Easing mặc định: `[0.22, 1, 0.36, 1]` (easeOutQuint).

| Hành động      | Animation                 | Thời lượng   |
| -------------- | ------------------------- | ------------ |
| Page enter     | opacity 0→1, y 12→0       | 300ms        |
| Button tap     | scale 1→0.96→1            | 150ms spring |
| Chip select    | scale 1→1.05, glow border | 200ms        |
| Note float     | y 0→-6→0 loop             | 4s infinite  |
| Sao twinkle    | opacity 0.4→1→0.4 loop    | 2–4s random  |
| Seal envelope  | scale 1→1.2→0, y 0→-200   | 800ms        |
| Star fly up    | y 0→-500, opacity 1→0     | 700ms        |
| Confetti       | physics burst             | 1.5s         |
| Note open      | blur 12→0, scale 0.95→1   | 600ms        |
| Countdown tick | number flip               | 300ms        |

**Tôn trọng `prefers-reduced-motion`:** tắt float, twinkle, confetti; giữ fade.

---

## 8. Tech Stack

| Layer      | Chọn                             | Ghi chú                                |
| ---------- | -------------------------------- | -------------------------------------- |
| Framework  | **Vite + React 18 + TypeScript** | Static SPA, deploy Cloudflare Pages dễ |
| Styling    | **Tailwind CSS v3**              | Custom tokens ở `tailwind.config`      |
| Animation  | **Framer Motion**                |                                        |
| State      | **Zustand** hoặc React Context   | Đủ cho v1                              |
| Storage    | **localStorage**                 | Wrap trong `lib/storage.ts`            |
| ID         | **nanoid**                       |                                        |
| Share card | **html-to-image**                |                                        |
| Confetti   | **canvas-confetti**              | Nhẹ, không cần asset                   |
| Date       | **date-fns** với locale `vi`     |                                        |
| Icons      | **lucide-react**                 |                                        |
| Validation | **zod**                          |                                        |
| Deploy     | **Cloudflare Pages**             | Build: `npm run build`, output: `dist` |
| Analytics  | **Cloudflare Web Analytics**     | Free, không cookie                     |

> **Tại sao không Next.js?** v1 không cần SSR/SEO phức tạp, Vite SPA build nhanh hơn, deploy Pages đơn giản hơn (không cần `@cloudflare/next-on-pages`). Khi lên v2 có public wall + SEO → cân nhắc chuyển.

---

## 9. File Structure

```
gui-vu-tru/
├── public/
│   ├── favicon.svg
│   ├── og-image.png        // 1200×630
│   ├── star-field.svg
│   └── mock-notes/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx
│   ├── styles/
│   │   ├── globals.css
│   │   └── fonts.css
│   ├── lib/
│   │   ├── storage.ts
│   │   ├── constants.ts    // paper themes, prompts, stickers
│   │   ├── date.ts
│   │   ├── share.ts        // html-to-image
│   │   └── cn.ts
│   ├── hooks/
│   │   ├── useNotes.ts
│   │   ├── useCountdown.ts
│   │   ├── useTheme.ts
│   │   └── useReducedMotion.ts
│   ├── components/         // như mục 5
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Write/
│   │   │   ├── Step1Prompt.tsx
│   │   │   ├── Step2Content.tsx
│   │   │   ├── Step3Unlock.tsx
│   │   │   └── index.tsx
│   │   ├── Sealed.tsx      // /viet/xong
│   │   ├── MyCorner.tsx    // /toi
│   │   ├── NoteDetail.tsx  // /note/:id
│   │   └── About.tsx       // /gioi-thieu
│   └── types/
│       └── note.ts
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
├── SPEC.md                 // file này
└── README.md
```

---

## 10. Build Phases

### Phase 0 — Setup (0.5 ngày)

- [ ] `npm create vite@latest gui-vu-tru -- --template react-ts`
- [ ] Cài: `tailwindcss postcss autoprefixer framer-motion zustand nanoid html-to-image canvas-confetti date-fns lucide-react zod react-router-dom clsx tailwind-merge`
- [ ] Cấu hình `tailwind.config.ts` với tokens mục 2.1 + 2.3
- [ ] Load fonts với subset `vietnamese` (test chuỗi `Điều ước của tớ ở Đà Lạt 🌸`)
- [ ] Setup `globals.css` với CSS vars, reset, noise overlay
- [ ] Setup React Router (5 routes)
- [ ] Tạo `PageShell` (TopBar + Footer)

### Phase 1 — Landing (1 ngày)

- [ ] Hero với Baloo 2, 2 CTA
- [ ] `StarField` component (SVG + animate twinkle)
- [ ] 3 mock note cards xoay nhẹ + float
- [ ] Section "3 bước"
- [ ] Footer
- [ ] Responsive test 390px / 768px / 1280px

### Phase 2 — Write Flow (2 ngày)

- [ ] `Write` page với 3 step + ProgressDots
- [ ] Step 1: `PromptChips` (6 lựa chọn)
- [ ] Step 2: `NotePaper` preview real-time + `PaperPicker` + `StickerPicker`
- [ ] Step 3: `UnlockPicker` (chip nhanh + date picker) + validation zod
- [ ] Save vào localStorage ở bước "Niêm phong"
- [ ] Toast feedback

### Phase 3 — Seal + Share (1.5 ngày)

- [ ] Animation phong bì → sao → bay lên
- [ ] Confetti pastel
- [ ] Màn "Điều ước đã bay lên trời"
- [ ] `share.ts` với html-to-image → export PNG 1080×1920
- [ ] Test share card trên mobile (tải về album ảnh)

### Phase 4 — Góc của tôi (1 ngày)

- [ ] List note với `NoteCard`
- [ ] `CountdownBadge` (hook `useCountdown`)
- [ ] Empty state
- [ ] Nút xoá có confirm modal
- [ ] Route `/note/:id` với 2 trạng thái sealed/opened

### Phase 5 — Polish (1 ngày)

- [ ] `prefers-reduced-motion` respect
- [ ] Light mode toggle
- [ ] OG image + meta tags
- [ ] Accessibility: focus ring, aria-label, contrast ≥ 4.5
- [ ] Lighthouse ≥ 90 mobile
- [ ] Test Safari iOS (font, animation, download PNG)

### Phase 6 — Deploy (0.5 ngày)

- [ ] Push GitHub
- [ ] Cloudflare Pages → Connect repo
- [ ] Build command: `npm run build`, output: `dist`
- [ ] Env: `NODE_VERSION=20`
- [ ] Custom 404 (SPA fallback): tạo `public/_redirects` với `/* /index.html 200`
- [ ] Bật Cloudflare Web Analytics
- [ ] Test trên `guivutru.pages.dev`

**Tổng v1: ~7.5 ngày làm việc solo + AI agent.**

---

## 11. Instructions for Antigravity Agent

> Paste block này vào system prompt của agent.

```
You are building "Gửi Vũ Trụ" — a Vietnamese manifest-note web app.

RULES:
1. Read SPEC.md at the start of every session. Never deviate from it.
2. Language: all user-facing copy is Vietnamese, in "mình/bạn" tone.
   Never use "quý khách", "người dùng", "vui lòng".
3. Dark mode is DEFAULT. Light mode is a toggle (phase 5).
4. All fonts MUST have Vietnamese subset. Test with:
   "Điều ước của tớ ở Đà Lạt 🌸 — ĐẶC BIỆT"
5. Mobile-first. Design at 390px width. Test at 768px and 1280px.
6. Use Tailwind tokens from tailwind.config, never hardcode hex in components.
7. Animations: Framer Motion, easeOutQuint [0.22, 1, 0.36, 1].
   Respect prefers-reduced-motion.
8. localStorage only in v1. Never call an API.
9. Never render sealed note content into the DOM.
10. Prefer small components in components/ui and components/wish.
11. After each phase, run `npm run build` and fix TS errors before moving on.
12. When unsure about a decision, ASK before coding.
```

---

## 12. Acceptance Criteria (v1 done = all ✅)

- [ ] Landing load: Lighthouse mobile Performance ≥ 90 (median of 3 runs on simulated 4G). LCP ≤ 2.5s under the same conditions.
- [ ] Viết được note trong < 60 giây
- [ ] Note lưu vào localStorage, reload vẫn còn
- [ ] Note sealed không đọc được nội dung
- [ ] Countdown đúng đến từng ngày
- [ ] Share card export PNG 1080×1920, tiếng Việt không lỗi font
- [ ] Confetti chạy mượt 60fps trên iPhone 11
- [ ] Không có chữ tiếng Anh lẫn vào UI
- [ ] Deploy thành công trên `guivutru.pages.dev`
- [ ] Test pass trên Chrome Android + Safari iOS

_Ghi chú: LCP is measured with Lighthouse mobile simulated 4G (median of 3 runs). Real-world LCP on 4G/5G will be lower._

---

## 13. Out of Scope (v1)

- Login / tài khoản
- Backend / database
- Public wall "Bầu trời điều ước"
- Email/Zalo reminder
- Multi-language
- Reactions, comments
- Payment / premium
- PWA offline mode

→ Tất cả để v2.

---

## 14. v2 Roadmap (ghi chú trước)

| Tính năng                  | Ghi chú                                              |
| -------------------------- | ---------------------------------------------------- |
| Supabase auth (magic link) | Sync note cross-device                               |
| `/bau-troi` public wall    | Sao ẩn danh, tap → mở note                           |
| Email reminder             | Resend + Cloudflare Cron Triggers                    |
| Moderation                 | Bad-word filter + report + rate limit 1 note/ngày/IP |
| RLS policy                 | Sealed note content trả `null` server-side           |
| PWA                        | Install prompt, offline read                         |
| Premium                    | Paper packs, sticker packs, in bưu thiếp             |

---

## 15. Open Questions (cần quyết trước khi code)

- [ ] Favicon: monogram **GVT** hay mặt trăng 🌙?
- [ ] OG image: có cần thiết kế riêng không?
- [ ] Ngôn ngữ trong code (comment, biến): tiếng Anh hay tiếng Việt? _(đề xuất: Anh)_
- [ ] Có cần `README.md` cho public repo không?
- [ ] Confetti: dùng `canvas-confetti` hay tự viết? _(đề xuất: thư viện)_

---

**Hết spec. Lưu file này làm `SPEC.md`, commit vào repo, feed cho Antigravity mỗi session.**

Bạn trả lời 5 câu ở mục 15 là mình có thể bắt đầu Phase 0 ngay. 🚀
