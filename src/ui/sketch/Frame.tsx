import React, { useState } from "react";
import { View, StyleSheet, type ViewStyle, type StyleProp, type LayoutChangeEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import { getBasePath, getSketchPath, seedFrom, type Shape } from "./sketch";
import { useTheme, stroke as themeStroke } from "@/lib/theme";

export interface FrameProps {
  id?: string;
  seed?: number;
  shape?: Shape;
  fill?: boolean;
  shadow?: boolean;
  dashed?: boolean;
  double?: boolean;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
  shadowColor?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Frame({
  id = "frame",
  seed,
  shape = "rect",
  fill = false,
  shadow = false,
  dashed = false,
  double = true,
  strokeWidth = themeStroke.line,
  strokeColor,
  fillColor,
  shadowColor,
  style,
  children,
}: FrameProps) {
  const t = useTheme();
  const [layout, setLayout] = useState({ w: 0, h: 0 });

  const finalSeed = seed ?? seedFrom(id);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.round(width) !== layout.w || Math.round(height) !== layout.h) {
      setLayout({ w: Math.round(width), h: Math.round(height) });
    }
  };

  const pathD = layout.w > 4 && layout.h > 0
    ? getSketchPath(shape, layout.w, layout.h, finalSeed, { double })
    : "";

  const strokeCol = strokeColor ?? t.ink;
  const fillCol = fill ? (fillColor ?? t.paper) : "none";
  const shadowCol = shadowColor ?? t.ink;

  return (
    <View onLayout={onLayout} style={[styles.container, style]}>
      {layout.w > 4 && layout.h > 0 && pathD ? (
        <Svg
          pointerEvents="none"
          width={layout.w + (shadow ? 4 : 0)}
          height={layout.h + (shadow ? 4 : 0)}
          style={styles.svg}>
          {shadow ? (
            <Path
              d={getBasePath(shape, layout.w, layout.h)}
              fill={shadowCol}
              transform="translate(5, 5)"
            />
          ) : null}
          {fillCol !== "none" ? (
            <Path
              d={getBasePath(shape, layout.w, layout.h)}
              fill={fillCol}
              transform="translate(2, 2)"
            />
          ) : null}
          <Path
            d={pathD}
            fill="none"
            stroke={strokeCol}
            strokeWidth={strokeWidth}
            strokeDasharray={dashed ? "6,4" : undefined}
            transform="translate(2, 2)"
          />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "visible",
  },
});
