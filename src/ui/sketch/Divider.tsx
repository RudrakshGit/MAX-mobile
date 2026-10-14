import React, { useState } from "react";
import { View, StyleSheet, Text, type ViewStyle, type StyleProp, type LayoutChangeEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import { getSketchPath, seedFrom } from "./sketch";
import { useTheme, stroke as themeStroke, space, font } from "@/lib/theme";

export interface DividerProps {
  id?: string;
  seed?: number;
  variant?: "rule" | "hatch";
  color?: string;
  width?: number;
  style?: StyleProp<ViewStyle>;
}

export function Divider({
  id = "divider",
  seed,
  variant = "rule",
  color,
  width,
  style,
}: DividerProps) {
  const t = useTheme();
  const [measuredW, setMeasuredW] = useState(0);

  const finalSeed = seed ?? seedFrom(id);
  const strokeCol = color ?? t.rule;

  if (variant === "hatch") {
    return (
      <View style={[styles.hatchContainer, style]}>
        <Text style={[styles.hatchText, { color: strokeCol }]}>///</Text>
      </View>
    );
  }

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== measuredW) setMeasuredW(w);
  };

  const w = width ?? (measuredW > 0 ? measuredW : 80);
  const pathD = w > 4 ? getSketchPath("line", w, 6, finalSeed) : "";

  return (
    <View onLayout={onLayout} style={[styles.container, style]}>
      {w > 4 && pathD ? (
        <Svg pointerEvents="none" width={w} height={6}>
          <Path
            d={pathD}
            fill="none"
            stroke={strokeCol}
            strokeWidth={themeStroke.hair}
            transform="translate(2, 2)"
          />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 12,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: space.sm,
  },
  hatchContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: space.sm,
  },
  hatchText: {
    fontFamily: font.handwritten,
    fontSize: 16,
    letterSpacing: 2,
  },
});
