import { router, Stack, useLocalSearchParams, type Href } from "expo-router";
import { View } from "react-native";
import { lessons } from "@/content/learn";
import { space } from "@/lib/theme";
import { Button, Page, T } from "@/lib/ui";

export default function Lesson() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const l = lessons.find((x) => x.id === id);
  if (!l) return <Page><T>Lesson not found.</T></Page>;
  return (
    <Page>
      <Stack.Screen options={{ title: "" }} />
      <View style={{ gap: space.lg }}>
        <View style={{ gap: space.sm }}>
          <T v="display">{l.title}</T>
          <T v="voice" soft>{l.sub}</T>
        </View>
        {l.body.map((p, i) => (
          <T key={i} style={{ fontSize: 17, lineHeight: 27 }}>{p}</T>
        ))}
        {l.tryThis ? <Button kind="accent" label={l.tryThis.label} onPress={() => router.push(l.tryThis!.href as Href)} /> : null}
        <View style={{ gap: space.xs, marginTop: space.md }}>
          <T v="small" soft>Sources</T>
          {l.sources.map((s) => (
            <T key={s} v="small" soft>{s}</T>
          ))}
        </View>
      </View>
    </Page>
  );
}
