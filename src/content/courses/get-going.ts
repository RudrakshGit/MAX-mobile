import type { Course } from "./types";

export const STATUS = "draft" as const;

export const getGoing: Course = {
  id: "get-going",
  title: "Get going again",
  summary: "Behavioural activation tools for low mood, inertia, and chronic procrastination.",
  category: "mood",
  days: [
    {
      day: 1,
      title: "Action before motivation",
      body: [
        "When you feel low or overwhelmed, you tell yourself: 'I will start studying when I feel like it,' or 'I will clean my desk once motivation strikes.'",
        "The cruel catch of low mood is that motivation rarely strikes while you are lying in bed. Waiting to feel like doing something before doing it keeps you stuck for days.",
        "In Behavioural Activation, one of the most effective therapies for depression, we invert the equation: Action comes first, and feelings follow.",
        "When you take even a tiny step, your brain registers slight progress, releasing dopamine and generating momentum. You do not need to feel motivated to start; you just need to start tiny.",
      ],
      action: { tool: "breathe" },
      watch: "therapy-behavioral-activation",
      source: "Behavioral Activation for Depression: A Clinician's Guide (Martell, Dimidjian & Herman-Dunn, 2010)",
      licence: "MAX Original adaptation",
    },
    {
      day: 2,
      title: "Shrinking the task to a tiny size",
      body: [
        "Looking at a 50-page technical report or a messy room makes your brain perceive threat and cognitive overwhelm, triggering procrastination.",
        "Shrink the task until your brain can no longer offer resistance. If 'write the lab report' feels impossible, shrink it to 'open the document and type the heading.'",
        "If 'study for the exam' feels paralyzing, shrink it to 'read just one page of Unit 1.'",
        "A tiny task feels ridiculous to avoid. Once the friction of starting is removed, continuing is often surprisingly easy.",
      ],
      action: { write: "What is one task you are avoiding, and what is its tinies possible first step?" },
      watch: "ted-ed-procrastinate",
      source: "Ideas from the books Atomic Habits (Clear, 2018) and Tiny Habits (Fogg, 2019); not a clinical protocol",
      licence: "MAX Original adaptation",
    },
    {
      day: 3,
      title: "The two-minute start rule",
      body: [
        "The hardest part of any journey is overcoming static inertia. The energy required to move from resting to moving is ten times greater than keeping momentum going.",
        "Make an agreement with yourself: 'I will only work on this for two minutes. If I still want to stop after two minutes, I give myself full permission to stop.'",
        "Set a timer for 120 seconds. Open the book, write one paragraph, or wash two dishes. Do not worry about doing it well; just do it for two minutes.",
        "Nine times out of ten, once you cross the threshold of starting, the dread evaporates and you choose to keep going.",
      ],
      action: { tool: "spiral" },
      watch: "therapy-overwhelm-do-stuff",
      source: "The two-minute rule from Atomic Habits (Clear, 2018); not a clinical protocol",
      licence: "MAX Original adaptation",
    },
    {
      day: 4,
      title: "If-then anchors for low-energy days",
      body: [
        "Some days in college you wake up completely drained. The mess food is unappetizing, you feel exhausted, and your brain wants to shut down.",
        "Relying on motivation on low-energy days is a recipe for guilt. What saves these days is having pre-decided low-friction routines.",
        "Create an if-then rule for hard days: 'If I feel too tired to study, then I will put on headphones and listen to one recorded lecture while taking a walk outside.'",
        "Or: 'If I cannot write code today, then I will simply organize my notes for 10 minutes.' Meeting yourself where you are prevents a low day from turning into a downward spiral.",
      ],
      action: { tool: "spiral" },
      watch: "who-depression-talk",
      source: "Implementation Intentions for Goal Attainment (Gollwitzer & Sheeran, 2006)",
      licence: "MAX Original adaptation",
    },
    {
      day: 5,
      title: "Self-forgiveness after a zero day",
      body: [
        "You spent the entire Sunday scrolling on your phone and accomplishing nothing. Evening arrives, and heavy guilt and self-loathing take over.",
        "Research shows that beating yourself up for procrastinating actually increases stress, making you even more likely to procrastinate again tomorrow.",
        "Students who practice self-forgiveness after falling behind rebound significantly faster than those who dwell in self-blame.",
        "Acknowledge the zero day without drama: 'I lost today to exhaustion or distraction. That is human and normal. Tomorrow is a fresh, clean slate.'",
      ],
      action: { tool: "reframe" },
      watch: "therapy-micro-habits-depression",
      source: "Wohl, Pychyl & Bennett (2010), “I forgive myself, now I can study”, Personality and Individual Differences",
      licence: "MAX Original adaptation",
    },
  ],
};
