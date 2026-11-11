import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { coursesById } from "@/content/courses";
import { useStore } from "@/lib/store";
import { radius, space, useTheme } from "@/lib/theme";
import { Page, Section, T, call } from "@/lib/ui";
import { DoodleIcon, type DoodleIconName } from "@/ui/icons/DoodleIcon";

const CATEGORY_ICONS: Record<string, DoodleIconName> = {
  stress: "activity",
  exam: "book",
  worry: "compass",
  sleep: "moon",
  mood: "activity",
  compassion: "heart",
};

export default function CourseDetailScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = id ? coursesById.get(id) : undefined;

  const progress = useStore((s) => s.courseProgress?.[id ?? ""]);
  const doneDays = new Set(progress?.done || []);

  if (!course) {
    return (
      <Page>
        <Stack.Screen options={{ title: "Course" }} />
        <T>Course not found.</T>
      </Page>
    );
  }

  const completedCount = course.days.filter((d) => doneDays.has(d.day)).length;
  const icon = CATEGORY_ICONS[course.category] || "book";

  return (
    <Page>
      <Stack.Screen options={{ title: "Course" }} />

      <View style={{ gap: space.md, paddingBottom: space.xl }}>
        {/* Header Hero */}
        <View style={[styles.heroCard, { backgroundColor: t.raised, borderColor: t.rule }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <View style={[styles.iconCircle, { backgroundColor: t.paper }]}>
              <DoodleIcon name={icon} size={24} color={t.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="title">{course.title}</T>
              <View style={[styles.draftBadge, { borderColor: t.rule, backgroundColor: t.paper }]}>
                <T v="small" soft>Draft · Under clinician review</T>
              </View>
            </View>
          </View>
          <T soft style={{ marginTop: space.xs }}>{course.summary}</T>

          {/* Progress bar */}
          <View style={{ marginTop: space.sm, gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <T v="small" soft>{`${completedCount} of ${course.days.length} days completed`}</T>
              {completedCount === course.days.length ? (
                <T v="small" style={{ color: t.ink, fontWeight: "600" }}>Complete ✓</T>
              ) : null}
            </View>
            <View style={[styles.progressTrack, { backgroundColor: t.rule }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: t.ink,
                    width: `${Math.round((completedCount / course.days.length) * 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Days List */}
        <Section title="Lessons">
          <View style={{ gap: space.sm }}>
            {course.days.map((d) => {
              const isDone = doneDays.has(d.day);
              return (
                <Pressable
                  key={d.day}
                  accessibilityRole="button"
                  accessibilityLabel={`Day ${d.day}: ${d.title}${isDone ? ", done" : ""}`}
                  onPress={() => router.push(`/course/${course.id}/${d.day}`)}
                  style={({ pressed }) => [
                    styles.dayRow,
                    {
                      backgroundColor: t.raised,
                      borderColor: t.rule,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <View style={[styles.dayNumber, { backgroundColor: isDone ? t.ink : t.paper }]}>
                    <T
                      style={{
                        color: isDone ? t.paper : t.ink,
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      {String(d.day)}
                    </T>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T v="heading">{d.title}</T>
                    <T v="small" soft>{"tool" in d.action ? `Tool: ${d.action.tool}` : "Reflection"}</T>
                  </View>
                  {isDone ? (
                    <T style={{ color: t.ink, fontSize: 18 }}>✓</T>
                  ) : (
                    <DoodleIcon name="chevron-right" size={18} color={t.ink2} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Support Footer */}
        <View style={[styles.footerCard, { borderColor: t.rule }]}>
          <T v="small" soft>
            Self-guided courses are supportive education and cannot replace medical care. Free 24×7 confidential support:
          </T>
          <Pressable accessibilityRole="button" accessibilityLabel="Call Tele-MANAS, 14416, toll-free" hitSlop={12} onPress={() => call("14416")} style={{ marginTop: 4 }}>
            <T v="small" style={{ color: t.ink, fontWeight: "600" }}>
              Call Tele-MANAS: 14416 (Toll-free)
            </T>
          </Pressable>
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.xs,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  draftBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.md,
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  footerCard: {
    marginTop: space.lg,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
