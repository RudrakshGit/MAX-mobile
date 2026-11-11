import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, Linking } from "react-native";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { coursesById } from "@/content/courses";
import { resourcesById } from "@/content/resources";
import { logActivity, newId, update, useStore } from "@/lib/store";
import { radius, space, useTheme } from "@/lib/theme";
import { Button, Field, Page, Section, T, call, openWebUrl } from "@/lib/ui";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";
import { Max } from "@/components/max";

export default function LessonScreen() {
  const t = useTheme();
  const { id, day } = useLocalSearchParams<{ id: string; day: string }>();

  const course = id ? coursesById.get(id) : undefined;
  const dayNum = parseInt(day ?? "1", 10);
  const lesson = course?.days.find((d) => d.day === dayNum);

  const progress = useStore((s) => s.courseProgress?.[id ?? ""]);
  const isDone = progress?.done?.includes(dayNum);
  const isUnhelpful = progress?.unhelpful?.includes(dayNum);

  const [writeText, setWriteText] = useState("");
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(
    isUnhelpful ? "no" : isDone ? "yes" : null
  );

  // the day counts as done after it has been read for a while (30 s), or when it is marked
  useEffect(() => {
    if (!id || !dayNum) return;
    const t = setTimeout(() => logActivity("learn", `${id}:${dayNum}`), 30_000);
    return () => clearTimeout(t);
  }, [id, dayNum]);

  if (!course || !lesson) {
    return (
      <Page>
        <Stack.Screen options={{ title: "Lesson" }} />
        <T>Lesson not found.</T>
      </Page>
    );
  }

  const markProgress = (helpful: boolean) => {
    setFeedback(helpful ? "yes" : "no");
    logActivity("learn", `${course.id}:${dayNum}`);
    update((s) => {
      const cur = s.courseProgress[course.id] || { done: [], unhelpful: [] };
      const newDone = Array.from(new Set([...cur.done, dayNum]));
      const newUnhelpful = helpful
        ? cur.unhelpful.filter((d) => d !== dayNum)
        : Array.from(new Set([...cur.unhelpful, dayNum]));
      return {
        courseProgress: {
          ...s.courseProgress,
          [course.id]: { done: newDone, unhelpful: newUnhelpful },
        },
      };
    });
  };

  const watchResource = lesson.watch ? resourcesById.get(lesson.watch) : undefined;
  const nextLesson = course.days.find((d) => d.day === dayNum + 1);

  return (
    <Page>
      <Stack.Screen options={{ title: `Day ${dayNum}` }} />

      <View style={{ gap: space.lg, paddingBottom: space.xl }}>
        {/* Lesson Header */}
        <View style={{ gap: space.xs }}>
          <T v="small" soft>{`Day ${dayNum} of ${course.days.length}`}</T>
          <T v="display">{lesson.title}</T>
        </View>

        {/* Lesson Body */}
        <View style={{ gap: space.md }}>
          {lesson.body.map((para, i) => (
            <T key={i} style={{ fontSize: 17, lineHeight: 28, color: t.ink }}>
              {para}
            </T>
          ))}
        </View>

        {/* Try it now action */}
        <View style={[styles.actionCard, { backgroundColor: t.raised, borderColor: t.rule }]}>
          <T v="heading">Try it now (≤ 2 min)</T>
          {"tool" in lesson.action ? (
            <View style={{ gap: space.sm, marginTop: 4 }}>
              <T soft>
                {lesson.action.tool === "breathe" && "Take a 60-second breathing pause to anchor your nervous system."}
                {lesson.action.tool === "ground" && "Ground your awareness using 5-4-3-2-1 sensory observation."}
                {lesson.action.tool === "reframe" && "Catch a sticky thinking trap and draft a fairer thought."}
                {lesson.action.tool === "spiral" && "Create an if-then action plan to break the anxiety loop."}
                {lesson.action.tool === "safety-plan" && "Review and update your crisis safety plan."}
              </T>
              {(() => {
                const targetTool = lesson.action.tool;
                return (
                  <Button
                    kind="primary"
                    label={`Open ${targetTool === "breathe" ? "breathing tool" : targetTool}`}
                    onPress={() => {
                      const href = targetTool === "safety-plan"
                        ? "/tool/safety-plan"
                        : `/tool/${targetTool}`;
                      router.push(href as Href);
                    }}
                  />
                );
              })()}
            </View>
          ) : (
            <View style={{ gap: space.sm, marginTop: 4 }}>
              <T soft>{lesson.action.write}</T>
              <Field
                value={writeText}
                onChangeText={(v) => (setWriteText(v), setSaved(false))}
                multiline
                maxLength={2000}
                placeholder="Write your brief reflection here..."
                style={{ minHeight: 70 }}
              />
              <Button
                kind="secondary"
                label={saved ? "Saved to your journal" : "Save reflection"}
                disabled={!writeText.trim() || saved}
                onPress={() => {
                  const text = writeText.trim();
                  if (!text || saved) return;
                  // kept as a journal entry, so the student can find it again in Journal
                  const now = Date.now();
                  update((s) => ({
                    entries: [{ id: newId(), at: now, updatedAt: now, feelings: [], influences: [], text, prompt: "write" in lesson.action ? lesson.action.write : undefined }, ...s.entries],
                  }));
                  setSaved(true);
                  markProgress(true);
                }}
              />
            </View>
          )}
        </View>

        {/* Optional Watch Item */}
        {watchResource ? (
          <View style={[styles.watchCard, { backgroundColor: t.paper, borderColor: t.rule }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <DoodleIcon name="play" size={20} color={t.ink} />
              <T v="heading" style={{ flex: 1 }}>Watch companion</T>
              {watchResource.minutes ? (
                <T v="small" soft>{`~${watchResource.minutes} min`}</T>
              ) : null}
            </View>
            <T>{watchResource.title}</T>
            <T v="small" soft>{`By ${watchResource.creator} · ${watchResource.credential}`}</T>
            <Button
              kind="quiet"
              label={watchResource.url.includes("youtube") ? "Watch on YouTube" : "Read resource"}
              onPress={() => {
                if (watchResource.url.includes("youtube.com") || watchResource.url.includes("youtu.be")) {
                  Linking.openURL(watchResource.url).catch(() => openWebUrl(watchResource.url));
                } else {
                  openWebUrl(watchResource.url);
                }
              }}
            />
          </View>
        ) : null}

        {/* Helpfulness feedback */}
        <View style={[styles.feedbackCard, { backgroundColor: t.raised, borderColor: t.rule }]}>
          <T v="heading">Did this help you?</T>
          <View style={{ flexDirection: "row", gap: space.md, marginTop: 4 }}>
            <Button
              kind={feedback === "yes" ? "primary" : "quiet"}
              label="Yes, it helped"
              onPress={() => markProgress(true)}
            />
            <Button
              kind={feedback === "no" ? "danger" : "quiet"}
              label="Not for me"
              onPress={() => markProgress(false)}
            />
          </View>
          {feedback === "yes" ? (
            <View style={{ alignItems: "center", gap: space.xs, marginTop: space.sm }}>
              <Max state="cheer" size={88} />
              <T v="small" soft>✓ Marked complete for today.</T>
            </View>
          ) : feedback === "no" ? (
            <T v="small" soft style={{ marginTop: 4 }}>Got it. We won't recommend this lesson in Your Course again.</T>
          ) : null}
        </View>

        {/* Navigation to next day */}
        {nextLesson ? (
          <Button
            label={`Go to Day ${nextLesson.day}: ${nextLesson.title}`}
            onPress={() => router.replace(`/course/${course.id}/${nextLesson.day}`)}
          />
        ) : (
          <Button
            label="Back to course overview"
            onPress={() => (router.canGoBack() ? router.back() : router.replace(`/course/${course.id}`))}
          />
        )}

        {/* Footer with Attribution and Helpline */}
        <View style={[styles.sourceFooter, { borderColor: t.rule }]}>
          <T v="small" soft>{`Source: ${lesson.source}`}</T>
          <T v="small" soft>{`Licence: ${lesson.licence}`}</T>
          <T v="small" soft>
            {lesson.reviewer
              ? `Reviewed by ${lesson.reviewer}${lesson.reviewedOn ? `, ${lesson.reviewedOn}` : ""}`
              : "Draft: not yet reviewed by a counsellor or psychology faculty member. General skills practice, not treatment."}
          </T>
          <View style={{ height: 1, backgroundColor: t.rule, marginVertical: space.xs }} />
          <T v="small" soft>
            If you are experiencing distress, speak to someone trained and caring:
          </T>
          <Pressable accessibilityRole="button" accessibilityLabel="Call Tele-MANAS, 14416, 24 by 7 national helpline" hitSlop={12} onPress={() => call("14416")} style={{ marginTop: 2 }}>
            <T v="small" style={{ color: t.ink, fontWeight: "600" }}>
              Tele-MANAS: 14416 (24×7 National Helpline)
            </T>
          </Pressable>
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.sm,
  },
  watchCard: {
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.xs,
  },
  feedbackCard: {
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.xs,
  },
  sourceFooter: {
    marginTop: space.md,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
  },
});
