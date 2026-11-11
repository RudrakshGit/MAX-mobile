import { useSegments } from "expo-router";
import React, { type ReactNode } from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type TextStyle,
  type TextInputProps,
} from "react-native";
import { router } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { font, radius, space, useTheme } from "./theme";
import { useStore } from "./store";
import { Button as SketchButton } from "@/ui/sketch/Button";
import { Chip as SketchChip } from "@/ui/sketch/Chip";
import { Field as SketchField } from "@/ui/sketch/Field";
import { Frame as SketchFrame } from "@/ui/sketch/Frame";
import { HelpPill as SketchHelpPill } from "@/ui/sketch/HelpPill";
import { DoodleIcon, type DoodleIconName } from "@/ui/icons/DoodleIcon";

type Variant = "display" | "title" | "heading" | "body" | "small" | "voice";

export function T({
  v = "body",
  soft,
  style,
  children,
  numberOfLines,
  fit,
}: {
  fit?: boolean;
  v?: Variant;
  soft?: boolean;
  style?: TextStyle;
  children: ReactNode;
  numberOfLines?: number;
}) {
  const t = useTheme();
  const simple = useStore((s) => s.simpleFont);
  const color = soft ? t.ink2 : t.ink;

  let fontFamily: string = font.body;
  if (v === "display" || v === "title" || v === "heading") {
    fontFamily = font.headline;
  } else if (v === "voice") {
    fontFamily = simple ? font.body : font.handwritten;
  }

  return (
    <Text
      // the web can't shrink text to fit, so there a long title wraps instead of being cut off
      numberOfLines={fit ? (Platform.OS === "web" ? 2 : 1) : numberOfLines}
      adjustsFontSizeToFit={fit && Platform.OS !== "web"}
      minimumFontScale={fit && Platform.OS !== "web" ? 0.7 : undefined}
      style={[styles[v], { color, fontFamily }, style, fit && Platform.OS === "web" ? { fontSize: 22, lineHeight: 28 } : null]}>
      {children}
    </Text>
  );
}

/** Paper grain texture layer */
export function PaperGrain() {
  const t = useTheme();
  const { width, height } = useWindowDimensions();
  return (
    // clipped to its screen: on the web a grain taller than the screen made the page scroll (Talk's header slid away)
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}>
      <Image
        source={require("../../assets/paper-grain-tall.png")}
        // Explicit size: on Android a fill-sized Image with resizeMode="repeat" drew one small patch (audit F18),
        // so the tile is pre-tiled into one tall image and stretched over the whole window.
        style={{ position: "absolute", top: 0, left: 0, width, height, opacity: t.grainOpacity }}
        resizeMode="stretch"
        fadeDuration={0}
      />
    </View>
  );
}

/** Tab screens draw their own header: big title, Help always top right. */
export function Screen({
  title,
  left,
  right,
  children,
  scroll = true,
  onScrollSettled,
}: {
  title?: string;
  left?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  /** called once the page stops scrolling (drag released, fling finished) */
  onScrollSettled?: () => void;
}) {
  const t = useTheme();
  // On tabs the screen draws its own big title and Help pill. On pushed screens the native header already
  // shows the title and the Help pill (see _layout.tsx), so only the optional left/right actions are drawn.
  const seg = useSegments()[0];
  const pushed = seg !== "(tabs)" && seg !== "onboarding"; // onboarding has no native header either
  const header = pushed ? (
    left || right ? (
      <View style={[styles.header, { justifyContent: "flex-end" }]}>
        {left}
        <View style={{ flex: 1 }} />
        {right}
      </View>
    ) : null
  ) : title ? (
    <View style={styles.header}>
      {left}
      <T v="display" fit style={{ flex: 1 }}>{title}</T>
      {right}
      <HelpPill />
    </View>
  ) : null;

  return (
    // no background here: the navigator already paints paper under every screen (overdraw, M16 follow-up)
    <SafeAreaView edges={pushed ? [] : ["top"]} style={{ flex: 1 }}>
      <PaperGrain />
      {scroll ? (
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
          // a fling's end is the settle; a drag released without a fling settles too (the scope waits a moment)
          onScrollEndDrag={onScrollSettled}
          onMomentumScrollEnd={onScrollSettled}
          bottomOffset={24}>
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
    <View style={{ flex: 1 }}>
      <PaperGrain />
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.page, { paddingBottom: space.xl + bottom }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bottomOffset={24}>
        {children}
      </KeyboardAwareScrollView>
      {/* Edge-to-edge protective ground for system nav bar */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: bottom,
          backgroundColor: t.paper,
        }}
      />
    </View>
  );
}

export function HelpPill() {
  return <SketchHelpPill />;
}

export function Button({
  label,
  onPress,
  kind = "primary",
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  kind?: "primary" | "secondary" | "accent" | "quiet" | "danger";
  disabled?: boolean;
  icon?: DoodleIconName | string | ReactNode;
}) {
  const iconNode =
    typeof icon === "string" ? (
      <DoodleIcon name={icon as DoodleIconName} size={18} />
    ) : (
      icon
    );

  return (
    <SketchButton
      label={label}
      onPress={onPress}
      kind={kind}
      disabled={disabled}
      icon={iconNode}
    />
  );
}

/** A row of options to pick from rendered as hand-drawn Chips. */
export function Choice<V extends string | number>({
  options,
  value,
  onChange,
  fill,
  nowrap,
}: {
  options: { label: string; value: V }[];
  value?: V;
  onChange: (v: V) => void;
  fill?: boolean;
  nowrap?: boolean;
}) {
  // with large text a filled row would break words inside the chips ("badl/y"), so the chips wrap instead
  const { fontScale } = useWindowDimensions();
  const even = fill && fontScale <= 1.3;
  return (
    <View style={[styles.choices, even && { flexWrap: "nowrap", gap: 6 }, nowrap && { flexWrap: "nowrap" }]}>
      {options.map((o) => (
        <View key={String(o.value)} style={even ? { flex: 1 } : undefined}>
          <SketchChip
            id={`choice-${o.value}`}
            label={o.label}
            selected={o.value === value}
            onPress={() => onChange(o.value)}
          />
        </View>
      ))}
    </View>
  );
}

/** Grouped list row with doodle icons and wobbly sketch container. */
export function Row({
  title,
  sub,
  icon,
  onPress,
}: {
  title: string;
  sub?: string;
  icon?: DoodleIconName | string;
  onPress: () => void;
  last?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        { opacity: pressed ? 0.75 : 1, marginBottom: 8 },
      ]}>
      <SketchFrame id={`row-${title}`} fill fillColor={t.raised} strokeColor={t.rule} style={styles.row}>
        {icon ? (
          <View style={[styles.iconCircle, { backgroundColor: t.paper }]}>
            <DoodleIcon name={icon as DoodleIconName} size={18} color={t.ink} />
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 2, justifyContent: "center" }}>
          <T v="heading">{title}</T>
          {sub ? <T v="small" soft>{sub}</T> : null}
        </View>
        <DoodleIcon name="chevron-right" size={18} color={t.ink2} style={{ alignSelf: "center" }} />
      </SketchFrame>
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

export function Field(props: TextInputProps & { label?: string; error?: string }) {
  return <SketchField {...props} />;
}

/** Opens the dialer. On a tablet or a phone without one, the number is shown instead, so the button never does nothing. */
export const call = async (n: string) => {
  const digits = n.replace(/[^0-9+]/g, "");
  try {
    await Linking.openURL(`tel:${digits}`);
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { showAlert } = require("./dialog") as typeof import("./dialog");
    showAlert("Call this number", `This phone can't start the call. Dial ${n} from another phone.`);
  }
};

export const openWebUrl = async (url: string) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WebBrowser = require("expo-web-browser");
    if (WebBrowser?.openBrowserAsync) {
      await WebBrowser.openBrowserAsync(url);
      return;
    }
  } catch {}
  Linking.openURL(url);
};

/** Fixed, reviewed text. A model never writes or paraphrases this. */
export function CrisisCard() {
  const t = useTheme();
  return (
    <SketchFrame id="crisis-card" fill fillColor={t.raised} strokeColor={t.help} strokeWidth={2} style={styles.crisis}>
      <T v="heading" style={{ color: t.help }}>You deserve support right now, from a person.</T>
      <T soft>These lines are free, confidential and open all day and night. If you are in immediate danger, call 112.</T>
      <Button kind="danger" icon="phone" label="Call Tele-MANAS · 14416" onPress={() => call("14416")} />
      <Button kind="quiet" icon="shield" label="Open my safety plan" onPress={() => router.push("/tool/safety-plan")} />
      <Button kind="quiet" icon="phone" label="Tele-MANAS toll-free · 1-800-891-4416" onPress={() => call("18008914416")} />
      <Button kind="quiet" icon="phone" label="Vandrevala Foundation · 9999666555" onPress={() => call("9999666555")} />
      <Button kind="quiet" label="See all helplines" onPress={() => router.push("/help")} />
    </SketchFrame>
  );
}

const styles = StyleSheet.create({
  display: {
    fontFamily: font.headline,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: font.headline,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  heading: {
    fontFamily: font.headline,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  body: {
    fontFamily: font.body,
    fontSize: 15,
    lineHeight: 23,
  },
  small: {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 18,
  },
  voice: {
    fontFamily: font.handwritten,
    fontSize: 17,
    lineHeight: 26,
  },
  page: {
    padding: space.md,
    paddingBottom: space.xl * 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  choices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  crisis: {
    padding: space.md,
    gap: space.sm,
  },
});
