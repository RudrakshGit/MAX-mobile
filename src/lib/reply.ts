// Backstops for what the prompt asks but models don't always do.

// NFD + dropping U+0300–036F removes Latin accents ("Lagtā") but leaves
// Devanagari matras alone: those live in U+0900–097F.
export const plain = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC").replace(/\*\*|__/g, "").replace(/^#+\s*/gm, "").trim();

const HINGLISH = /\b(hai|hain|nahi|nhi|kya|kyu|kyun|mujhe|mera|meri|mere|yaar|raha|rahi|kuch|bahut|bohot|aaj|kal|lag|lagta|ho|gaya|gayi|karna|kar|tha|thi|sab|koi|bhi|aur|toh|matlab|pata)\b/gi;

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
