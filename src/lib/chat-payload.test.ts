import { test } from "node:test";
import assert from "node:assert/strict";
import { CARD_NOTE, CARE_WINDOW, chatPayload, saysSafe, userTextsAfterCard } from "./chat-payload.ts";

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
});

test("care mode lasts two replies, then MAX talks normally (owner's screenshot)", () => {
  const start = [u("im gonna kms"), a("", "crisis")];
  assert.equal(chatPayload([...start, u("Hi")]).afterCrisis, true);
  assert.equal(chatPayload([...start, u("Hi"), a("are you safe?", "care"), u("hmm")]).afterCrisis, true);
  assert.equal(chatPayload([...start, u("Hi"), a("are you safe?", "care"), u("hmm"), a("ok", "care"), u("college was long")]).afterCrisis, false);
});

test("saying you're safe ends care mode at once; saying you aren't keeps it", () => {
  const start = [u("im gonna kms"), a("", "crisis"), u("Hi"), a("are you safe?", "care")];
  assert.equal(chatPayload([...start, u("Yes I feel safe")]).afterCrisis, false);
  assert.equal(chatPayload([...start, u("haan safe hu")]).afterCrisis, false);
  assert.equal(chatPayload([...start, u("nahi, safe nahi hu")]).afterCrisis, true);
  assert.equal(chatPayload([...start, u("I'm not okay")]).afterCrisis, true);
});

test("once settled, care mode doesn't come back for that card (the reply after 'I feel safe' was normal)", () => {
  const h = [u("I want to die"), a("", "crisis"), u("Hi"), a("are you safe?", "care"), u("Yes I feel safe"), a("glad to hear it"), u("presentation achhi gayi")];
  assert.equal(chatPayload(h).afterCrisis, false);
  const h2 = [u("kms"), a("", "crisis"), u("hmm"), a("safe?", "care"), u("long day"), a("safe?", "care"), u("exam kal"), a("breathe"), u("ok")];
  assert.equal(chatPayload(h2).afterCrisis, false);
});

test("a new card starts care mode again", () => {
  const h = [u("I want to die"), a("", "crisis"), u("safe now"), a("glad"), u("actually i still want to die"), a("", "crisis"), u("hi")];
  assert.equal(chatPayload(h).afterCrisis, true);
});

test("safety phrases", () => {
  for (const s of ["Yes I feel safe", "I'm safe now", "i am fine", "main theek hu", "safe hu yaar", "it was a joke", "mazak tha bhai", "just kidding"]) assert.equal(saysSafe(s), true, s);
  for (const s of ["I don't feel safe", "not safe", "safe nahi hu", "i am not fine", "theek nahi hu", "hi", "what is tele manas"]) assert.equal(saysSafe(s), false, s);
});

test("only what came after the last card is scored", () => {
  const msgs = [u("im gonna kms"), { role: "assistant", text: CARD_NOTE }, u("Hi"), { role: "assistant", text: "are you safe?" }, u("Yes I feel safe")];
  assert.deepEqual(userTextsAfterCard(msgs), ["Hi", "Yes I feel safe"]);
  assert.deepEqual(userTextsAfterCard([u("a"), u("b")]), ["a", "b"]);
});
