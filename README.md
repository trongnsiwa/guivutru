# Gửi Vũ Trụ (GVT) ✨

> *"Viết điều mình muốn. Niêm phong. Để vũ trụ lo."*

A Vietnamese manifest-note web application designed with a mobile-first philosophy, aesthetic night-sky theme, and privacy-first local storage model.

---

## 🌟 Tech Stack

- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS v3 (custom design tokens, CSS variables, dark mode by default)
- **Animation:** Framer Motion (respects `prefers-reduced-motion`)
- **State Management:** Zustand
- **Storage:** Client-side `localStorage` (no account/login required in v1)
- **Date Utilities:** `date-fns` with Vietnamese locale
- **Exporting & Effects:** `html-to-image`, `canvas-confetti`
- **Routing:** React Router v6
- **Hosting:** Cloudflare Pages (static SPA build)

---

## 📁 Folder Structure

```
gui-vu-tru/
├── public/
│   ├── _redirects          # SPA fallback for Cloudflare Pages
│   ├── favicon.svg         # GVT monogram vector icon
│   ├── og-image.png        # 1200x630 social share banner
│   ├── star-field.svg      # Ambient star graphics
│   └── mock-notes/         # Landing mock note assets
├── src/
│   ├── components/
│   │   ├── fx/             # StarField, NoiseOverlay, Confetti, etc.
│   │   ├── layout/         # TopBar, Footer, PageShell
│   │   ├── ui/             # Button, Card, Chip, Modal, Toast, Textarea, Tooltip
│   │   └── wish/           # NoteCard, NotePaper, PaperPicker, StickerPicker, PromptChips, UnlockPicker, CountdownBadge, MockNoteStack
│   ├── hooks/              # useNotes, useCountdown, useTheme, useReducedMotion
│   ├── lib/                # storage, constants, date, share, cn
│   ├── pages/
│   │   ├── Write/          # 3-step write flow: Step1Prompt, Step2Content, Step3Unlock
│   │   ├── Landing.tsx     # Hero & introduction
│   │   ├── Sealed.tsx      # Post-seal celebration & share card (/viet/xong)
│   │   ├── MyCorner.tsx    # Saved notes list (/toi)
│   │   ├── NoteDetail.tsx  # Note view (/note/:id)
│   │   ├── About.tsx       # About Gửi Vũ Trụ (/gioi-thieu)
│   │   ├── DevFonts.tsx    # Font verification tool (/dev/fonts, DEV only)
│   │   └── NotFound.tsx    # 404 fallback page
│   ├── styles/
│   │   ├── globals.css     # Design tokens, reset, noise overlay
│   │   └── fonts.css       # Google Fonts with Vietnamese subset
│   ├── types/
│   │   └── note.ts         # Note data models
│   ├── App.tsx             # Root application provider
│   ├── main.tsx            # Entrypoint
│   └── router.tsx          # React Router setup
├── .nvmrc                  # Node 20
├── tailwind.config.ts      # Custom theme palette, radii, and fonts
├── vite.config.ts          # Vite build and path aliases
├── tsconfig.json           # TypeScript configuration
├── SPEC.md                 # Project specification and source of truth
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (managed via `.nvmrc`)
- npm 10+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd guivutru

# Install dependencies
npm install
```

### Development Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local Vite dev server |
| `npm run build` | Typecheck with `tsc -b` and produce production build in `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint across code files |

---

## ☁️ Deployment (Cloudflare Pages)

1. Connect this repository to **Cloudflare Pages**.
2. Set build configuration:
   - **Framework Preset:** Vite / None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment Variable:** `NODE_VERSION=20`
3. Single Page Application (SPA) routing is handled automatically by `public/_redirects` (`/* /index.html 200`).

---

## 🎨 Design System Rules

- **Mobile First:** Optimized for 390px viewport width (tested at 768px and 1280px).
- **Default Theme:** Dark mode ("bầu trời đêm").
- **Tokens:** Never hardcode hex values in UI components — always use Tailwind tokens (`lavender`, `bg-deep`, `star`, etc.).
- **Typography:**
  - `font-display`: Ingrid Darling (weight 400 only, display/whimsical headings >= 24px)
  - `font-sans`: Nunito (body & UI, weights 400, 500, 600, 700)
  - `font-note`: Sriracha (handwritten note content & share cards, weight 400)
  - `font-hand`: Kalam (accents, signatures & section tags, weight 400, 700)
  - All fonts configured with Vietnamese subset (`vietnamese, latin, latin-ext`).
- **Tone:** Vietnamese, gentle Gen Z "mình / bạn" voice (never "quý khách" or "người dùng").
