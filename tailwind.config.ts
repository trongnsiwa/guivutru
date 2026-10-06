import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: 'var(--bg-deep)',
          soft: 'var(--bg-soft)',
          elevated: 'var(--bg-elevated)',
        },
        star: {
          DEFAULT: 'var(--star)',
          glow: 'var(--star-glow)',
        },
        lavender: 'var(--lavender)',
        pink: 'var(--pink)',
        mint: 'var(--mint)',
        peach: 'var(--peach)',
        sky: 'var(--sky)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: {
          soft: 'var(--border-soft)',
          strong: 'var(--border-strong)',
          'paper-dem-sao': 'var(--paper-dem-sao-border)',
          'paper-tim-mong': 'var(--paper-tim-mong-border)',
          'paper-hogn': 'var(--paper-hogn-border)',
          'paper-bien': 'var(--paper-bien-border)',
          'paper-rung': 'var(--paper-rung-border)',
          'paper-giay-cu': 'var(--paper-giay-cu-border)',
        },
        paper: {
          'dem-sao': 'var(--paper-dem-sao)',
          'tim-mong': 'var(--paper-tim-mong)',
          hogn: 'var(--paper-hogn)',
          bien: 'var(--paper-bien)',
          rung: 'var(--paper-rung)',
          'giay-cu': 'var(--paper-giay-cu)',
        },
      },
      fontFamily: {
        note: ['"Sriracha"', '"Sriracha Fallback"', 'cursive', 'sans-serif'],
        display: ['"Ingrid Darling"', '"Ingrid Darling Fallback"', 'cursive', 'sans-serif'],
        sans: ['"Nunito"', '"Nunito Fallback"', 'sans-serif'],
        heading: ['"Ingrid Darling"', '"Ingrid Darling Fallback"', 'cursive', 'sans-serif'],
        body: ['"Nunito"', '"Nunito Fallback"', 'sans-serif'],
        ui: ['"Nunito"', '"Nunito Fallback"', 'sans-serif'],
      },
      borderRadius: {
        sm: '12px',
        md: '20px',
        lg: '28px',
        xl: '36px',
        pill: '9999px',
      },
      boxShadow: {
        dark: '0 8px 32px rgba(201, 182, 255, 0.12)',
        glow: '0 0 40px rgba(201, 182, 255, 0.25)',
      },
      spacing: {
        '18': '4.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
