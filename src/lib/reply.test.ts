import { test } from "node:test";
import assert from "node:assert/strict";
import { oneQuestion, plain } from "./reply.ts";

test("keeps statements and only the first question", () => {
  assert.equal(oneQuestion("That sounds hard. What happened? Could it be mind-reading? Try one breath."), "That sounds hard. What happened? Try one breath.");
  assert.equal(oneQuestion("No questions here. Just support."), "No questions here. Just support.");
});

test("strips markdown emphasis and headings", () => {
  assert.equal(plain("Tap the **Help** button\n## Next"), "Tap the Help button\nNext");
});

import { replyLanguage } from "./reply.ts";

test("strips Latin accents but keeps Devanagari intact", () => {
  assert.equal(plain("Lagtā hai tum akelā ho"), "Lagta hai tum akela ho");
  // a model once ended a reply with "(End)"
  assert.equal(plain("chalo grounding try karte hain?(End)"), "chalo grounding try karte hain?");
  assert.equal(plain("मुझे नींद नहीं आती"), "मुझे नींद नहीं आती");
});

test("detects the student's language", () => {
  assert.equal(replyLanguage("I failed my midsem and everyone thinks I'm stupid"), "english");
  assert.equal(replyLanguage("roommate se ladai ho gayi, akela feel ho raha hai"), "hinglish");
  assert.equal(replyLanguage("मुझे नींद नहीं आती"), "hindi");
  // short Hinglish replies used to come back in English (found in the end-to-end chat check)
  assert.equal(replyLanguage("haan safe hu, bas bura laga"), "hinglish");
  assert.equal(replyLanguage("Are baat karo na"), "hinglish");
  assert.equal(replyLanguage("i am safe, just really tired"), "english");
});

import { extractTestChip } from "./reply.ts";

test("extractTestChip strips markers and returns first allowed id", () => {
  const allowed = ["phq9", "gad7", "sci"];

  // Marker stripped and allowed id returned
  const r1 = extractTestChip("It might help to check in.\n\n[[test:phq9]]", allowed);
  assert.equal(r1.text, "It might help to check in.");
  assert.equal(r1.testId, "phq9");

  // Unknown id ignored, marker stripped
  const r2 = extractTestChip("Try this out [[test:unknown]]", allowed);
  assert.equal(r2.text, "Try this out");
  assert.equal(r2.testId, undefined);

  // No marker -> unchanged
  const r3 = extractTestChip("Just normal text.", allowed);
  assert.equal(r3.text, "Just normal text.");
  assert.equal(r3.testId, undefined);

  // Multiple markers -> all stripped, first allowed returned
  const r4 = extractTestChip("See [[test:unknown]] or [[test:sci]]", allowed);
  assert.equal(r4.text, "See or");
  assert.equal(r4.testId, "sci");
});
