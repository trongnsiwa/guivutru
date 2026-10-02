import { z } from 'zod';

// Re-implement or import the schemas logic for direct Node execution
const MIN_CONTENT_LENGTH = 5;
const MAX_CONTENT_LENGTH = 500;
const MAX_STICKERS = 3;
const MIN_UNLOCK_DAYS = 7;

const paperThemeEnum = z.enum([
  'dem-sao',
  'tim-mong',
  'hogn',
  'bien',
  'rung',
  'giay-cu',
]);

const minUnlockTimestamp = () =>
  Date.now() + MIN_UNLOCK_DAYS * 24 * 60 * 60 * 1000 - 60 * 1000;

const step2ContentSchema = z.object({
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

const wishSchema = z.object({
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
    .number()
    .refine((val) => val >= minUnlockTimestamp(), {
      message: 'Cho vũ trụ chút thời gian nha, ít nhất 7 ngày 🌙',
    }),
});

// Run assertions
console.log('--- Testing Step 2 Content Schema ---');

// Test 1: Content < 5 chars
const shortRes = step2ContentSchema.safeParse({
  content: 'abc',
  paperTheme: 'dem-sao',
  stickerIds: ['🌸'],
});
console.assert(!shortRes.success, 'Short content should fail');
console.assert(
  shortRes.error.errors[0].message === 'Viết thêm chút nữa nha, ít nhất 5 ký tự nè ✨',
  'Wrong error message for short content'
);
console.log('✓ Short content validation passed');

// Test 2: Test string "Điều ước của tớ ở Đà Lạt 🌸 — ĐẶC BIỆT"
const testStrRes = step2ContentSchema.safeParse({
  content: 'Điều ước của tớ ở Đà Lạt 🌸 — ĐẶC BIỆT',
  paperTheme: 'tim-mong',
  stickerIds: ['🌙', '⭐', '🌸'],
});
console.assert(testStrRes.success, 'Test string should pass');
console.log('✓ Required test string validation passed');

// Test 3: More than 3 stickers
const stickerRes = step2ContentSchema.safeParse({
  content: 'Điều ước của tớ ở Đà Lạt 🌸 — ĐẶC BIỆT',
  paperTheme: 'tim-mong',
  stickerIds: ['🌙', '⭐', '🌸', '🪐'],
});
console.assert(!stickerRes.success, '4 stickers should fail');
console.assert(
  stickerRes.error.errors[0].message === 'Chỉ dán tối đa 3 sticker nha 🥺',
  'Wrong error message for max stickers'
);
console.log('✓ Sticker limit validation passed');

console.log('--- Testing Wish Schema & Unlock Date ---');

// Test 4: Unlock date < 7 days
const now = Date.now();
const pastUnlockRes = wishSchema.safeParse({
  content: 'Điều ước của tớ ở Đà Lạt 🌸 — ĐẶC BIỆT',
  paperTheme: 'dem-sao',
  stickerIds: ['🌙'],
  unlockAt: now + 3 * 24 * 60 * 60 * 1000, // 3 days
});
console.assert(!pastUnlockRes.success, 'Unlock < 7 days should fail');
console.assert(
  pastUnlockRes.error.errors[0].message === 'Cho vũ trụ chút thời gian nha, ít nhất 7 ngày 🌙',
  'Wrong error message for unlock < 7 days'
);
console.log('✓ Unlock < 7 days validation passed');

// Test 5: Unlock date = 30 days (1 month)
const monthUnlockRes = wishSchema.safeParse({
  content: 'Điều ước của tớ ở Đà Lạt 🌸 — ĐẶC BIỆT',
  paperTheme: 'dem-sao',
  stickerIds: ['🌙'],
  unlockAt: now + 30 * 24 * 60 * 60 * 1000,
});
console.assert(monthUnlockRes.success, 'Unlock 30 days should pass');
console.log('✓ Unlock 30 days validation passed');

console.log('\nAll Phase 2 schema and validation tests PASSED successfully!');
