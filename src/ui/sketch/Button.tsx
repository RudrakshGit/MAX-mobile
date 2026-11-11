import React from "react";
import { Pressable, Text, StyleSheet, View, type StyleProp, type ViewStyle, type TextStyle } from "react-native";
import { useTheme, font, space } from "@/lib/theme";

// Buttons are plain rounded boxes, the same family as the time field (owner, 11 Nov 2026): the pencil look stays on
// card outlines, not on things you tap. `id` and `seed` are kept so callers don't change; they no longer draw anything.

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

export const BUTTON_RADIUS = 12;

export function Button({ label, onPress, kind = "primary", disabled = false, icon, style, textStyle }: ButtonProps) {
  const t = useTheme();

  if (kind === "quiet") {
    const color = disabled ? t.ink3 : t.ink;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        // text buttons: widen the touch area to the 48 dp minimum
        hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.quiet, { opacity: pressed ? 0.6 : 1 }, style]}>
        <View style={styles.row}>
          {icon ? <View style={styles.icon}>{tint(icon, color)}</View> : null}
          <Text style={[styles.quietText, { color, textDecorationColor: t.ink3 }, textStyle]}>{label}</Text>
        </View>
      </Pressable>
    );
  }

  // a disabled button is an outline with faint text, not a grey slab
  const filled = !disabled && (kind === "primary" || kind === "accent" || kind === "danger");
  const bg = !filled ? t.raised : kind === "danger" ? t.help : t.ink;
  const fg = disabled ? t.ink3 : !filled ? t.ink : kind === "danger" ? t.onHelp : t.inverseInk;
  const border = filled ? bg : t.rule;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor: border, opacity: pressed && !disabled ? 0.8 : 1 },
        style,
      ]}>
      <View style={styles.row}>
        {icon ? <View style={styles.icon}>{tint(icon, fg)}</View> : null}
        <Text style={[styles.label, { color: fg }, textStyle]}>{label}</Text>
      </View>
    </Pressable>
  );
}

// an icon without its own colour takes the label's, so it stays visible on filled buttons
const tint = (icon: React.ReactNode, color: string) =>
  React.isValidElement<{ color?: string }>(icon) && !icon.props.color ? React.cloneElement(icon, { color }) : icon;

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: space.lg,
    paddingVertical: 12,
    borderRadius: BUTTON_RADIUS,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  quiet: { paddingVertical: space.xs, paddingHorizontal: space.xs, alignSelf: "flex-start" },
  quietText: { fontFamily: font.bodyBold, fontSize: 14, textDecorationLine: "underline" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  icon: { alignItems: "center", justifyContent: "center" },
  label: { fontFamily: font.button, fontSize: 15, fontWeight: "600", textAlign: "center" },
});
