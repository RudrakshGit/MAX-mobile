// Which tool to offer under a reply is decided here, by rules we can test,
// not by asking the model to emit tags it may forget or invent.

export type Suggestion = { label: string; href: string };

const rules: { re: RegExp; s: Suggestion }[] = [
  { re: /\b(panic|heart\s+(is\s+)?racing|can'?t\s+breathe|ghabra|saans|shaking|anxiety\s+attack)/i, s: { label: "5-4-3-2-1 grounding", href: "/tool/ground" } },
  { re: /\b(sleep|insomnia|neend|nind|awake|so\s+nahi|raat\s+bhar|3\s?am|2\s?am|4\s?am)/i, s: { label: "Phone and sleep", href: "/lesson/phone-sleep" } },
  { re: /\b(scroll|reels|instagram|youtube|procrastinat|addict|habit|loop|again\s+and\s+again|baar\s+baar)/i, s: { label: "Spiral breaker", href: "/tool/spiral" } },
  { re: /\b(overthink|thinks?\s+i'?m|everyone|failure|stupid|useless|should\s+have|never\s+going|sab\s+log|log\s+kya)/i, s: { label: "Reframe the thought", href: "/tool/reframe" } },
  { re: /\b(stress|pressure|tension|overwhelm|anxious|nervous|worried|dar\s+lag)/i, s: { label: "One-minute reset", href: "/tool/breathe" } },
];

export function suggestFor(text: string): Suggestion[] {
  const out: Suggestion[] = [];
  for (const { re, s } of rules) if (re.test(text) && out.length < 2) out.push(s);
  return out;
}
