import { PaperTheme } from '@/types/note';

export interface PaperThemeConfig {
  id: PaperTheme;
  name: string;
  bgHex: string;
  borderHex: string;
  bgColor: string;
  borderColor: string;
}

export const PAPER_THEMES: PaperThemeConfig[] = [
  { id: 'dem-sao', name: 'Đêm sao', bgHex: '#1B1436', borderHex: '#C9B6FF', bgColor: '#1B1436', borderColor: '#C9B6FF' },
  { id: 'tim-mong', name: 'Tím mộng', bgHex: '#241B47', borderHex: '#C9B6FF', bgColor: '#241B47', borderColor: '#C9B6FF' },
  { id: 'hogn', name: 'Hồng phấn', bgHex: '#3A1F3D', borderHex: '#FFB3D1', bgColor: '#3A1F3D', borderColor: '#FFB3D1' },
  { id: 'bien', name: 'Biển đêm', bgHex: '#0F2036', borderHex: '#A5D8FF', bgColor: '#0F2036', borderColor: '#A5D8FF' },
  { id: 'rung', name: 'Rừng khuya', bgHex: '#122A22', borderHex: '#A0F0DC', bgColor: '#122A22', borderColor: '#A0F0DC' },
  { id: 'giay-cu', name: 'Giấy cũ', bgHex: '#2B2320', borderHex: '#FFCBA4', bgColor: '#2B2320', borderColor: '#FFCBA4' },
];

export interface PromptOption {
  id: string;
  text: string;
  template: string;
}

export const PROMPTS: PromptOption[] = [
  { id: 'dulich', text: 'Mình muốn đến ___', template: 'Mình muốn đến ___' },
  { id: 'tuonglai', text: 'Năm sau, mình sẽ ___', template: 'Năm sau, mình sẽ ___' },
  { id: 'uocmo', text: 'Mình mong một ngày ___', template: 'Mình mong một ngày ___' },
  { id: 'buongbo', text: 'Mình sẽ không còn ___', template: 'Mình sẽ không còn ___' },
  { id: 'nguoithuong', text: 'Người mình muốn gặp ___', template: 'Người mình muốn gặp là ___' },
  { id: 'custom', text: 'Tự viết từ đầu ✍️', template: '' },
];

export const PROMPT_OPTIONS = PROMPTS;

export const STICKERS = ['🌙', '⭐', '💫', '🪐', '☁️', '🌸', '🍀', '🫧', '🎀', '🕯️'];

export const MAX_CONTENT_LENGTH = 500;
export const MIN_CONTENT_LENGTH = 5;
export const MAX_STICKERS = 3;
export const MIN_UNLOCK_DAYS = 7;

export const STORAGE_KEYS = {
  NOTES: 'gvt.notes',
  VERSION: 'gvt.version',
  THEME: 'gvt.theme',
  WRITE: 'gvt.write',
  LAST_SEALED: 'gvt.lastSealed',
} as const;

export const DEFAULT_EASING = [0.22, 1, 0.36, 1];
