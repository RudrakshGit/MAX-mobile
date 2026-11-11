import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { router, type Href } from "expo-router";
import { useTheme, space } from "@/lib/theme";
import { T } from "@/lib/ui";
import { DoodleIcon, type DoodleIconName } from "@/ui/icons/DoodleIcon";
import { Frame } from "@/ui/sketch/Frame";
import { setFloatingMaxEnabled, setQuickMenuOpen } from "@/lib/max-store";

interface QuickActionItem {
  id: string;
  icon: DoodleIconName;
  label: string;
  description: string;
  onPress: () => void;
}

export function MaxQuickActions({ visible }: { visible: boolean }) {
  const t = useTheme();

  if (!visible) return null;

  const close = () => setQuickMenuOpen(false);

  const items: QuickActionItem[] = [
    {
      id: "talk",
      icon: "chat",
      label: "Talk to MAX",
      description: "Chat with your AI companion anytime",
      onPress: () => {
        close();
        router.push("/talk" as Href);
      },
    },
    {
      id: "breathe",
      icon: "compass",
      label: "2-Min Reset",
      description: "Guided box breathing pause",
      onPress: () => {
        close();
        router.push("/tool/breathe" as Href);
      },
    },
    {
      id: "journal",
      icon: "pen",
      label: "Quick Check-in",
      description: "Log how you're feeling right now",
      onPress: () => {
        close();
        router.push("/journal-new" as Href);
      },
    },
    {
      id: "hide",
      icon: "x",
      label: "Hide MAX for now",
      description: "You can turn MAX back on in Settings",
      onPress: () => {
        close();
        setFloatingMaxEnabled(false);
      },
    },
  ];

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={close}>
      <View style={{ flex: 1, justifyContent: "flex-end", padding: space.md, paddingBottom: space.xl }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={close}
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.35)" }]}
        />
        <View style={{ width: "100%" }}>
          <Frame
            id="quick-actions-frame"
            fill
            fillColor={t.paper}
            strokeColor={t.rule}
            style={{
              padding: space.md,
              borderRadius: 20,
              gap: space.sm,
            }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: space.xs,
                borderBottomWidth: 1,
                borderBottomColor: t.rule,
              }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
                <DoodleIcon name="sparkles" size={18} color={t.ink} />
                <T v="heading" style={{ fontSize: 16 }}>
                  MAX Companion
                </T>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={close}
                hitSlop={10}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: t.raised,
                }}>
                <DoodleIcon name="x" size={14} color={t.ink2} />
              </Pressable>
            </View>

            <View style={{ gap: space.xs }}>
              {items.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={item.onPress}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.md,
                    paddingVertical: space.sm,
                    paddingHorizontal: space.sm,
                    borderRadius: 12,
                    backgroundColor: pressed ? t.raised : "transparent",
                  })}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: t.raised,
                      borderWidth: 1,
                      borderColor: t.rule,
                    }}>
                    <DoodleIcon name={item.icon} size={18} color={t.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T style={{ fontSize: 15, fontWeight: "600" }}>{item.label}</T>
                    <T soft v="small">
                      {item.description}
                    </T>
                  </View>
                  <DoodleIcon name="arrow-right" size={14} color={t.ink2} />
                </Pressable>
              ))}
            </View>
          </Frame>
        </View>
      </View>
    </Modal>
  );
}
