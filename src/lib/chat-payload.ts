// What the phone sends to /api/chat. Pure, so it is tested (chat-payload.test.ts).

type M = { role: "user" | "assistant"; text: string; kind?: string };

/** How the helpline card reads to the model, so it knows helplines were already shown. */
export const CARD_NOTE = "(I showed the student free helplines: Tele-MANAS 14416, open 24x7, and 112 for immediate danger.)";

/** A helpline card in the last few messages: the next replies stay in care mode instead of repeating the card. */
export const CARE_WINDOW = 10;

export function chatPayload(history: M[]) {
  const afterCrisis = history.slice(-CARE_WINDOW).some((m) => m.kind === "crisis");
  const messages = history
    .filter((m) => m.kind !== "offline")
    .slice(-20)
    .map((m) => ({ role: m.role, text: m.kind === "crisis" ? CARD_NOTE : m.text }))
    .filter((m) => m.text);
  return { messages, afterCrisis };
}
