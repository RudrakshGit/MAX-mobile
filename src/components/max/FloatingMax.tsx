import { isWeb } from "@/lib/platform";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { router, usePathname, useSegments, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/lib/theme";
import { useStore } from "@/lib/store";
import { Max } from "./Max";
import { useMaxBehavior } from "./useMaxBehavior";
import { MaxQuickActions } from "./MaxQuickActions";
import {
  finishFloatingMaxDigExit,
  getFloatingMaxState,
  setFloatingMaxPos,
  setQuickMenuOpen,
  useFloatingMax,
} from "@/lib/max-store";

// Increased size for a prominent, delightful floating character
const WIDGET_SIZE = 64;

function triggerHaptic(type: "light" | "medium" | "heavy") {
  try {
    if (type === "light") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (type === "medium") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (type === "heavy") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {}
}

// Paths where the floating companion stays hidden (audit F24, F33, F36, F40, F47).
const QUIET_PATHS = ["/onboarding", "/test/", "/tool/", "/lesson/", "/settings", "/profile/settings", "/help", "/sounds", "/journal-new", "/chats", "/dev"];

export function FloatingMax() {
  const t = useTheme();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const enabled = useFloatingMax((s) => s.enabled);
  const [built, setBuilt] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setBuilt(true), 1500);
    return () => clearTimeout(id);
  }, []);
  const isDiggingExit = useFloatingMax((s) => s.isDiggingExit);
  const quickMenuOpen = useFloatingMax((s) => s.quickMenuOpen);
  const contextEmotion = useFloatingMax((s) => s.contextEmotion);
  const touchPos = useFloatingMax((s) => s.touchPos);
  const lastGlobalTouch = useFloatingMax((s) => s.lastGlobalTouch);

  const [facing, setFacing] = useState(1);
  const [gazeOffset, setGazeOffset] = useState<{ x: number; y: number } | null>(null);

  const [snapshot, controls] = useMaxBehavior("idle");

  // Digging exit animation values
  const digOffsetY = useSharedValue(0);
  const digScale = useSharedValue(1);
  const digOpacity = useSharedValue(1);


  // Wake up MAX whenever user touches anywhere on the screen
  useEffect(() => {
    if (lastGlobalTouch > 0) {
      controls.poke();
    }
  }, [lastGlobalTouch, controls]);

  useEffect(() => {
    if (isDiggingExit) {
      triggerHaptic("light");
      // Switched off: MAX sinks calmly out of sight (no shaking), then the widget goes.
      digOffsetY.value = withTiming(44, { duration: 900, easing: Easing.bezier(0.3, 0, 1, 1) });
      digScale.value = withTiming(0.6, { duration: 900, easing: Easing.bezier(0.3, 0, 1, 1) });
      digOpacity.value = withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(finishFloatingMaxDigExit)();
          }
        })
      );
    } else {
      digOffsetY.value = 0;
      digScale.value = 1;
      digOpacity.value = 1;
    }
  }, [isDiggingExit]);

  // Keep MAX strictly above bottom navigation menu (tab bar height: 52 + insets.bottom + 14px clearance)
  const windowDims = Dimensions.get("window");
  const bottomMenuHeight = 52 + Math.max(insets.bottom, 8);
  const effectiveWidth = screenWidth > 0 ? screenWidth : windowDims.width;
  const effectiveHeight = screenHeight > 0 ? screenHeight : windowDims.height;

  const minX = 12;
  const maxX = effectiveWidth - WIDGET_SIZE - 12;
  const minY = Math.max(insets.top + 16, 64);
  const maxY = effectiveHeight - bottomMenuHeight - WIDGET_SIZE - 14;

  // Restore saved position or default to bottom-right above tab bar
  const savedPos = getFloatingMaxState().pos;
  const initialX = savedPos ? Math.min(Math.max(savedPos.x, minX), maxX) : maxX;
  const initialY = savedPos ? Math.min(Math.max(savedPos.y, minY), maxY) : maxY;

  const posX = useSharedValue(initialX);
  const posY = useSharedValue(initialY);
  const startX = useSharedValue(initialX);
  const startY = useSharedValue(initialY);

  // Track touch position on screen so MAX looks towards wherever user touches!
  useEffect(() => {
    if (!touchPos || snapshot.behavior === "drag") {
      setGazeOffset(null);
      return;
    }

    const centerX = posX.value + WIDGET_SIZE / 2;
    const centerY = posY.value + WIDGET_SIZE / 2;
    const dx = touchPos.x - centerX;
    const dy = touchPos.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 15) {
      const normX = Math.max(-1, Math.min(1, dx / Math.max(120, dist * 0.75)));
      const normY = Math.max(-1, Math.min(1, dy / Math.max(120, dist * 0.75)));
      setGazeOffset({ x: normX, y: normY });

      // Turn body towards the touched side
      if (dx < -30) setFacing(-1);
      else if (dx > 30) setFacing(1);
    }
    // posX/posY are read inside the effect only; reading .value during render makes Reanimated warn and can tear.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touchPos, snapshot.behavior]);

  // Sync when screen dimensions change
  useEffect(() => {
    const sPos = getFloatingMaxState().pos;
    if (sPos) {
      posX.value = Math.min(Math.max(sPos.x, minX), maxX);
      posY.value = Math.min(Math.max(sPos.y, minY), maxY);
    } else {
      posX.value = maxX;
      posY.value = maxY;
    }
  }, [effectiveWidth, effectiveHeight, minX, maxX, minY, maxY, posX, posY]);

  // Wake, jump and land MAX whenever user navigates between screens
  const isFirstMountRef = useRef(true);
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    // A small calm hop on a new tab: the behaviour goes to "jump" and MAX plays its smallHop clip.
    controls.send("screenFocus");
    controls.poke();
  }, [pathname, controls]);

  const handleTap = useCallback(() => {
    if (snapshot.behavior === "sleep") {
      controls.send("tap");
      triggerHaptic("light");
    } else {
      triggerHaptic("light");
      // Direct navigation to Talk to MAX!
      router.push("/talk" as Href);
    }
  }, [snapshot.behavior, controls]);

  const savePos = useCallback((x: number, y: number) => {
    setFloatingMaxPos(x, y);
  }, []);

  const lastVelX = useSharedValue(0);
  const shakeCount = useSharedValue(0);
  const lastShakeTime = useSharedValue(0);

  // Gestures: .minDistance(6) guarantees tap is never swallowed by pan
  const panGesture = Gesture.Pan()
    .minDistance(6)
    .onStart(() => {
      "worklet";
      cancelAnimation(posX);
      cancelAnimation(posY);
      startX.value = posX.value;
      startY.value = posY.value;
      lastVelX.value = 0;
      shakeCount.value = 0;
      lastShakeTime.value = 0;
      runOnJS(controls.send)("panStart");
      runOnJS(triggerHaptic)("light");
    })
    .onUpdate((e) => {
      "worklet";
      const nextX = Math.min(Math.max(startX.value + e.translationX, minX), maxX);
      const nextY = Math.min(Math.max(startY.value + e.translationY, minY), maxY);
      posX.value = nextX;
      posY.value = nextY;

      // Update directional fly pose
      runOnJS(controls.updateDirection)(e.translationX, e.translationY);

      // Detect vigorous shake gesture (rapid left-right flick reversals only)
      const now = Date.now();
      if (Math.abs(e.velocityX) > 650) {
        if (lastVelX.value !== 0 && (lastVelX.value > 0 !== e.velocityX > 0)) {
          if (now - lastShakeTime.value < 350) {
            shakeCount.value += 1;
            if (shakeCount.value >= 4) {
              shakeCount.value = 0;
              runOnJS(controls.send)("shake");
              runOnJS(triggerHaptic)("heavy");
            }
          } else {
            shakeCount.value = 1;
          }
          lastShakeTime.value = now;
        }
        lastVelX.value = e.velocityX;
      }
    })
    .onEnd(() => {
      "worklet";
      // Released anywhere on screen -> snappy landing right where user placed him
      runOnJS(controls.send)("panEnd");

      const targetX = posX.value;
      const targetY = posY.value;

      // Quick, responsive landing dip in place
      posY.value = withSequence(
        withTiming(Math.min(targetY + 6, maxY), { duration: 90, easing: Easing.out(Easing.quad) }),
        withTiming(targetY, { duration: 220, easing: Easing.bezier(0.2, 0, 0, 1) }, (finished) => {
          if (finished) {
            runOnJS(controls.send)("animationEnd");
            runOnJS(triggerHaptic)("light");
            runOnJS(savePos)(targetX, targetY);
          }
        })
      );
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      "worklet";
      runOnJS(handleTap)();
    });

  const combinedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: posX.value },
        { translateY: posY.value + digOffsetY.value },
        { scaleX: facing * digScale.value },
        { scaleY: digScale.value },
      ],
      opacity: digOpacity.value,
    };
  });

  const segments = useSegments() as string[];

  // Screen detection:
  // Home screen: when in tabs and on index (or no sub-segment)
  const isHomeScreen =
    segments.length === 0 ||
    (segments[0] === "(tabs)" && (!segments[1] || segments[1] === "index")) ||
    pathname === "/" ||
    pathname === "/index";

  // Talk screen: when in chat where dedicated full-size MAX welcomes and converses
  const isTalkScreen =
    segments.includes("talk") ||
    pathname === "/talk" ||
    pathname === "/(tabs)/talk" ||
    pathname.includes("talk");

  // Journal empty screen: when on journal with 0 entries, widget transforms into the static empty-state MAX
  const journalEntriesCount = useStore((s) => s.entries.length);
  const isJournalScreen =
    segments.includes("journal") ||
    pathname === "/journal" ||
    pathname === "/(tabs)/journal" ||
    pathname.includes("journal");
  const isJournalEmptyScreen = isJournalScreen && journalEntriesCount === 0;

  // Never before consent, and not on screens that are forms, dense with controls, or already show their own MAX.
  const onboarded = useStore((s) => s.onboarded);
  // Pushed screens (profile, tools, lessons, help...) have their own back button and plenty of content to cover:
  // the floating companion lives on the main tabs only.
  const isQuietScreen = QUIET_PATHS.some((p) => pathname.startsWith(p)) || segments[0] !== "(tabs)";


  // Never show on Home, Talk, or empty Journal (where Max transforms into static companion), or when disabled.
  // Hidden is not unmounted: building MAX again on every tab change held the first frame of the new tab for about
  // half a second (M16 speed), so MAX is built once, a moment after the app opens, and only shown or hidden.
  const hidden = isHomeScreen || isTalkScreen || isJournalEmptyScreen || isQuietScreen;
  // not on the web: the app sits in a phone-width column there, and the floating companion is an app extra
  if (isWeb || !onboarded || !built || (!enabled && !isDiggingExit)) return null;

  // If external context overrides emotion (e.g. thinking during chat AI response) and not dragging
  const effectiveBehavior =
    snapshot.behavior === "drag" || snapshot.behavior === "falling" || snapshot.behavior === "landed"
      ? snapshot.behavior
      : (contextEmotion ?? snapshot.behavior);

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, hidden ? { display: "none" } : null]}>
      <GestureDetector gesture={combinedGesture}>
        {/* Free floating independent character with no surrounding bubble/shape */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              width: WIDGET_SIZE,
              height: WIDGET_SIZE,
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              elevation: 20,
            },
            animatedStyle,
          ]}>
          <View pointerEvents="none" style={{ alignItems: "center" }}>
            <Max
              behavior={isDiggingExit ? "idle" : effectiveBehavior}
              direction={snapshot.direction}
              size={WIDGET_SIZE}
              gaze={isDiggingExit ? null : gazeOffset}
              customEyes={isDiggingExit ? "sad" : undefined}
              customMouth={isDiggingExit ? "sad" : undefined}
              reducedMotion={hidden ? true : undefined}
              boil
            />
            {isDiggingExit ? (
              <View style={{ position: "absolute", bottom: -4, left: 0, right: 0, alignItems: "center" }}>
                <Svg width={54} height={14} viewBox="0 0 54 14">
                  <Path d="M 4 8 Q 27 12 50 8" fill="none" stroke={t.ink} strokeWidth={2} />
                  <Path d="M 6 6 Q 2 2 0 4" fill="none" stroke={t.rule} strokeWidth={1.5} />
                  <Path d="M 48 6 Q 52 2 54 4" fill="none" stroke={t.rule} strokeWidth={1.5} />
                  <Circle cx={8} cy={3} r={1.5} fill={t.ink} />
                  <Circle cx={46} cy={3} r={1.5} fill={t.ink} />
                </Svg>
              </View>
            ) : null}
          </View>
        </Animated.View>
      </GestureDetector>

      <MaxQuickActions visible={quickMenuOpen && !hidden} />
    </View>
  );
}
