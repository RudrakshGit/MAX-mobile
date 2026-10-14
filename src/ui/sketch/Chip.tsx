import React, { useState } from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
  type LayoutChangeEvent,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { getBasePath, getSketchPath, seedFrom } from "./sketch";
import { useTheme, stroke as themeStroke, font, space } from "@/lib/theme";

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  id?: string;
  seed?: number;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Chip({
  label,
  selected,
  onPress,
  id,
  seed,
  icon,
  style,
  textStyle,
}: ChipProps) {
  const t = useTheme();
  const [layout, setLayout] = useState({ w: 0, h: 0 });

  const chipId = id ?? label;
  const finalSeed = seed ?? seedFrom(chipId);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.round(width) !== layout.w || Math.round(height) !== layout.h) {
      setLayout({ w: Math.round(width), h: Math.round(height) });
    }
  };

  const pathD = layout.w > 4 && layout.h > 0
    ? getSketchPath("pill", layout.w, layout.h, finalSeed)
    : "";

  const strokeColor = selected ? t.ink : t.rule;
  const textColor = selected ? t.inverseInk : t.ink;

  return (
    <Pressable
      onLayout={onLayout}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        pressed && styles.pressed,
        style,
      ]}>
      {layout.w > 4 && layout.h > 0 && pathD ? (
        <Svg pointerEvents="none" width={layout.w + 4} height={layout.h + 4} style={styles.svg}>
          {selected ? (
            <Path
              d={getBasePath("pill", layout.w, layout.h)}
              fill={t.ink}
              transform="translate(2, 2)"
            />
          ) : null}
          <Path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth={themeStroke.line}
            transform="translate(2, 2)"
          />
        </Svg>
      ) : null}
      <View style={styles.contentRow}>
        {icon ? <View style={styles.iconBox}>{icon}</View> : null}
        <Text numberOfLines={1} style={[styles.label, { color: textColor }, textStyle]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    position: "relative",
    paddingHorizontal: 8,
    minHeight: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  pressed: {
    transform: [
      { translateX: 1 },
      { translateY: 1 },
      { scaleX: 1.03 },
      { scaleY: 0.95 },
    ],
    opacity: 0.9,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
  },
  iconBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: font.handwritten,
    fontSize: 14,
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "visible",
  },
});
