// Plays MAX's clips on the UI thread: one shared value per pose channel, timing curves only (no springs), the face
// and comic marks switched on the JS side at their key times. Blinks run on their own channel over any clip.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cancelAnimation,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { BLINK_CLIP } from "./clips";
import { BLINK, easing, nextBlink, rng, steppedEasing } from "./motion";
import { CHANNELS, DEFAULT_FACE, NO_MARKS, REST, clipLength, type Channel, type Clip, type Face, type Marks, type Pose } from "./pose";
import { channelTrack, samplePose } from "./sample";

export type RigValues = Record<Channel, SharedValue<number>> & {
  /** Extra gaze on top of the clip's (the floating MAX looks toward a touch). */
  gx: SharedValue<number>;
  gy: SharedValue<number>;
};

/** One shared value per channel, starting at `initial` (a frozen frame in the MAX lab starts on its pose). */
export function useRigValues(initial: Pose = REST): RigValues {
  // one hook per channel, always in the same order
  const bx = useSharedValue(initial.bx);
  const by = useSharedValue(initial.by);
  const br = useSharedValue(initial.br);
  const bsx = useSharedValue(initial.bsx);
  const bsy = useSharedValue(initial.bsy);
  const alr = useSharedValue(initial.alr);
  const arr = useSharedValue(initial.arr);
  const flx = useSharedValue(initial.flx);
  const fly = useSharedValue(initial.fly);
  const frx = useSharedValue(initial.frx);
  const fry = useSharedValue(initial.fry);
  const fx = useSharedValue(initial.fx);
  const fy = useSharedValue(initial.fy);
  const lid = useSharedValue(initial.lid);
  const gx = useSharedValue(0);
  const gy = useSharedValue(0);
  return useMemo(
    () => ({ bx, by, br, bsx, bsy, alr, arr, flx, fly, frx, fry, fx, fy, lid, gx, gy }),
    // shared values are stable for the component's life
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}

const ENTER_MS = 320;
const BLINKABLE = new Set(["default", "sad", "thinking", "surprised", "angry"]);

export interface PlayOptions {
  /** How long a loop takes to blend in from wherever MAX is. */
  enterMs?: number;
  onDone?: () => void;
}

export function useRigPlayer({ still, blinking }: { still: boolean; blinking: boolean }) {
  const v = useRigValues();
  const [face, setFace] = useState<Face>(DEFAULT_FACE);
  const [marks, setMarks] = useState<Marks>(NO_MARKS);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const current = useRef<Clip | null>(null);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const stop = useCallback(() => {
    clearTimers();
    for (const ch of CHANNELS) cancelAnimation(v[ch]);
  }, [v]);

  const play = useCallback(
    (clip: Clip, opts: PlayOptions = {}) => {
      clearTimers();
      current.current = clip;
      const len = clipLength(clip);
      const enterMs = opts.enterMs ?? ENTER_MS;

      if (clip.kind === "loop") {
        setFace({ ...DEFAULT_FACE, ...(clip.keys[0].face ?? {}) });
        setMarks({ ...NO_MARKS, ...(clip.keys[0].marks ?? {}) });
      } else {
        for (const k of clip.keys) {
          if (!k.face && !k.marks) continue;
          const apply = () => {
            if (k.face) setFace((f) => ({ ...f, ...k.face }));
            if (k.marks) setMarks((m) => ({ ...m, ...k.marks }));
          };
          if (k.at === 0) apply();
          else timers.current.push(setTimeout(apply, k.at));
        }
      }

      if (still) {
        // Reduce motion: jump to the clip's resting pose, no movement.
        const pose = clip.kind === "loop" ? samplePose(clip, 0, REST) : samplePose(clip, len, REST);
        for (const ch of CHANNELS) if (ch !== "lid") v[ch].value = pose[ch];
        if (opts.onDone) timers.current.push(setTimeout(opts.onDone, 0));
        return;
      }

      for (const ch of CHANNELS) {
        if (ch === "lid") continue; // blinks own the eyelids
        const sv = v[ch];
        const track = channelTrack(clip, ch);
        if (!track.length) {
          // A new loop owns the whole body: anything it doesn't move settles back to rest.
          if (clip.kind === "loop") sv.value = withTiming(REST[ch], { duration: enterMs, easing: easing("standard") });
          continue;
        }
        if (clip.kind === "loop") {
          const segs = [];
          for (let i = 1; i < track.length; i++) {
            const ms = track[i].at - track[i - 1].at;
            // loops are slow (breathing, sways): step them on twos
            segs.push(withTiming(track[i].v, { duration: ms, easing: steppedEasing(track[i].ease, ms) }));
          }
          const last = track[track.length - 1];
          if (last.at < len) segs.push(withTiming(last.v, { duration: len - last.at }));
          const enter = withTiming(track[0].v, { duration: enterMs, easing: easing("standard") });
          sv.value = segs.length
            ? withSequence(enter, withRepeat(segs.length === 1 ? segs[0] : withSequence(...segs), -1, false))
            : enter;
        } else {
          const segs = [];
          let prevAt = 0;
          for (const k of track) {
            segs.push(withTiming(k.v, { duration: Math.max(0, k.at - prevAt), easing: easing(k.ease) }));
            prevAt = k.at;
          }
          sv.value = segs.length === 1 ? segs[0] : withSequence(...segs);
        }
      }
      if (opts.onDone) timers.current.push(setTimeout(opts.onDone, len));
    },
    [v, still],
  );

  // Blinks: irregular gaps of 2–7 s, sometimes a double blink, only with open eyes.
  const blinkable = blinking && !still && BLINKABLE.has(face.eyes);
  useEffect(() => {
    if (!blinkable) {
      cancelAnimation(v.lid);
      v.lid.value = 0;
      return;
    }
    const random = rng((Date.now() & 0xffff) ^ 0x5eed);
    let t: ReturnType<typeof setTimeout>;
    const blinkOnce = () => {
      const seq = channelTrack(BLINK_CLIP, "lid").slice(1);
      v.lid.value = withSequence(...seq.map((k, i) => withTiming(k.v, { duration: k.at - (i ? seq[i - 1].at : 0), easing: easing(k.ease) })));
    };
    const schedule = () => {
      const next = nextBlink(random);
      t = setTimeout(() => {
        blinkOnce();
        if (next.double) setTimeout(blinkOnce, BLINK.closeMs + BLINK.shutMs + BLINK.openMs + 90);
        schedule();
      }, next.inMs);
    };
    schedule();
    return () => {
      clearTimeout(t);
      cancelAnimation(v.lid);
    };
  }, [blinkable, v]);

  useEffect(() => () => stop(), [stop]);

  return { values: v, face, marks, play, stop, setFace, setMarks, current };
}
