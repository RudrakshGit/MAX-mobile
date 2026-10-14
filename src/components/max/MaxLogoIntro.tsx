import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { font, space, useTheme } from "@/lib/theme";
import { Max } from "./Max";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

// Ensures MAX logo splash only shows once per app startup session
let hasShownLogoThisSession = false;

export function resetLogoSessionForTests() {
  hasShownLogoThisSession = false;
}

export function MaxLogoIntro({ onFinished }: { onFinished?: () => void }) {
  const t = useTheme();
  const prefersReduced = useReducedMotionSafe();
  const [visible, setVisible] = useState(!hasShownLogoThisSession);
  const [phase, setPhase] = useState<"enter" | "wink" | "smile">("enter");
  const isDismissing = useRef(false);

  // Animations
  const containerOpacity = useSharedValue(1);
  const logoScale = useSharedValue(prefersReduced ? 1 : 0.88);
  const characterRotation = useSharedValue(0);
  const characterScale = useSharedValue(1);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(prefersReduced ? 0 : 8);

  const dismiss = () => {
    if (isDismissing.current) return;
    isDismissing.current = true;

    containerOpacity.value = withTiming(
      0,
      { duration: 320, easing: Easing.out(Easing.quad) },
      (finished) => {
        if (finished) {
          runOnJS(cleanup)();
        }
      }
    );
  };

  const cleanup = () => {
    setVisible(false);
    onFinished?.();
  };

  useEffect(() => {
    if (hasShownLogoThisSession) {
      setVisible(false);
      onFinished?.();
      return;
    }

    hasShownLogoThisSession = true;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (prefersReduced) {
      subtitleOpacity.value = withTiming(1, { duration: 200 });
      const timer = setTimeout(dismiss, 1400);
      return () => clearTimeout(timer);
    }

    // 1. Entrance spring: scale up logo smoothly
    logoScale.value = withSpring(1, { damping: 14, stiffness: 140 });

    // 2. Subtitle reveals
    subtitleOpacity.value = withTiming(1, { duration: 400 });
    subtitleTranslateY.value = withSpring(0, { damping: 15, stiffness: 120 });

    // 3. Playful wink at 350ms
    const t1 = setTimeout(() => {
      if (isDismissing.current) return;
      setPhase("wink");
      characterRotation.value = withSpring(-6, { damping: 11, stiffness: 150 });
      characterScale.value = withSequence(
        withSpring(1.08, { damping: 10, stiffness: 180 }),
        withSpring(1, { damping: 12, stiffness: 140 })
      );
    }, 350);

    // 4. Smile & cheerful face at 950ms
    const t2 = setTimeout(() => {
      if (isDismissing.current) return;
      setPhase("smile");
      characterRotation.value = withSpring(0, { damping: 12, stiffness: 140 });
    }, 950);

    // 5. Fade out at 1650ms (total ~1.95s)
    const t3 = setTimeout(() => {
      dismiss();
    }, 1650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [prefersReduced]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const characterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${characterRotation.value}deg` },
      { scale: characterScale.value },
    ],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.overlay,
        { backgroundColor: t.paper },
        containerAnimatedStyle,
      ]}
      pointerEvents={isDismissing.current ? "none" : "auto"}
    >
      <Pressable
        style={styles.contentWrap}
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel="Max app logo splash. Tap to continue."
      >
        <Animated.View style={[styles.centerCard, logoAnimatedStyle]}>
          {/* M A X Row */}
          <View style={styles.logoRow}>
            <Text
              style={[
                styles.letter,
                { color: t.ink, fontFamily: font.handwrittenBold },
              ]}
            >
              M
            </Text>

            <Animated.View style={[styles.characterWrap, characterAnimatedStyle]}>
              <Max
                size={90}
                emotion="happy"
                customEyes={phase === "wink" ? "wink" : phase === "smile" ? "happy" : "default"}
                customMouth="smile"
                interactive={false}
              />
            </Animated.View>

            <Text
              style={[
                styles.letter,
                { color: t.ink, fontFamily: font.handwrittenBold },
              ]}
            >
              X
            </Text>
          </View>

          {/* Subtitle */}
          <Animated.View style={[styles.subtitleWrap, subtitleAnimatedStyle]}>
            <Text
              style={[
                styles.subtitle,
                {
                  color: t.ink2,
                  fontFamily: font.bodyBold,
                },
              ]}
            >
              Mental-health Assistance & eXpert
            </Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 99999,
    justifyContent: "center",
    alignItems: "center",
  },
  contentWrap: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  centerCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.lg,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  letter: {
    fontSize: 74,
    lineHeight: 88,
    fontWeight: "700",
    textAlign: "center",
  },
  characterWrap: {
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  subtitleWrap: {
    marginTop: space.md,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 13,
    letterSpacing: 1.1,
    textAlign: "center",
    fontWeight: "600",
  },
});
