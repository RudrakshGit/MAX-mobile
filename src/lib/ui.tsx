import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Linking, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type TextStyle } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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
        <KeyboardAwareScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" bottomOffset={24}>
          {header}
          {children}
        </KeyboardAwareScrollView>
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
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.page, { paddingBottom: space.xl + bottom }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bottomOffset={24}>
        {children}
      </KeyboardAwareScrollView>
      {/* The nav bar is transparent (edge-to-edge); without a solid strip, scrolled text runs under the back/home buttons. */}
      <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: bottom, backgroundColor: t.bg }} />
    </View>
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
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: t.help, opacity: pressed ? 0.8 : 1 },
      ]}>
      <Feather name="phone" size={13} color={t.onHelp} />
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
        {
          backgroundColor: bg,
          borderColor: kind === "quiet" ? t.line : bg,
          opacity: disabled ? 0.4 : pressed ? 0.82 : 1,
        },
      ]}>
      {icon ? <Feather name={icon} size={18} color={fg} /> : null}
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/** A row of words to pick from. Tactile pills with clear active states. */
export function Choice<V extends string | number>({ options, value, onChange, fill, nowrap }: { options: { label: string; value: V }[]; value?: V; onChange: (v: V) => void; fill?: boolean; nowrap?: boolean }) {
  const t = useTheme();
  return (
    <View style={[styles.choices, fill && { flexWrap: "nowrap", gap: 6 }, nowrap && { flexWrap: "nowrap" }]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={({ pressed }) => [
              styles.choice,
              fill && { flex: 1, paddingHorizontal: 2, alignItems: "center" },
              {
                borderColor: on ? t.primary : t.line,
                backgroundColor: on ? t.primary : t.paper,
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.choiceText,
                fill && { fontSize: 13 },
                { color: on ? t.onPrimary : t.ink, fontWeight: on ? "600" : "500" },
              ]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Grouped list row with soft circular icon container and tactile press state. */
export function Row({ title, sub, icon, onPress, last }: { title: string; sub?: string; icon?: keyof typeof Feather.glyphMap; onPress: () => void; last?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: t.paper,
          borderColor: t.line,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      {icon ? (
        <View style={[styles.iconCircle, { backgroundColor: t.bg }]}>
          <Feather name={icon} size={18} color={t.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2, justifyContent: "center" }}>
        <T v="heading">{title}</T>
        {sub ? <T v="small" soft>{sub}</T> : null}
      </View>
      <Feather name="chevron-right" size={18} color={t.inkSoft} style={{ alignSelf: "center" }} />
    </Pressable>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: space.lg, gap: space.sm }}>
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
      style={[
        styles.field,
        {
          color: t.ink,
          backgroundColor: t.paper,
          borderColor: t.line,
          minHeight: props.multiline ? 120 : 48,
        },
        props.style,
      ]}
    />
  );
}

export const call = (n: string) => Linking.openURL(`tel:${n.replace(/[^0-9+]/g, "")}`);

/** Fixed, reviewed text. A model never writes or paraphrases this. */
export function CrisisCard() {
  const t = useTheme();
  return (
    <View style={[styles.crisis, { backgroundColor: t.paper, borderColor: t.help }]}>
      <T v="heading" style={{ color: t.help }}>You deserve support right now, from a person.</T>
      <T soft>These lines are free, confidential and open all day and night. If you are in immediate danger, call 112.</T>
      <Button kind="danger" icon="phone" label="Call Tele-MANAS · 14416" onPress={() => call("14416")} />
      <Button kind="quiet" icon="phone" label="Tele-MANAS toll-free · 1-800-891-4416" onPress={() => call("18008914416")} />
      <Button kind="quiet" icon="phone" label="Vandrevala Foundation · 9999666555" onPress={() => call("9999666555")} />
      <Button kind="quiet" label="See all helplines" onPress={() => router.push("/help")} />
    </View>
  );
}

const styles = StyleSheet.create({
  display: { fontFamily: serif, fontSize: 28, lineHeight: 36, letterSpacing: -0.5 },
  title: { fontFamily: serif, fontSize: 20, lineHeight: 28, letterSpacing: -0.2 },
  heading: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  body: { fontSize: 15, lineHeight: 23 },
  small: { fontSize: 13, lineHeight: 18 },
  voice: { fontFamily: serifItalic, fontSize: 17, lineHeight: 26 },
  page: { padding: space.md, paddingBottom: space.xl * 2 },
  header: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingTop: space.sm, paddingBottom: space.md },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  pillText: { fontSize: 13, fontWeight: "700" },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm, minHeight: 48, paddingHorizontal: space.lg, borderRadius: radius.pill, borderWidth: 1 },
  buttonText: { fontSize: 15, fontWeight: "600" },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  choice: { paddingHorizontal: 14, minHeight: 42, justifyContent: "center", borderRadius: radius.pill, borderWidth: 1 },
  choiceText: { fontSize: 14, fontWeight: "500" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, marginBottom: 8 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  field: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 12, fontSize: 15, lineHeight: 22, textAlignVertical: "top" },
  crisis: { borderWidth: 1.5, borderRadius: radius.lg, padding: space.md, gap: space.sm },
});
