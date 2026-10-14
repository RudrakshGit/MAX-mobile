import type { Course } from "./types";

export const STATUS = "draft" as const;

export const overthinking: Course = {
  id: "overthinking",
  title: "Overthinking & worry",
  summary: "Techniques to quiet a racing mind and distinguish real problems from mental loops.",
  category: "worry",
  days: [
    {
      day: 1,
      title: "Worry vs real problems",
      body: [
        "Your mind spends hours cycling through hypothetical scenarios: 'What if the interview panel asks about that one gap?' 'What if my friends are mad at me?' 'What if I fail in life?'",
        "Psychologists classify thoughts into two buckets: actionable problems and hypothetical worries.",
        "An actionable problem is happening right now and has something you can physically do about it today (like submitting an assignment before 5 PM). A hypothetical worry begins with 'What if...' and deals with uncertain future events beyond your immediate control.",
        "When a thought shows up, ask yourself: 'Is this an actionable problem right now, or a what-if worry?' If it is a what-if worry, recognize that solving it in your head only feeds the loop.",
      ],
      action: { tool: "reframe" },
      watch: "therapy-stop-worrying",
      source: "Generalized Anxiety Disorder CBT Protocol (Dugas & Robichaud, 2007)",
      licence: "MAX Original adaptation",
    },
    {
      day: 2,
      title: "The worry time technique",
      body: [
        "Trying to completely banish anxious thoughts never works—it is like trying not to think of a white elephant. The harder you push it away, the more it resurfaces.",
        "Instead of fighting worry throughout the day, try 'Worry Time'. Set aside a dedicated 15-minute window every day (for example, 5:30 PM to 5:45 PM, not right before bed).",
        "Whenever a worry strikes during your morning lectures or study sessions, note it down on a piece of paper or in your phone: 'I will consider this during my 5:30 PM worry time.' Then return to what you were doing.",
        "When 5:30 PM arrives, sit down with your list. You will often find that half the worries no longer feel urgent. For the remaining ones, brainstorm practical steps.",
      ],
      action: { write: "Pick a 15-minute slot today for your worry time (e.g., 5:00 PM)." },
      watch: "therapy-scheduled-worry",
      source: "Stimulus control for worry (Borkovec et al., 1983)",
      licence: "MAX Original adaptation",
    },
    {
      day: 3,
      title: "Five steps to solve a problem",
      body: [
        "When an issue is genuinely actionable, brooding over it keeps you trapped in anxiety. Structured problem-solving turns vague dread into concrete steps.",
        "Step 1: Define the specific problem in one clear sentence. (e.g. 'I do not understand the database project requirements.')",
        "Step 2: Brainstorm 3 to 4 possible actions without judging them (ask the TA, check the documentation, message a project partner, review lecture slides).",
        "Step 3: Pick the simplest, lowest-friction step.",
        "Step 4: Decide exactly when and where you will do it.",
        "Step 5: Review afterwards. Did it help? If not, try the next option. Action dissolves anxiety.",
      ],
      action: { tool: "spiral" },
      watch: "emm-tackle-worries",
      source: "Problem-Solving Therapy (Nezu, Nezu & D'Zurilla, 2013)",
      licence: "MAX Original adaptation",
    },
    {
      day: 4,
      title: "Unhooking from the mental loop",
      body: [
        "Overthinking feels like trying to untangle a knotted ball of wool. Every time you pull a strand, the knot gets tighter.",
        "Notice what rumination feels like physically: shallow breathing, clenched teeth, a furrowed brow, or restlessness in your legs.",
        "The goal is not to force the thoughts to vanish, but to 'unhook' your attention from them. A thought is just mental chatter, not an urgent command.",
        "Mentally label the process: 'Here is the overthinking loop again.' Then gently shift your focus to what your hands or feet are doing in this present moment.",
      ],
      action: { tool: "ground" },
      watch: "therapy-overthinking-skills",
      source: "Acceptance and Commitment Therapy (Hayes, Strosahl & Wilson, 2011)",
      licence: "MAX Original adaptation",
    },
    {
      day: 5,
      title: "Returning to the present",
      body: [
        "Overthinking constantly pulls you into either the past ('Why did I say that in the meeting?') or the future ('What will happen during campus placements?').",
        "Your life, your senses, and your real power exist only in the present moment.",
        "Whenever you catch yourself lost in a mental vortex, bring your awareness back to your immediate environment. Notice the sensation of air entering your nostrils, the taste of your tea, or the sound of birds outside your window.",
        "Each time you notice you were lost and gently return, you strengthen the neural pathway of calm presence.",
      ],
      action: { tool: "breathe" },
      watch: "who-dwm-tool1",
      source: "Mindfulness-Based Stress Reduction (Kabat-Zinn, 1990)",
      licence: "MAX Original adaptation",
    },
  ],
};
