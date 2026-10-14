export const FEELINGS = [
  // energetic + pleasant
  { id: "happy", label: "Happy", q: "yellow" },
  { id: "excited", label: "Excited", q: "yellow" },
  { id: "proud", label: "Proud", q: "yellow" },
  { id: "hopeful", label: "Hopeful", q: "yellow" },
  { id: "curious", label: "Curious", q: "yellow" },
  // calm + pleasant
  { id: "calm", label: "Calm", q: "green" },
  { id: "relieved", label: "Relieved", q: "green" },
  { id: "grateful", label: "Grateful", q: "green" },
  { id: "connected", label: "Loved / connected", q: "green" },
  { id: "okay", label: "Okay", q: "green" },
  // energetic + unpleasant
  { id: "anxious", label: "Anxious", q: "red" },
  { id: "overwhelmed", label: "Stressed / overwhelmed", q: "red" },
  { id: "frustrated", label: "Frustrated", q: "red" },
  { id: "angry", label: "Angry", q: "red" },
  { id: "embarrassed", label: "Embarrassed", q: "red" },
  // low + unpleasant
  { id: "sad", label: "Sad", q: "blue" },
  { id: "disappointed", label: "Disappointed", q: "blue" },
  { id: "lonely", label: "Lonely", q: "blue" },
  { id: "guilty", label: "Guilty", q: "blue" },
  { id: "drained", label: "Drained / tired", q: "blue" },
  { id: "confused", label: "Confused", q: "blue" },
] as const;

export const INFLUENCES = [
  { id: "studies", label: "Studies & exams" },
  { id: "deadlines", label: "Assignments & deadlines" },
  { id: "career", label: "Placements & career" },
  { id: "family", label: "Family" },
  { id: "friends", label: "Friends" },
  { id: "relationship", label: "Relationship" },
  { id: "hostel", label: "Hostel & roommates" },
  { id: "money", label: "Money" },
  { id: "health", label: "Health & body" },
  { id: "sleep", label: "Sleep" },
  { id: "phone", label: "Phone & social media" },
  { id: "thoughts", label: "Internal thoughts" },
  { id: "loneliness", label: "Loneliness" },
  { id: "good_news", label: "Something good happened" },
] as const;

export const FEELING_IDS = FEELINGS.map((f) => f.id);
export const INFLUENCE_IDS = INFLUENCES.map((i) => i.id);

export type FeelingId = typeof FEELINGS[number]["id"];
export type InfluenceId = typeof INFLUENCES[number]["id"];
