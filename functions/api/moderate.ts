import badWordsList from '../bad-words.json';

const BAD_WORD_REJECTION = 'Viết lại nhẹ nhàng hơn nha, vũ trụ nghe hết á 🌙';

const badWordsSet = new Set<string>(
  badWordsList.map((w: string) => w.trim().toLowerCase()).filter(Boolean)
);

// Diacritic collision words that must not be matched as bare single words without diacritics
// e.g. "đi dạo" (di), "đại học" / "dài" (dai), "du lịch" (du), "do đó" (do)
const DIACRITIC_COLLISION_WORDS = new Set(['di', 'dai', 'du', 'do']);

const strippedBadWordsSet = new Set<string>(
  badWordsList
    .map((w: string) => stripDiacritics(w.trim().toLowerCase()))
    .filter((w) => w.length >= 2 && (w.includes(' ') || !DIACRITIC_COLLISION_WORDS.has(w)))
);

function stripDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');
}

function normalizeLeet(str: string): string {
  return str
    .replace(/[@]/g, 'a')
    .replace(/[$]/g, 's')
    .replace(/[!|1]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[3]/g, 'e');
}

function collapseSpaced(str: string): string {
  const words = str.split(/\s+/);
  const result: string[] = [];
  let buffer: string[] = [];
  for (const w of words) {
    if (w.length === 1 && /[a-zA-Z0-9à-ỹÀ-Ỹ]/.test(w)) {
      buffer.push(w);
    } else {
      if (buffer.length > 1) result.push(buffer.join(''));
      else if (buffer.length === 1) result.push(buffer[0]);
      buffer = [];
      result.push(w);
    }
  }
  if (buffer.length > 1) result.push(buffer.join(''));
  else if (buffer.length === 1) result.push(buffer[0]);
  return result.join(' ');
}

export function containsBadWordsServer(text: string): boolean {
  if (!text) return false;

  const lower = text.toLowerCase();
  const deobfuscated = lower.replace(/([a-zA-Z0-9à-ỹÀ-Ỹ])[._\-*]+(?=[a-zA-Z0-9à-ỹÀ-Ỹ])/g, '$1');

  for (const candidate of [lower, deobfuscated]) {
    const leet = normalizeLeet(candidate);
    const cleanPunct = leet
      .normalize('NFC')
      .replace(/[._\-*+~`|/\\#@!$%^&()[\]{}<>?:;,"']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const collapsed = collapseSpaced(cleanPunct);

    for (const target of [cleanPunct, collapsed]) {
      const words = target.split(/\s+/).filter(Boolean);

      for (const word of words) {
        if (badWordsSet.has(word)) return true;
      }

      for (const phrase of badWordsSet) {
        if (phrase.includes(' ') && target.includes(phrase)) return true;
      }

      const stripped = stripDiacritics(target);
      const strippedWords = stripped.split(/\s+/).filter(Boolean);
      for (const word of strippedWords) {
        if (strippedBadWordsSet.has(word)) return true;
      }
      for (const phrase of strippedBadWordsSet) {
        if (phrase.includes(' ') && stripped.includes(phrase)) return true;
      }
    }
  }

  return false;
}

export const onRequestPost = async ({ request }: { request: Request }): Promise<Response> => {
  try {
    const body = (await request.json().catch(() => ({}))) as { content?: string };
    const content = body.content || '';

    if (containsBadWordsServer(content)) {
      return new Response(
        JSON.stringify({
          allowed: false,
          error: BAD_WORD_REJECTION,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ allowed: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
