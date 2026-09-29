import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { checkupById, maxScore, score } from "@/content/checkups";
import { newId, update, type Result } from "@/lib/store";
import { radius, space, useTheme } from "@/lib/theme";
import { Button, CrisisCard, Page, T } from "@/lib/ui";

export default function Checkup() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = checkupById(id);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<Result>();
  if (!c) return <Page><T>Check-up not found.</T></Page>;

  const i = answers.length;
  const item = c.items[i];

  const pick = (s: number) => {
    const next = [...answers, s];
    if (next.length < c.items.length) return setAnswers(next);
    const r: Result = { id: newId(), checkup: c.id, at: Date.now(), ...score(c.id, next) };
    update((st) => ({ results: [...st.results, r] }));
    setAnswers(next);
    setResult(r);
  };

  if (result) {
    const high = ["Moderate", "Moderately severe", "Severe", "High"].includes(result.band);
    return (
      <Page>
        <Stack.Screen options={{ title: c.short }} />
        <View style={{ gap: space.lg }}>
          {result.flag ? <CrisisCard /> : null}
          <View style={{ gap: space.sm }}>
            <T v="small" soft>{c.title}</T>
            <T v="display">{result.band}</T>
            <T soft>{`Score ${result.score} of ${maxScore[c.id]}${result.detail ? ` · ${result.detail}` : ""}`}</T>
          </View>
          <T>
            {high
              ? "This range suggests things are weighing on you quite a bit right now. It isn't a diagnosis, but it is a good reason to talk to someone: a campus counsellor, a doctor, or a helpline."
              : "This is a screening range, not a diagnosis. Checking again in two weeks shows whether things are shifting."}
          </T>
          {result.flag ? null : high ? <Button kind="danger" icon="phone" label="See who you can talk to" onPress={() => router.push("/help")} /> : null}
          <Button kind="quiet" label="Talk it through" onPress={() => router.replace("/talk")} />
          <Button kind="quiet" label="Done" onPress={() => router.back()} />
          <T v="small" soft>{c.source}</T>
        </View>
      </Page>
    );
  }

  const options = item.options ?? c.options;
  return (
    <Page>
      <Stack.Screen options={{ title: c.short }} />
      <View style={{ gap: space.lg }}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: t.line }}>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: t.primary, width: `${(i / c.items.length) * 100}%` }} />
        </View>
        <T v="small" soft>{`${i + 1} of ${c.items.length} · ${c.intro}`}</T>
        <T v="title">{item.text}</T>
        <View style={{ gap: space.sm }}>
          {options.map((o) => (
            <Pressable
              key={o.label}
              accessibilityRole="button"
              onPress={() => pick(o.score)}
              style={({ pressed }) => ({ minHeight: 52, justifyContent: "center", paddingHorizontal: space.md, borderRadius: radius.sm, borderWidth: 1, borderColor: t.line, backgroundColor: pressed ? t.accentSoft : t.paper })}>
              <T>{o.label}</T>
            </Pressable>
          ))}
        </View>
        {i > 0 ? <Button kind="quiet" label="Previous question" onPress={() => setAnswers(answers.slice(0, -1))} /> : null}
      </View>
    </Page>
  );
}
