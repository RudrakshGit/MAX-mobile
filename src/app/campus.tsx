import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { getCampus, type CampusPulse } from "@/lib/api";
import { moodWords } from "@/lib/insights";
import { useStore } from "@/lib/store";
import { space, useTheme } from "@/lib/theme";
import { Button, Field, Page, Section, T } from "@/lib/ui";

export default function Campus() {
  const t = useTheme();
  const mine = useStore((s) => s.campus);
  const [code, setCode] = useState(mine ?? "");
  const [data, setData] = useState<CampusPulse>();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  const load = async () => {
    setState("loading");
    try {
      setData(await getCampus(code.trim().toUpperCase()));
      setState("idle");
    } catch {
      setState("error");
    }
  };

  return (
    <Page>
      <View style={{ gap: space.sm }}>
        <T soft>Anonymous averages from the last 14 days for one college. Nothing shows until at least 10 different students have checked in, so no one can be picked out.</T>
        <Field value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="Campus code" accessibilityLabel="Campus code" />
        <Button label="Show pulse" onPress={load} disabled={code.trim().length < 2 || state === "loading"} />
      </View>
      {state === "loading" ? <ActivityIndicator style={{ marginTop: space.lg }} color={t.primary} /> : null}
      {state === "error" ? <T soft style={{ marginTop: space.lg }}>Couldn't load the pulse. Check your connection and try again.</T> : null}
      {data && !data.enough ? (
        <Section title="Not enough data yet">
          <T soft>Fewer than 10 students from this college have shared check-ins in the last two weeks. Averages appear once there are enough to keep everyone anonymous.</T>
        </Section>
      ) : null}
      {data?.enough ? (
        <Section title={`${data.students} students, last 14 days`}>
          <View style={{ gap: space.md }}>
            <Stat label="Average mood" value={`${data.mood.toFixed(1)} / 5`} note={`Mostly “${moodWords[Math.round(data.mood) - 1]}”`} />
            <Stat label="Average sleep" value={`${data.sleep.toFixed(1)} / 5`} />
            <Stat label="Average study pressure" value={`${data.stress.toFixed(1)} / 5`} />
            {data.days.length ? (
              <View style={{ gap: space.xs }}>
                <T v="heading">Mood by day</T>
                {data.days.map((d) => (
                  <View key={d.day} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                    <T v="small" soft style={{ width: 64 }}>{new Date(d.day + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</T>
                    <View style={{ height: 10, borderRadius: 5, backgroundColor: t.series.mood, width: `${(d.mood / 5) * 70}%` }} />
                    <T v="small">{d.mood.toFixed(1)}</T>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </Section>
      ) : null}
    </Page>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: t.line }}>
      <View>
        <T>{label}</T>
        {note ? <T v="small" soft>{note}</T> : null}
      </View>
      <T v="title">{value}</T>
    </View>
  );
}
