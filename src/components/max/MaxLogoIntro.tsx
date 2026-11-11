import React, { useEffect, useState, useRef } from "react";
import { Appearance, StyleSheet, View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { THEMES, font, space, useTheme } from "@/lib/theme";
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
  // Android draws the splash in the phone's theme before MAX runs; start in that colour and fade into MAX's own, so
  // a dark MAX on a light phone doesn't flash (M16 finding 11).
  const splashPaper = (Appearance.getColorScheme() === "dark" ? THEMES.dark : THEMES.light).paper;
  const themeIn = useSharedValue(splashPaper === t.paper ? 1 : 0);
  const logoScale = useSharedValue(prefersReduced ? 1 : 0.88);
  const characterRotation = useSharedValue(0);
  const characterScale = useSharedValue(1);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(prefersReduced ? 0 : 8);

  const dismiss = () => {
    if (isDismissing.current) return;
    isDismissing.current = true;
    // Safety net: with system animations off the fade's callback may never report "finished",
    // and a splash that never leaves locks the student out of the app.
    setTimeout(cleanup, 600);

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

  const cleaned = useRef(false);
  const cleanup = () => {
    if (cleaned.current) return;
    cleaned.current = true;
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

    // The reduced-motion answer arrives asynchronously. Starting the timeline once and never restarting it
    // keeps the dismiss timer alive (it used to be cleared when the answer changed, freezing the splash).
    // Calm timing curves, no springs (M16): the logo settles in, MAX winks, tilts a little, then smiles.
    const standard = Easing.bezier(0.2, 0, 0, 1);
    themeIn.value = withTiming(1, { duration: 450, easing: standard });
    subtitleOpacity.value = withTiming(1, { duration: 400 });
    subtitleTranslateY.value = withTiming(0, { duration: 450, easing: standard });
    logoScale.value = withTiming(1, { duration: 450, easing: standard });

    const t1 = setTimeout(() => {
      if (isDismissing.current) return;
      setPhase("wink");
      characterRotation.value = withTiming(-4, { duration: 300, easing: standard });
    }, 350);

    const t2 = setTimeout(() => {
      if (isDismissing.current) return;
      setPhase("smile");
      characterRotation.value = withTiming(0, { duration: 350, easing: standard });
    }, 950);

    const t3 = setTimeout(dismiss, 1650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));
  const themeInStyle = useAnimatedStyle(() => ({ opacity: themeIn.value }));

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
        { backgroundColor: splashPaper },
        containerAnimatedStyle,
      ]}
      pointerEvents={isDismissing.current ? "none" : "auto"}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: t.paper }, themeInStyle]} />
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
