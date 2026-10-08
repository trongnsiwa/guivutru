import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { step2ContentSchema, wishSchema } from '../src/lib/schemas.ts';
import { getSupportedAudioMimeType } from '../src/lib/audio.ts';

describe('Voice Notes Mini-Spec Verification', () => {
  const MIN_UNLOCK = Date.now() + 8 * 24 * 60 * 60 * 1000;

  it('VERIFY 1: Audio-only note: 5-char text minimum is bypassed when hasAudio is true', () => {
    // 0-character text with audio: MUST PASS
    const step2AudioOnly = step2ContentSchema.safeParse({
      content: '',
      paperTheme: 'dem-sao',
      stickerIds: [],
      hasAudio: true,
    });
    assert.strictEqual(step2AudioOnly.success, true, 'Audio-only note must pass Step 2 validation');

    const wishAudioOnly = wishSchema.safeParse({
      content: '',
      paperTheme: 'dem-sao',
      stickerIds: [],
      unlockAt: MIN_UNLOCK,
      hasAudio: true,
    });
    assert.strictEqual(wishAudioOnly.success, true, 'Audio-only note must pass seal validation');
  });

  it('VERIFY 2: Text-only note still enforces 5-character minimum when hasAudio is false or omitted', () => {
    const invalidText = step2ContentSchema.safeParse({
      content: 'abc', // 3 chars
      paperTheme: 'dem-sao',
      stickerIds: [],
      hasAudio: false,
    });
    assert.strictEqual(invalidText.success, false);
    assert.ok(invalidText.error?.errors.some((e) => e.message.includes('ít nhất 5 ký tự')));

    const validText = step2ContentSchema.safeParse({
      content: '12345',
      paperTheme: 'dem-sao',
      stickerIds: [],
    });
    assert.strictEqual(validText.success, true);
  });

  it('VERIFY 3: Audio note still respects 500-character maximum cap', () => {
    const tooLong = 'a'.repeat(501);
    const result = step2ContentSchema.safeParse({
      content: tooLong,
      paperTheme: 'dem-sao',
      stickerIds: [],
      hasAudio: true,
    });
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.errors.some((e) => e.message.includes('tối đa 500 ký tự')));
  });

  it('VERIFY 4: Supported audio mime type fallback logic', () => {
    // Under Node runtime MediaRecorder is undefined, function returns default 'audio/webm'
    const mime = getSupportedAudioMimeType();
    assert.strictEqual(mime, 'audio/webm');
  });
});
