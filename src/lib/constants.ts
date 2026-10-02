import { PaperTheme } from '@/types/note';

export interface PaperThemeConfig {
  id: PaperTheme;
  name: string;
  bgHex: string;
  borderHex: string;
}

export const PAPER_THEMES: PaperThemeConfig[] = [
  { id: 'dem-sao', name: 'Đêm sao', bgHex: '#1B1436', borderHex: '#C9B6FF' },
  { id: 'tim-mong', name: 'Tím mộng', bgHex: '#241B47', borderHex: '#C9B6FF' },
  { id: 'hogn', name: 'Hồng phấn', bgHex: '#3A1F3D', borderHex: '#FFB3D1' },
  { id: 'bien', name: 'Biển đêm', bgHex: '#0F2036', borderHex: '#A5D8FF' },
  { id: 'rung', name: 'Rừng khuya', bgHex: '#122A22', borderHex: '#A0F0DC' },
  { id: 'giay-cu', name: 'Giấy cũ', bgHex: '#2B2320', borderHex: '#FFCBA4' },
];

export interface PromptOption {
  id: string;
  text: string;
  template: string;
}

export const PROMPT_OPTIONS: PromptOption[] = [
  { id: 'dulich', text: 'Mình muốn đến ___', template: 'Mình muốn đến ' },
  { id: 'tuonglai', text: 'Năm sau, mình sẽ ___', template: 'Năm sau, mình sẽ ' },
  { id: 'uocmo', text: 'Mình mong một ngày', template: 'Mình mong một ngày ' },
  { id: 'buongbo', text: 'Mình sẽ không còn __', template: 'Mình sẽ không còn ' },
  { id: 'nguoithuong', text: 'Người mình muốn gặp', template: 'Người mình muốn gặp là ' },
  { id: 'custom', text: 'Tự viết từ đầu ✍️', template: '' },
];

export const STICKERS = ['🌙', '⭐', '💫', '🪐', '☁️', '🌸', '🍀', '🫧', '🎀', '🕯️'];

export const STORAGE_KEYS = {
  NOTES: 'gvt.notes',
  VERSION: 'gvt.version',
  THEME: 'gvt.theme',
} as const;

export const DEFAULT_EASING = [0.22, 1, 0.36, 1];
