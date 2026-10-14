// Short lessons. Every claim here traces to the source listed under it.
// Keep them plain, warm and under two minutes to read.

export type Lesson = { id: string; title: string; sub: string; body: string[]; tryThis?: { label: string; href: string }; sources: string[] };

export const lessons: Lesson[] = [
  {
    id: "alarm",
    title: "Your body's alarm system",
    sub: "Why stress feels physical, and why that's not a flaw",
    body: [
      "When your brain senses a threat, like an exam, a fight, or a message you're dreading, your sympathetic nervous system switches on. Heart rate rises, breathing speeds up, muscles tense. This is the fight-or-flight response, and it evolved to protect you.",
      "Its partner, the parasympathetic system, brings you back down: slower heart, deeper breath, digestion back on. Both are normal. Neither is broken.",
      "Psychiatrist Dan Siegel calls the zone where you can feel things and still think clearly your “window of tolerance”. Stress pushes you outside it, either up into panic and racing thoughts or down into numbness and shutting off. The goal is not to never leave the window. It's to learn your way back in.",
      "The fastest route back is through the body: a long, slow breath out, cold water on your face, feet pressed into the floor. You can't argue your nervous system calm, but you can show it that you're safe.",
    ],
    tryThis: { label: "Try 1 minute of slow breathing", href: "/tool/breathe" },
    sources: [
      "Siegel, D. J. (1999). The Developing Mind. Guilford Press.",
      "McEwen, B. S. (1998). Protective and damaging effects of stress mediators. New England Journal of Medicine, 338(3), 171–179.",
    ],
  },
  {
    id: "waves",
    title: "Feelings are weather, not identity",
    sub: "Naming a feeling makes it quieter",
    body: [
      "A feeling is a signal, not a verdict. Sadness says something matters to you. Anxiety says something feels uncertain. Anger says a line was crossed. They are information, and they are temporary, even when they feel permanent from inside.",
      "“I feel like a failure today” is very different from “I am a failure”. The first is weather passing through. The second is a story about who you are, and feelings are bad at writing those.",
      "There's evidence that simply putting a feeling into words helps. In brain-imaging studies, people who labelled an emotion (“this is fear”) showed less activity in the amygdala, the brain's alarm centre, than people who didn't.",
      "So when something big shows up, try naming it as precisely as you can. Not just “bad”: is it lonely, embarrassed, disappointed, overwhelmed? The more exact the word, the more room you get around it.",
    ],
    tryThis: { label: "Write it down in your journal", href: "/journal-new" },
    sources: [
      "Lieberman, M. D., et al. (2007). Putting feelings into words: Affect labeling disrupts amygdala activity. Psychological Science, 18(5), 421–428.",
    ],
  },
  {
    id: "sigh",
    title: "The one-minute reset",
    sub: "The breath pattern that calmed people fastest in a trial",
    body: [
      "Your exhale is linked to the brake pedal of your nervous system. Breathing out slowly, for longer than you breathe in, nudges your heart rate down.",
      "In a 2023 Stanford trial, people who practised “cyclic sighing” for five minutes a day, which is two inhales through the nose followed by one long exhale through the mouth, reported bigger improvements in mood and a larger drop in breathing rate than people doing mindfulness meditation for the same time.",
      "You don't need five minutes to feel a difference. One or two slow sighs can take the edge off a spike of panic. It works anywhere: in an exam hall, a hostel corridor, a crowded bus.",
    ],
    tryThis: { label: "Breathe with me for a minute", href: "/tool/breathe" },
    sources: [
      "Balban, M. Y., et al. (2023). Brief structured respiration practices enhance mood and reduce physiological arousal. Cell Reports Medicine, 4(1), 100895.",
    ],
  },
  {
    id: "traps",
    title: "Thinking traps",
    sub: "Six ways a stressed mind bends the truth",
    body: [
      "When we're anxious or low, our thoughts take shortcuts. Psychologists call these cognitive distortions. Everyone has them, and spotting one is half the work.",
      "All-or-nothing: “If I don't top this exam, I've failed.”\nCatastrophising: “If I fail this, my whole life is ruined.”\nMind reading: “Everyone in class thinks I'm stupid.”\nFortune telling: “I just know the interview will go badly.”\nShould statements: “I should be able to handle this without help.”\nLabelling: “I'm such a loser.”",
      "You don't have to force yourself to think positively. Just ask: what's the evidence? What would I tell a friend who said this? Will this matter in a year? A balanced thought is usually more believable than a cheerful one.",
    ],
    tryThis: { label: "Reframe a thought", href: "/tool/reframe" },
    sources: [
      "Beck, A. T., Rush, A. J., Shaw, B. F., & Emery, G. (1979). Cognitive Therapy of Depression. Guilford Press.",
      "Burns, D. D. (1980). Feeling Good: The New Mood Therapy. William Morrow.",
    ],
  },
  {
    id: "phone-sleep",
    title: "Your phone and your sleep",
    sub: "What an hour of scrolling before bed actually does",
    body: [
      "Bright screens in the evening delay your body's release of melatonin, the hormone that tells you it's night. In a controlled study, people who read on a light-emitting device before bed took longer to fall asleep, had less REM sleep, and felt less alert the next morning than when they read a printed book.",
      "Light isn't the only problem. Group chats, reels and notifications keep your mind switched on exactly when it needs to wind down, and one more video is designed to be hard to refuse.",
      "Small changes help: charge your phone away from your bed, stop scrolling 30 to 60 minutes before sleep, or switch to something that doesn't refresh itself. Track it in your daily check-in and watch your Insights. You may see your own pattern within two weeks.",
    ],
    tryThis: { label: "See your sleep and screen pattern", href: "/profile/mood" },
    sources: [
      "Chang, A.-M., Aeschbach, D., Duffy, J. F., & Czeisler, C. A. (2015). Evening use of light-emitting eReaders negatively affects sleep, circadian timing, and next-morning alertness. PNAS, 112(4), 1232–1237.",
    ],
  },
  {
    id: "loops",
    title: "Loops that pull you back",
    sub: "Why the same spiral keeps returning, and how to break it",
    body: [
      "Many of our hardest moments follow a loop: a trigger (a bad mark, a silent group chat), an automatic reaction (scrolling for hours, skipping meals, isolating), and a short-term relief that makes the loop stronger next time.",
      "Habits run on cues, not willpower. That's why “I'll just try harder” rarely works. What does work, across many studies, is deciding in advance: “If this happens, then I will do that.” Psychologists call these implementation intentions, and they make follow-through much more likely.",
      "Start with one loop. Name the trigger, notice what you usually do, and choose one small, doable alternative. Then write it as an if-then plan.",
    ],
    tryThis: { label: "Build a spiral breaker", href: "/tool/spiral" },
    sources: [
      "Wood, W., & Neal, D. T. (2007). A new look at habits and the habit–goal interface. Psychological Review, 114(4), 843–863.",
      "Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. American Psychologist, 54(7), 493–503.",
    ],
  },
];

export const traps = ["All-or-nothing", "Catastrophising", "Mind reading", "Fortune telling", "Should statements", "Labelling", "Not sure"];
