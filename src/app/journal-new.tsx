import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { newId, update } from "@/lib/store";
import { space } from "@/lib/theme";
import { Button, Choice, Field, Page, T } from "@/lib/ui";

const prompts = [
  "What's taking up the most space in my head?",
  "One thing that went okay today",
  "What would I tell a friend feeling this way?",
  "What am I avoiding, and why?",
  "What do I need right now?",
];

export default function NewEntry() {
  const [prompt, setPrompt] = useState<string>();
  const [text, setText] = useState("");

  const save = () => {
    update((s) => ({ entries: [...s.entries, { id: newId(), at: Date.now(), text: text.trim(), prompt }] }));
    router.back();
  };

  return (
    <Page>
      <View style={{ gap: space.lg }}>
        <View style={{ gap: space.sm }}>
          <T soft>Start anywhere, or pick a prompt.</T>
          {/* One scrollable row: five wrapped chips pushed the field below the keyboard. */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: space.sm, paddingRight: space.md }} style={{ marginHorizontal: -space.md, paddingHorizontal: space.md }}>
            <Choice options={prompts.map((p) => ({ label: p, value: p }))} value={prompt} onChange={(p) => setPrompt(p === prompt ? undefined : p)} nowrap />
          </ScrollView>
        </View>
        <Field value={text} onChangeText={setText} multiline autoFocus placeholder={prompt ?? "Write whatever comes…"} style={{ minHeight: 140 }} accessibilityLabel="Journal entry" />
        <Button label="Save entry" onPress={save} disabled={!text.trim()} />
      </View>
    </Page>
  );
}
