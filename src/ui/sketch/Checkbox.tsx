import React, { useEffect, useRef } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { getSketchPath, seedFrom } from "./sketch";
import { useTheme, stroke as themeStroke, font, space } from "@/lib/theme";
import { useReducedMotionSafe } from "@/components/max/useReducedMotionSafe";

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  id?: string;
  seed?: number;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function Checkbox({
  checked,
  onPress,
  label,
  id = "checkbox",
  seed,
  size = 24,
  style,
}: CheckboxProps) {
  const t = useTheme();
  const prefersReduced = useReducedMotionSafe();
  const finalSeed = seed ?? seedFrom(id);

  const boxD = getSketchPath("rect", size, size, finalSeed);
  const s = size / 24;
  const checkD = `M ${(4 * s).toFixed(1)} ${(12 * s).toFixed(1)} C ${(6 * s).toFixed(1)} ${(14.5 * s).toFixed(1)}, ${(8 * s).toFixed(1)} ${(16.5 * s).toFixed(1)}, ${(10 * s).toFixed(1)} ${(18.5 * s).toFixed(1)} C ${(13 * s).toFixed(1)} ${(14 * s).toFixed(1)}, ${(16.5 * s).toFixed(1)} ${(9.5 * s).toFixed(1)}, ${(20.5 * s).toFixed(1)} ${(5.5 * s).toFixed(1)}`;
  const tickLen = Math.max(30, Math.round(36 * s));

  const animProgress = useRef(new Animated.Value(prefersReduced || !checked ? 0 : 1)).current;

  useEffect(() => {
    if (!checked) {
      animProgress.setValue(1);
      return;
    }
    if (prefersReduced) {
      animProgress.setValue(0);
      return;
    }
    animProgress.setValue(1);
    Animated.timing(animProgress, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [checked, prefersReduced]);

  const dashOffset = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tickLen],
  });

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={[styles.container, style]}>
      <View style={{ width: size, height: size, position: "relative" }}>
        <Svg pointerEvents="none" width={size + 4} height={size + 4} style={styles.svg}>
          <Path
            d={boxD}
            fill="none"
            stroke={checked ? t.ink : t.rule}
            strokeWidth={themeStroke.line}
            transform="translate(2, 2)"
          />
          {checked ? (
            <AnimatedPath
              d={checkD}
              fill="none"
              stroke={t.ink}
              strokeWidth={themeStroke.bold}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${tickLen}, ${tickLen}`}
              strokeDashoffset={dashOffset}
              transform="translate(2, 2)"
            />
          ) : null}
        </Svg>
      </View>
      {label ? (
        <Text style={[styles.label, { color: t.ink }]}>{label}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  label: {
    fontFamily: font.body,
    fontSize: 15,
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "visible",
  },
});
