import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Share, useWindowDimensions, View } from "react-native";
import Svg, { Circle, G, Line, Polyline } from "react-native-svg";
import { checkupById } from "@/content/checkups";
import { hm, measure, type Measured } from "@/lib/device-usage";
import { lastDays, MIN_CHECKINS, patterns } from "@/lib/insights";
import { useStore, type CheckIn } from "@/lib/store";
import { radius, space, useTheme, type Theme } from "@/lib/theme";
import { Button, Choice, Screen, Section, T } from "@/lib/ui";

type Key = "mood" | "sleep" | "screen" | "stress";
const series: { key: Key; label: string; norm: (c: CheckIn) => number }[] = [
  { key: "mood", label: "Mood", norm: (c) => (c.mood - 1) / 4 },
  { key: "sleep", label: "Sleep", norm: (c) => (c.sleep - 1) / 4 },
  { key: "screen", label: "Phone before bed", norm: (c) => Math.min(c.screenMin ?? c.screen, 60) / 60 },
  { key: "stress", label: "Study pressure", norm: (c) => (c.stress - 1) / 4 },
];

export default function Insights() {
  const t = useTheme();
  const checkins = useStore((s) => s.checkins);
  const results = useStore((s) => s.results);
  const [range, setRange] = useState<14 | 28>(14);
  const [on, setOn] = useState<Record<Key, boolean>>({ mood: true, sleep: true, screen: true, stress: false });
  const found = patterns(checkins);
  const [phone, setPhone] = useState<Measured | null>(null);
  useFocusEffect(useCallback(() => void measure().then(setPhone), []));
  const latest = ["phq9", "gad7", "cbi", "tech"].map((id) => results.filter((r) => r.checkup === id).at(-1)).filter((r) => !!r);

  const share = () => {
    const days = new Set(lastDays(14));
    const c = checkins.filter((x) => days.has(x.date));
    const avg = (f: (x: CheckIn) => number) => (c.length ? (c.reduce((a, x) => a + f(x), 0) / c.length).toFixed(1) : "–");
    const lines = [
      "My MAX summary, last 14 days",
      `Check-ins: ${c.length}`,
      `Average mood ${avg((x) => x.mood)}/5 · sleep ${avg((x) => x.sleep)}/5 · study pressure ${avg((x) => x.stress)}/5 · phone before bed ${avg((x) => x.screen)} min`,
      ...latest.map((r) => `${checkupById(r.checkup)?.short}: ${r.band} (${r.score}) on ${new Date(r.at).toLocaleDateString("en-IN")}`),
      ...(found.length ? ["", "Patterns:", ...found.map((p) => `• ${p}`)] : []),
      "",
      "Self-reported, from the MAX app. Not a diagnosis.",
    ];
    Share.share({ message: lines.join("\n") });
  };

  return (
    <Screen title="Insights">
      <T soft style={{ marginTop: -space.sm }}>Your check-ins on one timeline, so you can see how they move together.</T>

      <View style={{ marginTop: space.lg, padding: space.md, borderRadius: radius.lg, backgroundColor: t.paper, borderWidth: 1, borderColor: t.line, gap: space.md }}>
        <Choice options={[{ label: "2 weeks", value: 14 }, { label: "4 weeks", value: 28 }]} value={range} onChange={setRange} />
        {checkins.length ? (
          <Chart checkins={checkins} days={range} on={on} t={t} />
        ) : (
          <T soft>Your timeline appears here after your first check-in on the Today tab.</T>
        )}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {series.map((s) => (
            <Legend key={s.key} color={t.series[s.key]} label={s.label} active={on[s.key]} onPress={() => setOn({ ...on, [s.key]: !on[s.key] })} />
          ))}
        </View>
        <T v="small" soft>Higher on the chart means more: better mood, better sleep, more phone, more pressure.</T>
      </View>

      {phone ? (
        <Section title="Yesterday on this phone">
          <T>{`Screen on for ${hm(phone.yesterday)}.${phone.beforeSleep != null ? ` ${phone.beforeSleep} min of that was in the hour before you slept.` : ""}`}</T>
          {phone.topApps.map((a) => (
            <View key={a.app} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: t.line }}>
              <T>{a.app}</T>
              <T soft>{hm(a.minutes)}</T>
            </View>
          ))}
          <T v="small" soft style={{ marginTop: space.sm }}>Read from Android on this phone. Never sent anywhere.</T>
        </Section>
      ) : null}

      <Section title="What we noticed">
        {checkins.length < MIN_CHECKINS ? (
          <T soft>{`Check in on ${MIN_CHECKINS - checkins.length} more day${MIN_CHECKINS - checkins.length === 1 ? "" : "s"} and your patterns will start to show here.`}</T>
        ) : found.length ? (
          <View style={{ gap: space.md }}>
            {found.map((p) => (
              <T key={p}>{p}</T>
            ))}
            <T v="small" soft>These are patterns in your own answers, not proof of cause.</T>
          </View>
        ) : (
          <T soft>No strong patterns yet. Keep checking in; two to four weeks of data shows the most.</T>
        )}
      </Section>

      {latest.length ? (
        <Section title="Check-ups over time">
          {latest.map((r) => {
            const runs = results.filter((x) => x.checkup === r.checkup);
            const prev = runs.at(-2);
            const diff = prev ? r.score - prev.score : 0;
            return (
              <View key={r.id} style={{ paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: t.line, gap: 2 }}>
                <T v="heading">{`${checkupById(r.checkup)?.title}: ${r.band}`}</T>
                <T v="small" soft>{`Score ${r.score}${r.detail ? ` · ${r.detail}` : ""} · ${new Date(r.at).toLocaleDateString("en-IN")}`}</T>
                {prev ? (
                  <T v="small" style={{ color: diff < 0 ? t.primary : diff > 0 ? t.help : t.inkSoft }}>
                    {diff === 0 ? `Same as last time (${prev.score}).` : `${diff < 0 ? "Down" : "Up"} from ${prev.score} last time${diff < 0 ? ", which is a good direction" : ""}. ${runs.length} runs so far.`}
                  </T>
                ) : (
                  <T v="small" soft>Take it again in two weeks to see the direction.</T>
                )}
              </View>
            );
          })}
        </Section>
      ) : null}

      <Section title="Share with a counsellor">
        <T soft>Make a short text summary and send it to whoever you choose. Nothing is shared unless you do this.</T>
        <View style={{ marginTop: space.md }}>
          <Button kind="quiet" icon="share-2" label="Share my summary" onPress={share} disabled={!checkins.length && !latest.length} />
        </View>
      </Section>
    </Screen>
  );
}

function Legend({ color, label, active, onPress }: { color: string; label: string; active: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
          minHeight: 38,
          paddingHorizontal: 12,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: active ? color : t.line,
          backgroundColor: active ? (t.bg) : t.paper,
          opacity: pressed ? 0.75 : 1,
        },
      ]}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: active ? color : "transparent", borderWidth: 2, borderColor: color }} />
      <T v="small" style={{ fontWeight: active ? "600" : "400" }} soft={!active}>{label}</T>
    </Pressable>
  );
}

function Chart({ checkins, days, on, t }: { checkins: CheckIn[]; days: number; on: Record<Key, boolean>; t: Theme }) {
  const { width: screenW } = useWindowDimensions();
  const w = Math.max(screenW - space.md * 4, 280);
  const h = 180;
  const pad = 10;
  const dates = lastDays(days);
  const byDate = new Map(checkins.map((c) => [c.date, c]));
  const x = (i: number) => pad + (i * (w - pad * 2)) / (dates.length - 1);
  const y = (v: number) => h - pad - v * (h - pad * 2);

  return (
    <View>
      <Svg width={w} height={h}>
        {[0, 0.5, 1].map((g) => (
          <Line key={g} x1={pad} x2={w - pad} y1={y(g)} y2={y(g)} stroke={t.line} strokeWidth={1} />
        ))}
        {series
          .filter((s) => on[s.key])
          .map((s) => {
            // Break the line wherever a day was skipped rather than inventing a value.
            const runs: string[][] = [[]];
            const dots: { cx: number; cy: number }[] = [];
            dates.forEach((d, i) => {
              const c = byDate.get(d);
              if (!c) return runs.at(-1)!.length && runs.push([]);
              const p = { cx: x(i), cy: y(s.norm(c)) };
              runs.at(-1)!.push(`${p.cx},${p.cy}`);
              dots.push(p);
            });
            return (
              <G key={s.key}>
                {runs.filter((r) => r.length > 1).map((r, j) => (
                  <Polyline key={j} points={r.join(" ")} fill="none" stroke={t.series[s.key]} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                ))}
                {dots.map((p, j) => (
                  <Circle key={j} cx={p.cx} cy={p.cy} r={3.5} fill={t.series[s.key]} />
                ))}
              </G>
            );
          })}
      </Svg>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {[dates[0], dates[Math.floor(dates.length / 2)], dates.at(-1)!].map((d) => (
          <T key={d} v="small" soft>{new Date(d + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</T>
        ))}
      </View>
    </View>
  );
}
