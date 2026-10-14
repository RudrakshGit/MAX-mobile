import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { useStore } from "@/lib/store";
import { radius, space, useTheme } from "@/lib/theme";
import { Screen, Section, T } from "@/lib/ui";
import { DoodleIcon, type DoodleIconName } from "@/ui/icons/DoodleIcon";
import {
  BreathingFigure,
  GroundingFigure,
  PersonalityFigure,
  SpiralFigure,
  SafetyFigure,
  MediaFigure,
} from "@/ui/illustrations";
import { Frame } from "@/ui/sketch/Frame";
import { Chip as SketchChip } from "@/ui/sketch/Chip";
import { consistency, lastDays, moodWords, patterns } from "@/lib/insights";
import {
  hm,
  measure,
  type Measured,
  usageSupported,
  hasUsageAccess,
  openUsageSettings,
  sevenDayCategoryAverage,
  CATEGORY_LABELS,
  type PhoneCategory,
} from "@/lib/device-usage";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";

export const TOOLS_LIST = [
  { id: "breathe", title: "Breathing reset", sub: "Cyclic sighing, box breathing & 4-7-8 patterns", icon: "wind" as const },
  { id: "ground", title: "5-4-3-2-1 grounding", sub: "Come back to the room when your mind is racing", icon: "compass" as const },
  { id: "reframe", title: "Thought reframe", sub: "Catch a thinking trap and find a fairer thought", icon: "edit" as const },
  { id: "spiral", title: "Spiral breaker", sub: "Plan what you'll do next time the loop starts", icon: "checklist" as const },
  { id: "safety-plan", title: "My safety plan", sub: "Personal crisis warning signs and support contacts", icon: "shield" as const },
] as const;

const TOOL_FIGURES: Record<string, React.ComponentType<{ size?: number }>> = {
  breathe: BreathingFigure,
  ground: GroundingFigure,
  reframe: PersonalityFigure,
  spiral: SpiralFigure,
  "safety-plan": SafetyFigure,
};

const TOOL_BADGES: Record<string, string> = {
  breathe: "SOMATIC",
  ground: "SENSORY",
  reframe: "CBT",
  spiral: "BREAK LOOP",
  "safety-plan": "SAFETY",
};

const MEDIA_ITEMS = [
  {
    id: "sounds",
    title: "Sounds & ambient music",
    sub: "Offline ambient noise, sleep timer & calming lo-fi soundscapes",
    badge: "OFFLINE AUDIO",
    icon: "music" as const,
    figure: BreathingFigure,
    href: "/sounds",
    action: "Listen now →",
  },
  {
    id: "library",
    title: "Watch & read library",
    sub: "60+ verified videos and guides from WHO, NHS & NIMHANS",
    badge: "60+ VETTED",
    icon: "tv" as const,
    figure: MediaFigure,
    href: "/library",
    action: "Explore library →",
  },
];

export default function ToolsScreen() {
  const t = useTheme();
  const checkins = useStore((s) => s.checkins);
  const insightsList = useStore((s) => s.insights);
  const phoneDays = useStore((s) => s.phoneDays);

  const [phone, setPhone] = useState<Measured | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(() => hasUsageAccess());

  useFocusEffect(
    useCallback(() => {
      const access = hasUsageAccess();
      setHasAccess(access);
      if (access) {
        void measure().then(setPhone);
      } else {
        setPhone(null);
      }
    }, [])
  );

  const weekDates = lastDays(7);
  const avg7 = sevenDayCategoryAverage(phoneDays, weekDates);

  const topCategoryLabel = useMemo(() => {
    if (!phone) return null;
    const entries = (Object.entries(phone.categories) as [PhoneCategory, number][])
      .filter(([_, m]) => m > 0)
      .sort((a, b) => b[1] - a[1]);
    return entries.length > 0 ? CATEGORY_LABELS[entries[0][0]] : "None";
  }, [phone]);

  // Data tracking signals
  const daysChecked = consistency(checkins);
  const detectedPatterns = patterns(checkins);

  // 7-day averages calculation
  const last7 = checkins.slice(-7);
  const avgMood = last7.length ? (last7.reduce((a, b) => a + b.mood, 0) / last7.length).toFixed(1) : null;
  const avgSleep = last7.length ? (last7.reduce((a, b) => a + b.sleep, 0) / last7.length).toFixed(1) : null;
  const avgStress = last7.length ? (last7.reduce((a, b) => a + b.stress, 0) / last7.length).toFixed(1) : null;

  return (
    <Screen title="Tools">
      <View style={{ gap: space.xl, paddingBottom: space.xl }}>
        {/* Intro */}
        <View style={{ marginTop: -space.xs }}>
          <T soft>
            Interactive somatic exercises, audio soundscapes, and personal wellbeing trends.
          </T>
        </View>

        {/* 1. Interactive Somatic & CBT Exercises */}
        <View style={{ gap: space.sm }}>
          <View style={{ gap: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
              <DoodleIcon name="compass" size={18} color={t.ink} />
              <T v="heading" style={{ fontSize: 18 }}>Interactive exercises</T>
            </View>
            <T soft>Quick somatic and cognitive resets you can practice anytime.</T>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: space.md, paddingRight: space.md }}
          >
            {TOOLS_LIST.map((x) => {
              const ToolFigure = TOOL_FIGURES[x.id] ?? BreathingFigure;
              const badgeLabel = TOOL_BADGES[x.id] ?? "TOOL";

              return (
                <Pressable
                  key={x.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${x.title}, ${x.sub}`}
                  onPress={() => {
                    const href = x.id === "safety-plan" ? "/tool/safety-plan" : `/tool/${x.id}`;
                    router.push(href as any);
                  }}
                  style={({ pressed }) => [{
                    width: 230,
                    minHeight: 265,
                    opacity: pressed ? 0.8 : 1,
                  }]}
                >
                  <Frame
                    id={`tool-card-${x.id}`}
                    fill
                    fillColor={t.raised}
                    strokeColor={t.rule}
                    style={styles.card}
                  >
                    <View style={[styles.figureContainer, { backgroundColor: t.paper, borderColor: t.rule }]}>
                      <ToolFigure size={110} />
                    </View>

                    <View style={{ flex: 1, justifyContent: "space-between", gap: space.xs }}>
                      <View style={{ gap: 4 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                            <DoodleIcon name={x.icon} size={14} color={t.ink} />
                            <T v="small" soft style={{ fontWeight: "600", fontSize: 10 }}>
                              {badgeLabel}
                            </T>
                          </View>
                          <View style={[styles.badge, { borderColor: t.rule }]}>
                            <T v="small" soft style={{ fontSize: 9 }}>1–3 MIN</T>
                          </View>
                        </View>

                        <T v="heading" numberOfLines={2} style={{ fontSize: 15, lineHeight: 20 }}>
                          {x.title}
                        </T>
                        <T v="small" soft numberOfLines={2} style={{ fontSize: 12, lineHeight: 16 }}>
                          {x.sub}
                        </T>
                      </View>

                      <View style={[styles.cardFooter, { borderTopColor: t.rule }]}>
                        <T v="small" style={{ fontSize: 11, color: t.ink, fontWeight: "600" }}>
                          Practice tool
                        </T>
                        <DoodleIcon name="chevron-right" size={15} color={t.ink} />
                      </View>
                    </View>
                  </Frame>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. Media & Audio Tools */}
        <View style={{ gap: space.sm }}>
          <View style={{ gap: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
              <DoodleIcon name="music" size={18} color={t.ink} />
              <T v="heading" style={{ fontSize: 18 }}>Media & audio</T>
            </View>
            <T soft>Calming offline soundscapes and clinician-verified video guides.</T>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: space.md, paddingRight: space.md }}
          >
            {MEDIA_ITEMS.map((item) => {
              const MediaFig = item.figure;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}, ${item.sub}`}
                  onPress={() => router.push(item.href as any)}
                  style={({ pressed }) => [{
                    width: 240,
                    minHeight: 265,
                    opacity: pressed ? 0.8 : 1,
                  }]}
                >
                  <Frame
                    id={`media-card-${item.id}`}
                    fill
                    fillColor={t.raised}
                    strokeColor={t.rule}
                    style={styles.card}
                  >
                    <View style={[styles.figureContainer, { backgroundColor: t.paper, borderColor: t.rule }]}>
                      <MediaFig size={110} />
                    </View>

                    <View style={{ flex: 1, justifyContent: "space-between", gap: space.xs }}>
                      <View style={{ gap: 4 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                            <DoodleIcon name={item.icon} size={14} color={t.ink} />
                            <T v="small" soft style={{ fontWeight: "600", fontSize: 10 }}>
                              {item.badge}
                            </T>
                          </View>
                        </View>

                        <T v="heading" numberOfLines={2} style={{ fontSize: 15, lineHeight: 20 }}>
                          {item.title}
                        </T>
                        <T v="small" soft numberOfLines={2} style={{ fontSize: 12, lineHeight: 16 }}>
                          {item.sub}
                        </T>
                      </View>

                      <View style={[styles.cardFooter, { borderTopColor: t.rule }]}>
                        <T v="small" style={{ fontSize: 11, color: t.ink, fontWeight: "600" }}>
                          {item.action}
                        </T>
                        <DoodleIcon name="chevron-right" size={15} color={t.ink} />
                      </View>
                    </View>
                  </Frame>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. Screen Time & Wellbeing Insights */}
        <View style={{ gap: space.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ gap: 2, flex: 1, marginRight: space.xs }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
                <DoodleIcon name="smartphone" size={18} color={t.ink} />
                <T v="heading" style={{ fontSize: 18 }}>Screen time & insights</T>
              </View>
              <T soft>Phone usage by category, screen time, and wellbeing trends.</T>
            </View>
            <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View detailed mood and screen time trends"
                onPress={() => router.push("/profile/mood" as Href)}
                hitSlop={8}
              >
                <T v="small" style={{ color: t.ink, fontWeight: "600" }}>Trends →</T>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View reflection history"
                onPress={() => router.push("/profile/insights" as Href)}
                hitSlop={8}
              >
                <T v="small" style={{ color: t.ink, fontWeight: "600" }}>History →</T>
              </Pressable>
            </View>
          </View>

          {/* Screen Time & Category Usage */}
          {phone ? (
            <Frame
              id="screen-time-metrics-frame"
              fill
              fillColor={t.raised}
              strokeColor={t.rule}
              style={{ padding: space.md, gap: space.sm }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <DoodleIcon name="smartphone" size={16} color={t.ink} />
                  <T v="heading" style={{ fontSize: 15 }}>Yesterday's screen time</T>
                </View>
                <View style={[styles.badge, { borderColor: t.rule, backgroundColor: t.paper }]}>
                  <T v="small" style={{ fontSize: 11, fontWeight: "600" }}>
                    {hm(phone.yesterday)} total
                  </T>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: space.sm, marginTop: 2 }}>
                <View style={[styles.statBox, { borderColor: t.rule, backgroundColor: t.paper }]}>
                  <T soft v="small" style={{ fontSize: 11 }}>Screen on</T>
                  <T v="heading" style={{ fontSize: 16 }}>{hm(phone.yesterday)}</T>
                </View>
                <View style={[styles.statBox, { borderColor: t.rule, backgroundColor: t.paper }]}>
                  <T soft v="small" style={{ fontSize: 11 }}>Before bed</T>
                  <T v="heading" style={{ fontSize: 16 }}>
                    {phone.beforeSleep != null ? `${phone.beforeSleep} min` : "None"}
                  </T>
                </View>
                <View style={[styles.statBox, { borderColor: t.rule, backgroundColor: t.paper }]}>
                  <T soft v="small" style={{ fontSize: 11 }}>Top focus</T>
                  <T v="heading" style={{ fontSize: 15 }} numberOfLines={1}>
                    {topCategoryLabel}
                  </T>
                </View>
              </View>

              <CategoryBreakdown
                categories={phone.categories}
                avg7={avg7}
                t={t}
                title="Usage by category"
                style={{ marginTop: 4 }}
              />

              {phone.topApps.length > 0 ? (
                <View style={{ marginTop: space.xs, gap: 4 }}>
                  <T v="heading" style={{ fontSize: 13, marginBottom: 2 }}>
                    Top apps
                  </T>
                  {phone.topApps.slice(0, 4).map((a) => (
                    <View
                      key={a.app}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 4,
                        borderBottomWidth: 1,
                        borderBottomColor: t.rule,
                      }}
                    >
                      <T style={{ fontSize: 13 }}>{a.app}</T>
                      <T soft v="small">{hm(a.minutes)}</T>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                <DoodleIcon name="shield" size={13} color={t.ink2} />
                <T v="small" soft style={{ fontSize: 11 }}>
                  Read from Android on this phone. Never sent anywhere.
                </T>
              </View>
            </Frame>
          ) : usageSupported && !hasAccess ? (
            <Frame
              id="screen-time-permission-frame"
              fill
              fillColor={t.raised}
              strokeColor={t.rule}
              style={{ padding: space.md, gap: space.sm }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
                <DoodleIcon name="smartphone" size={16} color={t.ink} />
                <T v="heading" style={{ fontSize: 15 }}>Screen time & category breakdown</T>
              </View>
              <T soft v="small" style={{ lineHeight: 18 }}>
                Turn on usage access in Android Settings to see your daily screen time, app categories (Social, Games, Study), and bedtime habits.
              </T>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Grant screen time access in Android Settings"
                onPress={openUsageSettings}
                style={({ pressed }) => [{
                  marginTop: space.xs,
                  paddingVertical: space.sm,
                  paddingHorizontal: space.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: t.rule,
                  backgroundColor: t.paper,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  opacity: pressed ? 0.8 : 1,
                }]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
                  <DoodleIcon name="settings" size={16} color={t.ink} />
                  <T style={{ fontWeight: "600", fontSize: 13 }}>Grant screen time access</T>
                </View>
                <DoodleIcon name="chevron-right" size={16} color={t.ink} />
              </Pressable>
            </Frame>
          ) : null}

          {/* 7-Day Metrics Bar */}
          <Frame
            id="tracking-metrics-frame"
            fill
            fillColor={t.raised}
            strokeColor={t.rule}
            style={{ padding: space.md, gap: space.sm }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <DoodleIcon name="activity" size={16} color={t.ink} />
                <T v="heading" style={{ fontSize: 15 }}>7-Day consistency</T>
              </View>
              <View style={[styles.badge, { borderColor: t.rule, backgroundColor: t.paper }]}>
                <T v="small" style={{ fontSize: 11, fontWeight: "600" }}>
                  {daysChecked} of 7 days logged
                </T>
              </View>
            </View>

            {avgMood ? (
              <View style={{ flexDirection: "row", gap: space.sm, marginTop: 4 }}>
                <View style={[styles.statBox, { borderColor: t.rule, backgroundColor: t.paper }]}>
                  <T soft v="small" style={{ fontSize: 11 }}>Avg Mood</T>
                  <T v="heading" style={{ fontSize: 17 }}>{avgMood} <T soft v="small">/ 5</T></T>
                </View>
                <View style={[styles.statBox, { borderColor: t.rule, backgroundColor: t.paper }]}>
                  <T soft v="small" style={{ fontSize: 11 }}>Avg Sleep</T>
                  <T v="heading" style={{ fontSize: 17 }}>{avgSleep} <T soft v="small">/ 5</T></T>
                </View>
                <View style={[styles.statBox, { borderColor: t.rule, backgroundColor: t.paper }]}>
                  <T soft v="small" style={{ fontSize: 11 }}>Pressure</T>
                  <T v="heading" style={{ fontSize: 17 }}>{avgStress} <T soft v="small">/ 5</T></T>
                </View>
              </View>
            ) : (
              <T soft v="small">
                Complete a few daily check-ins on Home to see your weekly averages.
              </T>
            )}

            {/* Smart Pattern Signals */}
            {detectedPatterns.length > 0 ? (
              <View style={{ gap: space.xs, marginTop: space.xs }}>
                {detectedPatterns.map((pat, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: space.xs,
                      paddingVertical: 4,
                    }}
                  >
                    <DoodleIcon name="sparkles" size={14} color={t.ink} style={{ marginTop: 2 }} />
                    <T soft v="small" style={{ flex: 1, fontSize: 12, lineHeight: 17 }}>
                      {pat}
                    </T>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Daily AI Insight Link Card */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Read today's insight reflection"
              onPress={() => router.push("/insight" as Href)}
              style={({ pressed }) => [{
                marginTop: space.xs,
                borderTopWidth: 1,
                borderTopColor: t.rule,
                paddingTop: space.sm,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: pressed ? 0.75 : 1,
              }]}
            >
              <View style={{ gap: 2, flex: 1 }}>
                <T v="heading" style={{ fontSize: 14 }}>Today's reflection</T>
                <T soft v="small" numberOfLines={1}>
                  {insightsList[0]?.title ?? "Personalized reflection crafted from your check-ins"}
                </T>
              </View>
              <DoodleIcon name="chevron-right" size={16} color={t.ink} />
            </Pressable>
          </Frame>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: space.sm,
    gap: space.sm,
    flex: 1,
  },
  figureContainer: {
    height: 120,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: space.xs,
    alignItems: "center",
    gap: 2,
  },
});
