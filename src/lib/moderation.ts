import badWordsList from '../../functions/bad-words.json' with { type: 'json' };

export const BAD_WORD_REJECTION = 'Viết lại nhẹ nhàng hơn nha, vũ trụ nghe hết á 🌙';
export const RATE_LIMIT_REJECTION = 'Bạn đã gửi hôm nay rồi, mai quay lại nha 🌙';

// Normalized set of forbidden terms
const badWordsSet = new Set(
  badWordsList.map((w: string) => w.trim().toLowerCase()).filter(Boolean)
);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFC')
    // Replace non-alphanumeric punctuation commonly used to bypass filters with space or empty
    .replace(/[._\-*+~`|/\\#@!$%^&()[\]{}<>?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Pre-filter check for Vietnamese + English bad words per §3.4.
 * Returns true if text contains prohibited terms.
 */
export function containsBadWords(text: string): boolean {
  if (!text) return false;
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);

  // 1. Single word check
  for (const word of words) {
    if (badWordsSet.has(word)) {
      return true;
    }
  }

  // 2. Multi-word phrase check (e.g. "du má", "địt mẹ", "chó đẻ")
  for (const phrase of badWordsSet) {
    if (phrase.includes(' ')) {
      if (normalized.includes(phrase)) {
        return true;
      }
    }
  }

  // 3. Compacted check (detect bypass like "d.m" or "v_l")
  const compacted = normalized.replace(/\s+/g, '');
  for (const phrase of badWordsSet) {
    if (phrase.length >= 2 && compacted.includes(phrase.replace(/\s+/g, ''))) {
      return true;
    }
  }

  return false;
}
