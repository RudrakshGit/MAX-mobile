import React from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme, font, space } from "@/lib/theme";

// A plain rounded box with a clean tick, like the buttons (owner, 11 Nov 2026: no pencil look on things you tap).
// `id` and `seed` are kept so callers don't change.

export interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  id?: string;
  seed?: number;
  size?: number;
  style?: StyleProp<ViewStyle>;
  /** Set when the checkbox sits inside a row that is itself the labelled checkbox, so screen readers
   * don't land on a second, unlabelled "checkbox, not checked". */
  decorative?: boolean;
}

export function Checkbox({ checked, onPress, label, size = 24, style, decorative = false }: CheckboxProps) {
  const t = useTheme();
  return (
    <Pressable
      accessible={!decorative}
      importantForAccessibility={decorative ? "no-hide-descendants" : "auto"}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.container, style]}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size / 4),
          borderWidth: 1.5,
          borderColor: checked ? t.ink : t.rule,
          backgroundColor: checked ? t.ink : t.raised,
          alignItems: "center",
          justifyContent: "center",
        }}>
        {checked ? (
          <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none" stroke={t.inverseInk} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12.5l4.5 4.5L19 7.5" />
          </Svg>
        ) : null}
      </View>
      {label ? <Text style={[styles.label, { color: t.ink }]}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: space.sm },
  label: { fontFamily: font.body, fontSize: 15 },
});
