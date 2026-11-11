import { THIS_DEVICE } from "@/lib/platform";
import { router, Stack, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { byId } from "@/content/instruments";
import { update, useStore } from "@/lib/store";
import { dateKey, whatHelps } from "@/lib/personal";
import { font, radius, space, useTheme } from "@/lib/theme";
import { Button, Page, Row, Section, T } from "@/lib/ui";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";
import { Avatar } from "@/ui/Avatar";

export default function Profile() {
  const t = useTheme();
  const companion = useStore((s) => s.companion);
  const collegeName = useStore((s) => (s.college && !s.college.gone ? s.college.name : undefined));
  const results = useStore((s) => s.results);
  const checkins = useStore((s) => s.checkins);
  const insights = useStore((s) => s.insights);
  const displayName = useStore((s) => s.displayName);
  const helped = useStore((s) => s.helped);
  const exams = useStore((s) => s.exams);
  const syncEmail = useStore((s) => s.sync?.email);
  const helps = whatHelps(helped);
  const todayKey = dateKey(new Date());
  const nextUp = exams.find((e) => e.date >= todayKey);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayName ?? "");

  const handleSaveName = () => {
    update((s) => ({ ...s, displayName: nameInput.trim() }));
    setEditingName(false);
  };

  const latestTests = ["phq9", "gad7", "cbi", "tech"]
    .map((id) => results.filter((r) => r.checkup === id).at(-1))
    .filter((r) => !!r);

  return (
    <Page>
      <Stack.Screen options={{ title: "Profile" }} />

      {/* Profile Header */}
      <View style={{ alignItems: "center", marginVertical: space.md, gap: space.sm }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change avatar"
          onPress={() => router.push("/profile/avatar")}
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            borderWidth: 2,
            borderColor: t.ink,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: t.raised,
            overflow: "hidden",
          }}>
          <Avatar size={80} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
          onPress={() => router.push("/profile/avatar")}>
          <T v="small" soft style={{ textDecorationLine: "underline" }}>
            Change avatar
          </T>
        </Pressable>

        {/* Editable Name */}
        {editingName ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs, marginTop: space.xs }}>
            <TextInput
              value={nameInput}
              maxLength={30}
              onChangeText={setNameInput}
              placeholder="Enter your name"
              placeholderTextColor={t.hair}
              autoFocus
              style={{
                fontFamily: font.headline,
                fontSize: 18,
                color: t.ink,
                borderBottomWidth: 1.5,
                borderBottomColor: t.ink,
                paddingHorizontal: space.xs,
                paddingVertical: 2,
                minWidth: 140,
                textAlign: "center",
              }}
            />
            <Button kind="accent" label="Save" onPress={handleSaveName} />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit display name"
            hitSlop={12}
            onPress={() => {
              setNameInput(displayName ?? "");
              setEditingName(true);
            }}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <T v="title">{displayName ? displayName : "Friend"}</T>
            <DoodleIcon name="edit" size={16} color={t.ink2} />
          </Pressable>
        )}

        <T soft v="small">
          {companion ? `Friend of ${companion}` : "Friend"}
          {collegeName ? ` · ${collegeName}` : ""}
        </T>
      </View>

      {/* Wellbeing & Activity */}
      <Section title="Your activity">
        <Row
          icon="calendar"
          title="Mood & check-ins"
          sub={`${checkins.length} ${checkins.length === 1 ? "check-in" : "check-ins"} · calendar & distribution`}
          onPress={() => router.push("/profile/mood")}
        />
        <Row
          icon="sparkles"
          title="Personal reflections"
          sub={`${insights.length} ${insights.length === 1 ? "reflection" : "reflections"} saved`}
          onPress={() => router.push("/profile/insights" as Href)}
        />
        <Row
          icon="checklist"
          title="Tests taken"
          sub={results.length === 0 ? `None yet — your results stay on ${THIS_DEVICE}` : `${results.length} ${results.length === 1 ? "check-up" : "check-ups"} on this phone`}
          onPress={() => router.push("/check-yourself")}
          last={latestTests.length === 0}
        />
      </Section>

      {/* Latest test screening bands */}
      {latestTests.length > 0 ? (
        <Section title="Latest check-up bands">
          <View
            style={{
              padding: space.md,
              borderRadius: radius.lg,
              backgroundColor: t.paper,
              borderWidth: 1,
              borderColor: t.rule,
              gap: space.sm,
            }}>
            {latestTests.map((r) => (
              <View
                key={r.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 4,
                }}>
                <T>{byId[r.checkup]?.short ?? r.checkup}</T>
                <T soft v="small">
                  {r.band ? `${r.band} (Score ${r.score})` : `Score ${r.score}`}
                </T>
              </View>
            ))}
            <T v="small" soft style={{ marginTop: space.xs }}>
              Screening ranges, never diagnoses.
            </T>
          </View>
        </Section>
      ) : null}

      {/* Settings & Support */}
      <Section title="What helps you">
        {helps.length ? (
          <View style={{ gap: space.xs }}>
            {helps.slice(0, 5).map((h) => (
              <View key={h.tool} style={{ flexDirection: "row", justifyContent: "space-between", gap: space.sm }}>
                <T style={{ flexShrink: 1 }}>{h.name}</T>
                <T soft style={{ flexShrink: 0 }}>{`helped ${h.yes} of ${h.total}`}</T>
              </View>
            ))}
            <T v="small" soft>From your "Did that help?" answers. MAX offers these first.</T>
          </View>
        ) : (
          <T soft>After a breathing reset, grounding or a focus session, MAX asks "Did that help?". Your answers build this list, and MAX offers what works for you first.</T>
        )}
      </Section>

      <Section title="Plans">
        <Row
          icon="calendar"
          title="Exams & deadlines"
          sub={nextUp ? `Next: ${nextUp.name}, ${new Date(`${nextUp.date}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "Add them and MAX helps in the days before"}
          onPress={() => router.push("/profile/exams" as Href)}
        />
        <Row
          icon="cloud"
          title="Backup"
          sub={syncEmail ? `Backed up as ${syncEmail}` : "Optional: keep a copy with your Google account"}
          onPress={() => router.push("/profile/account" as Href)}
          last
        />
      </Section>

      <Section title="Settings & Support">
        <Row
          icon="settings"
          title="Settings"
          sub="Reminders, simple font, security lock, storage"
          onPress={() => router.push("/profile/settings")}
        />
        <Row
          icon="phone"
          title="Helplines & support"
          sub="Free, confidential, 24×7 crisis help"
          onPress={() => router.push("/help")}
        />
        <Row
          icon="heart"
          title="About these tests"
          sub="Validated clinical sources & CC licences"
          onPress={() => router.push("/tests-about")}
          last
        />
      </Section>
    </Page>
  );
}
