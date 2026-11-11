import { THIS_DEVICE } from "@/lib/platform";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { DateField } from "@/ui/sketch/Wheel";
import { Stack } from "expo-router";
import { dateKey } from "@/lib/personal";
import { refreshReminders } from "@/lib/reminders";
import { newId, tombstone, update, useStore } from "@/lib/store";
import { space, useTheme } from "@/lib/theme";
import { Button, Field, Page, Section, T } from "@/lib/ui";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";

// Exams and big deadlines. MAX uses them to offer the right help in the days before (brain dump, focus
// sessions, the exam course) and, if the student wants, a gentle note the evening before.

const DAY = 86_400_000;
const nice = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

export default function Exams() {
  const t = useTheme();
  const exams = useStore((s) => s.exams);
  const college = useStore((s) => s.college);
  const today = dateKey(new Date());
  const upcoming = exams.filter((e) => e.date >= today);
  const [name, setName] = useState("");
  // the wheel starts a week out (most exams are planned ahead); scroll up for sooner
  const [date, setDate] = useState<string>(() => dateKey(new Date(Date.now() + 7 * DAY)));
  const clean = name.trim().slice(0, 60);
  // exam dates the student's college posted, not yet in their own list
  const fromCollege = (college?.exams ?? []).filter((c) => c.date >= today && !exams.some((e) => e.name === c.name && e.date === c.date));

  const add = () => {
    if (!clean || !date) return;
    update((s) => ({ exams: [...s.exams, { id: newId(), name: clean, date }].sort((a, b) => a.date.localeCompare(b.date)) }));
    setName("");
    setDate(dateKey(new Date(Date.now() + 7 * DAY)));
    void refreshReminders();
  };
  const remove = (id: string) => {
    update((s) => ({ exams: s.exams.filter((e) => e.id !== id), tombstones: tombstone(s, id) }));
    void refreshReminders();
  };

  return (
    <Page>
      <Stack.Screen options={{ title: "Exams" }} />
      <View style={{ gap: space.lg, paddingBottom: space.xl }}>
        <T soft>
          Add exams or big deadlines. In the days before, MAX offers what helps then: a brain dump, a focus session, the exam
          {`stress course. Stays on ${THIS_DEVICE} (and in your backup, if you use one).`}
        </T>

        {upcoming.length ? (
          <Section title="Coming up">
            {upcoming.map((e) => {
              const inDays = Math.round((Date.parse(`${e.date}T12:00:00`) - Date.parse(`${today}T12:00:00`)) / DAY);
              return (
                <View key={e.id} style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: t.rule }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T numberOfLines={1} style={{ fontWeight: "600" }}>{e.name}</T>
                    <T v="small" soft>{`${nice(e.date)} · ${inDays === 0 ? "today" : inDays === 1 ? "tomorrow" : `in ${inDays} days`}`}</T>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${e.name}`} hitSlop={12} onPress={() => remove(e.id)}>
                    <DoodleIcon name="trash-2" size={18} color={t.ink2} />
                  </Pressable>
                </View>
              );
            })}
          </Section>
        ) : null}

        {college && fromCollege.length ? (
          <Section title={`From ${college.name}`}>
            {fromCollege.map((c) => (
              <View key={`${c.name}${c.date}`} style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.xs }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T numberOfLines={1} style={{ fontWeight: "600" }}>{c.name}</T>
                  <T v="small" soft>{nice(c.date)}</T>
                </View>
                <Button kind="secondary" label="Add" onPress={() => { update((s) => ({ exams: [...s.exams, { id: newId(), name: c.name, date: c.date }].sort((a, b) => a.date.localeCompare(b.date)) })); void refreshReminders(); }} />
              </View>
            ))}
          </Section>
        ) : null}

        <Section title="Add an exam or deadline">
          <Field value={name} onChangeText={setName} maxLength={60} placeholder="e.g. Physics mid-sem, DBMS project" accessibilityLabel="Exam name" />
          <T v="small" soft style={{ marginTop: space.sm }}>When?</T>
          <DateField label="Exam date" value={date} onChange={setDate} />
          <View style={{ height: space.sm }} />
          <Button label="Add" icon="plus" onPress={add} disabled={!clean || !date} />
        </Section>
      </View>
    </Page>
  );
}
