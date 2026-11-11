import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import * as Haptics from "expo-haptics";
import { font, space, useTheme } from "@/lib/theme";
import { Button, T } from "@/lib/ui";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";
import { Frame } from "./Frame";

// Numbers, times and dates (owner: no rows of buttons for these). On a page they show as a field with the value;
// a tap opens a sheet with scroll wheels and Done, like Android's own time picker. Wheels never sit open on a page
// that scrolls, so scrolling the page can't change a value by accident. Flick or drag a wheel and it settles on the
// middle row with a light tick as each value passes; TalkBack: swipe up or down to change it (adjustable).

const ROW = 40;
const VISIBLE = 5;

export interface WheelItem<V> {
  label: string;
  value: V;
}

export function Wheel<V extends string | number>({
  items,
  value,
  onChange,
  label,
  width = 96,
}: {
  items: WheelItem<V>[];
  value: V;
  onChange: (v: V) => void;
  /** What it picks, for screen readers ("Hour"). */
  label: string;
  width?: number;
}) {
  const t = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);
  const placed = useRef(false);
  const index = Math.max(0, items.findIndex((x) => x.value === value));
  const scrollY = useRef(new Animated.Value(index * ROW)).current;
  const shown = useRef(index);
  const settled = useRef(index);

  // follow a value changed from outside (another wheel, a reset)
  useEffect(() => {
    if (index !== settled.current) {
      settled.current = index;
      shown.current = index;
      ref.current?.scrollTo({ y: index * ROW, animated: false });
    }
  }, [index]);

  const at = (y: number) => Math.min(items.length - 1, Math.max(0, Math.round(y / ROW)));
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const i = at(e.nativeEvent.contentOffset.y);
          if (i !== shown.current) {
            shown.current = i;
            Haptics.selectionAsync().catch(() => {});
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.length],
  );
  const settle = (y: number) => {
    const i = at(y);
    if (i !== settled.current) {
      settled.current = i;
      onChange(items[i].value);
    }
  };
  const step = (d: number) => {
    const i = Math.min(items.length - 1, Math.max(0, settled.current + d));
    ref.current?.scrollTo({ y: i * ROW, animated: true });
    settled.current = i;
    shown.current = i;
    onChange(items[i].value);
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: items[index]?.label }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === "increment" ? 1 : -1)}
      style={{ width, height: ROW * VISIBLE }}>
      {/* the middle row, between two hand lines */}
      <View pointerEvents="none" style={{ position: "absolute", left: 4, right: 4, top: ROW * 2, height: ROW, borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: t.rule }} />
      <Animated.ScrollView
        ref={ref}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ROW * 2 }}
        onLayout={() => {
          if (!placed.current) {
            placed.current = true;
            ref.current?.scrollTo({ y: index * ROW, animated: false });
          }
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => settle(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          // a slow drag with no fling never sends momentum end
          const v = e.nativeEvent.velocity?.y ?? 0;
          if (Math.abs(v) < 0.05) settle(e.nativeEvent.contentOffset.y);
        }}>
        {items.map((item, i) => (
          <Animated.View
            key={String(item.value)}
            style={{
              height: ROW,
              alignItems: "center",
              justifyContent: "center",
              opacity: scrollY.interpolate({
                inputRange: [(i - 2) * ROW, (i - 1) * ROW, i * ROW, (i + 1) * ROW, (i + 2) * ROW],
                outputRange: [0.2, 0.45, 1, 0.45, 0.2],
                extrapolate: "clamp",
              }),
            }}>
            <T style={{ fontSize: 18, lineHeight: 24, fontFamily: font.bodyBold }}>{item.label}</T>
          </Animated.View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

// ---- time: hour · minute · am/pm, stored as "HH:MM" (24 h) ----

const HOURS: WheelItem<number>[] = Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));
const MERIDIEM: WheelItem<string>[] = [
  { label: "am", value: "am" },
  { label: "pm", value: "pm" },
];

export function TimeWheel({ value, onChange, minuteStep = 5, label }: { value: string; onChange: (hhmm: string) => void; minuteStep?: number; label: string }) {
  const minutes = useMemo<WheelItem<number>[]>(
    () => Array.from({ length: 60 / minuteStep }, (_, i) => ({ label: String(i * minuteStep).padStart(2, "0"), value: i * minuteStep })),
    [minuteStep],
  );
  const h24 = Number(value.slice(0, 2)) || 0;
  const m = Math.round((Number(value.slice(3, 5)) || 0) / minuteStep) * minuteStep % 60;
  const pm = h24 >= 12;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const emit = (hour12: number, minute: number, isPm: boolean) => {
    const h = (hour12 % 12) + (isPm ? 12 : 0);
    onChange(`${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.xs }}>
      <Wheel label={`${label}, hour`} items={HOURS} value={h12} onChange={(h) => emit(h, m, pm)} width={72} />
      <T style={{ fontSize: 20, fontFamily: font.bodyBold }}>:</T>
      <Wheel label={`${label}, minutes`} items={minutes} value={m} onChange={(mm) => emit(h12, mm, pm)} width={72} />
      <Wheel label={`${label}, am or pm`} items={MERIDIEM} value={pm ? "pm" : "am"} onChange={(x) => emit(h12, m, x === "pm")} width={72} />
    </View>
  );
}

// ---- date: one wheel of the coming days, stored as "YYYY-MM-DD" ----

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function DateWheel({ value, onChange, days = 365, label, from = 0 }: { value?: string; onChange: (ymd: string) => void; days?: number; label: string; from?: number }) {
  const items = useMemo<WheelItem<string>[]>(() => {
    const out: WheelItem<string>[] = [];
    const now = new Date();
    for (let i = from; i < from + days; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const name = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
      out.push({ label: name, value: ymd(d) });
    }
    return out;
  }, [days, from]);
  return <Wheel label={label} items={items} value={value && items.some((x) => x.value === value) ? value : items[0].value} onChange={onChange} width={200} />;
}

// ---- the field on the page, and the sheet with the wheels ----

export function PickerField<V>({
  label,
  value,
  text,
  onChange,
  picker,
}: {
  /** What it picks ("Reminder time"), shown above the wheels and read by screen readers. */
  label: string;
  value: V;
  /** The value as words on the field ("9:00 pm"). */
  text: string;
  onChange: (v: V) => void;
  /** The wheels for a draft value; nothing changes until Done. */
  picker: (draft: V, setDraft: (v: V) => void) => React.ReactNode;
}) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const show = () => (setDraft(value), setOpen(true));
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${text}. Change`}
        onPress={show}
        style={({ pressed }) => ({
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
          minHeight: 48,
          paddingHorizontal: space.md,
          borderWidth: 1.5,
          borderRadius: 12,
          borderColor: t.rule,
          backgroundColor: t.raised,
          opacity: pressed ? 0.75 : 1,
        })}>
        <T style={{ fontSize: 18, fontFamily: font.bodyBold }}>{text}</T>
        <DoodleIcon name="edit-3" size={16} color={t.ink2} />
      </Pressable>
      {open ? (
        <Modal transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={() => setOpen(false)}>
          {/* the dim backdrop is a sibling of the sheet, so a screen reader still reads the sheet's own words */}
          <View style={{ flex: 1, justifyContent: "flex-end", padding: space.md, paddingBottom: space.xl }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setOpen(false)} style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }]} />
              <Frame id="picker-sheet" fill fillColor={t.paper} strokeColor={t.ink} strokeWidth={2} style={{ padding: space.lg, gap: space.md }}>
                <T v="heading">{label}</T>
                <View style={{ alignItems: "center" }}>{picker(draft, setDraft)}</View>
                <View style={{ flexDirection: "row", gap: space.sm }}>
                  <View style={{ flex: 1 }}>
                    <Button kind="quiet" label="Cancel" onPress={() => setOpen(false)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button label="Done" onPress={() => (setOpen(false), onChange(draft))} />
                  </View>
                </View>
              </Frame>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

/** "21:30" → "9:30 pm" */
export const clock12 = (hhmm: string) => {
  const h = Number(hhmm.slice(0, 2)) || 0;
  const m = hhmm.slice(3, 5) || "00";
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h >= 12 ? "pm" : "am"}`;
};
const dayName = (ymd: string) => {
  const d = new Date(`${ymd}T12:00:00`);
  const today = new Date();
  const days = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86_400_000);
  return days === 0 ? "Today" : days === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
};

export function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (hhmm: string) => void }) {
  return <PickerField label={label} value={value} text={clock12(value)} onChange={onChange} picker={(d, set) => <TimeWheel label={label} value={d} onChange={set} />} />;
}

export function DateField({ label, value, onChange, days = 365 }: { label: string; value: string; onChange: (ymd: string) => void; days?: number }) {
  return <PickerField label={label} value={value} text={dayName(value)} onChange={onChange} picker={(d, set) => <DateWheel label={label} value={d} onChange={set} days={days} />} />;
}

export function NumberField<V extends string | number>({ label, value, items, onChange }: { label: string; value: V; items: WheelItem<V>[]; onChange: (v: V) => void }) {
  return (
    <PickerField
      label={label}
      value={value}
      text={items.find((x) => x.value === value)?.label ?? String(value)}
      onChange={onChange}
      picker={(d, set) => <Wheel label={label} items={items} value={d} onChange={set} width={160} />}
    />
  );
}
