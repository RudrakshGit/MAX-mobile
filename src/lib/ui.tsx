import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type TextStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { radius, serif, serifItalic, space, useTheme } from "./theme";

type Variant = "display" | "title" | "heading" | "body" | "small" | "voice";

export function T({ v = "body", soft, style, children }: { v?: Variant; soft?: boolean; style?: TextStyle; children: ReactNode }) {
  const t = useTheme();
  return <Text style={[styles[v], { color: soft ? t.inkSoft : t.ink }, style]}>{children}</Text>;
}

/** Tab screens draw their own header: big serif title, Help always top right. */
export function Screen({ title, right, children, scroll = true }: { title?: string; right?: ReactNode; children: ReactNode; scroll?: boolean }) {
  const t = useTheme();
  const header = title ? (
    <View style={styles.header}>
      <T v="display" style={{ flex: 1 }}>{title}</T>
      {right}
      <HelpPill />
    </View>
  ) : null;
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: space.md }}>{header}</View>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

/** Pushed screens get the Stack header; this is just their scrolling body. */
export function Page({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function HelpPill() {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Get help now"
      onPress={() => router.push("/help")}
      hitSlop={8}
      style={({ pressed }) => [styles.pill, { backgroundColor: t.help, opacity: pressed ? 0.8 : 1 }]}>
      <Feather name="phone" size={14} color={t.onHelp} />
      <Text style={[styles.pillText, { color: t.onHelp }]}>Help</Text>
    </Pressable>
  );
}

export function Button({ label, onPress, kind = "primary", disabled, icon }: { label: string; onPress: () => void; kind?: "primary" | "accent" | "quiet" | "danger"; disabled?: boolean; icon?: keyof typeof Feather.glyphMap }) {
  const t = useTheme();
  const bg = { primary: t.primary, accent: t.accent, quiet: "transparent", danger: t.help }[kind];
  const fg = { primary: t.onPrimary, accent: t.onAccent, quiet: t.ink, danger: t.onHelp }[kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: kind === "quiet" ? t.line : bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
      ]}>
      {icon ? <Feather name={icon} size={18} color={fg} /> : null}
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/** A row of words to pick from. Words, not emoji: they say what they mean. */
export function Choice<V extends string | number>({ options, value, onChange, fill }: { options: { label: string; value: V }[]; value?: V; onChange: (v: V) => void; fill?: boolean }) {
  const t = useTheme();
  return (
    <View style={[styles.choices, fill && { flexWrap: "nowrap", gap: 6 }]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.choice, fill && { flex: 1, paddingHorizontal: 2, alignItems: "center" }, { borderColor: on ? t.ink : t.line, backgroundColor: on ? t.ink : t.paper }]}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.choiceText, fill && { fontSize: 14 }, { color: on ? t.bg : t.ink }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Table-of-contents row: the app reads like a notebook, not a card grid. */
export function Row({ title, sub, icon, onPress, last }: { title: string; sub?: string; icon?: keyof typeof Feather.glyphMap; onPress: () => void; last?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderBottomColor: t.line, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, opacity: pressed ? 0.6 : 1 }]}>
      {icon ? <Feather name={icon} size={20} color={t.primary} style={{ marginTop: 2 }} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <T v="heading">{title}</T>
        {sub ? <T v="small" soft>{sub}</T> : null}
      </View>
      <Feather name="chevron-right" size={18} color={t.inkSoft} style={{ marginTop: 3 }} />
    </Pressable>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: space.xl, gap: space.sm }}>
      <T v="title">{title}</T>
      <View>{children}</View>
    </View>
  );
}

export function Field(props: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.inkSoft}
      selectionColor={t.accent}
      cursorColor={t.primary}
      {...props}
      style={[styles.field, { color: t.ink, backgroundColor: t.paper, borderColor: t.line, minHeight: props.multiline ? 120 : 48 }, props.style]}
    />
  );
}

export const call = (n: string) => Linking.openURL(`tel:${n.replace(/[^0-9+]/g, "")}`);

/** Fixed, reviewed text. A model never writes or paraphrases this. */
export function CrisisCard() {
  const t = useTheme();
  return (
    <View style={[styles.crisis, { backgroundColor: t.paper, borderColor: t.help }]}>
      <T v="heading">You deserve support right now, from a person.</T>
      <T soft>These lines are free, confidential and open all day and night. If you are in immediate danger, call 112.</T>
      <Button kind="danger" icon="phone" label="Call Tele-MANAS · 14416" onPress={() => call("14416")} />
      <Button kind="quiet" icon="phone" label="Tele-MANAS toll-free · 1-800-891-4416" onPress={() => call("18008914416")} />
      <Button kind="quiet" icon="phone" label="Vandrevala Foundation · 9999666555" onPress={() => call("9999666555")} />
      <Button kind="quiet" label="See all helplines" onPress={() => router.push("/help")} />
    </View>
  );
}

const styles = StyleSheet.create({
  display: { fontFamily: serif, fontSize: 32, lineHeight: 40, letterSpacing: -0.5 },
  title: { fontFamily: serif, fontSize: 22, lineHeight: 30 },
  heading: { fontSize: 17, lineHeight: 24, fontWeight: "600" },
  body: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 14, lineHeight: 20 },
  voice: { fontFamily: serifItalic, fontSize: 17, lineHeight: 27 },
  page: { padding: space.md, paddingBottom: space.xl * 2 },
  header: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingTop: space.md, paddingBottom: space.md },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill },
  pillText: { fontSize: 14, fontWeight: "700" },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm, minHeight: 50, paddingHorizontal: space.lg, borderRadius: radius.pill, borderWidth: 1 },
  buttonText: { fontSize: 16, fontWeight: "600" },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  choice: { paddingHorizontal: 16, minHeight: 44, justifyContent: "center", borderRadius: radius.pill, borderWidth: 1 },
  choiceText: { fontSize: 15, fontWeight: "500" },
  row: { flexDirection: "row", alignItems: "flex-start", gap: space.md, paddingVertical: space.md },
  field: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: 12, fontSize: 16, lineHeight: 22, textAlignVertical: "top" },
  crisis: { borderWidth: 1.5, borderRadius: radius.md, padding: space.md, gap: space.sm },
});
