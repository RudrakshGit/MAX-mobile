import React, { useState } from "react";
import { View, StyleSheet, type ViewStyle, type StyleProp, type LayoutChangeEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import { getSketchPath, seedFrom, type Shape } from "./sketch";
import { useTheme, stroke as themeStroke, space } from "@/lib/theme";

export interface BalloonProps {
  id?: string;
  seed?: number;
  tail?: "left" | "right" | "bottom" | "none";
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Balloon({
  id = "balloon",
  seed,
  tail = "right",
  style,
  children,
}: BalloonProps) {
  const t = useTheme();
  const [layout, setLayout] = useState({ w: 0, h: 0 });

  const finalSeed = seed ?? seedFrom(id);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.round(width) !== layout.w || Math.round(height) !== layout.h) {
      setLayout({ w: Math.round(width), h: Math.round(height) });
    }
  };

  const shape: Shape =
    tail === "right"
      ? "balloon-right"
      : tail === "left"
      ? "balloon-left"
      : tail === "bottom"
      ? "balloon-bottom"
      : "rect";

  const pathD = layout.w > 4 && layout.h > 0
    ? getSketchPath(shape, layout.w, layout.h, finalSeed)
    : "";

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        tail === "bottom" && styles.bottomTailPad,
        style,
      ]}>
      {layout.w > 4 && layout.h > 0 && pathD ? (
        <Svg
          pointerEvents="none"
          width={layout.w + (tail === "right" ? 18 : 4)}
          height={layout.h + (tail === "bottom" ? 18 : 4)}
          style={styles.svg}>
          <Path
            d={pathD}
            fill={t.paper}
            stroke={t.ink}
            strokeWidth={themeStroke.line}
            transform="translate(2, 2)"
          />
        </Svg>
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  bottomTailPad: {
    paddingBottom: 14,
  },
  content: {
    padding: space.md,
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "visible",
  },
});
