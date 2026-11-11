import type { Course } from "./types";

export const STATUS = "draft" as const;

export const sleepReset: Course = {
  id: "sleep-reset",
  title: "Sleep reset",
  summary: "Evidence-based CBT-I rules to rebuild your sleep without tossing and turning.",
  category: "sleep",
  days: [
    {
      day: 1,
      title: "The anchor of fixed wake time",
      body: [
        "In college, sleep schedules swing wildly: sleeping at 3 AM on weekdays, sleeping until 1 PM on weekends. This 'social jetlag' confuses your body's circadian clock.",
        "The single most powerful lever for consistent sleep is not your bedtime; it is your wake-up time. Your internal biological clock anchors to when morning light hits your eyes.",
        "Pick a realistic wake-up time that works for your lecture schedule and stick to it within 30 minutes every single day, including Sundays.",
        "Even if you had trouble falling asleep the previous night, wake up at the chosen hour. This builds up natural sleep drive ('sleep pressure') so that you fall asleep faster the next night.",
      ],
      action: { write: "Choose your fixed wake-up time for the next 7 days (e.g. 7:30 AM):" },
      watch: "therapy-fall-asleep-cbti",
      source: "Fixed rise time from CBT for insomnia (Spielman et al., 1987; Morin et al., 2006)",
      licence: "MAX Original adaptation",
    },
    {
      day: 2,
      title: "The bed is only for sleep",
      body: [
        "If you study for exams, eat snacks, argue on WhatsApp, and watch Instagram reels from your hostel bed, your brain forms an unconscious association: 'Bed = high arousal, stress, and entertainment.'",
        "In CBT for Insomnia, this is resolved through 'stimulus control'. Your brain must learn that the bed means one thing only: rest.",
        "Do your coursework and phone scrolling at a desk, chair, or common room. Only get into bed when you are physically drowsy.",
        "If you get into bed and find yourself wide awake or tossing and turning after 20 minutes, get out of bed. Sit in dim light and read a calm book until drowsiness returns, then go back to bed.",
      ],
      action: { tool: "breathe" },
      watch: "emm-tips-sleep",
      source: "Stimulus Control Therapy for Insomnia (Bootzin, 1972)",
      licence: "MAX Original adaptation",
    },
    {
      day: 3,
      title: "The 30-minute wind-down",
      body: [
        "You cannot expect your nervous system to go from high-speed problem sets or intense gaming straight to deep sleep at the flick of a light switch.",
        "Your brain needs a transitional buffer zone. About 30 to 45 minutes before sleep, begin dimming overhead lights and step away from high-stimulus screens.",
        "Blue light from screens suppresses melatonin release, the hormone that signals sleep readiness. High-arousal messages or social feeds trigger adrenaline.",
        "Switch to warm lamplight, wash your face, do light stretches, or listen to calming sounds. Signal your body that the working day is officially closed.",
      ],
      action: { tool: "ground" },
      watch: "mind-better-sleep",
      source: "Sleep hygiene and circadian biology (Irish et al., 2015)",
      licence: "MAX Original adaptation",
    },
    {
      day: 4,
      title: "Parking your thoughts before bed",
      body: [
        "The moment you lay your head on the pillow and darkness falls, your brain often decides it is the perfect time to review every pending assignment, life doubt, and conversation from 2019.",
        "This happens because night is often the first quiet moment without distraction all day.",
        "Prevent the bedtime thought spin by 'parking' your worries earlier in the evening. Keep a notebook near your desk. About an hour before sleep, spend 5 minutes writing down everything on your mind and tomorrow's top 3 tasks.",
        "Once written down, tell your brain: 'These are safely recorded. There is nothing I can do about them at midnight. I will handle them tomorrow.'",
      ],
      action: { write: "Write down 2 things on your mind and 1 thing you will tackle tomorrow." },
      watch: "hi-whiteswan-sleep",
      source: "Scullin et al. (2018), bedtime to-do writing and sleep onset, J Exp Psychol Gen",
      licence: "MAX Original adaptation",
    },
    {
      day: 5,
      title: "Letting go of sleep anxiety",
      body: [
        "Paradoxically, obsessing over getting 'perfect sleep' is one of the main causes of sleeplessness. Watching the clock tick from 1:00 AM to 2:00 AM while panicking about tomorrow's test spikes cortisol.",
        "Turn your clock and phone display away from your view. Clock-watching only fuels anxiety.",
        "Remember that lying quietly in bed in a calm, relaxed state still provides valuable physical rest. Even if you do not fall into deep sleep immediately, resting your body and calming your breath carries you through the next day.",
        "Trust your body's natural sleep machinery. Let go of the effort to sleep, and let sleep come to you.",
      ],
      action: { tool: "breathe" },
      watch: "therapy-fall-asleep-cbti",
      source: "Cognitive therapy for insomnia (Harvey, 2002)",
      licence: "MAX Original adaptation",
    },
  ],
};
