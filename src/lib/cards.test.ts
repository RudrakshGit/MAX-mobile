import { test } from "node:test";
import assert from "node:assert/strict";
import { todaysCard } from "./cards.ts";
import { CARDS, type Card } from "../content/cards.ts";

const sampleCards: Card[] = [
  { id: "c1", type: "value", text: "Card 1" },
  { id: "c2", type: "step", text: "Card 2" },
  { id: "c3", type: "normal", text: "Card 3" },
  { id: "c4", type: "skill", text: "Card 4" },
];

test("todaysCard picks deterministically for a given date with empty history", () => {
  const cardA = todaysCard(sampleCards, [], "2026-10-20");
  const cardB = todaysCard(sampleCards, [], "2026-10-20");
  assert.equal(cardA.id, cardB.id);
});

test("todaysCard skips cards marked 'less'", () => {
  // If card 1 is picked by default, mark it as less
  const defaultCard = todaysCard(sampleCards, [], "2026-10-20");
  const history = [{ id: defaultCard.id, date: "2026-10-19", less: true }];
  const nextCard = todaysCard(sampleCards, history, "2026-10-20");
  assert.notEqual(nextCard.id, defaultCard.id);
});

test("todaysCard never repeats within 60 days when other cards available", () => {
  const history = [
    { id: "c1", date: "2026-10-01" },
    { id: "c2", date: "2026-10-02" },
    { id: "c3", date: "2026-10-03" },
  ];
  // Only c4 has not been seen in the last 60 days
  const card = todaysCard(sampleCards, history, "2026-10-20");
  assert.equal(card.id, "c4");
});

test("todaysCard returns existing card for today if already recorded", () => {
  const history = [{ id: "c3", date: "2026-10-20" }];
  const card = todaysCard(sampleCards, history, "2026-10-20");
  assert.equal(card.id, "c3");
});

test("todaysCard falls back gracefully when all cards have been seen within 60 days", () => {
  const history = [
    { id: "c1", date: "2026-10-01" },
    { id: "c2", date: "2026-10-02" },
    { id: "c3", date: "2026-10-03" },
    { id: "c4", date: "2026-10-04" },
  ];
  const card = todaysCard(sampleCards, history, "2026-10-20");
  assert.ok(sampleCards.some((c) => c.id === card.id));
});

test("todaysCard works on the full CARDS content pool", () => {
  assert.ok(CARDS.length >= 40);
  const card = todaysCard(CARDS, [], "2026-10-20");
  assert.ok(card.id);
  assert.ok(card.text);
  assert.ok(["value", "step", "normal", "skill"].includes(card.type));
});

test("todaysCard rotates to different cards when offset is provided", () => {
  const card0 = todaysCard(CARDS, [], "2026-10-20", 0);
  const card1 = todaysCard(CARDS, [], "2026-10-20", 1);
  const card2 = todaysCard(CARDS, [], "2026-10-20", 2);
  assert.notEqual(card0.id, card1.id);
  assert.notEqual(card1.id, card2);
});

