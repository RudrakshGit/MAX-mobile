import { test } from "node:test";
import assert from "node:assert/strict";
import { CARD_NOTE, CARE_WINDOW, chatPayload } from "./chat-payload.ts";

const u = (text: string) => ({ role: "user" as const, text });
const a = (text: string, kind?: string) => ({ role: "assistant" as const, text, kind });

test("a helpline card is sent as a note, so the model knows helplines were shown", () => {
  const p = chatPayload([u("im gonna kms"), a("", "crisis"), u("ye manas kaun hai")]);
  assert.deepEqual(p.messages.map((m) => m.text), ["im gonna kms", CARD_NOTE, "ye manas kaun hai"]);
  assert.equal(p.afterCrisis, true);
});

test("offline notes never reach the model", () => {
  const p = chatPayload([u("hi"), a("couldn't reach the internet", "offline"), u("hi again")]);
  assert.deepEqual(p.messages.map((m) => m.text), ["hi", "hi again"]);
  assert.equal(p.afterCrisis, false);
});

test("care mode ends once the card is out of the recent window", () => {
  const later = Array.from({ length: CARE_WINDOW }, (_, i) => (i % 2 ? a(`r${i}`) : u(`m${i}`)));
  assert.equal(chatPayload([u("x"), a("", "crisis"), ...later]).afterCrisis, false);
  assert.equal(chatPayload([u("x"), a("", "crisis"), ...later.slice(1)]).afterCrisis, true);
});
