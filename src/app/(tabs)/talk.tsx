import { DoodleIcon, type DoodleIconName } from "@/ui/icons/DoodleIcon";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { askCompanion } from "@/lib/api";
import { activeChat, addMessage, getState, startChat, update, useStore, type Msg } from "@/lib/store";
import { radius, space, useTheme } from "@/lib/theme";
import { Button, call, CrisisCard, Screen, T } from "@/lib/ui";
import { classifyRisk } from "@/safety/classifier";
import { suggestFor } from "@/lib/suggest";
import { extractTestChip } from "@/lib/reply";
import { Max } from "@/components/max";
import { Frame } from "@/ui/sketch/Frame";
import { Chip as SketchChip } from "@/ui/sketch/Chip";
import { setContextEmotion } from "@/lib/max-store";

const TEST_CHIP_NAMES: Record<string, string> = {
  phq9: "Low mood check (PHQ-9)",
  gad7: "Worry check (GAD-7)",
  pswq: "Worry check (PSWQ)",
  sci: "Sleep check (SCI)",
  loneliness3: "Loneliness check",
  miniIpip: "Personality (Mini-IPIP)",
  onetMiniIp: "Interests (O*NET)",
  saps: "Perfectionism (SAPS)",
  brs: "Resilience (BRS)",
  rses: "Self-esteem (RSES)",
  who5: "Well-being (WHO-5)",
  bas2: "Body appreciation (BAS-2)",
  tech: "Tech-stress check",
};

const starters = ["I can't focus on my studies", "I keep overthinking something", "I feel lonely in the hostel", "I can't sleep"];

export default function Talk() {
  const t = useTheme();
  const companion = useStore((s) => s.companion);
  const chat = useStore(activeChat);
  const messages = chat?.messages ?? [];
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useRef<FlatList<Msg>>(null);
  const { draft, n } = useLocalSearchParams<{ draft?: string; n?: string }>();
  useEffect(() => {
    if (draft) setText(draft);
  }, [draft, n]);

  useEffect(() => {
    if (busy) {
      setContextEmotion("thinking");
    } else {
      setContextEmotion(null);
    }
    return () => {
      setContextEmotion(null);
    };
  }, [busy]);

  // Three heavy replies in the last six turns: point towards a person, not just the app.
  const heavy = messages.slice(-12).filter((m) => m.kind === "distress").length >= 3;

  const send = async (raw: string, retry = false) => {
    const said = raw.trim();
    if (!said || busy) return;
    setText("");

    const chatId = activeChat(getState())?.id ?? startChat();

    if (retry) {
      update((s) => ({
        chats: s.chats.map((c) =>
          c.id === chatId ? { ...c, messages: c.messages.filter((m) => m.kind !== "offline") } : c
        ),
      }));
    } else {
      addMessage(chatId, { role: "user", text: said });
    }

    // Checked on the phone first: a crisis never waits on the network.
    if (classifyRisk(said).level === "crisis") {
      addMessage(chatId, { role: "assistant", text: "", kind: "crisis" });
      return;
    }
    setBusy(true);
    try {
      const currentMessages = activeChat(getState())?.messages ?? [];
      const r = await askCompanion(currentMessages, companion);
      if (r.kind === "crisis") {
        addMessage(chatId, { role: "assistant", text: "", kind: "crisis" });
      } else {
        const { text: cleanReply, testId } = extractTestChip(r.text, Object.keys(TEST_CHIP_NAMES));
        const suggestions = suggestFor(said);
        if (testId) {
          suggestions.push({
            label: TEST_CHIP_NAMES[testId] ?? "Self-test",
            href: `/test/${testId}`,
          });
        }
        addMessage(chatId, {
          role: "assistant",
          text: cleanReply,
          kind: r.distress ? "distress" : undefined,
          suggest: suggestions.length > 0 ? suggestions : undefined,
          emotions: r.emotions,
        });
      }
    } catch (e) {
      const errText =
        (e as Error).message === "no-server"
          ? "Chat isn't connected in this build yet, so I can't reply. Everything else in the app works offline. Writing it down or a slow breath can help right now."
          : "I couldn't reach the internet just now, so I can't reply. Your message is saved. While you wait, a slow breath or writing it down can help.";
      addMessage(chatId, { role: "assistant", text: errText, kind: "offline" });
    } finally {
      setBusy(false);
    }
  };

  const reversed = [...messages].reverse();

  return (
    <Screen
      scroll={false}
      title={companion}
      left={
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginRight: space.xs }}>
          <Pressable accessibilityLabel="Back" onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}>
            <DoodleIcon name="arrow-left" size={20} color={t.ink} />
          </Pressable>
          {messages.length > 0 ? <Max state={busy ? "thinking" : "idle"} size={34} boil /> : null}
        </View>
      }
      right={
        <Pressable accessibilityLabel="Conversations" onPress={() => router.push("/chats")} hitSlop={10} style={{ padding: 6 }}>
          <DoodleIcon name="message-square" size={20} color={t.ink2} />
        </Pressable>
      }>
      <View style={{ paddingHorizontal: space.md, marginTop: -space.sm, marginBottom: space.sm }}>
        <T v="small" soft>AI companion · not a counsellor · can't handle emergencies</T>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" automaticOffset>
        {messages.length === 0 ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: space.md, gap: space.md, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled">
            <Welcome name={companion} onPick={send} />
          </ScrollView>
        ) : (
          <FlatList
            ref={list}
            inverted
            data={reversed}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: space.md, gap: space.md }}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={busy ? <Typing /> : null}
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
        )}
        <View style={{ flexDirection: "row", gap: space.sm, padding: space.sm, paddingHorizontal: space.md, borderTopWidth: 1, borderTopColor: t.rule, backgroundColor: t.paper }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={`Message ${companion}…`}
            placeholderTextColor={t.ink2}
            selectionColor={t.ink}
            cursorColor={t.ink}
            multiline
            maxLength={2000}
            accessibilityLabel={`Message ${companion}`}
            style={{ flex: 1, maxHeight: 120, minHeight: 46, color: t.ink, backgroundColor: t.paper, borderColor: t.rule, borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: space.md, paddingVertical: 10, fontSize: 15 }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            disabled={!text.trim() || busy}
            onPress={() => send(text)}
            style={({ pressed }) => [
              { width: 46, height: 46, alignSelf: "flex-end", borderRadius: radius.pill, backgroundColor: t.ink, alignItems: "center", justifyContent: "center", opacity: !text.trim() || busy ? 0.4 : pressed ? 0.8 : 1 }
            ]}>
            <DoodleIcon name="arrow-up" size={20} color={t.inverseInk} />
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
      <View style={{ alignSelf: "flex-end", maxWidth: "85%", backgroundColor: t.raised, borderRadius: radius.lg, borderBottomRightRadius: 4, paddingHorizontal: 16, paddingVertical: 12 }}>
        <T>{m.text}</T>
      </View>
    );
  // Soft, calming companion card
  return (
    <View style={{ alignSelf: "flex-start", maxWidth: "92%", backgroundColor: t.paper, borderRadius: radius.lg, borderTopLeftRadius: 4, borderWidth: 1, borderColor: t.rule, padding: space.md, gap: space.sm }}>
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
            <Chip key={s.href} icon={s.href.startsWith("/test/") ? "checklist" : "arrow-right"} label={s.label} onPress={() => router.push(s.href as Href)} />
          ))}
          {m.kind === "distress" ? <Chip icon="phone" label="Talk to a person" onPress={() => router.push("/help")} /> : null}
        </View>
      ) : null}
      {latest && heavy && m.kind === "distress" ? (
        <Frame id="heavy-card" fill fillColor={t.paper} strokeColor={t.rule} style={{ padding: space.md, gap: space.sm }}>
          <T v="heading">This has been a heavy conversation.</T>
          <T soft>I'm glad you're talking. A real person can carry more of this with you than I can: a friend, family, a counsellor, or Tele-MANAS, free and 24×7.</T>
          <Button kind="danger" icon="phone" label="Call Tele-MANAS · 14416" onPress={() => call("14416")} />
        </Frame>
      ) : null}
    </View>
  );
}

function Chip({ icon, label, onPress }: { icon: DoodleIconName | string; label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <SketchChip
      id={`suggest-${label}`}
      label={label}
      selected={false}
      onPress={onPress}
      icon={<DoodleIcon name={icon as DoodleIconName} size={15} color={t.ink} />}
    />
  );
}

function Typing() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
      <Max state="thinking" size={48} />
      <T v="small" soft>Thinking…</T>
    </View>
  );
}

function Welcome({ name, onPick }: { name: string; onPick: (s: string) => void }) {
  return (
    <View style={{ gap: space.md, paddingTop: space.md, alignItems: "center" }}>
      <Max state="wave" size={130} boil />
      <T v="voice" style={{ textAlign: "center" }}>{`Hi, I'm ${name}. I'm here to listen and help you think things through, at any hour. What's on your mind?`}</T>
      <View style={{ gap: space.sm, width: "100%", marginTop: space.xs }}>
        {starters.map((s) => (
          <Button key={s} kind="quiet" label={s} onPress={() => onPick(s)} />
        ))}
      </View>
    </View>
  );
}
