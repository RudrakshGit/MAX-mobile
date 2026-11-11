import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Share, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Defs, G, Line, Pattern, Polyline, Rect } from "react-native-svg";
import { byId } from "@/content/instruments";
import {
  hm,
  measure,
  type Measured,
  usageSupported,
  CATEGORY_LABELS,
  type PhoneCategory,
} from "@/lib/device-usage";
import { lastDays, MIN_CHECKINS, moodDistribution, moodWords, patterns } from "@/lib/insights";
import { useStore, type CheckIn } from "@/lib/store";
import { font, radius, space, useTheme, type Theme } from "@/lib/theme";
import { Button, Choice, Screen, Section, T } from "@/lib/ui";

type Key = "mood" | "sleep" | "screen" | "stress";
// seven equal columns: each day cell is a full seventh of the row (about 44 dp wide on a phone), so taps land easily
// (a hair under 100/7, or rounding wraps the seventh day onto the next line)
const CELL = "14.28%" as const;
const series: { key: Key; label: string; norm: (c: CheckIn) => number }[] = [
  { key: "mood", label: "Mood", norm: (c) => (c.mood - 1) / 4 },
  { key: "sleep", label: "Sleep", norm: (c) => (c.sleep - 1) / 4 },
  { key: "screen", label: "Phone before bed", norm: (c) => Math.min(c.screenMin ?? c.screen, 60) / 60 },
  { key: "stress", label: "Study pressure", norm: (c) => (c.stress - 1) / 4 },
];

const seriesDashes: Record<Key, string | undefined> = {
  mood: undefined,
  sleep: "6 4",
  screen: "2 4",
  stress: "8 3 2 3",
};

const moodLetters = ["H", "L", "O", "G", "B"]; // Heavy, Low, Okay, Good, Bright

export default function Mood() {
  const t = useTheme();
  const checkins = useStore((s) => s.checkins);
  const results = useStore((s) => s.results);

  // Month Calendar State
  const [calDate] = useState(() => new Date());

  // Distribution range chip: 7d | 30d | all
  const [distRange, setDistRange] = useState<7 | 30 | "all">(30);

  // Chart range: 2 weeks | 4 weeks
  const [range, setRange] = useState<14 | 28>(14);
  const [on, setOn] = useState<Record<Key, boolean>>({ mood: true, sleep: true, screen: true, stress: false });

  const found = patterns(checkins);
  const [phone, setPhone] = useState<Measured | null>(null);
  useFocusEffect(useCallback(() => void measure().then(setPhone), []));
  const latest = ["phq9", "gad7", "cbi", "tech"].map((id) => results.filter((r) => r.checkup === id).at(-1)).filter((r) => !!r);

  const dist = moodDistribution(checkins, distRange);

  const share = () => {
    const days = new Set(lastDays(14));
    const c = checkins.filter((x) => days.has(x.date));
    const avg = (f: (x: CheckIn) => number) => (c.length ? (c.reduce((a, x) => a + f(x), 0) / c.length).toFixed(1) : "–");
    const lines = [
      "My MAX summary, last 14 days",
      `Check-ins: ${c.length}`,
      `Average mood ${avg((x) => x.mood)}/5 · sleep ${avg((x) => x.sleep)}/5 · study pressure ${avg((x) => x.stress)}/5 · phone before bed ${avg((x) => x.screen)} min`,
      ...latest.map((r) => `${byId[r.checkup]?.short ?? r.checkup}: ${r.band ?? `Score ${r.score}`} on ${new Date(r.at).toLocaleDateString("en-IN")}`),
      ...(found.length ? ["", "Patterns:", ...found.map((p) => `• ${p}`)] : []),
      "",
      "Self-reported, from the MAX app. Not a diagnosis.",
    ];
    Share.share({ message: lines.join("\n") });
  };

  return (
    <Screen title="Mood & Check-ins">
      <T soft style={{ marginTop: -space.sm }}>
        Your check-in calendar, mood distribution, and timeline trends.
      </T>

      {/* 1. Month Calendar Grid */}
      <Section title="This month">
        <MonthCalendar checkins={checkins} date={calDate} t={t} />
      </Section>

      {/* 2. Mood Distribution Bar */}
      <Section title="Mood distribution">
        <View
          style={{
            padding: space.md,
            borderRadius: radius.lg,
            backgroundColor: t.paper,
            borderWidth: 1,
            borderColor: t.rule,
            gap: space.md,
          }}>
          {/* Range Chips */}
          <View style={{ flexDirection: "row", gap: space.xs }}>
            {(["7", "30", "all"] as const).map((r) => {
              const val: 7 | 30 | "all" = r === "all" ? "all" : (parseInt(r, 10) as 7 | 30);
              const active = distRange === val;
              const label = r === "all" ? "All time" : `${r} days`;
              return (
                <Pressable
                  key={r}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={label}
                  onPress={() => setDistRange(val)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: active ? t.ink : t.rule,
                    backgroundColor: active ? t.ink : t.raised,
                  }}>
                  <T v="small" style={{ color: active ? t.paper : t.ink, fontWeight: active ? "600" : "400" }}>
                    {label}
                  </T>
                </Pressable>
              );
            })}
          </View>

          {/* Distribution Segmented Bar */}
          <DistributionBar distribution={dist} t={t} />

          {/* Breakdown labels */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, justifyContent: "space-between" }}>
            {dist.map((d) => (
              <View key={d.mood} style={{ alignItems: "center", minWidth: 48 }}>
                <T v="small" soft style={{ textTransform: "capitalize" }}>
                  {moodWords[d.mood - 1]}
                </T>
                <T v="heading" style={{ fontSize: 15 }}>
                  {d.pct}%
                </T>
                <T v="small" soft>
                  ({d.count})
                </T>
              </View>
            ))}
          </View>
        </View>
      </Section>

      {/* 3. Timeline Chart */}
      <Section title="Timeline & trends">
        <View
          style={{
            padding: space.md,
            borderRadius: radius.lg,
            backgroundColor: t.paper,
            borderWidth: 1,
            borderColor: t.rule,
            gap: space.md,
          }}>
          <Choice
            options={[
              { label: "2 weeks", value: 14 },
              { label: "4 weeks", value: 28 },
            ]}
            value={range}
            onChange={setRange}
          />
          {checkins.length ? (
            <Chart checkins={checkins} days={range} on={on} t={t} />
          ) : (
            <T soft>Your timeline appears here after your first check-in on the Today tab.</T>
          )}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {series.map((s) => (
              <Legend
                key={s.key}
                color={t.ink}
                label={s.label}
                active={on[s.key]}
                onPress={() => setOn({ ...on, [s.key]: !on[s.key] })}
              />
            ))}
          </View>
          <T v="small" soft>Higher on the chart means more: better mood, better sleep, more phone, more pressure.</T>
        </View>
      </Section>

      {usageSupported ? (
        <Section title="Phone use">
          <T soft>
            {phone
              ? `Yesterday your screen was on for ${hm(phone.yesterday)}.${phone.beforeSleep != null ? ` ${phone.beforeSleep} min of that was in the hour before you slept.` : ""}`
              : "Turn on automatic screen time to see your phone use next to your check-ins."}
          </T>
          <Button kind="quiet" label="Open screen time" onPress={() => router.push("/screen-time")} />
        </Section>
      ) : null}

      <Section title="What we noticed">
        {checkins.length < MIN_CHECKINS ? (
          <T soft>{`Check in on ${MIN_CHECKINS - checkins.length} more day${
            MIN_CHECKINS - checkins.length === 1 ? "" : "s"
          } and your patterns will start to show here.`}</T>
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
              <View
                key={r.id}
                style={{ paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: t.rule, gap: 2 }}>
                <T v="heading">{`${byId[r.checkup]?.title ?? r.checkup}: ${r.band ?? `Score ${r.score}`}`}</T>
                <T v="small" soft>{`Score ${r.score}${r.detail ? ` · ${r.detail}` : ""} · ${new Date(
                  r.at
                ).toLocaleDateString("en-IN")}`}</T>
                {prev ? (
                  <T v="small" style={{ color: diff < 0 ? t.ink : diff > 0 ? t.help : t.ink2 }}>
                    {diff === 0
                      ? `Same as last time (${prev.score}).`
                      : `${diff < 0 ? "Down" : "Up"} from ${prev.score} last time${
                          diff < 0 ? ", which is a good direction" : ""
                        }. ${runs.length} runs so far.`}
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
          <Button
            kind="quiet"
            icon="share-2"
            label="Share my summary"
            onPress={share}
            disabled={!checkins.length && !latest.length}
          />
        </View>
      </Section>
    </Screen>
  );
}

const SLEEP_WORDS = ["badly", "poorly", "okay", "well", "deeply"];

function MonthCalendar({ checkins, date, t }: { checkins: CheckIn[]; date: Date; t: Theme }) {
  const [selected, setSelected] = useState<string | null>(null);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const year = date.getFullYear();
  const month = date.getMonth();
  const monthName = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7; // Convert to Mon = 0 ... Sun = 6

  const checkinMap = new Map(checkins.map((c) => [c.date, c]));

  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View
      style={{
        padding: space.md,
        borderRadius: radius.lg,
        backgroundColor: t.paper,
        borderWidth: 1,
        borderColor: t.rule,
        gap: space.sm,
      }}>
      <T v="heading" style={{ fontSize: 16 }}>
        {monthName}
      </T>

      {/* Weekday headers */}
      <View style={{ flexDirection: "row" }}>
        {weekdays.map((w, idx) => (
          <View key={idx} style={{ width: CELL, alignItems: "center" }}>
            <T v="small" soft style={{ fontWeight: "600" }}>
              {w}
            </T>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {cells.map((dayNum, idx) => {
          if (!dayNum) {
            return <View key={`empty-${idx}`} style={{ width: CELL, height: 48 }} />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const c = checkinMap.get(dateStr);
          const moodLetter = c ? moodLetters[c.mood - 1] : null;

          return (
            <Pressable
              key={dateStr}
              accessibilityRole="button"
              accessibilityLabel={c ? `Day ${dayNum}: ${moodWords[c.mood - 1]}` : dateStr === todayStr ? `Day ${dayNum}, today, tap to check in` : `Day ${dayNum}, no check-in`}
              accessibilityState={{ selected: selected === dateStr, disabled: !c && dateStr !== todayStr }}
              disabled={!c && dateStr !== todayStr}
              onPress={() => (c ? setSelected(selected === dateStr ? null : dateStr) : router.navigate("/"))}
              style={{ width: CELL, height: 48, padding: 2 }}>
              <View style={{
                flex: 1,
                borderRadius: radius.sm,
                borderWidth: c || selected === dateStr ? 1.5 : 1,
                borderColor: c || dateStr === todayStr ? t.ink : t.rule,
                opacity: !c && dateStr !== todayStr ? 0.6 : 1,
                backgroundColor: c ? t.raised : "transparent",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 2,
              }}>
              <T
                style={{
                  fontSize: 12,
                  fontWeight: c ? "700" : "500",
                  color: t.ink,
                  lineHeight: 14,
                }}>
                {dayNum}
              </T>
              {c ? (
                <T
                  style={{
                    fontFamily: font.headline,
                    fontSize: 11,
                    color: t.ink,
                    lineHeight: 13,
                  }}>
                  {moodLetter}
                </T>
              ) : (
                <T soft style={{ fontSize: 10, lineHeight: 12 }}>
                  {dateStr === todayStr ? "+" : " "}
                </T>
              )}
              </View>
            </Pressable>
          );
        })}
      </View>
      {selected && checkinMap.get(selected) ? (
        <T style={{ marginTop: space.xs }}>
          {(() => {
            const c = checkinMap.get(selected)!;
            const d = new Date(`${selected}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
            return `${d} · felt ${moodWords[c.mood - 1]} · slept ${SLEEP_WORDS[c.sleep - 1] ?? "—"} · pressure ${c.stress}/5`;
          })()}
        </T>
      ) : null}
      <T v="small" soft style={{ marginTop: space.xs }}>
        H = Heavy · L = Low · O = Okay · G = Good · B = Bright. Tap a day to see it; tap today's + to check in.
      </T>
    </View>
  );
}

function DistributionBar({
  distribution,
  t,
}: {
  distribution: { mood: number; count: number; pct: number }[];
  t: Theme;
}) {
  const { width: screenW } = useWindowDimensions();
  const barW = Math.max(screenW - space.md * 4, 280);
  const barH = 20;

  const totalCount = distribution.reduce((acc, d) => acc + d.count, 0);

  if (totalCount === 0) {
    return (
      <View
        style={{
          height: barH,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: t.rule,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: t.raised,
        }}>
        <T v="small" soft>
          No check-ins in this period
        </T>
      </View>
    );
  }

  // Fills from dark to light
  const fills = [t.ink, t.ink2, t.rule, t.hair, t.raised];

  let currentX = 0;

  return (
    <View style={{ borderRadius: radius.sm, overflow: "hidden", borderWidth: 1, borderColor: t.ink }}>
      <Svg width={barW} height={barH}>
        {distribution.map((d, idx) => {
          const w = (d.pct / 100) * barW;
          const x = currentX;
          currentX += w;
          return (
            <Rect
              key={d.mood}
              x={x}
              y={0}
              width={w}
              height={barH}
              fill={fills[idx]}
            />
          );
        })}
      </Svg>
    </View>
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
          borderColor: active ? color : t.rule,
          backgroundColor: active ? t.raised : t.paper,
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
          <Line key={g} x1={pad} x2={w - pad} y1={y(g)} y2={y(g)} stroke={t.rule} strokeWidth={1} />
        ))}
        {series
          .filter((s) => on[s.key])
          .map((s) => {
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
                  <Polyline
                    key={j}
                    points={r.join(" ")}
                    fill="none"
                    stroke={t.ink}
                    strokeDasharray={seriesDashes[s.key]}
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ))}
                {dots.map((p, j) => (
                  <Circle key={j} cx={p.cx} cy={p.cy} r={3.5} fill={t.ink} />
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


