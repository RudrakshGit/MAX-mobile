// What the phone sends to /api/chat. Pure, so it is tested (chat-payload.test.ts).

type M = { role: "user" | "assistant"; text: string; kind?: string };

/** How the helpline card reads to the model, so it knows helplines were already shown. The server also uses it to
 * score only what the student said after the card (see userTextsAfterCard). */
export const CARD_NOTE = "(I showed the student free helplines: Tele-MANAS 14416, open 24x7, and 112 for immediate danger.)";

/** A helpline card in the last few messages can put the next replies in care mode. */
export const CARE_WINDOW = 10;
/** Care mode lasts at most this many replies after a card; then MAX talks normally again (owner, 11 Nov 2026). */
export const CARE_REPLIES = 2;

// "I'm safe", "I feel safe", "safe hu", "theek hu", "it was a joke", "mazak tha"...
const SAFE =
  /\b(i('?m| am)?\s+(feel(ing)?\s+)?(safe|okay|ok|fine|alright|better)|i\s+feel\s+(safe|okay|fine|better)|(main|mai|me|mein)\s+(safe|theek|thik|thk)\s*(hu|hoon|hun|h)|(safe|theek|thik|thk)\s+(hu|hoon|hun)|(it\s+was\s+|just\s+)?(a\s+)?joke|joking|kidding|mazak|mazaak)\b/i;
// ...but not "not safe", "safe nahi hu", "I'm not okay"
const NOT =
  /\b(not|nahi|nahin|nhi|na|never)\b[^.?!]{0,14}\b(safe|okay|ok|fine|alright|theek|thik|better)\b|\b(safe|theek|thik|okay|fine)\b[^.?!]{0,8}\b(nahi|nahin|nhi|not)\b/i;

/** The student says they're safe now (and doesn't say they aren't). */
export const saysSafe = (text: string) => SAFE.test(text) && !NOT.test(text);

export function chatPayload(history: M[]) {
  const recent = history.slice(-CARE_WINDOW);
  const card = recent.map((m) => m.kind).lastIndexOf("crisis");
  const after = card < 0 ? [] : recent.slice(card + 1);
  const careReplies = after.filter((m) => m.role === "assistant" && m.kind === "care").length;
  // once the student has said they're safe, or MAX has already answered normally, care mode is over for this card
  const settled = after.some((m) => (m.role === "user" && saysSafe(m.text)) || (m.role === "assistant" && m.kind !== "care"));
  // care mode: a card was shown a moment ago, MAX hasn't checked in twice yet, and nothing has settled it
  const afterCrisis = card >= 0 && careReplies < CARE_REPLIES && !settled;
  const messages = history
    .filter((m) => m.kind !== "offline")
    .slice(-20)
    .map((m) => ({ role: m.role, text: m.kind === "crisis" ? CARD_NOTE : m.text }))
    .filter((m) => m.text);
  return { messages, afterCrisis };
}

/** The student's messages after the last helpline card (all of them if there's none). A message that already got a
 * card is never scored again, so it can't bring the card back on every later message. */
export function userTextsAfterCard(messages: { role: string; text: string }[]) {
  let from = 0;
  messages.forEach((m, i) => {
    if (m.role === "assistant" && m.text === CARD_NOTE) from = i + 1;
  });
  return messages.slice(from).filter((m) => m.role === "user").map((m) => m.text);
}
