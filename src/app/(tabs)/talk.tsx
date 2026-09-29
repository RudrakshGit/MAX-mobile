import Feather from "@expo/vector-icons/Feather";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";
import { askCompanion } from "@/lib/api";
import { getState, newId, update, useStore, type Msg } from "@/lib/store";
import { radius, space, useTheme } from "@/lib/theme";
import { Button, call, CrisisCard, Screen, T } from "@/lib/ui";
import { classifyRisk } from "@/safety/classifier";
import { suggestFor } from "@/lib/suggest";

const MAX_KEPT = 300;

const starters = ["I can't focus on my studies", "I keep overthinking something", "I feel lonely in the hostel", "I can't sleep"];

export default function Talk() {
  const t = useTheme();
  const companion = useStore((s) => s.companion);
  const messages = useStore((s) => s.messages);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useRef<FlatList<Msg>>(null);
  const { draft } = useLocalSearchParams<{ draft?: string }>();
  useEffect(() => {
    if (draft) setText(draft);
  }, [draft]);

  // Three heavy replies in the last six turns: point towards a person, not just the app.
  const heavy = messages.slice(-12).filter((m) => m.kind === "distress").length >= 3;

  const add = (m: Omit<Msg, "id" | "at">) =>
    update((s) => ({ messages: [...s.messages, { ...m, id: newId(), at: Date.now() }].slice(-MAX_KEPT) }));

  const send = async (raw: string, retry = false) => {
    const said = raw.trim();
    if (!said || busy) return;
    setText("");
    if (retry) update((s) => ({ messages: s.messages.filter((m) => m.kind !== "offline") }));
    else add({ role: "user", text: said });

    // Checked on the phone first: a crisis never waits on the network.
    if (classifyRisk(said).level === "crisis") {
      add({ role: "assistant", text: "", kind: "crisis" });
      return;
    }
    setBusy(true);
    try {
      const r = await askCompanion(getState().messages, companion);
      if (r.kind === "crisis") add({ role: "assistant", text: "", kind: "crisis" });
      else add({ role: "assistant", text: r.text, kind: r.distress ? "distress" : undefined, suggest: suggestFor(said) });
    } catch (e) {
      const text =
        (e as Error).message === "no-server"
          ? "Chat isn't connected in this build yet, so I can't reply. Everything else in the app works offline. Writing it down or a slow breath can help right now."
          : "I couldn't reach the internet just now, so I can't reply. Your message is saved. While you wait, a slow breath or writing it down can help.";
      add({ role: "assistant", text, kind: "offline" });
    } finally {
      setBusy(false);
    }
  };

  const clear = () =>
    Alert.alert("Start fresh?", `This deletes your conversation with ${companion} from this phone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => update(() => ({ messages: [] })) },
    ]);

  const reversed = [...messages].reverse();

  return (
    <Screen
      scroll={false}
      title={companion}
      right={
        messages.length ? (
          <Pressable accessibilityLabel="Start a fresh conversation" onPress={clear} hitSlop={10} style={{ padding: 6 }}>
            <Feather name="rotate-ccw" size={20} color={t.inkSoft} />
          </Pressable>
        ) : null
      }>
      <View style={{ paddingHorizontal: space.md, marginTop: -space.sm, marginBottom: space.sm }}>
        <T v="small" soft>AI companion · not a counsellor · can't handle emergencies</T>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        <FlatList
          ref={list}
          inverted
          data={reversed}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: space.md, gap: space.md, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={busy ? <Typing /> : null}
          ListEmptyComponent={<Welcome name={companion} onPick={send} />}
          renderItem={({ item, index }) => (
            <Bubble
              m={item}
              latest={index === 0}
              heavy={heavy}
              onRetry={() => {
                const lastUser = [...messages].reverse().find((m) => m.role === "user");
                if (lastUser) send(lastUser.text, true);
              }}
            />
          )}
        />
        <View style={{ flexDirection: "row", gap: space.sm, padding: space.sm, paddingHorizontal: space.md, borderTopWidth: 1, borderTopColor: t.line, backgroundColor: t.bg }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={`Message ${companion}…`}
            placeholderTextColor={t.inkSoft}
            selectionColor={t.accent}
            cursorColor={t.primary}
            multiline
            maxLength={2000}
            accessibilityLabel={`Message ${companion}`}
            style={{ flex: 1, maxHeight: 120, minHeight: 48, color: t.ink, backgroundColor: t.paper, borderColor: t.line, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 12, fontSize: 16 }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            disabled={!text.trim() || busy}
            onPress={() => send(text)}
            style={{ width: 48, height: 48, alignSelf: "flex-end", borderRadius: radius.pill, backgroundColor: t.primary, alignItems: "center", justifyContent: "center", opacity: !text.trim() || busy ? 0.4 : 1 }}>
            <Feather name="arrow-up" size={22} color={t.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Bubble({ m, latest, heavy, onRetry }: { m: Msg; latest: boolean; heavy: boolean; onRetry: () => void }) {
  const t = useTheme();
  if (m.kind === "crisis") return <CrisisCard />;
  if (m.role === "user")
    return (
      <View style={{ alignSelf: "flex-end", maxWidth: "85%", backgroundColor: t.userBubble, borderRadius: radius.md, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 }}>
        <T>{m.text}</T>
      </View>
    );
  // The companion writes on the page itself, like a letter, not in a bubble.
  return (
    <View style={{ maxWidth: "92%", gap: space.sm }}>
      <T v="voice">{m.text}</T>
      {m.kind === "offline" && latest ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          <Chip icon="refresh-cw" label="Try again" onPress={onRetry} />
          <Chip icon="wind" label="Breathe for a minute" onPress={() => router.push("/tool/breathe")} />
        </View>
      ) : null}
      {m.kind !== "offline" && (m.suggest?.length || m.kind === "distress") ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {m.suggest?.map((s) => (
            <Chip key={s.href} icon="arrow-right" label={s.label} onPress={() => router.push(s.href as Href)} />
          ))}
          {m.kind === "distress" ? <Chip icon="phone" label="Talk to a person" onPress={() => router.push("/help")} /> : null}
        </View>
      ) : null}
      {latest && heavy && m.kind === "distress" ? (
        <View style={{ padding: space.md, borderRadius: radius.md, backgroundColor: t.paper, borderWidth: 1, borderColor: t.line, gap: space.sm }}>
          <T v="heading">This has been a heavy conversation.</T>
          <T soft>I'm glad you're talking. A real person can carry more of this with you than I can: a friend, family, a counsellor, or Tele-MANAS, free and 24×7.</T>
          <Button kind="danger" icon="phone" label="Call Tele-MANAS · 14416" onPress={() => call("14416")} />
        </View>
      ) : null}
    </View>
  );
}

function Chip({ icon, label, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, minHeight: 40, borderRadius: radius.pill, borderWidth: 1, borderColor: t.line, backgroundColor: t.paper }}>
      <Feather name={icon} size={15} color={t.primary} />
      <T v="small">{label}</T>
    </Pressable>
  );
}

function Typing() {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
      <ActivityIndicator size="small" color={t.inkSoft} />
      <T v="small" soft>Thinking…</T>
    </View>
  );
}

function Welcome({ name, onPick }: { name: string; onPick: (s: string) => void }) {
  return (
    // The list is inverted, so flip the empty state back upright.
    <View style={{ transform: [{ scaleY: -1 }], gap: space.lg, paddingTop: space.md }}>
      <T v="voice">{`Hi, I'm ${name}. I'm here to listen and help you think things through, at any hour. What's on your mind?`}</T>
      <View style={{ gap: space.sm }}>
        {starters.map((s) => (
          <Button key={s} kind="quiet" label={s} onPress={() => onPick(s)} />
        ))}
      </View>
    </View>
  );
}
