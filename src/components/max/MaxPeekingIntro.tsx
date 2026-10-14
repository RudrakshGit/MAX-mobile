import React, { useEffect, useState } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/lib/theme";
import { T } from "@/lib/ui";
import { Max } from "./Max";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

// Ensures MAX only peeks once per app startup session
let hasPeekedThisSession = false;

export function MaxPeekingIntro({ onFinished }: { onFinished?: () => void }) {
  const t = useTheme();
  const prefersReduced = useReducedMotionSafe();
  const [visible, setVisible] = useState(!hasPeekedThisSession);
  const [peekPhase, setPeekPhase] = useState<"curious" | "wink" | "grin" | "celebrating">("curious");

  // Peeking vertical position (positive = hidden offscreen below bottom edge) and playful head tilt
  const translateY = useSharedValue(110);
  const rotation = useSharedValue(0);
  const bubbleScale = useSharedValue(0);

  useEffect(() => {
    if (hasPeekedThisSession || prefersReduced) {
      setVisible(false);
      onFinished?.();
      return;
    }

    hasPeekedThisSession = true;

    // Small delay after splash screen fade to pop up playfully
    const timer = setTimeout(() => {
      // 1. Peek up smoothly with curious peek
      translateY.value = withSpring(16, { damping: 13, stiffness: 130 }, (fin) => {
        if (fin) {
          // 2. Pop tiny greeting bubble
          bubbleScale.value = withSpring(1, { damping: 12, stiffness: 160 });
        }
      });

      // 2. Playful expression transitions:
      // At 350ms: Cheeky wink and head tilt left 😉
      const t1 = setTimeout(() => {
        setPeekPhase("wink");
        rotation.value = withSpring(-8, { damping: 10, stiffness: 140 });
      }, 350);

      // At 1100ms: Big cheerful grin and head tilt right 😄
      const t2 = setTimeout(() => {
        setPeekPhase("grin");
        rotation.value = withSpring(8, { damping: 10, stiffness: 140 });
      }, 1100);

      // At 1900ms: Return head straight before ducking down
      const t3 = setTimeout(() => {
        rotation.value = withTiming(0, { duration: 200 });
      }, 1900);

      // 3. Duck back down smoothly after playful sequence
      translateY.value = withDelay(
        2350,
        withTiming(120, { duration: 320 }, (finished) => {
          if (finished) {
            runOnJS(setVisible)(false);
            if (onFinished) runOnJS(onFinished)();
          }
        })
      );

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }, 450);

    return () => clearTimeout(timer);
  }, [prefersReduced]);

  const handleTap = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setPeekPhase("celebrating");
    // Extra little bounce & wiggle when tapped
    rotation.value = withSequence(
      withTiming(-10, { duration: 120 }),
      withTiming(10, { duration: 120 }),
      withTiming(0, { duration: 120 })
    );
    translateY.value = withSequence(
      withSpring(0, { damping: 10 }),
      withDelay(700, withTiming(120, { duration: 280 }, () => {
        runOnJS(setVisible)(false);
        if (onFinished) runOnJS(onFinished)();
      }))
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const bubbleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bubbleScale.value }],
    opacity: bubbleScale.value,
  }));

  if (!visible) return null;

  const currentEyes =
    peekPhase === "curious"
      ? "thinking"
      : peekPhase === "wink"
      ? "wink"
      : "happy";

  const currentMouth =
    peekPhase === "curious"
      ? "calm"
      : peekPhase === "wink"
      ? "smile"
      : "open";

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={[styles.peekerContainer, animatedStyle]}>
        {/* Playful handwritten greeting badge */}
        <Animated.View
          style={[
            styles.bubble,
            {
              backgroundColor: t.raised,
              borderColor: t.rule,
              shadowColor: t.ink,
            },
            bubbleAnimatedStyle,
          ]}>
          <T v="small" style={{ fontSize: 11, fontWeight: "600", color: t.ink }}>
            {peekPhase === "celebrating" ? "Yay! ✨" : "Psst... I'm here! ✨"}
          </T>
        </Animated.View>

        {/* Peeking MAX face */}
        <Pressable onPress={handleTap} accessibilityLabel="Max peeking to say hello">
          <Max
            size={78}
            customEyes={currentEyes}
            customMouth={currentMouth}
            boil
            interactive={false}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 9998,
  },
  peekerContainer: {
    alignItems: "center",
    marginBottom: 0,
  },
  bubble: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
});
