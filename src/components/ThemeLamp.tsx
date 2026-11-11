import React, { useRef, useState } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Circle, G, Line, Path } from "react-native-svg";
import { Max } from "@/components/max";
import { switchTheme } from "@/lib/theme-switch";
import { isDarkTheme, stroke, useTheme } from "@/lib/theme";

// Settings → Appearance (docs/history.md, M16): a small lamp beside MAX. Picking light or
// dark, MAX reaches up and tugs the lamp's cord, and the new theme closes in on the lamp. A short moment in the row,
// not a full-screen film.

type Pref = "system" | "light" | "dark";

export function useThemeLamp() {
  const [tug, setTug] = useState(0);
  const lamp = useRef<View>(null);
  const bead = useSharedValue(0);
  const pick = (pref: Pref) => {
    setTug((n) => n + 1);
    // the cord is pulled as MAX's hand comes down
    bead.value = withSequence(
      withTiming(0, { duration: 300 }),
      withTiming(9, { duration: 140, easing: Easing.bezier(0.3, 0, 1, 1) }),
      withTiming(0, { duration: 320, easing: Easing.bezier(0.2, 0, 0, 1) }),
    );
    const go = (origin?: { x: number; y: number }) => setTimeout(() => void switchTheme(pref, origin), 440);
    if (lamp.current) lamp.current.measureInWindow((x, y, w, h) => go({ x: x + w / 2, y: y + h * 0.55 }));
    else go();
  };
  return { tug, lamp, bead, pick };
}

export function ThemeLamp({ tug, lamp, bead }: Omit<ReturnType<typeof useThemeLamp>, "pick">) {
  const t = useTheme();
  const lit = !isDarkTheme(t);
  const pull = useAnimatedStyle(() => ({ transform: [{ translateY: bead.value }] }));
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 2, paddingTop: 4 }}>
      {/* a fresh key per tug replays MAX's tug */}
      <Max key={tug} size={64} action={tug ? "tug" : "none"} />
      <View ref={lamp} collapsable={false} style={{ width: 52, height: 92 }}>
        <Svg width={52} height={92} viewBox="0 0 52 92">
          <Line x1={30} y1={0} x2={30} y2={26} stroke={t.ink} strokeWidth={stroke.line} />
          <Path d="M24 26 H36 V32 H24 Z" fill={t.raised} stroke={t.ink} strokeWidth={stroke.line} strokeLinejoin="round" />
          <Path
            d="M24 32 C16 36 13 44 13 50 C13 60 21 66 30 66 C39 66 47 60 47 50 C47 44 44 36 36 32 Z"
            fill={lit ? t.characterPaper : t.paper}
            stroke={t.ink}
            strokeWidth={stroke.line}
            strokeLinejoin="round"
          />
          {lit ? (
            <G stroke={t.ink} strokeWidth={stroke.hair} strokeLinecap="round">
              <Line x1={4} y1={46} x2={8} y2={47} />
              <Line x1={7} y1={60} x2={10} y2={58} />
              <Line x1={52} y1={46} x2={48} y2={47} />
              <Line x1={50} y1={60} x2={47} y2={58} />
            </G>
          ) : null}
        </Svg>
        <Animated.View style={[{ position: "absolute", left: 2, top: 30, width: 14, height: 46 }, pull]}>
          <Svg width={14} height={46} viewBox="0 0 14 46">
            <Line x1={7} y1={0} x2={7} y2={34} stroke={t.ink} strokeWidth={stroke.hair} strokeDasharray="2,3" />
            <Circle cx={7} cy={39} r={4.5} fill={t.raised} stroke={t.ink} strokeWidth={stroke.line} />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}
