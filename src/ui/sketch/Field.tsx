import React, { useState } from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
  type TextInputProps,
  type LayoutChangeEvent,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { getSketchPath, seedFrom } from "./sketch";
import { useTheme, stroke as themeStroke, font, space } from "@/lib/theme";

export interface FieldProps extends TextInputProps {
  label?: string;
  error?: string;
  id?: string;
  seed?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Field({
  label,
  error,
  id = "field",
  seed,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: FieldProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const [layout, setLayout] = useState({ w: 0, h: 0 });

  const finalSeed = seed ?? seedFrom(id);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.round(width) !== layout.w || Math.round(height) !== layout.h) {
      setLayout({ w: Math.round(width), h: Math.round(height) });
    }
  };

  const strokeCol = error ? t.help : (focused ? t.ink : t.rule);
  const strokeWidth = error || focused ? themeStroke.bold : themeStroke.line;

  // Frame when focused, line at bottom when at rest
  const frameD = layout.w > 4 && layout.h > 0 && focused
    ? getSketchPath("rect", layout.w, layout.h, finalSeed)
    : "";

  const lineD = layout.w > 4 && !focused
    ? getSketchPath("line", layout.w, 6, finalSeed)
    : "";

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text style={[styles.labelText, { color: error ? t.help : t.ink2 }]}>
          {label}
        </Text>
      ) : null}
      <View onLayout={onLayout} style={styles.inputContainer}>
        {layout.w > 4 && layout.h > 0 && focused && frameD ? (
          <Svg pointerEvents="none" width={layout.w + 4} height={layout.h + 4} style={styles.svg}>
            <Path
              d={frameD}
              fill="none"
              stroke={strokeCol}
              strokeWidth={strokeWidth}
              transform="translate(2, 2)"
            />
          </Svg>
        ) : null}
        {layout.w > 4 && !focused && lineD ? (
          <Svg pointerEvents="none" width={layout.w + 4} height={6} style={styles.lineSvg}>
            <Path
              d={lineD}
              fill="none"
              stroke={strokeCol}
              strokeWidth={strokeWidth}
              transform="translate(2, 2)"
            />
          </Svg>
        ) : null}
        <TextInput
          placeholderTextColor={t.ink3}
          style={[
            styles.input,
            { color: t.ink },
            style,
          ]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...inputProps}
        />
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: t.help }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: space.xs,
  },
  labelText: {
    fontFamily: font.headline,
    fontSize: 14,
  },
  inputContainer: {
    position: "relative",
    minHeight: 46,
    justifyContent: "center",
  },
  input: {
    fontFamily: font.body,
    fontSize: 15,
    paddingHorizontal: space.md,
    paddingVertical: 12,
  },
  errorText: {
    fontFamily: font.body,
    fontSize: 13,
    marginTop: 2,
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  lineSvg: {
    position: "absolute",
    bottom: 0,
    left: 0,
  },
});
