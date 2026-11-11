import React from "react";
import { Pressable, Text, StyleSheet, View, type StyleProp, type ViewStyle, type TextStyle } from "react-native";
import { useTheme, font, space } from "@/lib/theme";
import { BUTTON_RADIUS } from "./Button";

// A pick in a set (radio), an on/off pick (checkbox) or a small action (button). Plain rounded boxes like the
// buttons (owner, 11 Nov 2026). `id` and `seed` are kept for callers; they no longer draw anything.

export interface ChipProps {
  label: string;
  selected: boolean;
  /** how a screen reader announces it: one of a set (radio), an on/off pick (checkbox), or a plain action (button) */
  role?: "radio" | "checkbox" | "button";
  onPress: () => void;
  id?: string;
  seed?: number;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Chip({ label, selected, role = "radio", onPress, icon, style, textStyle }: ChipProps) {
  const t = useTheme();
  return (
    <Pressable
      hitSlop={{ top: 6, bottom: 6 }}
      accessibilityRole={role}
      accessibilityState={role === "button" ? undefined : { checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? t.ink : t.raised, borderColor: selected ? t.ink : t.rule, opacity: pressed ? 0.75 : 1 },
        style,
      ]}>
      <View style={styles.row}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        {/* one line, shrinking a little in tight rows: a word never breaks inside a chip ("poorl/y") */}
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[styles.label, { color: selected ? t.inverseInk : t.ink, fontFamily: selected ? font.bodyBold : font.body }, textStyle]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: BUTTON_RADIUS,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.xs },
  icon: { alignItems: "center", justifyContent: "center" },
  label: { fontSize: 15, textAlign: "center", flexShrink: 1 },
});
