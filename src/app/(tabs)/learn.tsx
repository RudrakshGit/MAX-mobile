import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { courses, coursesById } from "@/content/courses";
import type { Course } from "@/content/courses/types";
import { lessons } from "@/content/learn";
import { yourCourse } from "@/lib/course";
import { useStore } from "@/lib/store";
import { radius, space, useTheme } from "@/lib/theme";
import { Page, Row, Section, T } from "@/lib/ui";
import { DoodleIcon, type DoodleIconName } from "@/ui/icons/DoodleIcon";
import {
  LearningFigure,
  WellnessFigure,
  GrowthFigure,
  PersonalityFigure,
  BreathingFigure,
  GroundingFigure,
  SpiralFigure,
  SafetyFigure,
  MediaFigure,
  ReadingFigure,
} from "@/ui/illustrations";
import { Frame } from "@/ui/sketch/Frame";

export const tools = [
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

const CATEGORY_ICONS: Record<string, DoodleIconName> = {
  stress: "activity",
  exam: "book",
  worry: "compass",
  sleep: "moon",
  mood: "activity",
  compassion: "heart",
};

interface CourseCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: DoodleIconName;
  courseIds: string[];
}

const COURSE_CATEGORIES: CourseCategory[] = [
  {
    id: "calm",
    title: "Nervous System & Calm",
    subtitle: "Reset your fight-or-flight response and sleep deeply",
    icon: "activity",
    courseIds: ["stress-toolkit", "sleep-reset"],
  },
  {
    id: "academic",
    title: "Academic & Mind",
    subtitle: "Conquer exam tension, perfectionism and thought spirals",
    icon: "book",
    courseIds: ["exam-stress", "overthinking"],
  },
  {
    id: "momentum",
    title: "Motivation & Compassion",
    subtitle: "Overcome low mood inertia and treat yourself kindly",
    icon: "heart",
    courseIds: ["get-going", "kind-to-yourself"],
  },
];

const COURSE_FIGURES: Record<string, React.ComponentType<{ size?: number }>> = {
  "stress-toolkit": WellnessFigure,
  "sleep-reset": WellnessFigure,
  "exam-stress": LearningFigure,
  "overthinking": PersonalityFigure,
  "get-going": GrowthFigure,
  "kind-to-yourself": WellnessFigure,
};

const MEDIA_ITEMS = [
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
];

const LESSON_FIGURES: Record<string, React.ComponentType<{ size?: number }>> = {
  alarm: WellnessFigure,
  waves: ReadingFigure,
  sigh: BreathingFigure,
  traps: PersonalityFigure,
};

const LESSON_TAGS: Record<string, string> = {
  alarm: "NEUROSCIENCE",
  waves: "EMOTIONS",
  sigh: "BREATHING",
  traps: "CBT SKILLS",
};

export default function Learn() {
  const t = useTheme();
  const state = useStore((s) => s);

  // Compute "Your course" (4 lessons + day 5 review)
  const yourRefs = yourCourse(state, courses);
  let completedDays = 0;
  let nextLessonRef = yourRefs[0];

  for (let i = 0; i < yourRefs.length; i++) {
    const ref = yourRefs[i];
    const done = state.courseProgress?.[ref.course]?.done?.includes(ref.day);
    if (done) {
      completedDays++;
    } else if (!nextLessonRef || state.courseProgress?.[nextLessonRef.course]?.done?.includes(nextLessonRef.day)) {
      nextLessonRef = ref;
    }
  }

  const currentDayIndex = Math.min(5, completedDays + 1);
  const nextCourse = nextLessonRef ? coursesById.get(nextLessonRef.course) : undefined;
  const nextLesson = nextCourse?.days.find((d) => d.day === nextLessonRef.day);

  return (
    <Page>
      <View style={{ gap: space.lg, paddingBottom: space.xl }}>
        {/* Learn Tab Title */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1, gap: space.xs, paddingRight: space.sm }}>
            <T v="display">Learn</T>
            <T soft>Evidence-based mental health skills, tools, and courses.</T>
          </View>
          <LearningFigure size={68} />
        </View>

        {/* "Your Course" Hero Card */}
        <Pressable
          onPress={() => {
            if (nextLessonRef) {
              router.push(`/course/${nextLessonRef.course}/${nextLessonRef.day}`);
            } else {
              router.push("/course/stress-toolkit/1");
            }
          }}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <Frame
            id="personalized-course-card"
            fill
            fillColor={t.raised}
            strokeColor={t.rule}
            style={styles.yourCourseCard}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <View style={[styles.iconCircle, { backgroundColor: t.paper }]}>
                  <DoodleIcon name="sparkles" size={20} color={t.ink} />
                </View>
                <T v="heading">Your personalized course</T>
              </View>
              <T v="small" soft>{`Day ${currentDayIndex} of 5`}</T>
            </View>

            <View style={{ marginTop: space.xs, gap: 2 }}>
              <T v="title">
                {currentDayIndex === 5
                  ? "Review: What helped you most?"
                  : nextLesson?.title ?? "Grounding in the storm"}
              </T>
              <T v="small" soft>
                {currentDayIndex === 5
                  ? "Reflect on the techniques and build your long-term routine."
                  : `From ${nextCourse?.title ?? "Stress toolkit"} · 2–4 min read`}
              </T>
            </View>

            {/* Progress bar */}
            <View style={[styles.progressTrack, { backgroundColor: t.rule, marginTop: space.sm }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: t.ink,
                    width: `${Math.round((completedDays / 5) * 100)}%`,
                  },
                ]}
              />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space.xs }}>
              <T v="small" style={{ color: t.ink, fontWeight: "600" }}>
                {currentDayIndex === 5 ? "Complete day 5 review" : "Continue today's lesson"}
              </T>
              <DoodleIcon name="chevron-right" size={16} color={t.ink} />
            </View>
          </Frame>
        </Pressable>

        {/* Structured Courses with Side Scrolls & Big Thematic Cards */}
        <View style={{ gap: space.md }}>
          <View style={{ gap: 2 }}>
            <T v="display" style={{ fontSize: 20 }}>Structured courses</T>
            <T soft>5-day evidence-based modules designed for university life.</T>
          </View>

          {COURSE_CATEGORIES.map((cat) => {
            const catCourses = cat.courseIds
              .map((id) => coursesById.get(id))
              .filter((c): c is Course => c !== undefined);

            if (catCourses.length === 0) return null;

            return (
              <View key={cat.id} style={{ gap: space.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
                  <DoodleIcon name={cat.icon} size={18} color={t.ink} />
                  <T v="heading">{cat.title}</T>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: space.md, paddingRight: space.md }}
                >
                  {catCourses.map((c) => {
                    const prog = state.courseProgress?.[c.id];
                    const doneCount = prog?.done?.length ?? 0;
                    const icon = CATEGORY_ICONS[c.category] || "book";
                    const FigureComp = COURSE_FIGURES[c.id] ?? LearningFigure;

                    return (
                      <Pressable
                        key={c.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${c.title}, ${c.summary}`}
                        onPress={() => router.push(`/course/${c.id}`)}
                        style={({ pressed }) => [{
                          width: 250,
                          minHeight: 280,
                          opacity: pressed ? 0.8 : 1,
                        }]}
                      >
                        <Frame
                          id={`course-card-${c.id}`}
                          fill
                          fillColor={t.raised}
                          strokeColor={t.rule}
                          style={styles.courseCard}
                        >
                          {/* Top Figure Illustration Area */}
                          <View style={[styles.figureContainer, { backgroundColor: t.paper, borderColor: t.rule }]}>
                            <FigureComp size={125} />
                          </View>

                          {/* Card Content Body */}
                          <View style={{ flex: 1, justifyContent: "space-between", gap: space.xs }}>
                            <View style={{ gap: 4 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                  <DoodleIcon name={icon} size={14} color={t.ink} />
                                  <T v="small" soft style={{ fontWeight: "600", textTransform: "uppercase", fontSize: 10 }}>
                                    {c.category}
                                  </T>
                                </View>
                                {doneCount > 0 ? (
                                  <View style={[styles.doneBadge, { borderColor: t.rule, backgroundColor: t.paper }]}>
                                    <DoodleIcon name="check" size={10} color={t.ink} />
                                    <T v="small" style={{ fontSize: 10, color: t.ink, fontWeight: "600" }}>
                                      {`${doneCount}/${c.days.length}`}
                                    </T>
                                  </View>
                                ) : (
                                  <View style={[styles.badge, { borderColor: t.rule }]}>
                                    <T v="small" soft style={{ fontSize: 9 }}>5 DAYS</T>
                                  </View>
                                )}
                              </View>

                              <T v="heading" numberOfLines={2} style={{ fontSize: 15, lineHeight: 20 }}>
                                {c.title}
                              </T>
                              <T v="small" soft numberOfLines={2} style={{ fontSize: 12, lineHeight: 16 }}>
                                {c.summary}
                              </T>
                            </View>

                            <View style={[styles.cardFooter, { borderTopColor: t.rule }]}>
                              <T v="small" soft style={{ fontSize: 11 }}>
                                {doneCount > 0 ? `${doneCount} of ${c.days.length} done` : `~3 min/day · Guided`}
                              </T>
                              <DoodleIcon name="chevron-right" size={15} color={t.ink2} />
                            </View>
                          </View>
                        </Frame>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            );
          })}
        </View>



        {/* Quick Reads with Side-Scroll Cards */}
        <View style={{ gap: space.sm }}>
          <View style={{ gap: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
              <DoodleIcon name="book" size={18} color={t.ink} />
              <T v="heading" style={{ fontSize: 18 }}>Quick reads</T>
            </View>
            <T soft>Bite-sized, clinically grounded insights for busy students.</T>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: space.md, paddingRight: space.md }}
          >
            {lessons.map((l) => {
              const ReadFig = LESSON_FIGURES[l.id] ?? ReadingFigure;
              const tag = LESSON_TAGS[l.id] ?? "READ";

              return (
                <Pressable
                  key={l.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${l.title}, ${l.sub}`}
                  onPress={() => router.push(`/lesson/${l.id}`)}
                  style={({ pressed }) => [{
                    width: 240,
                    minHeight: 275,
                    opacity: pressed ? 0.8 : 1,
                  }]}
                >
                  <Frame
                    id={`lesson-card-${l.id}`}
                    fill
                    fillColor={t.raised}
                    strokeColor={t.rule}
                    style={styles.courseCard}
                  >
                    <View style={[styles.figureContainer, { backgroundColor: t.paper, borderColor: t.rule }]}>
                      <ReadFig size={120} />
                    </View>

                    <View style={{ flex: 1, justifyContent: "space-between", gap: space.xs }}>
                      <View style={{ gap: 4 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                            <DoodleIcon name="book" size={14} color={t.ink} />
                            <T v="small" soft style={{ fontWeight: "600", fontSize: 10 }}>
                              {tag}
                            </T>
                          </View>
                          <View style={[styles.badge, { borderColor: t.rule }]}>
                            <T v="small" soft style={{ fontSize: 9 }}>~2 MIN</T>
                          </View>
                        </View>

                        <T v="heading" numberOfLines={2} style={{ fontSize: 15, lineHeight: 20 }}>
                          {l.title}
                        </T>
                        <T v="small" soft numberOfLines={2} style={{ fontSize: 12, lineHeight: 16 }}>
                          {l.sub}
                        </T>
                      </View>

                      <View style={[styles.cardFooter, { borderTopColor: t.rule }]}>
                        <T v="small" soft style={{ fontSize: 11 }}>
                          Read lesson
                        </T>
                        <DoodleIcon name="chevron-right" size={15} color={t.ink2} />
                      </View>
                    </View>
                  </Frame>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Support & Settings */}
        <Section title="Support & settings">
          <Row
            icon="phone"
            title="Helplines"
            sub="Free, confidential, 24×7 Tele-MANAS"
            onPress={() => router.push("/help")}
          />
          <Row
            icon="users"
            title="Campus pulse"
            sub="Anonymous averages for your college"
            onPress={() => router.push("/campus")}
          />
          <Row
            icon="settings"
            title="Settings"
            sub="Companion name, theme, your data"
            onPress={() => router.push("/profile/settings")}
            last
          />
        </Section>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  yourCourseCard: {
    padding: space.md,
    gap: space.xs,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
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
  courseCard: {
    padding: space.sm,
    gap: space.xs,
    minHeight: 280,
  },
  figureContainer: {
    height: 105,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: space.xs,
    borderTopWidth: 1,
    marginTop: space.xs,
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
