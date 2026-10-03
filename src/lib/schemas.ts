import { z } from 'zod';
import { MIN_CONTENT_LENGTH, MAX_CONTENT_LENGTH, MAX_STICKERS, MIN_UNLOCK_DAYS } from './constants';

export const paperThemeEnum = z.enum([
  'dem-sao',
  'tim-mong',
  'hogn',
  'bien',
  'rung',
  'giay-cu',
]);

// Minimum 7 days from now (allowing a 1-minute grace margin for clock jitter)
export const minUnlockTimestamp = () =>
  Date.now() + MIN_UNLOCK_DAYS * 24 * 60 * 60 * 1000 - 60 * 1000;

export const step2ContentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(MIN_CONTENT_LENGTH, {
      message: 'Viết thêm chút nữa nha, ít nhất 5 ký tự nè ✨',
    })
    .max(MAX_CONTENT_LENGTH, {
      message: 'Điều ước dài quá nè, tối đa 500 ký tự thôi nha ✨',
    }),
  paperTheme: paperThemeEnum,
  stickerIds: z
    .array(z.string())
    .max(MAX_STICKERS, {
      message: 'Chỉ dán tối đa 3 sticker nha 🥺',
    }),
});

export const wishSchema = z.object({
  content: z
    .string()
    .trim()
    .min(MIN_CONTENT_LENGTH, {
      message: 'Viết thêm chút nữa nha, ít nhất 5 ký tự nè ✨',
    })
    .max(MAX_CONTENT_LENGTH, {
      message: 'Điều ước dài quá nè, tối đa 500 ký tự thôi nha ✨',
    }),
  paperTheme: paperThemeEnum,
  stickerIds: z
    .array(z.string())
    .max(MAX_STICKERS, {
      message: 'Chỉ dán tối đa 3 sticker nha 🥺',
    }),
  unlockAt: z
    .number({
      required_error: 'Chọn ngày mở điều ước cùng mình nha 🌙',
      invalid_type_error: 'Ngày mở không hợp lệ',
    })
    .refine((val) => val >= minUnlockTimestamp(), {
      message: 'Cho vũ trụ chút thời gian nha, ít nhất 7 ngày 🌙',
    }),
});

export type WishInput = z.infer<typeof wishSchema>;
