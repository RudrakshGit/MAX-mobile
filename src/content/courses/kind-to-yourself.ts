import type { Course } from "./types";

export const STATUS = "draft" as const;

export const kindToYourself: Course = {
  id: "kind-to-yourself",
  title: "Kind to yourself",
  summary: "Break free from harsh self-criticism and cultivate a supportive inner voice.",
  category: "compassion",
  days: [
    {
      day: 1,
      title: "Spotting the inner critic",
      body: [
        "When things go wrong in college—a bad presentation, a rejection email, or a low score—an automatic inner voice often attacks: 'You are so useless. You never do anything right.'",
        "Most of us believe that harsh self-criticism keeps us disciplined and successful. But clinical evidence proves the opposite: severe self-criticism triggers the brain's amygdala and stress response, paralyzing our ability to learn.",
        "Begin by simply noticing this inner critic without judging it. Listen to its tone. Would you speak to your best friend, your younger sibling, or a roommate using those exact cruel words?",
        "Recognizing that the inner critic is just an automated tape playing in your head—not the ultimate truth—is the very first step toward self-compassion.",
      ],
      action: { tool: "reframe" },
      watch: "therapy-stop-beating-yourself",
      source: "Adapted from 29k Self-compassion I (CC BY-SA 4.0) and Neff (2003)",
      licence: "CC BY-SA 4.0",
    },
    {
      day: 2,
      title: "The inner friend perspective",
      body: [
        "Imagine your closest friend comes to your hostel room looking exhausted and sad. They say: 'I messed up the coding interview today. I feel like a total failure.'",
        "Would you say to them: 'You are right, you are incompetent and should give up'? Of course not. You would offer them a cup of chai, remind them of their strengths, and tell them that one bad interview does not define them.",
        "Self-compassion is simply giving yourself the exact same warmth, fairness, and perspective that you naturally offer to others you care about.",
        "Next time you make a mistake, pause. Put your hand gently on your desk, take a breath, and ask: 'What would a truly supportive friend say to me right now?'",
      ],
      action: { write: "Write one encouraging sentence you would say to a friend going through your current situation." },
      watch: "therapy-self-compassion-flaws",
      source: "Adapted from 29k Self-compassion I (CC BY-SA 4.0)",
      licence: "CC BY-SA 4.0",
    },
    {
      day: 3,
      title: "Common humanity in college",
      body: [
        "When we struggle, shame makes us feel uniquely isolated: 'Everyone else in my batch has everything figured out. I am the only one feeling lonely, confused, and behind.'",
        "Social media and campus bravado amplify this illusion. People post about their hackathon victories and placement offers; nobody posts about crying in the bathroom or dreading the future.",
        "Self-compassion researcher Dr Kristin Neff calls the antidote 'common humanity.' Suffering, confusion, and feelings of inadequacy are part of the shared human condition.",
        "Thousands of students across Indian campuses are sitting in hostel rooms tonight feeling the exact same self-doubt. You are not broken, and you are never alone in feeling this way.",
      ],
      action: { tool: "ground" },
      watch: "emm-reframe-unhelpful",
      source: "Self-Compassion: Theory and Research (Neff, 2011)",
      licence: "CC BY-SA 4.0",
    },
    {
      day: 4,
      title: "Soothing touch and physical warmth",
      body: [
        "Self-compassion is not just a mental exercise; it is also a physical experience for your nervous system.",
        "As mammals, our bodies are hardwired to respond to gentle touch, warmth, and soft vocal tone. These physical cues trigger the release of oxytocin and endorphins, dialing down stress hormones.",
        "When you feel overwhelmed or emotionally bruised, try placing both hands gently over the centre of your chest, or wrap your arms around yourself in a comforting hold.",
        "Feel the warmth of your palms and the gentle rise and fall of your chest as you breathe. Let your body know: 'I am here for you right now.'",
      ],
      action: { tool: "breathe" },
      watch: "who-dwm-tool5",
      source: "Physiological effects of soothing touch (Dreisoerner et al., 2021)",
      licence: "CC BY-SA 4.0",
    },
    {
      day: 5,
      title: "Mistakes are just data",
      body: [
        "In rigid educational systems, mistakes are treated as crimes or signs of low intelligence. This creates intense perfectionism and fear of failure.",
        "In science and engineering, an error is not a moral failure—it is simply data. A failed test case tells you where the code needs refactoring. A rejected proposal highlights where communication needs sharpening.",
        "When a mistake happens, practice separating your self-worth from the outcome: 'That approach did not work. What useful data can I take from this for next time?'",
        "Treat yourself with gentleness as you learn and grow. You are a work in progress, and that is completely okay.",
      ],
      action: { tool: "reframe" },
      watch: "who-dwm-tool4",
      source: "Ideas from Mindset (Dweck, 2006) and self-compassion research (Neff, 2003)",
      licence: "CC BY-SA 4.0",
    },
  ],
};
