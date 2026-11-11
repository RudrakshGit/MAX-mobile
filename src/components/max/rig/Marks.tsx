// Comic marks that move, as in comics: Zs drift up and fade one after another, a sweat drop slides, thinking dots
// appear one by one, a heart rises, sparkles twinkle, notes float, stars circle a dizzy head. Each mark is a tiny
// drawing moved only by view transforms (no SVG redraw); with reduce motion or off screen they stand still. Like the
// slow loops, marks move on twos (12 changes a second): unchanged frames send nothing to the views.
import React, { useEffect } from "react";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue } from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { ON_TWOS_MS } from "./motion";
import type { Marks } from "./pose";

const HOUR = 3_600_000;

/** The marks' clock held in 1/12 s steps. */
function twos(t: SharedValue<number>) {
  "worklet";
  return Math.floor(t.value / ON_TWOS_MS) * ON_TWOS_MS;
}

export function RigMarks({ size, marks, ink, paper, still }: { size: number; marks: Marks; ink: string; paper: string; still: boolean }) {
  const t = useSharedValue(1000);
  const any = Object.values(marks).some(Boolean);
  useEffect(() => {
    if (!any || still) {
      cancelAnimation(t);
      t.value = 1000;
      return;
    }
    t.value = 0;
    t.value = withRepeat(withTiming(HOUR, { duration: HOUR, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [any, still, t]);
  if (!any) return null;
  const k = size / 180;
  const m = { t, k, ink, paper };
  return (
    <>
      {marks.zs ? [0, 1, 2].map((i) => <Z key={`z${i}`} i={i} {...m} />) : null}
      {marks.sweat ? <Sweat {...m} /> : null}
      {marks.dots ? [0, 1, 2].map((i) => <Dot key={`d${i}`} i={i} {...m} />) : null}
      {marks.heart ? <Heart {...m} /> : null}
      {marks.sparkles ? [0, 1, 2].map((i) => <Sparkle key={`s${i}`} i={i} {...m} />) : null}
      {marks.notes ? [0, 1].map((i) => <Note key={`n${i}`} i={i} {...m} />) : null}
      {marks.stars ? [0, 1, 2].map((i) => <Star key={`st${i}`} i={i} {...m} />) : null}
    </>
  );
}

type MarkProps = { t: SharedValue<number>; k: number; ink: string; paper: string };

/** A w×h box centred on (x, y) in MAX's drawing, in dp. */
const box = (k: number, x: number, y: number, w: number, h: number) => ({
  position: "absolute" as const,
  left: (x - w / 2) * k,
  top: (y - h / 2) * k,
  width: w * k,
  height: h * k,
});

function Z({ i, t, k, ink }: MarkProps & { i: number }) {
  const style = useAnimatedStyle(() => {
    const ph = ((twos(t) / 3600 + i / 3) % 1 + 1) % 1;
    return {
      opacity: Math.sin(Math.PI * ph),
      transform: [{ translateX: 26 * ph * k }, { translateY: -36 * ph * k }, { scale: 0.7 + 0.5 * ph }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[box(k, 140, 40, 14, 14), style]}>
      <Svg width="100%" height="100%" viewBox="-3 -3 14 14">
        <Path d="M0 0 L8 0 L0 8 L8 8" stroke={ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </Animated.View>
  );
}

function Sweat({ t, k, ink, paper }: MarkProps) {
  const style = useAnimatedStyle(() => {
    const ph = (twos(t) % 1800) / 1800;
    const fade = ph < 0.12 ? ph / 0.12 : ph > 0.8 ? (1 - ph) / 0.2 : 1;
    return { opacity: fade, transform: [{ translateY: 7 * ph * k }] };
  });
  return (
    <Animated.View pointerEvents="none" style={[box(k, 43, 51, 16, 22), style]}>
      <Svg width="100%" height="100%" viewBox="47 39 16 22">
        <Path d="M50 52 C 50 48 54 44 54 40 C 56 44 60 48 60 52 C 60 55 55 58 55 58 C 55 58 50 55 50 52 Z" fill={paper} stroke={ink} strokeWidth={1.8} strokeLinejoin="round" />
        <Path d="M53 51 Q 52.5 47.5 54.5 45" stroke={ink} strokeWidth={1.1} strokeLinecap="round" fill="none" opacity={0.6} />
      </Svg>
    </Animated.View>
  );
}

const DOTS = [
  { x: 124, y: 35, r: 2.5 },
  { x: 136, y: 26, r: 3.5 },
  { x: 152, y: 18, r: 4.5 },
];
function Dot({ i, t, k, ink }: MarkProps & { i: number }) {
  const d = DOTS[i];
  const style = useAnimatedStyle(() => {
    const ph = (twos(t) % 2000) / 2000;
    const on = ph > i * 0.22 && ph < 0.86 ? 1 : 0;
    return { opacity: on };
  });
  return (
    <Animated.View pointerEvents="none" style={[box(k, d.x, d.y, d.r * 2 + 2, d.r * 2 + 2), style]}>
      <Svg width="100%" height="100%" viewBox={`${-d.r - 1} ${-d.r - 1} ${d.r * 2 + 2} ${d.r * 2 + 2}`}>
        <Circle cx={0} cy={0} r={d.r} fill={ink} />
      </Svg>
    </Animated.View>
  );
}

function Heart({ t, k, ink }: MarkProps) {
  const style = useAnimatedStyle(() => {
    const ph = (twos(t) % 2600) / 2600;
    return { opacity: 0.85 * Math.sin(Math.PI * ph), transform: [{ translateY: -10 * ph * k }, { scale: 0.9 + 0.2 * ph }] };
  });
  return (
    <Animated.View pointerEvents="none" style={[box(k, 152, 46, 22, 22), style]}>
      <Svg width="100%" height="100%" viewBox="141 34 22 22">
        <Path d="M142 42 C 142 36 148 33 152 38 C 156 33 162 36 162 42 C 162 49 152 56 152 56 C 152 56 142 49 142 42 Z" fill={ink} />
      </Svg>
    </Animated.View>
  );
}

const SPARKS = [
  { x: 31, y: 45, s: 8 },
  { x: 156, y: 35, s: 10 },
  { x: 142, y: 18, s: 6 },
];
function Sparkle({ i, t, k, ink }: MarkProps & { i: number }) {
  const sp = SPARKS[i];
  const style = useAnimatedStyle(() => {
    const w = 0.5 + 0.5 * Math.sin(2 * Math.PI * ((twos(t) % 1200) / 1200 + i / 3));
    return { opacity: 0.35 + 0.65 * w, transform: [{ scale: 0.8 + 0.3 * w }] };
  });
  const h = sp.s / 2;
  return (
    <Animated.View pointerEvents="none" style={[box(k, sp.x, sp.y, sp.s + 4, sp.s + 4), style]}>
      <Svg width="100%" height="100%" viewBox={`${-h - 2} ${-h - 2} ${sp.s + 4} ${sp.s + 4}`}>
        <Path d={`M${-h} 0 L${h} 0 M0 ${-h} L0 ${h}`} stroke={ink} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

function Note({ i, t, k, ink }: MarkProps & { i: number }) {
  const at = i === 0 ? { x: 156, y: 32 } : { x: 170, y: 13 };
  const style = useAnimatedStyle(() => {
    const ph = ((twos(t) / 2400 + i * 0.5) % 1 + 1) % 1;
    return { opacity: Math.sin(Math.PI * ph) * 0.9, transform: [{ translateX: 4 * ph * k }, { translateY: -8 * ph * k }] };
  });
  return (
    <Animated.View pointerEvents="none" style={[box(k, at.x, at.y, 14, 18), style]}>
      <Svg width="100%" height="100%" viewBox="-7 -12 14 18">
        <Path d="M2 3 A 3.5 2.5 0 1 1 -1.5 5.5 L -1.5 -8 L 5 -10 L 5 -4" stroke={ink} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Circle cx={-1.5} cy={4.5} r={2.5} fill={ink} />
      </Svg>
    </Animated.View>
  );
}

function Star({ i, t, k, ink }: MarkProps & { i: number }) {
  const style = useAnimatedStyle(() => {
    const a = 2 * Math.PI * ((twos(t) % 1400) / 1400 + i / 3);
    return { transform: [{ translateX: 34 * Math.cos(a) * k }, { translateY: 9 * Math.sin(a) * k }] };
  });
  return (
    <Animated.View pointerEvents="none" style={[box(k, 90, 22, 10, 10), style]}>
      <Svg width="100%" height="100%" viewBox="-5 -5 10 10">
        <Path d="M0 -4 L1.2 -1.2 L4 0 L1.2 1.2 L0 4 L-1.2 1.2 L-4 0 L-1.2 -1.2 Z" fill={ink} />
      </Svg>
    </Animated.View>
  );
}
