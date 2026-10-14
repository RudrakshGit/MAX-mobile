import React, { useEffect, useRef, useState } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import Svg from "react-native-svg";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { useIsFocused } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/lib/theme";
import { useFloatingMax } from "@/lib/max-store";
import {
  AngryVein,
  CareHeart,
  CheerSparkles,
  DizzyBirds,
  FloatingHearts,
  FlyingArms,
  HummingNotes,
  ImpactStars,
  MAX_VIEWBOX,
  MaxBlush,
  MaxBody,
  MaxBrows,
  MaxEyes,
  MaxMouth,
  MaxWalkingFeet,
  MotionLines,
  SleepZs,
  SweatDrop,
  ThinkingDots,
  WaveTicks,
  WhistleBlowing,
} from "./parts";
import { useReducedMotionSafe } from "./useReducedMotionSafe";
import { useMaxBehavior } from "./useMaxBehavior";
import type { MaxBehavior, MoveDirection } from "./MaxBehaviorEngine";

export type MaxState =
  | "idle"
  | "wave"
  | "thinking"
  | "listening"
  | "breathe"
  | "cheer"
  | "care"
  | "empty"
  | "sleep";

export type MaxEmotion =
  | "neutral"
  | "happy"
  | "calm"
  | "curious"
  | "surprised"
  | "proud"
  | "lowMood"
  | "anxious"
  | "tired"
  | "sleepy";

export type MaxAction =
  | "none"
  | "wave"
  | "celebrate"
  | "cheer"
  | "bounce"
  | "breathe"
  | "sleep";

export interface MaxProps {
  state?: MaxState;
  behavior?: MaxBehavior;
  initialBehavior?: MaxBehavior;
  direction?: MoveDirection | null;
  emotion?: MaxEmotion;
  action?: MaxAction;
  size?: number;
  boil?: boolean;
  reducedMotion?: boolean;
  interactive?: boolean;
  humming?: boolean;
  whistling?: boolean;
  walking?: boolean;
  flying?: boolean;
  gaze?: { x: number; y: number } | null;
  customEyes?: "default" | "blink" | "happy" | "thinking" | "sleep" | "sad" | "wink" | "surprised" | "dizzy" | "angry";
  customMouth?: "smile" | "open" | "calm" | "sad" | "o" | "whistle" | "dizzy" | "angry";
  onPress?: () => void;
  onPetClick?: () => void;
  style?: StyleProp<ViewStyle>;
}

function triggerHaptic(type: "light" | "medium" | "heavy" | "selection") {
  try {
    if (type === "light") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (type === "medium") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (type === "heavy") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    else if (type === "selection") Haptics.selectionAsync();
  } catch {}
}

export function Max({
  state: stateProp,
  behavior: behaviorProp,
  initialBehavior = "idle",
  direction: directionProp = null,
  emotion = "neutral",
  action = "none",
  size = 100,
  boil = false,
  reducedMotion: reducedMotionProp,
  interactive = false,
  humming = false,
  whistling = false,
  walking = false,
  flying = false,
  gaze = null,
  customEyes,
  customMouth,
  onPress,
  onPetClick,
  style,
}: MaxProps) {
  const t = useTheme();
  const isFocused = useIsFocused();
  const prefersReduced = useReducedMotionSafe(reducedMotionProp);
  const [blinking, setBlinking] = useState(false);
  const [walkPhase, setWalkPhase] = useState(0);
  // Line boil runs on the UI thread (a clock + tiny transform jitter), not as a JS interval that re-renders the SVG.
  const boilClock = useSharedValue(0);
  // Only changes 3 times per cycle, so the style below is re-applied 8 times a second instead of every frame.
  const boilFrame = useDerivedValue(() => Math.floor(boilClock.value) % 3);

  // Hook into living behavior machine when interactive
  const [internalSnapshot, internalControls] = useMaxBehavior(initialBehavior);
  const lastTapRef = useRef(0);

  // Wake up when user touches anywhere in the app
  const lastGlobalTouch = useFloatingMax((s) => s.lastGlobalTouch);
  useEffect(() => {
    if (interactive && lastGlobalTouch > 0) {
      internalControls.poke();
    }
  }, [interactive, lastGlobalTouch, internalControls]);

  // Jump and land on screen focus when user navigates to this page
  const prevFocusedRef = useRef(isFocused);
  useEffect(() => {
    if (interactive) {
      if (!prevFocusedRef.current && isFocused) {
        internalControls.send("screenFocus");
        internalControls.poke();
      }
      prevFocusedRef.current = isFocused;
    }
  }, [interactive, isFocused, internalControls]);

  // Dizzy birds circle on a JS phase, but only while the dizzy reaction (about 1.5 s) is playing.
  const isDizzy = (interactive ? (behaviorProp ?? internalSnapshot.behavior) : behaviorProp) === "dizzy";
  useEffect(() => {
    if (!isDizzy || prefersReduced || !isFocused) return;
    const interval = setInterval(() => {
      setWalkPhase((p) => (p + 0.35) % (Math.PI * 2));
    }, 60);
    return () => clearInterval(interval);
  }, [isDizzy, prefersReduced, isFocused]);

  // Determine current active behavior
  const rawBehavior: MaxBehavior | null = interactive
    ? (behaviorProp ?? internalSnapshot.behavior)
    : (behaviorProp ?? null);
  // A walking, whistling MAX is awake: never show sleep eyes and Zs while it is strolling (audit: walking animation).
  const currentBehavior: MaxBehavior | null = (walking || whistling) && (rawBehavior === "sleep" || rawBehavior === "waking") ? "active" : rawBehavior;

  const currentDirection: MoveDirection | null = interactive
    ? (directionProp ?? internalSnapshot.direction)
    : directionProp;

  // Resolve effective visual state if not using behavior
  let effectiveState: MaxState = "idle";
  if (currentBehavior) {
    if (currentBehavior === "sleep") effectiveState = "sleep";
    else if (currentBehavior === "thinking") effectiveState = "thinking";
    else if (currentBehavior === "celebrating" || currentBehavior === "tapped") effectiveState = "cheer";
    else if (currentBehavior === "greeting") effectiveState = "wave";
    else effectiveState = "idle";
  } else if (stateProp) {
    effectiveState = stateProp;
  } else if (action !== "none") {
    if (action === "celebrate" || action === "cheer" || action === "bounce") {
      effectiveState = "cheer";
    } else if (action === "wave") {
      effectiveState = "wave";
    } else if (action === "breathe") {
      effectiveState = "breathe";
    } else if (action === "sleep") {
      effectiveState = "sleep";
    }
  } else {
    if (emotion === "happy" || emotion === "proud") effectiveState = "wave";
    else if (emotion === "calm") effectiveState = "idle";
    else if (emotion === "curious" || emotion === "surprised") effectiveState = "thinking";
    else if (emotion === "anxious" || emotion === "lowMood") effectiveState = "care";
    else if (emotion === "tired" || emotion === "sleepy") effectiveState = "sleep";
    else effectiveState = "idle";
  }

  // Animation values
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const tapBounce = useSharedValue(0);


  // Periodic Eye Blink for living character feel
  const isSleeping = currentBehavior ? currentBehavior === "sleep" : effectiveState === "sleep";
  useEffect(() => {
    if (prefersReduced || isSleeping) return;
    const interval = setInterval(() => {
      setBlinking(true);
      const timer = setTimeout(() => setBlinking(false), 140);
      return () => clearTimeout(timer);
    }, 3800);
    return () => clearInterval(interval);
  }, [prefersReduced, isSleeping]);

  // Boiling line: 3 slightly different poses of the outline at 8 fps, paused off-focus or with reduced motion.
  useEffect(() => {
    // A sleeping MAX is perfectly still, so an idle screen costs no frames at all.
    if (!boil || prefersReduced || !isFocused || isSleeping) {
      cancelAnimation(boilClock);
      boilClock.value = 0;
      return;
    }
    boilClock.value = withRepeat(withTiming(3, { duration: 375, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(boilClock);
  }, [boil, prefersReduced, isFocused, isSleeping]);

  // Main UI-thread motion loops
  useEffect(() => {
    if (prefersReduced) {
      cancelAnimation(translateY);
      cancelAnimation(rotation);
      cancelAnimation(scale);
      cancelAnimation(scaleX);
      cancelAnimation(scaleY);
      translateY.value = 0;
      rotation.value = 0;
      scale.value = 1;
      scaleX.value = 1;
      scaleY.value = 1;
      return;
    }

    if (walking) {
      // Natural dumpling waddle: rhythmic side-to-side body tilt + vertical bobbing
      translateY.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 220 }),
          withTiming(0, { duration: 220 })
        ),
        -1,
        true
      );
      rotation.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 220 }),
          withTiming(5, { duration: 220 })
        ),
        -1,
        true
      );
      scaleX.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 220 }),
          withTiming(0.96, { duration: 220 })
        ),
        -1,
        true
      );
      scaleY.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 220 }),
          withTiming(1.05, { duration: 220 })
        ),
        -1,
        true
      );
    } else if (currentBehavior) {
      // Behavior-driven animations
      if (currentBehavior === "idle" || currentBehavior === "active") {
        translateY.value = withRepeat(
          withSequence(
            withTiming(-3, { duration: 1200 }),
            withTiming(0, { duration: 1200 })
          ),
          -1,
          true
        );
        rotation.value = 0;
        scale.value = 1;
        scaleX.value = 1;
        scaleY.value = 1;
      } else if (currentBehavior === "sleep") {
        translateY.value = withTiming(4, { duration: 800 });
        rotation.value = withTiming(2, { duration: 800 });
        scale.value = 1;
        scaleX.value = 1;
        scaleY.value = 1;
      } else if (currentBehavior === "waking") {
        translateY.value = withSequence(
          withSpring(-6, { damping: 8, stiffness: 220 }),
          withSpring(0, { damping: 10, stiffness: 180 })
        );
        rotation.value = withSequence(
          withTiming(-4, { duration: 120 }),
          withTiming(4, { duration: 120 }),
          withTiming(0, { duration: 120 })
        );
        scale.value = 1;
        scaleX.value = 1;
        scaleY.value = 1;
      } else if (currentBehavior === "drag") {
        scale.value = withSpring(0.95, { damping: 12, stiffness: 200 });
        let rot = 0;
        if (currentDirection === "right" || currentDirection === "upRight" || currentDirection === "downRight") rot = 6;
        else if (currentDirection === "left" || currentDirection === "upLeft" || currentDirection === "downLeft") rot = -6;
        rotation.value = withTiming(rot, { duration: 150 });
        translateY.value = 0;
        scaleX.value = withTiming(0.93, { duration: 150 });
        scaleY.value = withTiming(1.08, { duration: 150 });
      } else if (currentBehavior === "falling") {
        scale.value = 1;
        scaleX.value = withTiming(0.9, { duration: 200 });
        scaleY.value = withTiming(1.15, { duration: 200 });
        rotation.value = withTiming(0, { duration: 150 });
      } else if (currentBehavior === "landed") {
        scaleX.value = withSequence(
          withTiming(1.24, { duration: 250 }),
          withSpring(1.0, { damping: 10, stiffness: 140 })
        );
        scaleY.value = withSequence(
          withTiming(0.76, { duration: 250 }),
          withSpring(1.0, { damping: 10, stiffness: 140 })
        );
        translateY.value = 0;
        rotation.value = 0;
      } else if (currentBehavior === "tapped") {
        translateY.value = withSequence(
          withSpring(-10, { damping: 10, stiffness: 220 }),
          withSpring(0, { damping: 12, stiffness: 180 })
        );
        rotation.value = withSequence(
          withTiming(2, { duration: 100 }),
          withTiming(0, { duration: 100 })
        );
        scale.value = 1;
        scaleX.value = 1;
        scaleY.value = 1;
      } else if (currentBehavior === "petted") {
        rotation.value = withRepeat(
          withSequence(
            withTiming(4, { duration: 220 }),
            withTiming(-4, { duration: 220 })
          ),
          -1,
          true
        );
        scale.value = withSpring(1.06);
        translateY.value = withTiming(-2, { duration: 200 });
      } else if (currentBehavior === "thinking") {
        translateY.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 1000 }),
            withTiming(0, { duration: 1000 })
          ),
          -1,
          true
        );
        rotation.value = withRepeat(
          withSequence(
            withTiming(3, { duration: 1200 }),
            withTiming(-3, { duration: 1200 })
          ),
          -1,
          true
        );
        scale.value = 1;
      } else if (currentBehavior === "celebrating") {
        translateY.value = withRepeat(
          withSequence(
            withTiming(-14, { duration: 260 }),
            withTiming(0, { duration: 200 })
          ),
          3,
          false
        );
        scaleX.value = withSequence(
          withTiming(0.92, { duration: 150 }),
          withTiming(1.08, { duration: 200 }),
          withTiming(1.0, { duration: 150 })
        );
        rotation.value = 0;
      } else if (currentBehavior === "greeting") {
        translateY.value = withRepeat(
          withSequence(
            withTiming(-4, { duration: 350 }),
            withTiming(0, { duration: 350 })
          ),
          3,
          true
        );
        rotation.value = withRepeat(
          withSequence(
            withTiming(4, { duration: 250 }),
            withTiming(-4, { duration: 250 })
          ),
          4,
          true
        );
        scale.value = 1;
      } else if (currentBehavior === "nudge") {
        translateY.value = withSequence(
          withTiming(-4, { duration: 200 }),
          withTiming(0, { duration: 200 })
        );
        scaleX.value = withSequence(
          withTiming(1.06, { duration: 250 }),
          withTiming(1.0, { duration: 250 })
        );
      } else if (currentBehavior === "wall") {
        scaleX.value = withTiming(0.9, { duration: 150 });
        scaleY.value = withTiming(1.06, { duration: 150 });
        rotation.value = 0;
      } else if (currentBehavior === "dizzy") {
        // Rapid wobble shake, then topple down squashed on belly
        rotation.value = withRepeat(
          withSequence(
            withTiming(-15, { duration: 70 }),
            withTiming(15, { duration: 70 })
          ),
          12,
          true
        );
        translateY.value = withSequence(
          withTiming(0, { duration: 800 }),
          withTiming(10, { duration: 300 })
        );
        scaleX.value = withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(1.3, { duration: 300 })
        );
        scaleY.value = withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.65, { duration: 300 })
        );
      } else if (currentBehavior === "angry") {
        // Pop up, puff chest, pout and stamp
        translateY.value = withSequence(
          withSpring(-12, { damping: 9, stiffness: 240 }),
          withSpring(0, { damping: 12, stiffness: 180 })
        );
        rotation.value = withSequence(
          withTiming(-5, { duration: 100 }),
          withTiming(5, { duration: 100 }),
          withTiming(0, { duration: 100 })
        );
        scaleX.value = withSequence(
          withTiming(1.14, { duration: 150 }),
          withTiming(1.0, { duration: 160 })
        );
        scaleY.value = withSequence(
          withTiming(0.9, { duration: 150 }),
          withTiming(1.0, { duration: 160 })
        );
      } else if (currentBehavior === "jump") {
        // Joyful leap into air and landing
        translateY.value = withSequence(
          withTiming(4, { duration: 90 }),
          withTiming(-24, { duration: 240, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 190, easing: Easing.in(Easing.quad) })
        );
        scaleX.value = withSequence(
          withTiming(1.15, { duration: 90 }),
          withTiming(0.88, { duration: 240 }),
          withTiming(1.24, { duration: 190 }),
          withSpring(1.0, { damping: 10, stiffness: 160 })
        );
        scaleY.value = withSequence(
          withTiming(0.85, { duration: 90 }),
          withTiming(1.16, { duration: 240 }),
          withTiming(0.74, { duration: 190 }),
          withSpring(1.0, { damping: 10, stiffness: 160 })
        );
        rotation.value = withSequence(
          withTiming(-3, { duration: 120 }),
          withTiming(3, { duration: 180 }),
          withTiming(0, { duration: 120 })
        );
      }
    } else {
      // Legacy states fallback
      if (effectiveState === "idle" || effectiveState === "empty") {
        translateY.value = withRepeat(
          withSequence(
            withTiming(-3, { duration: 1200 }),
            withTiming(0, { duration: 1200 })
          ),
          -1,
          true
        );
        rotation.value = 0;
        scale.value = 1;
        scaleX.value = 1;
        scaleY.value = 1;
      } else if (effectiveState === "breathe") {
        translateY.value = 0;
        rotation.value = 0;
        scale.value = withRepeat(
          withSequence(
            withTiming(1.07, { duration: 4000 }),
            withTiming(1.0, { duration: 4000 })
          ),
          -1,
          true
        );
      } else if (effectiveState === "thinking") {
        translateY.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 1000 }),
            withTiming(0, { duration: 1000 })
          ),
          -1,
          true
        );
        rotation.value = withRepeat(
          withSequence(
            withTiming(3, { duration: 1200 }),
            withTiming(-3, { duration: 1200 })
          ),
          -1,
          true
        );
        scale.value = 1;
      } else if (effectiveState === "listening") {
        translateY.value = -1;
        rotation.value = withTiming(3.5, { duration: 500 });
        scale.value = 1;
      } else if (effectiveState === "wave") {
        translateY.value = withRepeat(
          withSequence(
            withTiming(-4, { duration: 400 }),
            withTiming(0, { duration: 400 })
          ),
          4,
          true
        );
        rotation.value = withRepeat(
          withSequence(
            withTiming(4, { duration: 300 }),
            withTiming(-4, { duration: 300 })
          ),
          6,
          true
        );
        scale.value = 1;
      } else if (effectiveState === "cheer") {
        translateY.value = withRepeat(
          withSequence(
            withTiming(-12, { duration: 350 }),
            withTiming(0, { duration: 250 })
          ),
          3,
          false
        );
        scaleX.value = withSequence(
          withTiming(0.95, { duration: 200 }),
          withTiming(1.06, { duration: 250 }),
          withTiming(1.0, { duration: 200 })
        );
        rotation.value = 0;
      } else if (effectiveState === "care") {
        translateY.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 1600 }),
            withTiming(0, { duration: 1600 })
          ),
          -1,
          true
        );
        rotation.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 1600 }),
            withTiming(2, { duration: 1600 })
          ),
          -1,
          true
        );
        scale.value = 1;
      } else if (effectiveState === "sleep") {
        translateY.value = withTiming(3, { duration: 800 });
        rotation.value = 0;
        scale.value = 1;
      }
    }

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(rotation);
      cancelAnimation(scale);
      cancelAnimation(scaleX);
      cancelAnimation(scaleY);
    };
  }, [currentBehavior, currentDirection, effectiveState, prefersReduced, walking]);

  const animatedStyle = useAnimatedStyle(() => {
    // 0 = still, 1 and 2 = the two jittered poses of the hand-drawn outline.
    const f = boilFrame.value;
    const jx = f === 1 ? 1.006 : f === 2 ? 0.995 : 1;
    const jy = f === 1 ? 0.994 : f === 2 ? 1.005 : 1;
    const jr = f === 1 ? 0.25 : f === 2 ? -0.25 : 0;
    return {
      transform: [
        { translateY: translateY.value + tapBounce.value },
        { rotate: `${rotation.value + jr}deg` },
        { scale: scale.value },
        { scaleX: scaleX.value * jx },
        { scaleY: scaleY.value * jy },
      ],
    };
  });

  const handlePress = () => {
    if (interactive) {
      const now = Date.now();
      if (now - lastTapRef.current < 320) {
        internalControls.send("doubleTap");
        triggerHaptic("medium");
      } else {
        internalControls.send("tap");
        triggerHaptic("light");
      }
      lastTapRef.current = now;
    } else if (!prefersReduced) {
      tapBounce.value = withSequence(
        withSpring(-8, { damping: 10, stiffness: 200 }),
        withSpring(0, { damping: 12, stiffness: 180 })
      );
    }
    onPetClick?.();
    onPress?.();
  };

  const handleLongPress = () => {
    if (interactive) {
      internalControls.send("longPress");
      triggerHaptic("selection");
    }
  };

  const handlePressOut = () => {
    if (interactive && internalSnapshot.behavior === "petted") {
      internalControls.send("longPressEnd");
    }
  };

  // Facial features resolution
  let eyesKind: "default" | "blink" | "happy" | "thinking" | "sleep" | "sad" | "wink" | "surprised" | "dizzy" | "angry" = "default";
  let browsKind: "default" | "curious" | "anxious" | "care" | "angry" = "default";
  let mouthKind: "smile" | "open" | "calm" | "sad" | "o" | "whistle" | "dizzy" | "angry" = "smile";

  if (currentBehavior) {
    if (currentBehavior === "sleep") {
      eyesKind = "sleep";
      browsKind = "default";
      mouthKind = "calm";
    } else if (currentBehavior === "waking" || currentBehavior === "tapped") {
      eyesKind = "wink";
      browsKind = "curious";
      mouthKind = "smile";
    } else if (currentBehavior === "falling" || currentBehavior === "wall") {
      eyesKind = "surprised";
      browsKind = "anxious";
      mouthKind = currentBehavior === "falling" ? "o" : "calm";
    } else if (currentBehavior === "celebrating" || currentBehavior === "greeting") {
      eyesKind = "happy";
      browsKind = "default";
      mouthKind = "open";
    } else if (currentBehavior === "petted") {
      eyesKind = "happy";
      browsKind = "default";
      mouthKind = "open";
    } else if (currentBehavior === "drag") {
      eyesKind = "happy";
      browsKind = "default";
      mouthKind = "o";
    } else if (currentBehavior === "jump") {
      eyesKind = "happy";
      browsKind = "curious";
      mouthKind = "open";
    } else if (currentBehavior === "landed") {
      eyesKind = "blink";
      browsKind = "default";
      mouthKind = "smile";
    } else if (currentBehavior === "thinking") {
      eyesKind = "thinking";
      browsKind = "curious";
      mouthKind = "smile";
    } else if (currentBehavior === "dizzy") {
      eyesKind = "dizzy";
      browsKind = "default";
      mouthKind = "dizzy";
    } else if (currentBehavior === "angry") {
      eyesKind = "angry";
      browsKind = "angry";
      mouthKind = "angry";
    } else {
      eyesKind = blinking ? "blink" : "default";
      browsKind = "default";
      mouthKind = "smile";
    }
  } else {
    eyesKind =
      effectiveState === "sleep"
        ? "sleep"
        : blinking
        ? "blink"
        : effectiveState === "cheer" || effectiveState === "wave" || emotion === "happy"
        ? "happy"
        : effectiveState === "thinking"
        ? "thinking"
        : emotion === "lowMood" || emotion === "anxious"
        ? "sad"
        : "default";

    browsKind =
      effectiveState === "thinking" || emotion === "curious"
        ? "curious"
        : effectiveState === "care" || emotion === "anxious"
        ? "anxious"
        : "default";

    mouthKind =
      effectiveState === "cheer" || emotion === "happy"
        ? "open"
        : effectiveState === "sleep" || effectiveState === "care"
        ? "calm"
        : emotion === "lowMood"
        ? "sad"
        : "smile";
  }

  // Explicit overrides & whistling / playful expressions
  if (customEyes) {
    eyesKind = customEyes;
  }
  if (customMouth) {
    mouthKind = customMouth;
  } else if (whistling) {
    mouthKind = "whistle";
    if (!customEyes && (eyesKind === "default" || eyesKind === "blink")) {
      eyesKind = "happy";
    }
  }

  const width = size;
  const height = Math.round(size * (172 / 180));

  const isClickable = interactive || Boolean(onPress || onPetClick);

  // Character palette: Max is always a warm-white sketchbook companion with rich ink
  const characterPaper = t.characterPaper;
  const characterInk = t.characterInk;

  return (
    <Pressable
      accessibilityRole="image"
      accessibilityLabel={`Max, feeling ${currentBehavior ?? effectiveState}`}
      onPress={handlePress}
      onLongPress={interactive ? handleLongPress : undefined}
      onPressOut={interactive ? handlePressOut : undefined}
      disabled={!isClickable}
      style={[{ width, height, alignItems: "center", justifyContent: "center" }, style]}>
      <Animated.View style={[{ width, height }, animatedStyle]}>
        <Svg width={width} height={height} viewBox={MAX_VIEWBOX}>
          {/* Main Body with full opaque paper fill covering dumpling torso, side-flap arms and feet */}
          <MaxBody ink={characterInk} paper={characterPaper} />

          {/* Cheeks */}
          <MaxBlush ink={characterInk} visible={isSleeping ? false : true} />

          {/* Facial Features */}
          <MaxBrows kind={browsKind} ink={characterInk} />
          <MaxEyes kind={eyesKind} ink={characterInk} gaze={gaze} />
          <MaxMouth kind={mouthKind} ink={characterInk} />

          {/* Behavior / state-specific particles */}
          {currentBehavior ? (
            <>
              {currentBehavior === "sleep" && <SleepZs ink={t.ink} />}
              {(currentBehavior === "tapped" || currentBehavior === "celebrating") && (
                <CheerSparkles ink={t.ink} />
              )}
              {currentBehavior === "petted" && <FloatingHearts ink={t.ink} />}
              {currentBehavior === "greeting" && <WaveTicks ink={t.ink} />}
              {currentBehavior === "thinking" && <ThinkingDots ink={t.ink} />}
              {currentBehavior === "falling" && <SweatDrop ink={t.ink} />}
              {currentBehavior === "landed" && <ImpactStars ink={t.ink} />}
              {currentBehavior === "drag" && (
                <MotionLines ink={t.ink} direction={currentDirection} />
              )}
              {currentBehavior === "dizzy" && <DizzyBirds ink={t.ink} phase={walkPhase} />}
              {currentBehavior === "angry" && <AngryVein ink={t.ink} />}
            </>
          ) : (
            <>
              {effectiveState === "wave" && <WaveTicks ink={t.ink} />}
              {effectiveState === "thinking" && <ThinkingDots ink={t.ink} />}
              {effectiveState === "sleep" && <SleepZs ink={t.ink} />}
              {effectiveState === "care" && <CareHeart ink={t.ink} />}
              {effectiveState === "cheer" && <CheerSparkles ink={t.ink} />}
            </>
          )}

          {/* Whistling or Humming notes */}
          {whistling && <WhistleBlowing ink={t.ink} />}
          {humming && <HummingNotes ink={t.ink} />}
        </Svg>
      </Animated.View>
    </Pressable>
  );
}
