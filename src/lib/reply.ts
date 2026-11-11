// Backstops for what the prompt asks but models don't always do.

// NFD + dropping U+0300–036F removes Latin accents ("Lagtā") but leaves
// Devanagari matras alone: those live in U+0900–097F.
export const plain = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC").replace(/\*\*|__/g, "").replace(/^#+\s*/gm, "").replace(/\s*[([]end[)\]]\s*$/i, "").trim();

// (only words that aren't also common English words: no "main", "to", "me", "bus")
const HINGLISH = /\b(hai|hain|nahi|nhi|kya|kyu|kyun|mujhe|mera|meri|mere|yaar|yrr|raha|rahi|kuch|bahut|bohot|aaj|kal|lag|lagta|laga|lagi|ho|hu|hoon|hun|haan|han|gaya|gayi|karna|kar|karo|tha|thi|sab|koi|bhi|aur|toh|matlab|pata|bas|bura|accha|acha|theek|thik|tum|tu|kaise|kaisa|kaun|abhi|bhai|wala|wale|mila|hua|hui|nahin|kyunki|ab)\b/gi;

/** Which language to answer in, decided from the student's own words. */
export function replyLanguage(text: string): "hindi" | "hinglish" | "english" {
  if (/[\u0900-\u097f]/.test(text)) return "hindi";
  const words = text.split(/\s+/).filter(Boolean).length || 1;
  return (text.match(HINGLISH)?.length ?? 0) / words >= 0.15 ? "hinglish" : "english";
}

/** Keep the first question; drop any later sentence that is also a question. */
export function oneQuestion(text: string) {
  const parts = text.match(/[^.?!\n]+[.?!]*["”’)]*\s*/g) ?? [text];
  let asked = false;
  return parts
    .filter((p) => {
      if (!p.trim().endsWith("?") && !/\?["”’)]*\s*$/.test(p)) return true;
      if (asked) return false;
      asked = true;
      return true;
    })
    .join("")
    .replace(/\s+\n/g, "\n")
    .trim();
}

const TEST_MARKER = /\s*\[\[test:([a-zA-Z0-9_-]+)\]\]/g;

/** Strips every [[test:...]] marker and returns the first allowed id (unknown ids are dropped). */
export function extractTestChip(
  text: string,
  allowedIds: string[] | Set<string> = []
): { text: string; testId?: string } {
  const allowedSet = allowedIds instanceof Set ? allowedIds : new Set(allowedIds);
  let testId: string | undefined;

  for (const match of text.matchAll(/\[\[test:([a-zA-Z0-9_-]+)\]\]/g)) {
    const id = match[1];
    if (allowedSet.has(id)) {
      testId = id;
      break;
    }
  }

  const cleaned = text.replace(TEST_MARKER, "").trim();
  return { text: cleaned, testId };
}
