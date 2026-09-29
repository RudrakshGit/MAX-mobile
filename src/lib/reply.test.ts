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
  assert.equal(plain("मुझे नींद नहीं आती"), "मुझे नींद नहीं आती");
});

test("detects the student's language", () => {
  assert.equal(replyLanguage("I failed my midsem and everyone thinks I'm stupid"), "english");
  assert.equal(replyLanguage("roommate se ladai ho gayi, akela feel ho raha hai"), "hinglish");
  assert.equal(replyLanguage("मुझे नींद नहीं आती"), "hindi");
});
