// Pure sampling of MAX's clips: the value of every channel, the face and the marks at time t. The player turns the
// same keys into Reanimated timing sequences; tests and the MAX lab use this to check and freeze any moment.
import { EASE, bezier } from "./motion.ts";
import { CHANNELS, type Channel, type Clip, type Face, type Key, type Marks, type Pose, clipLength } from "./pose.ts";

/** One channel at time t (ms). Before its first key it eases from `start`; after its last key it holds. */
export function sampleChannel(keys: Key[], ch: Channel, t: number, start: number): number {
  "worklet";
  let prevAt = 0;
  let prevV = start;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const v = k.pose ? k.pose[ch] : undefined;
    if (v === undefined) continue;
    if (t <= k.at) {
      if (k.at <= prevAt) return v;
      const e = bezier(EASE[k.ease ?? "inOut"], (t - prevAt) / (k.at - prevAt));
      return prevV + (v - prevV) * e;
    }
    prevAt = k.at;
    prevV = v;
  }
  return prevV;
}

/** The pose a loop starts (and must end) on: its first key over the rest pose. */
export function loopStart(clip: Clip, rest: Pose): Pose {
  return { ...rest, ...(clip.keys[0].pose ?? {}) };
}

/** Every channel at time t. Loops wrap around; an action starts from `start` (where MAX was when it began). */
export function samplePose(clip: Clip, t: number, start: Pose): Pose {
  const len = clipLength(clip);
  const tt = clip.kind === "loop" && len > 0 ? ((t % len) + len) % len : t;
  const from = clip.kind === "loop" ? loopStart(clip, start) : start;
  const out = { ...start };
  for (const ch of CHANNELS) out[ch] = sampleChannel(clip.keys, ch, tt, from[ch]);
  return out;
}

/** Face and marks switch (they don't tween): the latest value set at or before t. */
export function sampleFace(clip: Clip, t: number, start: Face): Face {
  let face = { ...start };
  for (const k of clip.keys) if (k.at <= t && k.face) face = { ...face, ...k.face };
  return face;
}

export function sampleMarks(clip: Clip, t: number, start: Marks): Marks {
  let marks = { ...start };
  for (const k of clip.keys) if (k.at <= t && k.marks) marks = { ...marks, ...k.marks };
  return marks;
}

/** The keys that move one channel, as [at, value, ease] after the start, for the player. */
export function channelTrack(clip: Clip, ch: Channel): { at: number; v: number; ease: keyof typeof EASE }[] {
  const out: { at: number; v: number; ease: keyof typeof EASE }[] = [];
  for (const k of clip.keys) {
    const v = k.pose?.[ch];
    if (v !== undefined) out.push({ at: k.at, v, ease: k.ease ?? "inOut" });
  }
  return out;
}
