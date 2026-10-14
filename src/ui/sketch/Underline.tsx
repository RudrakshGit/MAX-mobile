import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  type ViewStyle,
  type StyleProp,
  type LayoutChangeEvent,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { getSketchPath, seedFrom } from "./sketch";
import { useTheme, stroke as themeStroke } from "@/lib/theme";
import { useReducedMotionSafe } from "@/components/max/useReducedMotionSafe";

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface UnderlineProps {
  id?: string;
  seed?: number;
  color?: string;
  strokeWidth?: number;
  extraWidth?: number;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Underline({
  id = "underline",
  seed,
  color,
  strokeWidth = themeStroke.line,
  extraWidth = 8,
  animate = true,
  style,
  children,
}: UnderlineProps) {
  const t = useTheme();
  const prefersReduced = useReducedMotionSafe();
  const [layout, setLayout] = useState({ w: 0, h: 0 });
  const animProgress = useRef(new Animated.Value(prefersReduced || !animate ? 0 : 1)).current;

  const finalSeed = seed ?? seedFrom(id);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.round(width) !== layout.w || Math.round(height) !== layout.h) {
      setLayout({ w: Math.round(width), h: Math.round(height) });
    }
  };

  const lineW = layout.w + extraWidth;
  const pathD = lineW > 4 ? getSketchPath("line", lineW, 8, finalSeed) : "";
  const strokeCol = color ?? t.ink;
  const strokeLen = Math.max(20, Math.round(lineW * 2.5));

  useEffect(() => {
    if (prefersReduced || !animate || lineW <= 4) {
      animProgress.setValue(0);
      return;
    }
    animProgress.setValue(1);
    Animated.timing(animProgress, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [lineW, prefersReduced, animate]);

  const dashOffset = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, strokeLen],
  });

  return (
    <View onLayout={onLayout} style={[styles.container, style]}>
      {children}
      {lineW > 4 && pathD ? (
        <Svg
          pointerEvents="none"
          width={lineW}
          height={8}
          style={[styles.svg, { left: -extraWidth / 2 }]}>
          <AnimatedPath
            d={pathD}
            fill="none"
            stroke={strokeCol}
            strokeWidth={strokeWidth}
            strokeDasharray={`${strokeLen}, ${strokeLen}`}
            strokeDashoffset={dashOffset}
            transform="translate(2, 2)"
          />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignSelf: "flex-start",
  },
  svg: {
    position: "absolute",
    bottom: -2,
  },
});
