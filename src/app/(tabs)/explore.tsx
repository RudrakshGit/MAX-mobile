import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { router, type Href } from "expo-router";
import { SceneShelf, type ShelfItem } from "@/components/scenes/SceneArt";
import { FocusScope } from "@/components/scenes/focus";
import type { SceneName } from "@/components/scenes/scenes";
import { courses, coursesById } from "@/content/courses";
import { categories, instruments } from "@/content/instruments";
import { lessons } from "@/content/learn";
import { yourCourse } from "@/lib/course";
import { useStore } from "@/lib/store";
import { space } from "@/lib/theme";
import { Row, Screen, T } from "@/lib/ui";

// Explore: every self-help thing in one place (docs/history.md, owner's answer 1): quick tools, courses, things to read,
// watch and listen to, and the self-checks. Each card is a picture of MAX's world, a short title and one detail.

const TOOLS: { id: string; href: string; scene: SceneName; title: string; meta: string }[] = [
  { id: "breathe", href: "/tool/breathe", scene: "breathe", title: "Breathing", meta: "1 min" },
  { id: "ground", href: "/tool/ground", scene: "ground", title: "5-4-3-2-1 grounding", meta: "Use your senses" },
  { id: "reframe", href: "/tool/reframe", scene: "reframe", title: "Thought reframe", meta: "A fairer thought" },
  { id: "spiral", href: "/tool/spiral", scene: "spiral", title: "Spiral breaker", meta: "Break the loop" },
  { id: "safety-plan", href: "/tool/safety-plan", scene: "safety", title: "My safety plan", meta: "For hard moments" },
];
const COURSE_SCENES: Record<string, SceneName> = {
  "stress-toolkit": "toolkit",
  "sleep-reset": "sleep",
  "exam-stress": "exam",
  overthinking: "overthinking",
  "get-going": "getgoing",
  "kind-to-yourself": "kind",
};
const LESSON_SCENES: Record<string, SceneName> = { alarm: "alarm", waves: "waves", sigh: "sigh", traps: "traps", "phone-sleep": "phoneSleep", loops: "loops" };
const CHECK_SCENES: Record<string, SceneName> = { wellness: "wellness", growth: "growth", personality: "personality", phone: "phone" };

const go = (href: string) => router.push(href as Href);

// The cards never change while the app runs, so they are built once.
const TOOL_ITEMS: ShelfItem[] = TOOLS.map((x) => ({ key: x.id, scene: x.scene, title: x.title, meta: x.meta, metaIcon: "activity", onPress: () => go(x.href) }));
const COURSE_ITEMS: ShelfItem[] = courses.map((c) => ({
  key: c.id,
  scene: COURSE_SCENES[c.id] ?? "toolkit",
  title: c.title,
  meta: `${c.days.length} days`,
  onPress: () => go(`/course/${c.id}`),
}));
const READ_ITEMS: ShelfItem[] = [
  ...lessons.map((l): ShelfItem => ({ key: l.id, scene: LESSON_SCENES[l.id] ?? "library", title: l.title, meta: "Quick read", metaIcon: "book-open", onPress: () => go(`/lesson/${l.id}`) })),
  { key: "library", scene: "library", title: "Watch and read", meta: "Videos and guides", metaIcon: "tv", onPress: () => go("/library") },
  { key: "sounds", scene: "sounds", title: "Sounds and focus", meta: "Sleep, focus, calm", metaIcon: "music", onPress: () => go("/sounds") },
];
const CHECK_ITEMS: ShelfItem[] = categories.map((c) => ({
  key: c.id,
  scene: CHECK_SCENES[c.id] ?? "wellness",
  title: c.title,
  meta: `${instruments.filter((x) => x.category === c.id).length} checks`,
  metaIcon: "checklist",
  onPress: () => go("/check-yourself"),
}));

function Shelf({ title, items }: { title: string; items: ShelfItem[] }) {
  return (
    <View style={{ gap: space.sm }}>
      <T v="heading">{title}</T>
      <SceneShelf id={title} items={items} />
    </View>
  );
}

export default function Explore() {
  // only what the next-lesson row needs, so other changes in the app don't redraw this page
  const results = useStore((s) => s.results);
  const checkins = useStore((s) => s.checkins);
  const courseProgress = useStore((s) => s.courseProgress);
  const next = useMemo(() => {
    const refs = yourCourse({ results, checkins, courseProgress } as Parameters<typeof yourCourse>[0], courses);
    return refs.find((r) => !courseProgress?.[r.course]?.done?.includes(r.day)) ?? refs[0];
  }, [results, checkins, courseProgress]);
  const nextCourse = next ? coursesById.get(next.course) : undefined;
  const nextLesson = nextCourse?.days.find((d) => d.day === next?.day);

  // The first shelf comes with the page; the rest follow in two small steps, so the page opens at once.
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const a = setTimeout(() => setStage(1), 300);
    const b = setTimeout(() => setStage(2), 700);
    return () => (clearTimeout(a), clearTimeout(b));
  }, []);

  return (
    <FocusScope>
      {(settle) => (
    <Screen title="Explore" onScrollSettled={settle}>
      <View style={{ gap: space.lg, paddingBottom: space.xl }}>
        <Shelf title="Feel better now" items={TOOL_ITEMS} />

        {stage >= 1 && next && nextCourse ? (
          <Row
            icon="sparkles"
            title={nextLesson?.title ?? nextCourse.title}
            sub={`Your next lesson · ${nextCourse.title}, day ${next.day}`}
            onPress={() => go(`/course/${next.course}/${next.day}`)}
            last
          />
        ) : null}

        {stage >= 1 ? <Shelf title="Courses" items={COURSE_ITEMS} /> : null}
        {stage >= 2 ? (
          <>
            <Shelf title="Read, watch, listen" items={READ_ITEMS} />
            <Shelf title="Check yourself" items={CHECK_ITEMS} />
          </>
        ) : null}
      </View>
    </Screen>
      )}
    </FocusScope>
  );
}
