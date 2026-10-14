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
import { Underline } from "./Underline";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  kind?: "primary" | "secondary" | "accent" | "quiet" | "danger";
  disabled?: boolean;
  icon?: React.ReactNode;
  id?: string;
  seed?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  label,
  onPress,
  kind = "primary",
  disabled = false,
  icon,
  id,
  seed,
  style,
  textStyle,
}: ButtonProps) {
  const t = useTheme();
  const [layout, setLayout] = useState({ w: 0, h: 0 });

  const buttonId = id ?? label;
  const finalSeed = seed ?? seedFrom(buttonId);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.round(width) !== layout.w || Math.round(height) !== layout.h) {
      setLayout({ w: Math.round(width), h: Math.round(height) });
    }
  };

  if (kind === "quiet") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.quietContainer,
          pressed && styles.quietPressed,
          style,
        ]}>
        <Underline id={`${buttonId}-underline`} seed={finalSeed} color={disabled ? t.ink3 : t.ink}>
          <View style={styles.contentRow}>
            {icon ? <View style={styles.iconBox}>{icon}</View> : null}
            <Text
              style={[
                styles.quietText,
                { color: disabled ? t.ink3 : t.ink },
                textStyle,
              ]}>
              {label}
            </Text>
          </View>
        </Underline>
      </Pressable>
    );
  }

  const isPrimary = kind === "primary" || kind === "accent";
  const isDanger = kind === "danger";
  const hasShadow = !disabled && (isPrimary || isDanger);

  const pathD = layout.w > 4 && layout.h > 0
    ? getSketchPath("pill", layout.w, layout.h, finalSeed)
    : "";

  let strokeColor = t.ink;
  let fillColor = "none";
  let textColor = t.ink;
  let shadowColor = t.ink;

  if (disabled) {
    strokeColor = t.rule;
    fillColor = "none";
    textColor = t.ink3;
  } else if (isDanger) {
    strokeColor = t.help;
    fillColor = t.help;
    textColor = t.onHelp;
    shadowColor = t.ink;
  } else if (isPrimary) {
    strokeColor = t.ink;
    fillColor = t.ink;
    textColor = t.inverseInk;
    shadowColor = t.ink;
  } else {
    // secondary
    strokeColor = t.ink;
    fillColor = "none";
    textColor = t.ink;
  }

  return (
    <Pressable
      onLayout={onLayout}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.buttonBase,
        hasShadow && styles.withShadowMargin,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabledBase,
        style,
      ]}>
      {layout.w > 4 && layout.h > 0 && pathD ? (
        <Svg
          pointerEvents="none"
          width={layout.w + (hasShadow ? 4 : 0)}
          height={layout.h + (hasShadow ? 4 : 0)}
          style={styles.svg}>
          {hasShadow ? (
            <Path
              d={getBasePath("pill", layout.w, layout.h)}
              fill={shadowColor}
              transform="translate(5, 5)"
            />
          ) : null}
          {fillColor !== "none" ? (
            <Path
              d={getBasePath("pill", layout.w, layout.h)}
              fill={fillColor}
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
        <Text style={[styles.label, { color: textColor }, textStyle]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    position: "relative",
    minHeight: 48,
    paddingHorizontal: space.lg,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  withShadowMargin: {
    marginRight: 3,
    marginBottom: 3,
  },
  pressed: {
    transform: [
      { translateX: 2 },
      { translateY: 2 },
      { scaleX: 1.03 },
      { scaleY: 0.95 },
    ],
  },
  disabledBase: {
    opacity: 0.65,
  },
  quietContainer: {
    paddingVertical: space.xs,
    paddingHorizontal: space.xs,
    alignSelf: "flex-start",
  },
  quietPressed: {
    opacity: 0.7,
  },
  quietText: {
    fontFamily: font.body,
    fontSize: 13,
    fontStyle: "italic",
    fontWeight: "400",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  iconBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: font.button,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "visible",
  },
});
