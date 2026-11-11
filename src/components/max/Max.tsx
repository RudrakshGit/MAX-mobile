import React, { useCallback, useEffect, useRef, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
// Gesture-handler's Pressable hit-tests the real (transformed) view; with Reanimated's fast transform path the
// built-in one can miss taps on a MAX that has walked or moved.
import { Pressable } from "react-native-gesture-handler";
import { cancelAnimation, Easing, useSharedValue, withRepeat, withTiming, type SharedValue } from "react-native-reanimated";
import { useIsFocused } from "expo-router";
import * as Haptics from "expo-haptics";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { useReducedMotionSafe } from "./useReducedMotionSafe";
import { useMaxBehavior } from "./useMaxBehavior";
import type { MaxBehavior, MoveDirection } from "./MaxBehaviorEngine";
import { MaxRig } from "./rig/MaxRig";
import { CLIPS, IDLE_GESTURES, NIGHT_GESTURES, type ClipName } from "./rig/clips";
import { WALK, nextGesture, rng } from "./rig/motion";
import type { Face, Marks } from "./rig/pose";
import { useRigPlayer } from "./rig/useRigPlayer";

// MAX, the companion (docs/plan/M16-motion-cards-ia.md). A rig of separate parts acting pose to pose on the UI
// thread: calm timing curves, holds after every action, no bounce. Screens describe what MAX is doing (`state`,
// `behavior`, `walking`, `sleeping`, `breath`...); this component turns that into clips.

/** One walk cycle (two steps) and the slower tired one: 0.65 s and 0.85 s per step. */
export const WALK_CYCLE_MS = WALK.cycleMs;
export const TIRED_WALK_CYCLE_MS = WALK.tiredCycleMs;
export { walkSpeed } from "./rig/MaxRig";

export type MaxState = "idle" | "wave" | "thinking" | "listening" | "breathe" | "cheer" | "care" | "empty" | "sleep";

export type MaxEmotion = "neutral" | "happy" | "calm" | "curious" | "surprised" | "proud" | "lowMood" | "anxious" | "tired" | "sleepy";

export type MaxAction = "none" | "wave" | "celebrate" | "cheer" | "bounce" | "breathe" | "sleep" | "nod" | "tug" | "comfort";

export interface MaxProps {
  state?: MaxState;
  behavior?: MaxBehavior;
  initialBehavior?: MaxBehavior;
  direction?: MoveDirection | null;
  emotion?: MaxEmotion;
  action?: MaxAction;
  size?: number;
  /** Kept for older call sites; the outline no longer jitters. */
  boil?: boolean;
  reducedMotion?: boolean;
  interactive?: boolean;
  humming?: boolean;
  whistling?: boolean;
  walking?: boolean;
  flying?: boolean;
  sweating?: boolean;
  tired?: boolean;
  sleeping?: boolean;
  /** Sitting down, awake (Home's story: worn out after the walk). */
  sitting?: boolean;
  /** With `sleeping`: asleep lying on its side instead of sitting. */
  lying?: boolean;
  breathing?: boolean;
  /**
   * Breathing along (breathing tool, the deep breath before sleep on Home): 0 = lungs empty, 1 = full. MAX's body
   * fills upward with it (feet stay on the ground), the arms lift a little, and the face follows `breathPhase`.
   */
  breath?: SharedValue<number>;
  breathPhase?: "in" | "hold" | "out";
  /** Extra gaze, -1…1 each way (the floating MAX looks toward a touch). */
  gaze?: { x: number; y: number } | null;
  customEyes?: Face["eyes"];
  customMouth?: Face["mouth"];
  onPress?: () => void;
  onPetClick?: () => void;
  style?: StyleProp<ViewStyle>;
}

function haptic(type: "light" | "medium" | "selection") {
  try {
    if (type === "light") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (type === "medium") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else Haptics.selectionAsync();
  } catch {}
}

/** The loop MAX settles into for what the screen says it is doing. */
function baseFor(o: { behavior: MaxBehavior | null; state?: MaxState; emotion: MaxEmotion; sleeping: boolean; walking: boolean; breath: boolean; sitting: boolean; lying: boolean }): ClipName | "rest" {
  if (o.walking) return "rest";
  if (o.sleeping && o.lying) return "lieSleep";
  if (o.sitting) return "sit";
  if (o.breath) return "rest";
  if (o.sleeping || o.behavior === "sleep") return "sleep";
  switch (o.behavior) {
    case "thinking":
      return "think";
    case "petted":
      return "pet";
    case "drag":
    case "falling":
      return "drag";
    case "wall":
      return "wall";
    case null:
      break;
    default:
      return "idle";
  }
  switch (o.state) {
    case "sleep":
      return "sleep";
    case "thinking":
      return "think";
    case "listening":
      return "listen";
    case "care":
      return "care";
    case undefined:
      break;
    default:
      return "idle";
  }
  if (o.emotion === "anxious" || o.emotion === "lowMood") return "care";
  if (o.emotion === "tired" || o.emotion === "sleepy") return "sleep";
  if (o.emotion === "curious" || o.emotion === "surprised") return "think";
  return "idle";
}

/** A one-off action for a behaviour the engine has just entered. */
const BEHAVIOR_ACTION: Partial<Record<MaxBehavior, ClipName>> = {
  tapped: "tapReact",
  celebrating: "hop",
  greeting: "wave",
  landed: "land",
  dizzy: "dizzy",
  jump: "smallHop",
  nudge: "lookAround",
  angry: "nod",
};

const REST_CLIP = { name: "rest", kind: "loop" as const, keys: [{ at: 0, pose: { bsx: 1, bsy: 1, br: 0, by: 0 } }, { at: 1000, pose: { bsx: 1, bsy: 1, br: 0, by: 0 } }] };

export function Max({
  state: stateProp,
  behavior: behaviorProp,
  initialBehavior = "idle",
  direction: _direction = null,
  emotion = "neutral",
  action = "none",
  size = 100,
  reducedMotion: reducedMotionProp,
  interactive = false,
  humming = false,
  whistling = false,
  walking = false,
  sweating = false,
  tired = false,
  sleeping = false,
  sitting = false,
  lying = false,
  breathing = false,
  breath,
  breathPhase,
  gaze = null,
  customEyes,
  customMouth,
  onPress,
  onPetClick,
  style,
}: MaxProps) {
  const t = useTheme();
  const isFocused = useIsFocused();
  const reduced = useReducedMotionSafe(reducedMotionProp);
  // Settings → "MAX moves": still is like reduce motion; calm drops idle gestures and settles after a few seconds
  const motion = useStore((s) => s.maxMotion ?? "normal");
  const still = reduced || motion === "still" || !isFocused;
  const player = useRigPlayer({ still, blinking: size >= 40 });
  const { play } = player;
  const v = player.values;

  // The behaviour machine only runs for MAXes the student can play with.
  const [snap, controls] = useMaxBehavior(initialBehavior);
  const behavior: MaxBehavior | null = sleeping ? "sleep" : interactive ? (behaviorProp ?? snap.behavior) : (behaviorProp ?? null);

  const base = baseFor({ behavior, state: stateProp, emotion, sleeping, walking, breath: !!breath, sitting, lying });

  // One-off actions: a behaviour the engine just entered, a state that is an action, or an idle gesture.
  const [act, setAct] = useState<{ name: ClipName; id: number } | null>(null);
  const actId = useRef(0);
  const request = useCallback((name: ClipName) => setAct({ name, id: ++actId.current }), []);
  useEffect(() => {
    const name = behavior ? BEHAVIOR_ACTION[behavior] : undefined;
    if (name) request(name);
  }, [behavior, snap.seq, request]);
  useEffect(() => {
    if (stateProp === "wave" || action === "wave") request("wave");
    else if (stateProp === "cheer" || action === "celebrate" || action === "cheer" || action === "bounce") request("hop");
    else if (action === "nod") request("nod");
    else if (action === "tug") request("tug");
    else if (action === "comfort") request("comfort");
  }, [stateProp, action, request]);

  // The director: actions play to the end, then MAX settles back into the current loop. Sitting down and waking
  // up are played on the way into and out of sleep, so MAX never jumps between poses.
  const motionRef = useRef(motion);
  motionRef.current = motion;
  const calmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (calmTimer.current) clearTimeout(calmTimer.current);
  }, []);
  const baseRef = useRef(base);
  const shownBase = useRef<ClipName | "rest" | null>(null);
  const busy = useRef(false);
  const lastAct = useRef(0);
  baseRef.current = base;
  // Plays the actions one after another, then the loop; each step waits for the previous one.
  const chain = useCallback(
    (steps: ClipName[], then: ClipName | "rest") => {
      busy.current = true;
      const run = (i: number) => {
        if (i >= steps.length) {
          busy.current = false;
          play(then === "rest" ? REST_CLIP : CLIPS[then], { enterMs: 200 });
          return;
        }
        play(CLIPS[steps[i]], { onDone: () => run(i + 1) });
      };
      run(0);
    },
    [play],
  );
  const settle = useCallback(() => {
    const next = baseRef.current;
    const prev = shownBase.current;
    shownBase.current = next;
    const loop = next === "rest" ? REST_CLIP : CLIPS[next];
    const seated = prev === "sit" || prev === "sleep";
    if (prev === "lieSleep" && next !== "lieSleep") {
      // rolls back up to sitting, then stretches and yawns
      chain(next === "sit" || next === "sleep" ? ["getUp"] : ["getUp", "wakeUp"], next);
    } else if (next === "lieSleep" && prev) {
      chain(seated ? ["lieDown"] : ["sitDown", "lieDown"], "lieSleep");
    } else if ((next === "sleep" || next === "sit") && prev && !seated) {
      chain(["sitDown"], next);
    } else if (prev === "sleep" && next !== "sleep" && next !== "sit") {
      chain(["wakeUp"], next);
    } else if (prev === "sit" && next !== "sit" && next !== "sleep") {
      chain(["wakeUp"], next);
    } else {
      play(loop, seated && (next === "sit" || next === "sleep") ? { enterMs: 400 } : undefined);
      // calm: breathe for a moment, then hold still (WCAG 2.2.2: motion beside content stops within ~5 s)
      if (motionRef.current === "calm" && next === "idle") {
        if (calmTimer.current) clearTimeout(calmTimer.current);
        calmTimer.current = setTimeout(() => {
          if (!busy.current && shownBase.current === "idle") play(REST_CLIP, { enterMs: 600 });
        }, 5000);
      }
    }
  }, [play, chain]);
  useEffect(() => {
    if (act && act.id !== lastAct.current) {
      lastAct.current = act.id;
      busy.current = true;
      play(CLIPS[act.name], {
        onDone: () => {
          busy.current = false;
          settle();
        },
      });
      return;
    }
    if (!busy.current && shownBase.current !== base) settle();
  }, [base, act, settle, play]);
  // Off screen or with reduce motion everything holds still; coming back, MAX picks up its loop again.
  const firstStill = useRef(true);
  useEffect(() => {
    if (firstStill.current) {
      firstStill.current = false;
      return;
    }
    busy.current = false;
    shownBase.current = null;
    settle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still]);

  // Idle gestures every 6–15 s, only for a MAX big enough to read; yawns late at night.
  useEffect(() => {
    if (still || motion === "calm" || base !== "idle" || size < 70) return;
    const random = rng(size * 7919 + new Date().getMinutes());
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      timer = setTimeout(() => {
        const h = new Date().getHours();
        const pool = h >= 22 || h < 5 ? NIGHT_GESTURES : IDLE_GESTURES;
        if (!busy.current) request(pool[Math.floor(random() * pool.length)]);
        next();
      }, nextGesture(random));
    };
    next();
    return () => clearTimeout(timer);
  }, [still, motion, base, size, request]);

  // Walking: one clock drives feet, arms, bob and lean; MAX looks where it is going.
  const walkClock = useSharedValue(0);
  useEffect(() => {
    if (!walking || still) {
      cancelAnimation(walkClock);
      walkClock.value = 0;
      return;
    }
    walkClock.value = 0;
    walkClock.value = withRepeat(withTiming(1, { duration: tired ? TIRED_WALK_CYCLE_MS : WALK_CYCLE_MS, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(walkClock);
  }, [walking, tired, still, walkClock]);

  // Extra gaze: walking looks ahead; the floating MAX looks toward a touch.
  useEffect(() => {
    const gx = walking ? 3 : gaze ? Math.max(-5, Math.min(5, gaze.x * 5)) : 0;
    const gy = walking ? 0 : gaze ? Math.max(-4, Math.min(4, gaze.y * 4)) : 0;
    v.gx.value = still ? gx : withTiming(gx, { duration: 90 });
    v.gy.value = still ? gy : withTiming(gy, { duration: 90 });
  }, [walking, gaze?.x, gaze?.y, still, v]);

  // The face: what the clip shows, then what the screen asks for.
  const face: Face = { ...player.face };
  const marks: Marks = { ...player.marks };
  if (base === "idle" && player.face.eyes === "default") {
    if (emotion === "happy" || emotion === "proud") (face.eyes = "happy"), (face.mouth = "open");
    else if (emotion === "calm") face.mouth = "calm";
  }
  if (tired) {
    face.eyes = "sad";
    face.brows = "anxious";
    face.mouth = "o";
  } else if (breathPhase) {
    face.eyes = "sleep";
    face.brows = "default";
    face.mouth = breathPhase === "out" ? "o" : "calm";
  } else if (breathing) {
    face.eyes = "sleep";
    face.mouth = "o";
  }
  if (whistling && !tired && base !== "sleep") {
    face.mouth = "whistle";
    if (face.eyes === "default") face.eyes = "happy";
    marks.notes = true;
  }
  if (humming) marks.notes = true;
  if (sweating) marks.sweat = true;
  if (customEyes) face.eyes = customEyes;
  if (customMouth) face.mouth = customMouth;

  const lastTap = useRef(0);
  const handlePress = () => {
    if (interactive) {
      const now = Date.now();
      if (now - lastTap.current < 320) {
        controls.send("doubleTap");
        haptic("medium");
      } else {
        controls.send("tap");
        haptic("light");
      }
      lastTap.current = now;
    } else if (!still && (onPress || onPetClick)) {
      request("tapReact");
    }
    onPetClick?.();
    onPress?.();
  };

  const width = size;
  const height = Math.round(size * (172 / 180));
  const clickable = interactive || Boolean(onPress || onPetClick);
  const doing = base === "sleep" || base === "lieSleep" ? "sleeping" : base === "sit" ? "resting" : base === "think" ? "thinking" : base === "care" ? "here with you" : walking ? "walking" : "awake";

  return (
    <Pressable
      accessibilityRole={clickable ? "button" : "image"}
      accessibilityLabel={`Max, ${doing}`}
      onPress={handlePress}
      onLongPress={interactive ? () => (controls.send("longPress"), haptic("selection")) : undefined}
      onPressOut={interactive ? () => snap.behavior === "petted" && controls.send("longPressEnd") : undefined}
      disabled={!clickable}
      style={[{ width, height }, style]}>
      <MaxRig
        size={size}
        values={v}
        face={face}
        marks={marks}
        ink={t.characterInk}
        paper={t.characterPaper}
        foot={t.characterFoot}
        markInk={t.ink}
        blush={face.eyes !== "sleep"}
        blushColor={t.characterBlush}
        walkClock={walking && !still ? walkClock : undefined}
        breath={breath && !reduced ? breath : undefined}
        still={still}
      />
    </Pressable>
  );
}
