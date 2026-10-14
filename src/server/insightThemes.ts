// 20 predefined reflection themes for MAX Daily Personal Insight.
// Each theme provides a curated fallback article with 3 sections in MAX's voice.
// Fallbacks are returned if AI generation fails, times out, or trips output safety guards.

export type InsightSection = {
  tag: string;
  heading: string;
  body: string;
};

export type ThemeInsight = {
  theme: string;
  title: string;
  sections: [InsightSection, InsightSection, InsightSection];
};

export const INSIGHT_THEMES: ThemeInsight[] = [
  {
    theme: "sleep-energy",
    title: "Sleep and Energy",
    sections: [
      {
        tag: "Pattern",
        heading: "How night screens shape morning battery",
        body: "When you look at your phone in the hour before bed, sleep quality often takes a quiet hit. Blue light delays melatonin, but more than that, notifications and late-night scrolling keep your mind in problem-solving mode instead of winding down.",
      },
      {
        tag: "Reality",
        heading: "Hostel nights and late schedules",
        body: "College schedules in India rarely encourage early nights. Between late canteen runs, group project chats, and noisy corridors, quiet time often comes late. But giving yourself even 20 screen-free minutes before closing your eyes can help you fall into deeper rest.",
      },
      {
        tag: "Action",
        heading: "One small buffer tonight",
        body: "You don't need a perfect 8-hour sleep routine overnight. Just pick one tiny habit tonight: put the phone across the room or on the desk before turning off the light. Notice how your head feels when you wake up tomorrow.",
      },
    ],
  },
  {
    theme: "exam-stress",
    title: "Exam Stress Patterns",
    sections: [
      {
        tag: "Pattern",
        heading: "The pressure wave before deadlines",
        body: "Study pressure tends to peak in waves before internal sessional exams, vivas, and finals. When pressure spikes, your body enters a mild fight-or-flight state, which can make simple concepts feel suddenly impossible to memorize or recall.",
      },
      {
        tag: "Reality",
        heading: "Anxiety is not preparation",
        body: "It is easy to believe that stressing about a test means you care more or are working harder. In truth, anxious rumination exhausts energy that your working memory needs. Feeling nervous before exams is completely normal, but stress itself does not improve marks.",
      },
      {
        tag: "Action",
        heading: "Pacing your revisions in chunks",
        body: "Instead of staring at a 50-page syllabus unit all evening, set a timer for 25 focused minutes on one single subsection. When the timer chimes, stand up, breathe, and drink water. Small, steady bursts beat frantic late-night panic every time.",
      },
    ],
  },
  {
    theme: "social-connection",
    title: "Social Connection",
    sections: [
      {
        tag: "Pattern",
        heading: "Being surrounded yet feeling alone",
        body: "College campuses are crowded places: full classrooms, busy hostel mess halls, and active WhatsApp groups. Yet many students report feeling quietly isolated in the middle of all the noise, because casual banter is different from genuine understanding.",
      },
      {
        tag: "Reality",
        heading: "Everyone wears a brave face",
        body: "When you look around the campus lawn or lecture hall, it seems like everyone has found their tight-knit circle. Most people are also figuring it out as they go, feeling awkward, and hoping someone else reaches out first.",
      },
      {
        tag: "Action",
        heading: "One real conversation today",
        body: "You do not need a massive friend circle to feel supported. A single honest chat over chai with someone you trust can lift an entire day's weight. Ask a friend how they are actually doing, and listen to what they share.",
      },
    ],
  },
  {
    theme: "self-talk",
    title: "Self-Talk",
    sections: [
      {
        tag: "Pattern",
        heading: "The internal critic in your head",
        body: "Notice the tone of voice you use with yourself when you make a mistake or score lower than expected. Many of us speak to ourselves far more harshly than we would ever speak to a classmate, teacher, or friend.",
      },
      {
        tag: "Reality",
        heading: "Harsh criticism doesn't motivate",
        body: "Students often worry that if they stop berating themselves, they will turn lazy or complacent. Psychological research shows the opposite: self-criticism triggers avoidance and procrastination, while honest self-compassion builds resilience and faster recovery from setbacks.",
      },
      {
        tag: "Action",
        heading: "Speak to yourself like a friend",
        body: "The next time you catch yourself thinking 'I am completely messing this up,' pause and reframe it. Ask yourself: 'What would a calm, supportive mentor say to me right now?' Give yourself that exact same benefit of patience.",
      },
    ],
  },
  {
    theme: "small-wins",
    title: "Small Wins",
    sections: [
      {
        tag: "Pattern",
        heading: "Overlooking quiet daily efforts",
        body: "Our brains tend to only celebrate huge milestones: clearing an entrance exam, getting placed, or completing a major final submission. Because big moments are rare, daily effort often goes completely unnoticed and unacknowledged.",
      },
      {
        tag: "Reality",
        heading: "Progress is made of tiny steps",
        body: "Big achievements are simply the compound effect of hundreds of unglamorous days. Attending a morning lecture when you were tired, reading three pages of notes, or stepping away from your desk to eat lunch all count as real progress.",
      },
      {
        tag: "Action",
        heading: "Notice one quiet victory today",
        body: "Before you sleep tonight, write down or mentally note one thing you handled today that took effort. It doesn't have to be impressive to anyone else. Giving yourself credit for small consistency trains your brain to keep moving forward.",
      },
    ],
  },
  {
    theme: "rest-productivity",
    title: "Rest vs Productivity",
    sections: [
      {
        tag: "Pattern",
        heading: "The guilt of taking time off",
        body: "In competitive academic environments, taking a break can feel like falling behind. Many students sit at their study tables for hours without absorbing anything, simply because guilt prevents them from stepping away and taking genuine, restful time off.",
      },
      {
        tag: "Reality",
        heading: "Rest is part of the work",
        body: "Your brain consolidates memory and solves difficult problems while you rest. Grinding without recovery doesn't demonstrate discipline; it leads directly to burnout, brain fog, and irritability. Resting is not cheating your goals—it's fueling them.",
      },
      {
        tag: "Action",
        heading: "Take a deliberate, guilt-free break",
        body: "Today, give yourself a scheduled 15-minute break where you do nothing study-related. Listen to music, walk outside, or stretch without holding your textbooks or looking at notes. Give your nervous system permission to fully recharge.",
      },
    ],
  },
  {
    theme: "comparison-social-media",
    title: "Comparison and Social Media",
    sections: [
      {
        tag: "Pattern",
        heading: "The endless scroll of achievements",
        body: "Opening LinkedIn or Instagram often feels like a barrage of internships, offer letters, hackathon prizes, and vacation stories. It is easy to look at other people's milestones and immediately feel inadequate about your own standing.",
      },
      {
        tag: "Reality",
        heading: "You are comparing behind-the-scenes to highlight reels",
        body: "Nobody posts their rejections, backlogs, self-doubt, or panic attacks on social media. You are comparing your full, messy internal reality with someone else's carefully curated highlight reel. That comparison will always feel unbalanced and discouraging.",
      },
      {
        tag: "Action",
        heading: "Measure against your own yesterday",
        body: "The only valid baseline for your growth is where you were six months ago. Notice what you know today that you didn't understand then. Focus your energy on your own path, at your own steady pace.",
      },
    ],
  },
  {
    theme: "body-movement",
    title: "Body and Movement",
    sections: [
      {
        tag: "Pattern",
        heading: "Living entirely inside your head",
        body: "As college students, we spend hours hunched over laptops, desks, and books. Over time, mental exhaustion is often accompanied by physical stiffness, tight neck muscles, clenched jaws, and shallow chest breathing.",
      },
      {
        tag: "Reality",
        heading: "Your body signals your mind",
        body: "The mind and body communicate constantly. When your body is tense and still for too long, your nervous system interprets that stiffness as stress. Moving your muscles physically releases stored tension and signals safety to your brain.",
      },
      {
        tag: "Action",
        heading: "Ten minutes of physical movement",
        body: "Take a 10-minute walk around the college campus or hostel ground. Roll your shoulders back, let your arms swing freely, and look up at the sky. A brief change of physical posture can completely clear mental fog.",
      },
    ],
  },
  {
    theme: "gratitude",
    title: "Gratitude",
    sections: [
      {
        tag: "Pattern",
        heading: "Fixating on what is missing",
        body: "When exams, assignments, and job stress loom, our brains naturally scan for threats and problems. We notice everything that hasn't been completed, everything that might go wrong, and forget what is already steady and good.",
      },
      {
        tag: "Reality",
        heading: "Gratitude grounds your perspective",
        body: "Practicing gratitude is not about toxic positivity or pretending problems don't exist. It simply widens the lens so you can see both the challenges and the small moments of comfort, warmth, and relief that coexist alongside them.",
      },
      {
        tag: "Action",
        heading: "Name three concrete comforts",
        body: "Think of three specific things right now: a hot cup of chai, a funny text from a friend, or a warm bed to sleep in. Let yourself appreciate those small anchors for thirty quiet seconds today.",
      },
    ],
  },
  {
    theme: "boundaries",
    title: "Boundaries",
    sections: [
      {
        tag: "Pattern",
        heading: "Saying yes when you mean no",
        body: "Between group project teammates, hostel roommates, and family requests, students often overcommit. Saying yes to everyone else while neglecting your own sleep and peace leads straight to chronic exhaustion and hidden resentment.",
      },
      {
        tag: "Reality",
        heading: "Boundaries are self-respect",
        body: "Setting a boundary does not make you rude or selfish. It simply communicates your honest capacity. People around you cannot guess your limits unless you speak them clearly and kindly.",
      },
      {
        tag: "Action",
        heading: "One polite 'not right now'",
        body: "If someone asks for a favour or an extra commitment today when you are already running low, practice saying: 'I'd love to help, but I have a deadline today. Can we connect later this week?' Notice how protecting your time feels.",
      },
    ],
  },
  {
    theme: "family",
    title: "Family",
    sections: [
      {
        tag: "Pattern",
        heading: "The weight of expectations",
        body: "For many Indian college students, family is both the greatest source of love and the biggest source of pressure. Wanting to make parents proud can become an intense burden when choices, marks, or career paths diverge from their expectations.",
      },
      {
        tag: "Reality",
        heading: "Love and difference can coexist",
        body: "Parents often project their own anxieties about financial security onto their children. Even when their approach feels suffocating, remembering that it usually stems from care rather than malice can help take the sting out of difficult conversations.",
      },
      {
        tag: "Action",
        heading: "Keep communication gentle and brief",
        body: "If a call home feels tense, keep the focus on simple daily updates: what you ate, how your health is, and warm wishes. You don't have to solve your entire 10-year career trajectory in every single weekly phone call.",
      },
    ],
  },
  {
    theme: "uncertainty-future",
    title: "Uncertainty About the Future",
    sections: [
      {
        tag: "Pattern",
        heading: "Worrying about what comes next",
        body: "Will I get placed? Will I clear CAT or GATE? What if I choose the wrong career path? Uncertainty about the next two to five years can paralyze students in their third and final years, draining their current day's focus.",
      },
      {
        tag: "Reality",
        heading: "No one has a mapped-out life",
        body: "Life rarely unfolds in neat, straight lines. Most successful professionals will tell you their career took turns they never predicted in college. You do not need to know the next twenty steps; you only need to take the next one.",
      },
      {
        tag: "Action",
        heading: "Focus on today's horizon",
        body: "When future worry takes over, bring your horizon back to the next 24 hours. Ask yourself: 'What is one practical thing I can do today that moves me forward?' Do that small thing, and leave next year for next year.",
      },
    ],
  },
  {
    theme: "focus",
    title: "Focus",
    sections: [
      {
        tag: "Pattern",
        heading: "The fragmented attention span",
        body: "Juggling lectures, notifications, social apps, and assignments trains our minds to jump from tab to tab every three minutes. When you finally sit down to study deep theory or write code, staying focused feels painful.",
      },
      {
        tag: "Reality",
        heading: "Focus is a muscle, not a personality trait",
        body: "You aren't broken or uniquely distracted. Modern apps are engineered by thousands of engineers to capture your attention. Regaining focus is simply a habit of training your attention span in gentle, short intervals without self-judgment.",
      },
      {
        tag: "Action",
        heading: "Single-task for just twenty minutes",
        body: "Close every browser tab except the one you need. Put your phone on silent and set a timer for 20 minutes. Promise yourself to work only on this single task until the bell rings. You'll be amazed by how much gets done.",
      },
    ],
  },
  {
    theme: "kindness-self",
    title: "Kindness to Self",
    sections: [
      {
        tag: "Pattern",
        heading: "Holding yourself to impossible standards",
        body: "Many students carry an unspoken rule: 'I must never fail, never feel lazy, and always perform at my peak.' When reality doesn't match this perfectionist standard, feelings of shame and disappointment quickly follow.",
      },
      {
        tag: "Reality",
        heading: "You are human, not a machine",
        body: "Human beings have fluctuating energy, emotional highs and lows, and days where focus just won't cooperate. Expecting 100% output every single day of the semester is biologically impossible.",
      },
      {
        tag: "Action",
        heading: "Acknowledge your capacity today",
        body: "If your energy is at 40% today, giving that 40% means you gave your full capacity for this day. Be proud of showing up at all, and allow yourself to recover without self-blame.",
      },
    ],
  },
  {
    theme: "values",
    title: "Values",
    sections: [
      {
        tag: "Pattern",
        heading: "Chasing goals that aren't yours",
        body: "In college, it is easy to get swept up in the crowd's priorities: chasing the highest package, applying for the trendiest club, or following someone else's definition of success without asking if you actually want it.",
      },
      {
        tag: "Reality",
        heading: "Your values are your compass",
        body: "Success that contradicts your personal values will never feel fulfilling. Whether you value creativity, helping others, intellectual curiosity, or independence, honoring your unique values keeps you anchored when external opinions get loud.",
      },
      {
        tag: "Action",
        heading: "Reflect on what matters to you",
        body: "Take two quiet minutes to ask yourself: 'If nobody else was watching or keeping score, what kind of person would I want to become this year?' Let that answer guide your choices today.",
      },
    ],
  },
  {
    theme: "routines",
    title: "Routines",
    sections: [
      {
        tag: "Pattern",
        heading: "Chaos and irregular days",
        body: "Hostel life and unpredictable class timetables often mean sleeping at 4 AM one day, skipping breakfast the next, and cramming for submissions at odd hours. This irregularity keeps your biological clock in perpetual jetlag.",
      },
      {
        tag: "Reality",
        heading: "Routines create mental safety",
        body: "Having just one or two consistent anchor points in your day—like a regular waking window or a fixed evening tea time—reduces decision fatigue and helps your nervous system feel settled and safe.",
      },
      {
        tag: "Action",
        heading: "Pick one anchor habit",
        body: "Don't try to revamp your entire daily schedule at once. Just choose one simple anchor: drink water right after waking up, or sit for five quiet minutes before dinner. Consistency starts with one anchor.",
      },
    ],
  },
  {
    theme: "asking-help",
    title: "Asking for Help",
    sections: [
      {
        tag: "Pattern",
        heading: "Carrying everything alone",
        body: "Many students believe that asking for help is a sign of weakness or failure. They struggle in silence through tough subjects, mental distress, or campus bureaucracy rather than reaching out to teachers, counsellors, or seniors.",
      },
      {
        tag: "Reality",
        heading: "Reaching out takes courage",
        body: "No one succeeds in higher education completely alone. Asking a professor to explain a tough topic or talking to a mental health professional is a sign of wisdom and strength, not inadequacy.",
      },
      {
        tag: "Action",
        heading: "Reach out for one small thing",
        body: "If you have been feeling stuck with an assignment or feeling overwhelmed, identify one person who might have insight: a senior, a mentor, or a peer. Send a short, honest question today.",
      },
    ],
  },
  {
    theme: "change-adjustment",
    title: "Change and Adjustment",
    sections: [
      {
        tag: "Pattern",
        heading: "Navigating new semesters and transitions",
        body: "Transitioning between school and college, shifting hostels, or entering final year brings a flood of unfamiliar expectations. When routines shift, feeling disoriented or anxious is a very natural human reaction.",
      },
      {
        tag: "Reality",
        heading: "Adjustment takes time",
        body: "Adjustment is rarely instant. It takes several weeks for your mind and body to acclimate to new environments, food, peers, and academic workloads. Give yourself permission to feel unsettled during transitions.",
      },
      {
        tag: "Action",
        heading: "Find one familiar comfort",
        body: "When everything around you feels new or changing, ground yourself in something familiar: your favorite song, a comfort book, or calling an old friend from school. Let that familiarity give you steady ground.",
      },
    ],
  },
  {
    theme: "money-worries",
    title: "Money Worries",
    sections: [
      {
        tag: "Pattern",
        heading: "Financial pressure as a student",
        body: "Managing monthly mess bills, course expenses, exam fees, and personal spending while living away from home is stressful. Financial strain is one of the quietest yet heaviest worries college students carry.",
      },
      {
        tag: "Reality",
        heading: "You are doing your best with what you have",
        body: "Feeling anxious about money does not mean you are bad at managing your life. Millions of students navigate tight budgets every single semester. It takes resourcefulness, patience, and realistic pacing.",
      },
      {
        tag: "Action",
        heading: "Check your numbers calmly",
        body: "Instead of avoiding checking your account balance out of anxiety, take five minutes to review your monthly essentials with clear eyes. Having clear numbers replaces vague dread with actionable clarity.",
      },
    ],
  },
  {
    theme: "hope",
    title: "Hope",
    sections: [
      {
        tag: "Pattern",
        heading: "When the horizon feels heavy",
        body: "When you are deep in a slump or going through a difficult week, it is easy to feel like things will always stay this overwhelming. Our minds tend to project current fatigue into an indefinite future.",
      },
      {
        tag: "Reality",
        heading: "Difficult phases always pass",
        body: "Remember the hardest semester or exam you faced two years ago. At that time, it felt all-consuming, yet you got through it. Today's challenges will also eventually become memories that you survived.",
      },
      {
        tag: "Action",
        heading: "Hold on to the next good moment",
        body: "You do not need to feel wildly optimistic today. Just stay open to small moments of goodness: a sunset over the campus buildings, a warm dinner, or a good night's sleep. Tomorrow brings a fresh start.",
      },
    ],
  },
];
