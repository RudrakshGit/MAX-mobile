// DRAFT — owner review required
// Today's cards: rotating daily prompts in MAX's voice for Indian college students.
// 4 types: value (values affirmation), step (micro-action), normal (common humanity), skill (coping nudge).
// No generic "I am enough" / "I am lovable" affirmations (Wood et al. 2009).

export type CardType = "value" | "step" | "normal" | "skill";

export type Card = {
  id: string;
  type: CardType;
  text: string;
  action?: { label: string; href: string };
};

export const CARDS: Card[] = [
  // --- VALUE (11 cards) ---
  {
    id: "val-01",
    type: "value",
    text: "When everything feels urgent, what really matters to you today: finishing syllabus, resting, or checking in on a friend?",
  },
  {
    id: "val-02",
    type: "value",
    text: "College can make marks feel like your whole identity. What is one personal quality you value in yourself outside grades?",
  },
  {
    id: "val-03",
    type: "value",
    text: "Family expectations can weigh heavy. What is one personal value you want to hold onto for yourself this semester?",
  },
  {
    id: "val-04",
    type: "value",
    text: "Rest is not a reward you only earn after burning out. Your physical health is a core value, not a side errand.",
  },
  {
    id: "val-05",
    type: "value",
    text: "If you could show up for one person today with honest kindness, who would that be?",
  },
  {
    id: "val-06",
    type: "value",
    text: "Learning is often messy before it clicks. What made you curious about your course in the first place?",
  },
  {
    id: "val-07",
    type: "value",
    text: "Integrity matters more than matching everyone's pace. What does doing your honest best look like today?",
  },
  {
    id: "val-08",
    type: "value",
    text: "Friendships make campus life survivable. When did you last share a quiet tea or laugh without checking the clock?",
  },
  {
    id: "val-09",
    type: "value",
    text: "True progress is usually quiet. What is one small way you honoured your own effort this week?",
  },
  {
    id: "val-10",
    type: "value",
    text: "Honesty with yourself takes courage. Is there an expectation on your shoulders that isn't actually yours to carry?",
  },
  {
    id: "val-11",
    type: "value",
    text: "Being patient with yourself when you don't understand a concept is a form of self-respect.",
  },

  // --- STEP (11 cards) ---
  {
    id: "stp-01",
    type: "step",
    text: "Stuck staring at a blank document? Write just two messy sentences without backspacing.",
  },
  {
    id: "stp-02",
    type: "step",
    text: "Overwhelmed by a long to-do list? Pick the smallest 2-minute task, complete it, and take a pause.",
    action: { label: "One-minute reset", href: "/tool/breathe" },
  },
  {
    id: "stp-03",
    type: "step",
    text: "Haven't stepped out of your room today? Walk to the porch or hostel balcony for 60 seconds of fresh air.",
  },
  {
    id: "stp-04",
    type: "step",
    text: "Assignments piling up? If anxiety spikes, take three slow diaphragmatic breaths before opening the next tab.",
    action: { label: "Breathing tool", href: "/tool/breathe" },
  },
  {
    id: "stp-05",
    type: "step",
    text: "Phone pulling your attention into endless loops? Put it face down across the room for the next 20 minutes.",
  },
  {
    id: "stp-06",
    type: "step",
    text: "If your mind is racing before bed tonight, write down the three things bothering you onto paper.",
    action: { label: "Write it down", href: "/journal-new" },
  },
  {
    id: "stp-07",
    type: "step",
    text: "Have you had a glass of water since morning? Take a sip before you read the next paragraph.",
  },
  {
    id: "stp-08",
    type: "step",
    text: "When procrastination feels heavy: tell yourself you will only do five minutes, then give yourself permission to stop.",
  },
  {
    id: "stp-09",
    type: "step",
    text: "Send a quick one-line check-in message to family or a friend who might be waiting to hear from you.",
  },
  {
    id: "stp-10",
    type: "step",
    text: "If you have been sitting in the same chair for two hours straight, stand up and roll your shoulders back.",
  },
  {
    id: "stp-11",
    type: "step",
    text: "Before opening social media right now, pause for one full breath and ask what you actually need.",
    action: { label: "One-minute reset", href: "/tool/breathe" },
  },

  // --- NORMAL (11 cards) ---
  {
    id: "nrm-01",
    type: "normal",
    text: "Lots of students feel behind during placement and exam season. Feeling behind is not the same as actually being behind.",
  },
  {
    id: "nrm-02",
    type: "normal",
    text: "It is normal to feel lonely in a crowded college hostel or mess. Finding your people takes time.",
  },
  {
    id: "nrm-03",
    type: "normal",
    text: "Everyone's LinkedIn looks like they have life figured out. Nobody posts the rejections, fatigue, or doubt.",
  },
  {
    id: "nrm-04",
    type: "normal",
    text: "Having an unproductive day does not erase three months of hard work. Bad days happen to everyone.",
  },
  {
    id: "nrm-05",
    type: "normal",
    text: "People around you often pretend exams are effortless. Almost all of them are anxious under the surface.",
  },
  {
    id: "nrm-06",
    type: "normal",
    text: "Missing home or feeling out of place in a new city is completely natural, even months into college.",
  },
  {
    id: "nrm-07",
    type: "normal",
    text: "A low test score or harsh review from a faculty member stings, but it measures a snapshot, not your future.",
  },
  {
    id: "nrm-08",
    type: "normal",
    text: "Tiredness is not a character flaw or laziness. It is your body asking for recovery.",
  },
  {
    id: "nrm-09",
    type: "normal",
    text: "Comparing your internal struggle to everyone else's polished exterior will always feel unfair.",
  },
  {
    id: "nrm-10",
    type: "normal",
    text: "Some days just attending class, eating your meals, and getting through the day is more than enough.",
  },
  {
    id: "nrm-11",
    type: "normal",
    text: "Not knowing what you want to do after graduation is far more common than people admit in final year.",
  },

  // --- SKILL (11 cards) ---
  {
    id: "skl-01",
    type: "skill",
    text: "Caught in a thought spiral? Label it: 'I am having the thought that I might fail.' Notice it is a thought, not a fact.",
    action: { label: "Build a spiral breaker", href: "/tool/spiral" },
  },
  {
    id: "skl-02",
    type: "skill",
    text: "Notice your shoulders right now. Are they raised near your ears? Drop them down and unclench your jaw.",
    action: { label: "One-minute reset", href: "/tool/breathe" },
  },
  {
    id: "skl-03",
    type: "skill",
    text: "When self-criticism gets harsh, ask: would you speak these exact words to your closest friend?",
    action: { label: "Reframe a thought", href: "/tool/spiral" },
  },
  {
    id: "skl-04",
    type: "skill",
    text: "Ground yourself: notice 5 things you can see, 4 you can touch, and 3 you can hear around you.",
  },
  {
    id: "skl-05",
    type: "skill",
    text: "Overthinking a past viva or awkward chat? Remind yourself: you cannot edit the past from right here.",
  },
  {
    id: "skl-06",
    type: "skill",
    text: "If studying feels paralysing, break the chapter into just one heading. Read only that single section.",
  },
  {
    id: "skl-07",
    type: "skill",
    text: "When racing thoughts keep you awake, breathe in for 4 seconds and breathe out gently for 6.",
    action: { label: "Breathe", href: "/tool/breathe" },
  },
  {
    id: "skl-08",
    type: "skill",
    text: "Separate what is in your control (today's preparation) from what isn't (the examiner's mood).",
  },
  {
    id: "skl-09",
    type: "skill",
    text: "If a peer's comment stung today, take ten slow seconds before reacting. Give yourself space.",
  },
  {
    id: "skl-10",
    type: "skill",
    text: "Notice the story your brain is spinning about tomorrow. Anticipation is not prediction.",
  },
  {
    id: "skl-11",
    type: "skill",
    text: "When a spiral starts, plan what you will do: an if-then rule gives you a clear exit ramp.",
    action: { label: "Spiral plan", href: "/tool/spiral" },
  },
];
