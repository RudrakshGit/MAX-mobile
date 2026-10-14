import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router, Stack } from "expo-router";
import { useStore, update } from "@/lib/store";
import { radius, space, useTheme } from "@/lib/theme";
import { Button, Page, Screen, Section, T } from "@/lib/ui";
import { Frame } from "@/ui/sketch/Frame";
import { Avatar } from "@/ui/Avatar";
import {
  AVATARS_A,
  AVATARS_B,
  defaultAvatarFor,
  type AvatarId,
  type AvatarItem,
} from "@/content/avatars";

export default function AvatarPickerScreen() {
  const t = useTheme();
  const anonId = useStore((s) => s.anonId);
  const currentAvatar = useStore((s) => s.avatar) || defaultAvatarFor(anonId);
  const [selected, setSelected] = useState<AvatarId>(currentAvatar as AvatarId);
  const [activeTab, setActiveTab] = useState<"a" | "b">("a");

  const list: AvatarItem[] = activeTab === "a" ? AVATARS_A : AVATARS_B;

  const save = () => {
    update((s) => ({ ...s, avatar: selected }));
    router.back();
  };

  return (
    <Screen title="Choose avatar">
      <Stack.Screen options={{ title: "Choose Avatar" }} />
      <View style={{ gap: space.md, alignItems: "center", paddingVertical: space.sm }}>
        <View
          style={{
            padding: 4,
            borderRadius: 50,
            borderWidth: 2,
            borderColor: t.ink,
            backgroundColor: t.raised,
          }}>
          <Avatar id={selected} size={84} />
        </View>
        <T v="heading">Your profile look</T>
        <T soft v="small">
          Hand-drawn line art. Visible only on this phone.
        </T>
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: t.raised,
          borderRadius: radius.pill,
          padding: 3,
          marginVertical: space.sm,
        }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab("a")}
          style={{
            flex: 1,
            paddingVertical: space.xs + 2,
            alignItems: "center",
            borderRadius: radius.pill,
            backgroundColor: activeTab === "a" ? t.paper : "transparent",
            borderWidth: activeTab === "a" ? 1 : 0,
            borderColor: t.rule,
          }}>
          <T v="title" style={{ fontSize: 14 }}>
            Set A
          </T>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab("b")}
          style={{
            flex: 1,
            paddingVertical: space.xs + 2,
            alignItems: "center",
            borderRadius: radius.pill,
            backgroundColor: activeTab === "b" ? t.paper : "transparent",
            borderWidth: activeTab === "b" ? 1 : 0,
            borderColor: t.rule,
          }}>
          <T v="title" style={{ fontSize: 14 }}>
            Set B
          </T>
        </Pressable>
      </View>

      {/* Grid of Avatars */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          rowGap: space.md,
          paddingVertical: space.sm,
        }}>
        {list.map((item) => {
          const isSelected = item.id === selected;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => setSelected(item.id)}
              style={({ pressed }) => ({
                width: "30%",
                aspectRatio: 1,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.md,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? t.ink : t.rule,
                backgroundColor: isSelected ? t.raised : t.paper,
                opacity: pressed ? 0.75 : 1,
                padding: 6,
              })}>
              <Avatar id={item.id} size={64} />
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: space.lg, gap: space.sm }}>
        <Button kind="accent" label="Save avatar" onPress={save} />
        <Button kind="quiet" label="Cancel" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
