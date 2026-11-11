import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, AppState, View, type LayoutChangeEvent } from "react-native";
import { Stack, router, useFocusEffect, type Href } from "expo-router";
import Svg, { Line, Rect } from "react-native-svg";
import {
  CATEGORY_LABELS,
  goodDays,
  hasUsageAccess,
  hm,
  measure,
  openUsageSettings,
  readDay,
  usageSupported,
  type DayReport,
  type Measured,
  type PhoneCategory,
} from "@/lib/device-usage";
import { lastDays, patterns } from "@/lib/insights";
import { useStore } from "@/lib/store";
import { space, useTheme, type Theme } from "@/lib/theme";
import { Button, Choice, Page, Section, T } from "@/lib/ui";
import { Frame } from "@/ui/sketch/Frame";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";

// Everything here is read from Android on this phone and stays on it.

export default function ScreenTime() {
  const t = useTheme();
  const phoneDays = useStore((s) => s.phoneDays);
  const checkins = useStore((s) => s.checkins);
  const [which, setWhich] = useState<"yesterday" | "today">("yesterday");
  const [access, setAccess] = useState(hasUsageAccess());
  const [day, setDay] = useState<DayReport | null>(null);
  const [night, setNight] = useState<Measured | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const ok = hasUsageAccess();
    setAccess(ok);
    if (!ok) return;
    setLoading(true);
    setError(false);
    try {
      const [d, n] = await Promise.all([readDay(which), measure()]);
      setDay(d);
      setNight(n);
    } catch (e) {
      console.warn("screen time read failed", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [which]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  // Access is granted in a system screen; re-check when the student comes back.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => s === "active" && void load());
    return () => sub.remove();
  }, [load]);

  if (!usageSupported) {
    return (
      <Page>
        <Stack.Screen options={{ title: "Screen time" }} />
        <T soft>Screen time is read from Android, so it works only in the MAX app on Android phones.</T>
      </Page>
    );
  }

  if (!access) {
    return (
      <Page>
        <Stack.Screen options={{ title: "Screen time" }} />
        <View style={{ gap: space.md }}>
          <T v="title">See how your phone fits into your day</T>
          <T soft>
            MAX can read when your screen was on and which apps were open. It never sees what is on screen, messages or
            notifications, and nothing leaves this phone.
          </T>
          <Button label="Allow in Android settings" onPress={openUsageSettings} />
          <T v="small" soft>Find MAX in the list and switch on "Permit usage access", then come back.</T>
        </View>
      </Page>
    );
  }

  const history = goodDays(phoneDays);
  const enoughForAverage = history.length >= 3;
  const avgScreen = enoughForAverage ? Math.round(history.reduce((a, d) => a + (d.screenOn ?? 0), 0) / history.length) : null;
  const appTotal = day ? day.apps.reduce((a, x) => a + x.minutes, 0) : 0;
  const cats = day
    ? (Object.entries(day.categories) as [PhoneCategory, number][]).filter(([, m]) => m >= 1).sort((a, b) => b[1] - a[1])
    : [];
  const sleepPattern = patterns(checkins).find((p) => p.includes("phone before bed"));

  return (
    <Page>
      <Stack.Screen options={{ title: "Screen time" }} />
      <View style={{ gap: space.lg, paddingBottom: space.xl }}>
        <Choice
          fill
          options={[
            { label: "Yesterday", value: "yesterday" as const },
            { label: "Today so far", value: "today" as const },
          ]}
          value={which}
          onChange={(v) => {
            setDay(null);
            setWhich(v);
          }}
        />

        {loading && !day ? <ActivityIndicator color={t.ink} /> : null}
        {error ? <T style={{ color: t.help }}>Couldn't read screen time just now. Try again in a moment.</T> : null}

        {day ? (
          <>
            {/* 1. Summary */}
            <Frame id="st-summary" fill fillColor={t.raised} strokeColor={t.rule} style={{ padding: space.md, gap: space.sm }}>
              <T v="small" soft>{which === "yesterday" ? "Screen on yesterday" : "Screen on today so far"}</T>
              <T v="display">{hm(day.screenOnMin)}</T>
              {avgScreen !== null && which === "yesterday" ? (
                <T v="small" soft>{`Your usual: ${hm(avgScreen)} a day (last ${history.length} days measured)`}</T>
              ) : null}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.xs }}>
                <Stat t={t} label="Unlocks" value={String(day.pickups)} />
                <Stat t={t} label="Longest stretch" value={hm(day.longestMin)} />
                <Stat t={t} label="12–5 am" value={hm(day.nightMin)} />
              </View>
            </Frame>

            {/* 2. Hour by hour */}
            <Section title="Hour by hour">
              <HourChart t={t} hourly={day.hourly} />
              <T v="small" soft>Minutes the screen was on in each hour.</T>
            </Section>

            {/* 3. Sleep */}
            {night?.sleepAt ? (
              <Section title="Last night">
                <T>
                  {`Your phone went quiet around ${new Date(night.sleepAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}. `}
                  {night.beforeSleep ? `It was on for ${night.beforeSleep} min in the hour before that.` : "It stayed off in the hour before that."}
                </T>
                {sleepPattern ? <T soft>{sleepPattern}</T> : null}
                {night.beforeSleep && night.beforeSleep >= 30 ? (
                  <Button kind="quiet" label="Set a wind-down reminder" onPress={() => router.push("/profile/settings/reminders" as Href)} />
                ) : null}
              </Section>
            ) : null}

            {/* 4. Categories */}
            <Section title="What it went on">
              {cats.length === 0 ? (
                <T soft>No app use recorded.</T>
              ) : (
                <View style={{ gap: space.sm }}>
                  {cats.map(([cat, min]) => (
                    <Bar key={cat} t={t} label={CATEGORY_LABELS[cat]} value={hm(min)} share={appTotal ? min / appTotal : 0} />
                  ))}
                </View>
              )}
            </Section>

            {/* 5. Apps */}
            {day.apps.length ? (
              <Section title="Most used apps">
                <View>
                  {day.apps.slice(0, 10).map((a) => (
                    <View
                      key={a.pkg}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: space.sm,
                        paddingVertical: space.sm,
                        borderBottomWidth: 1,
                        borderBottomColor: t.rule,
                      }}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <T numberOfLines={1}>{a.app}</T>
                        <T v="small" soft>{CATEGORY_LABELS[a.group]}</T>
                      </View>
                      <T soft style={{ flexShrink: 0 }}>{hm(a.minutes)}</T>
                    </View>
                  ))}
                </View>
              </Section>
            ) : null}

            {/* 6. Trend */}
            <Section title="Last 7 days">
              {history.length >= 2 ? (
                <WeekChart t={t} days={history} />
              ) : (
                <T soft>The trend appears after MAX has measured a few days. Open this page on different days to build it up.</T>
              )}
            </Section>
          </>
        ) : null}

        <View style={{ flexDirection: "row", gap: space.sm, alignItems: "flex-start" }}>
          <DoodleIcon name="shield" size={16} color={t.ink2} style={{ marginTop: 2 }} />
          <T v="small" soft style={{ flex: 1 }}>
            Read from Android on this phone. Never sent anywhere, never shared with the AI. Times are close to, but may
            differ a little from, Android's Digital Wellbeing.
          </T>
        </View>
      </View>
    </Page>
  );
}

function Stat({ t, label, value }: { t: Theme; label: string; value: string }) {
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: 90,
        borderWidth: 1,
        borderColor: t.rule,
        borderRadius: 10,
        paddingVertical: space.xs,
        paddingHorizontal: space.sm,
        backgroundColor: t.paper,
        gap: 2,
      }}>
      <T v="small" soft>{label}</T>
      <T v="heading">{value}</T>
    </View>
  );
}

function Bar({ t, label, value, share }: { t: Theme; label: string; value: string; share: number }) {
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.sm }}>
        <T style={{ flexShrink: 1 }}>{label}</T>
        <T soft style={{ flexShrink: 0 }}>{`${value} · ${Math.round(share * 100)}%`}</T>
      </View>
      <View style={{ height: 10, borderRadius: 5, borderWidth: 1, borderColor: t.rule, overflow: "hidden" }}>
        <View style={{ width: `${Math.max(2, Math.round(share * 100))}%`, height: "100%", backgroundColor: t.ink }} />
      </View>
    </View>
  );
}

function useWidth() {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width));
  return { w, onLayout };
}

function HourChart({ t, hourly }: { t: Theme; hourly: number[] }) {
  const { w, onLayout } = useWidth();
  const h = 90;
  const max = Math.max(30, ...hourly);
  const slot = w / 24;
  return (
    <View onLayout={onLayout} style={{ gap: 4 }}>
      {w > 0 ? (
        <Svg width={w} height={h}>
          <Line x1={0} y1={h - 0.5} x2={w} y2={h - 0.5} stroke={t.rule} strokeWidth={1} />
          {hourly.map((m, i) => {
            const bh = m > 0 ? Math.max(2, (m / max) * (h - 4)) : 0;
            return <Rect key={i} x={i * slot + slot * 0.18} y={h - bh} width={slot * 0.64} height={bh} rx={1.5} fill={t.ink} />;
          })}
        </Svg>
      ) : (
        <View style={{ height: h }} />
      )}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {["12 am", "6 am", "12 pm", "6 pm", "11 pm"].map((l) => (
          <T key={l} v="small" soft>{l}</T>
        ))}
      </View>
    </View>
  );
}

function WeekChart({ t, days }: { t: Theme; days: { date: string; screenOn?: number }[] }) {
  const { w, onLayout } = useWidth();
  const week = lastDays(8).slice(0, 7); // the 7 finished days before today
  const byDate = new Map(days.map((d) => [d.date, d.screenOn ?? 0]));
  const values = week.map((d) => byDate.get(d));
  const max = Math.max(60, ...values.map((v) => v ?? 0));
  const h = 100;
  const slot = w / 7;
  return (
    <View onLayout={onLayout} style={{ gap: 4 }}>
      {w > 0 ? (
        <Svg width={w} height={h}>
          <Line x1={0} y1={h - 0.5} x2={w} y2={h - 0.5} stroke={t.rule} strokeWidth={1} />
          {values.map((v, i) => {
            const bh = v ? Math.max(2, (v / max) * (h - 4)) : 0;
            return <Rect key={i} x={i * slot + slot * 0.2} y={h - bh} width={slot * 0.6} height={bh} rx={2} fill={v === undefined ? t.hair : t.ink} />;
          })}
        </Svg>
      ) : (
        <View style={{ height: h }} />
      )}
      <View style={{ flexDirection: "row" }}>
        {week.map((d, i) => (
          <View key={d} style={{ flex: 1, alignItems: "center" }}>
            <T v="small" soft>{new Date(`${d}T12:00:00`).toLocaleDateString("en-IN", { weekday: "narrow" })}</T>
            <T v="small" soft>{values[i] === undefined ? "–" : `${Math.round((values[i] as number) / 6) / 10}h`}</T>
          </View>
        ))}
      </View>
    </View>
  );
}
