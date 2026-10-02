import { router } from "expo-router";
import { Alert, Pressable, View } from "react-native";
import { update, useStore } from "@/lib/store";
import { radius, space, useTheme } from "@/lib/theme";
import { Button, Screen, T } from "@/lib/ui";

export default function Journal() {
  const t = useTheme();
  const entries = useStore((s) => s.entries);
  const sorted = [...entries].sort((a, b) => b.at - a.at);

  const remove = (id: string) =>
    Alert.alert("Delete this entry?", "It will be gone from this phone for good.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => update((s) => ({ entries: s.entries.filter((e) => e.id !== id) })) },
    ]);

  return (
    <Screen title="Journal">
      <Button kind="accent" icon="edit-3" label="New entry" onPress={() => router.push("/journal-new")} />
      {sorted.length === 0 ? (
        <View style={{ marginTop: space.xl, gap: space.sm }}>
          <T v="title">Nothing here yet.</T>
          <T soft>Writing a feeling down, even a few messy lines, often makes it smaller. Only you can read this: it never leaves your phone.</T>
        </View>
      ) : (
        <View style={{ marginTop: space.lg, gap: space.sm }}>
          {sorted.map((e) => (
            <Pressable
              key={e.id}
              onLongPress={() => remove(e.id)}
              accessibilityHint="Long press to delete"
              style={({ pressed }) => [
                {
                  padding: space.md,
                  gap: space.xs,
                  borderRadius: radius.lg,
                  backgroundColor: t.paper,
                  borderWidth: 1,
                  borderColor: t.line,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <T v="small" soft>
                {new Date(e.at).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                {e.prompt ? ` · ${e.prompt}` : ""}
              </T>
              <T v="voice">{e.text}</T>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/talk", params: { draft: `I wrote this in my journal: "${e.text.slice(0, 600)}"`, n: String(Date.now()) } })}
                hitSlop={8}
                style={{ alignSelf: "flex-start", marginTop: space.xs }}>
                <T v="small" style={{ color: t.primary, fontWeight: "600" }}>Talk about this →</T>
              </Pressable>
            </Pressable>
          ))}
          <T v="small" soft style={{ marginTop: space.xs }}>Long press an entry to delete it.</T>
        </View>
      )}
    </Screen>
  );
}
