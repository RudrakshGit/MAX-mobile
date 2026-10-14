import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme, stroke as themeStroke } from "@/lib/theme";
import { Max } from "./Max";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

export interface ThemeSwitchBulbAnimationProps {
  visible: boolean;
  targetTheme: "light" | "dark";
  onApplyTheme: () => void;
  onFinished: () => void;
}

// Geometry (dp). The lamp hangs at screen centre; the pull-chain hangs to its right and ends in a bead.
const BULB_Y = 86; // top of the socket
const CHAIN_X = 20; // chain's x offset from screen centre
const BEAD_Y = 236; // bead centre, measured from the top of the screen at rest
const MAX_SIZE = 76;
const MAX_REST_TOP = 400; // MAX stands here before jumping
const REACH = MAX_REST_TOP - (BEAD_Y - 6); // how far MAX has to jump so the top of its head meets the bead
const PULL = 30; // how far the chain is yanked down

/**
 * "Pull the light switch" theme change. MAX pops in under a lamp, jumps, grabs the chain and yanks it;
 * at the click the theme flips under a veil of the OLD paper colour that fades away, so the change is a
 * soft lights-on/lights-off fade instead of a hard cut (and the header flips with the content).
 * Reduced motion: the theme just changes.
 */
export function ThemeSwitchBulbAnimation({ visible, targetTheme, onApplyTheme, onFinished }: ThemeSwitchBulbAnimationProps) {
  const t = useTheme();
  const prefersReduced = useReducedMotionSafe();
  const { width: screenWidth } = useWindowDimensions();

  const lampY = useSharedValue(-300);
  const chainPull = useSharedValue(0);
  const maxPop = useSharedValue(0);
  const maxJumpY = useSharedValue(0);
  const maxSquashX = useSharedValue(1);
  const maxSquashY = useSharedValue(1);
  const overlayOpacity = useSharedValue(1);
  const veil = useSharedValue(0);

  const oldPaper = useRef(t.paper);
  const [isBulbLit, setIsBulbLit] = useState(targetTheme === "dark");
  const [isPulling, setIsPulling] = useState(false);
  const [isCheering, setIsCheering] = useState(false);

  // Keep the callbacks fresh without restarting the timeline.
  const apply = useRef(onApplyTheme);
  const done = useRef(onFinished);
  apply.current = onApplyTheme;
  done.current = onFinished;

  useEffect(() => {
    if (!visible) return;

    if (prefersReduced) {
      apply.current();
      done.current();
      return;
    }

    oldPaper.current = t.paper;
    lampY.value = -300;
    chainPull.value = 0;
    maxPop.value = 0;
    maxJumpY.value = 0;
    maxSquashX.value = 1;
    maxSquashY.value = 1;
    overlayOpacity.value = 1;
    veil.value = 0;
    setIsBulbLit(targetTheme === "dark"); // shows the state we are leaving
    setIsPulling(false);
    setIsCheering(false);

    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    // 0 – lamp drops in, MAX pops up under it
    lampY.value = withSpring(0, { damping: 14, stiffness: 120 });
    at(120, () => {
      maxPop.value = withSpring(1, { damping: 11, stiffness: 180 });
    });

    // 520 – crouch
    at(520, () => {
      maxSquashX.value = withTiming(1.16, { duration: 160 });
      maxSquashY.value = withTiming(0.84, { duration: 160 });
    });

    // 700 – leap so the top of MAX's head reaches the bead
    at(700, () => {
      maxSquashX.value = withTiming(0.92, { duration: 120 });
      maxSquashY.value = withTiming(1.1, { duration: 120 });
      maxJumpY.value = withTiming(-REACH, { duration: 300, easing: Easing.out(Easing.cubic) });
    });

    // 1000 – grab the chain, yank, click: the theme flips under the veil
    at(1000, () => {
      setIsPulling(true);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      maxSquashX.value = withTiming(1, { duration: 100 });
      maxSquashY.value = withTiming(1, { duration: 100 });
      chainPull.value = withSequence(
        withTiming(PULL, { duration: 130, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 9, stiffness: 200 }),
      );
      maxJumpY.value = withSequence(
        withTiming(-REACH + PULL, { duration: 130 }),
        withTiming(-REACH + PULL * 0.4, { duration: 200 }),
      );
      veil.value = 1; // old paper colour covers the screen for this frame
      setIsBulbLit(targetTheme === "light");
      apply.current();
      veil.value = withTiming(0, { duration: 650, easing: Easing.inOut(Easing.quad) });
    });

    // 1300 – let go, fall, land cheering
    at(1300, () => {
      setIsPulling(false);
      setIsCheering(true);
      maxJumpY.value = withTiming(0, { duration: 260, easing: Easing.in(Easing.quad) }, () => {
        maxSquashX.value = withSequence(withTiming(1.18, { duration: 90 }), withSpring(1, { damping: 10, stiffness: 180 }));
        maxSquashY.value = withSequence(withTiming(0.82, { duration: 90 }), withSpring(1, { damping: 10, stiffness: 180 }));
      });
    });

    // 1950 – lamp goes back up, everything fades
    at(1950, () => {
      lampY.value = withTiming(-300, { duration: 320, easing: Easing.in(Easing.cubic) });
      maxPop.value = withTiming(0, { duration: 260 });
      overlayOpacity.value = withTiming(0, { duration: 320 }, (finished) => {
        if (finished) runOnJS(done.current)();
      });
    });

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const centerX = screenWidth / 2;

  const lampStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lampY.value }] }));
  const chainStyle = useAnimatedStyle(() => ({ transform: [{ translateY: chainPull.value }] }));
  const maxStyle = useAnimatedStyle(() => ({
    opacity: maxPop.value,
    transform: [
      { translateY: maxJumpY.value },
      { scale: maxPop.value },
      { scaleX: maxSquashX.value },
      { scaleY: maxSquashY.value },
    ],
  }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const veilStyle = useAnimatedStyle(() => ({ opacity: veil.value }));

  if (!visible || prefersReduced) return null;

  const chainLen = BEAD_Y - (BULB_Y + 8);

  return (
    <Animated.View
      pointerEvents="auto"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { zIndex: 99999 }, overlayStyle]}>
      {/* Taps are swallowed while the switch happens, so nothing underneath fires mid-fade. */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: oldPaper.current }, veilStyle]} />

      <Animated.View
        pointerEvents="none"
        style={[{ position: "absolute", top: 0, left: centerX - 60, width: 120, height: BEAD_Y + 30 }, lampStyle]}>
        <Svg width={120} height={BEAD_Y + 30} viewBox={`0 0 120 ${BEAD_Y + 30}`}>
          {/* Ceiling mount and wire */}
          <Rect x={52} y={0} width={16} height={8} rx={2} fill={t.rule} stroke={t.ink} strokeWidth={themeStroke.line} />
          <Line x1={60} y1={8} x2={60} y2={BULB_Y} stroke={t.ink} strokeWidth={themeStroke.bold} />

          {/* Rays when lit */}
          {isBulbLit ? (
            <>
              <Line x1={22} y1={BULB_Y + 12} x2={10} y2={BULB_Y + 6} stroke={t.ink} strokeWidth={themeStroke.line} />
              <Line x1={20} y1={BULB_Y + 28} x2={6} y2={BULB_Y + 28} stroke={t.ink} strokeWidth={themeStroke.line} />
              <Line x1={24} y1={BULB_Y + 44} x2={12} y2={BULB_Y + 50} stroke={t.ink} strokeWidth={themeStroke.line} />
              <Line x1={98} y1={BULB_Y + 12} x2={110} y2={BULB_Y + 6} stroke={t.ink} strokeWidth={themeStroke.line} />
              <Line x1={100} y1={BULB_Y + 28} x2={114} y2={BULB_Y + 28} stroke={t.ink} strokeWidth={themeStroke.line} />
              <Line x1={96} y1={BULB_Y + 44} x2={108} y2={BULB_Y + 50} stroke={t.ink} strokeWidth={themeStroke.line} />
              <Line x1={60} y1={BULB_Y + 58} x2={60} y2={BULB_Y + 70} stroke={t.ink} strokeWidth={themeStroke.line} />
            </>
          ) : null}

          {/* Socket */}
          <Rect x={53} y={BULB_Y} width={14} height={10} rx={2} fill={t.raised} stroke={t.ink} strokeWidth={themeStroke.line} />
          <Line x1={53} y1={BULB_Y + 4} x2={67} y2={BULB_Y + 4} stroke={t.ink} strokeWidth={themeStroke.hair} />
          <Line x1={53} y1={BULB_Y + 7} x2={67} y2={BULB_Y + 7} stroke={t.ink} strokeWidth={themeStroke.hair} />

          {/* Glass */}
          <Path
            d={`M 53 ${BULB_Y + 10} C 44 ${BULB_Y + 14}, 40 ${BULB_Y + 26}, 40 ${BULB_Y + 34} C 40 ${BULB_Y + 48}, 52 ${BULB_Y + 54}, 60 ${BULB_Y + 54} C 68 ${BULB_Y + 54}, 80 ${BULB_Y + 48}, 80 ${BULB_Y + 34} C 80 ${BULB_Y + 26}, 76 ${BULB_Y + 14}, 67 ${BULB_Y + 10} Z`}
            fill={isBulbLit ? t.characterPaper : t.paper}
            stroke={t.ink}
            strokeWidth={themeStroke.line}
          />
          <Path d={`M 55 ${BULB_Y + 24} Q 60 ${BULB_Y + 16} 65 ${BULB_Y + 24}`} fill="none" stroke={t.ink} strokeWidth={themeStroke.line} />
        </Svg>

        {/* Pull chain with bead; stretches when yanked */}
        <Animated.View
          style={[{ position: "absolute", top: BULB_Y + 8, left: 60 + CHAIN_X - 8, width: 16, height: chainLen + 14 }, chainStyle]}>
          <Svg width={16} height={chainLen + 14} viewBox={`0 0 16 ${chainLen + 14}`}>
            <Line x1={8} y1={0} x2={8} y2={chainLen - 6} stroke={t.ink} strokeWidth={themeStroke.line} strokeDasharray="2,3" />
            <Circle cx={8} cy={chainLen} r={6} fill={isPulling ? t.ink : t.raised} stroke={t.ink} strokeWidth={themeStroke.line} />
          </Svg>
        </Animated.View>
      </Animated.View>

      {/* MAX, standing under the bead */}
      <Animated.View
        pointerEvents="none"
        style={[
          { position: "absolute", top: MAX_REST_TOP, left: centerX + CHAIN_X - MAX_SIZE / 2, width: MAX_SIZE, height: MAX_SIZE, alignItems: "center", justifyContent: "center" },
          maxStyle,
        ]}>
        <View>
          <Max
            behavior={isCheering ? "celebrating" : isPulling ? "active" : "idle"}
            customEyes={isCheering ? "happy" : isPulling ? "wink" : "happy"}
            customMouth={isCheering ? "open" : isPulling ? "open" : "smile"}
            size={MAX_SIZE}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}
