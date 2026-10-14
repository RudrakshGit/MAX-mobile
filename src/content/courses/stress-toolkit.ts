import type { Course } from "./types";

export const STATUS = "draft" as const;

export const WHO_DISCLAIMER =
  "This adaptation was not created by WHO. WHO is not responsible for the content or accuracy of this adaptation.";

export const stressToolkit: Course = {
  id: "stress-toolkit",
  title: "Stress toolkit",
  summary: "Six field-tested tools from WHO to steady your mind when pressure mounts.",
  category: "stress",
  days: [
    {
      day: 1,
      title: "Grounding in the storm",
      body: [
        "When deadlines, family expectations, or hostel problems build up all at once, your mind can feel caught in an emotional storm. Thoughts race and your body tightens up.",
        "In a storm, trying to argue yourself calm rarely works. What helps first is dropping an anchor. Grounding does not push the storm away; it anchors you safely until the storm passes.",
        "To drop an anchor, notice what is happening inside you right now without fighting it. Then, deliberately reconnect with your physical body: push your feet into the floor, feel your hands against your desk, and look around the room.",
        "Notice three things you can see, two things you can hear, and the rhythm of your breath. You are still in the room, safe in this exact moment, even while difficult feelings are present.",
      ],
      action: { tool: "ground" },
      watch: "who-dwm-tool3",
      source: `Adapted from WHO Doing What Matters in Times of Stress (Tool 3: Grounding). ${WHO_DISCLAIMER}`,
      licence: "CC BY-NC-SA 3.0 IGO",
    },
    {
      day: 2,
      title: "Unhooking from sticky thoughts",
      body: [
        "Difficult thoughts hook us like a fish on a line. A thought like 'I will mess up placements' or 'everyone else is ahead of me' pulls us away from whatever we were trying to do.",
        "When you get hooked, fighting the thought usually makes it stronger. Instead, practice naming it: 'I notice I am having the thought that I am behind.'",
        "Adding that phrase gives you a few inches of breathing room. You are not the thought; you are the student noticing the thought.",
        "Once you notice the hook, gently bring your focus back to the small task in front of you—your lab file, a single paragraph, or taking one slow breath.",
      ],
      action: { tool: "breathe" },
      watch: "who-dwm-tool1",
      source: `Adapted from WHO Doing What Matters in Times of Stress (Tool 1: Unhooking). ${WHO_DISCLAIMER}`,
      licence: "CC BY-NC-SA 3.0 IGO",
    },
    {
      day: 3,
      title: "Acting on your values",
      body: [
        "Stress often makes us freeze or escape into hours of mindless scrolling. When stress dictates your actions, you end up feeling guilty and disconnected from who you want to be.",
        "Your values are the qualities you want to bring into your life—how you want to treat yourself, your work, and your friends. Even in stressful weeks, you can choose one small action aligned with your values.",
        "If curiosity matters to you, spend 10 focused minutes on one concept. If being a supportive friend matters, send a 30-second message to a batchmate.",
        "You do not need to feel calm or motivated before taking a value-guided step. Action can come first; motivation often follows.",
      ],
      action: { write: "What is one small, kind action you want to take today?" },
      watch: "who-dwm-tool4",
      source: `Adapted from WHO Doing What Matters in Times of Stress (Tool 4: Acting on your values). ${WHO_DISCLAIMER}`,
      licence: "CC BY-NC-SA 3.0 IGO",
    },
    {
      day: 4,
      title: "Being kind to yourself",
      body: [
        "When you miss a study goal or receive disappointing grades, your inner voice is often harsh. You might tell yourself things you would never say to a close friend.",
        "Harsh self-criticism does not motivate us; research shows it triggers the body's threat alarm, making us avoid our work even more.",
        "Being kind to yourself means acknowledging that college is genuinely tough and that mistakes are part of learning. Place a gentle hand on your chest or arm, take a breath, and speak to yourself with warmth.",
        "Ask yourself: 'What would a calm, supportive mentor say to me right now?' Let yourself hear that answer.",
      ],
      action: { tool: "reframe" },
      watch: "who-dwm-tool5",
      source: `Adapted from WHO Doing What Matters in Times of Stress (Tool 5: Being kind). ${WHO_DISCLAIMER}`,
      licence: "CC BY-NC-SA 3.0 IGO",
    },
    {
      day: 5,
      title: "Making room for heavy feelings",
      body: [
        "When anxiety or sadness shows up in the hostel at night, the immediate reaction is to push it down or numb it with distraction. But suppressing heavy feelings keeps tension trapped in the body.",
        "Making room means treating difficult feelings like unwanted weather. You cannot stop the rain, but you do not have to fight it either.",
        "Breathe into the sensation. Where do you feel the tension? In your chest, your stomach, your jaw? Breathe into that physical space and imagine making room for it.",
        "Tell yourself: 'It hurts right now, but I have room for this feeling. It will pass in its own time.'",
      ],
      action: { tool: "breathe" },
      watch: "who-dwm-tool6",
      source: `Adapted from WHO Doing What Matters in Times of Stress (Tool 6: Making room). ${WHO_DISCLAIMER}`,
      licence: "CC BY-NC-SA 3.0 IGO",
    },
    {
      day: 6,
      title: "Building your daily anchor",
      body: [
        "Stress management is not a one-time fix; it is a small daily habit. Just as you charge your phone before going to class, your nervous system needs regular moments of grounding.",
        "Pick one routine moment in your day to practice: while walking between lectures, right before opening your books in the library, or before going to sleep.",
        "Spend 60 seconds noticing your feet on the ground and taking two slow, calming breaths. Consistency matters far more than duration.",
        "Notice what tools in this kit helped you most this week. You can return to them whenever pressure rises.",
      ],
      action: { write: "Where and when will you practice your 1-minute anchor tomorrow?" },
      watch: "who-dwm-tool2",
      source: `Adapted from WHO Doing What Matters in Times of Stress (Tools review). ${WHO_DISCLAIMER}`,
      licence: "CC BY-NC-SA 3.0 IGO",
    },
  ],
};
