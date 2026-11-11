import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useTheme, font } from "@/lib/theme";

export interface HelpPillProps {
  onPress?: () => void;
}

export function HelpPill({ onPress }: HelpPillProps) {
  const t = useTheme();
  // plain red pill like the other buttons (owner, 11 Nov 2026); still the only red thing on the screen
  return (
    <Pressable
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
      accessibilityRole="button"
      accessibilityLabel="Get help now, call 14416"
      onPress={onPress ?? (() => router.push("/help"))}
      style={({ pressed }) => [styles.pill, { backgroundColor: t.help, opacity: pressed ? 0.8 : 1 }]}>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={t.onHelp} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </Svg>
      <Text style={[styles.text, { color: t.onHelp }]}>Help</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
    borderRadius: 999,
  },
  text: {
    fontFamily: font.button,
    fontSize: 13,
    fontWeight: "600",
  },
});
