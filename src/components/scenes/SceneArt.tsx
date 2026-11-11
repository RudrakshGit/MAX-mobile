import React, { memo, useEffect, useRef, useState } from "react";
import { FlatList, PixelRatio, Pressable, View, type ViewToken } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from "react-native-reanimated";
import Svg, { Rect } from "react-native-svg";
import { useReducedMotionSafe } from "@/components/max/useReducedMotionSafe";
import { useStore } from "@/lib/store";
import { radius, space, useTheme } from "@/lib/theme";
import { T } from "@/lib/ui";
import { DoodleIcon, type DoodleIconName } from "@/ui/icons/DoodleIcon";
import { Frame } from "@/ui/sketch/Frame";
import { SCENES, type Kit, type Move, type SceneName } from "./scenes";
import { useShelfFocus } from "./focus";

// A card picture of MAX's world (docs/plan/M16, decisions 11–12): one still drawing on the topic's soft tint, plus a
// couple of small parts that move only while the card is the one in view (`active`, see focus.tsx), like a feed that
// plays the video you stop on (owner, 11 Nov 2026). Each time it comes into view it plays once (2–4 s) and rests.
// Reduce motion or "MAX moves: still" shows the final picture.

const PLAY_MS = 4200; // longest move plus its lead; then the parts go back into the one still drawing

export function SceneArt({ name, width, active = false }: { name: SceneName; width: number; active?: boolean }) {
  const t = useTheme();
  const scene = SCENES[name];
  const height = Math.round(width * 0.75);
  const reduced = useReducedMotionSafe();
  const motion = useStore((s) => s.maxMotion ?? "normal");
  // a new play each time the card comes into view; back to the single drawing when it's done or leaves
  const [play, setPlay] = React.useState(0);
  const canMove = !reduced && motion !== "still";
  useEffect(() => {
    if (!active || !canMove) return setPlay(0);
    setPlay((n) => n + 1);
    const done = setTimeout(() => setPlay(0), PLAY_MS);
    return () => clearTimeout(done);
  }, [active, canMove]);
  const still = play === 0;
  const k: Kit = {
    line: t.ink,
    prop: t.raised,
    c: { ink: t.characterInk, paper: t.characterPaper, foot: t.characterFoot, blush: t.characterBlush },
  };
  const moves = (scene.moves as Move[] | undefined) ?? [];
  return (
    // the tint is painted inside the drawing, not as a view background: one coat less (overdraw, M16 follow-up)
    <View style={{ width, height, borderRadius: radius.sm, overflow: "hidden" }}>
      <Svg width={width} height={height} viewBox="0 0 200 150">
        <Rect x={-4} y={-4} width={208} height={158} fill={t.tint[scene.tint]} />
        {scene.draw(k)}
        {/* still: the moving parts are drawn in place, in the same drawing (one view instead of three) */}
        {still ? moves.map((m, i) => <React.Fragment key={i}>{m.draw(k)}</React.Fragment>) : null}
      </Svg>
      {still ? null : moves.map((m, i) => <MoveLayer key={`${play}-${i}`} move={m} k={k} scale={width / 200} still={false} delay={m.delay ?? 0} />)}
    </View>
  );
}

function MoveLayer({ move, k, scale, still, delay }: { move: Move; k: Kit; scale: number; still: boolean; delay: number }) {
  const [x, y, w, h] = move.box;
  const p = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    const lead = 250 + delay;
    const once = (ms: number, times: number) =>
      withDelay(lead, withSequence(withRepeat(withTiming(1, { duration: ms, easing: Easing.linear }), times, false), withTiming(1, { duration: 0 })));
    if (move.kind === "appear") p.value = withDelay(lead, withTiming(1, { duration: 260, easing: Easing.bezier(0.2, 0, 0, 1) }));
    else if (move.kind === "float") p.value = once(1500, 2);
    else if (move.kind === "pulse") p.value = once(1100, 2);
    else p.value = once(900, 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useMoveStyle(move.kind, p, scale, still);
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: x * scale, top: y * scale, width: w * scale, height: h * scale }, style]}>
      <Svg width="100%" height="100%" viewBox={`${x} ${y} ${w} ${h}`}>
        {move.draw(k)}
      </Svg>
    </Animated.View>
  );
}

function useMoveStyle(kind: Move["kind"], p: SharedValue<number>, scale: number, still: boolean) {
  return useAnimatedStyle(() => {
    const v = p.value;
    if (still || v >= 1) return { opacity: 1, transform: [{ translateY: 0 }, { rotate: "0deg" }, { scale: 1 }] };
    if (kind === "appear") return { opacity: v, transform: [{ translateY: 0 }, { rotate: "0deg" }, { scale: 0.9 + 0.1 * v }] };
    if (kind === "float") {
      const fade = v < 0.15 ? v / 0.15 : v > 0.8 ? (1 - v) / 0.2 : 1;
      return { opacity: fade, transform: [{ translateY: -14 * v * scale }, { rotate: "0deg" }, { scale: 1 }] };
    }
    if (kind === "pulse") return { opacity: 1, transform: [{ translateY: 0 }, { rotate: "0deg" }, { scale: 1 + 0.08 * Math.sin(Math.PI * v) }] };
    return { opacity: 1, transform: [{ translateY: 0 }, { rotate: `${8 * Math.sin(2 * Math.PI * v)}deg` }, { scale: 1 }] };
  });
}

/** The card's height, worked out ahead so its sketched outline draws in the first pass. */
function cardHeight(width: number, meta: boolean) {
  const fs = PixelRatio.getFontScale();
  const pic = Math.round((width - 12) * 0.75);
  return 6 + pic + 6 + 40 * fs + (meta ? 2 + Math.max(13, 18 * fs) : 0) + 4 + 6;
}

export interface SceneCardProps {
  scene: SceneName;
  title: string;
  meta?: string;
  metaIcon?: DoodleIconName;
  onPress: () => void;
  width?: number;
  /** the card in view: its picture plays */
  active?: boolean;
}

/** A card: MAX's world picture, a short title and one detail. No badges, subtitles or footers (decision 14). */
export const SceneCard = memo(function SceneCard({ scene, title, meta, metaIcon = "calendar", onPress, width = 168, active }: SceneCardProps) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={meta ? `${title}, ${meta}` : title}
      onPress={onPress}
      style={({ pressed }) => ({ width, opacity: pressed ? 0.85 : 1 })}>
      <Frame
        id={`scene-card-${scene}-${title}`}
        size={{ w: width, h: cardHeight(width, !!meta) }}
        fill
        fillColor={t.raised}
        strokeColor={t.rule}
        style={{ padding: 6, gap: 6 }}>
        <SceneArt name={scene} width={width - 12} active={active} />
        <View style={{ paddingHorizontal: 4, paddingBottom: 4, gap: 2 }}>
          {/* room for two lines, so cards side by side keep one height */}
          <T v="heading" numberOfLines={2} style={{ fontSize: 15, lineHeight: 20, minHeight: 40 * PixelRatio.getFontScale() }}>
            {title}
          </T>
          {meta ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
              <DoodleIcon name={metaIcon} size={13} color={t.ink2} />
              <T v="small" soft numberOfLines={1} style={{ flexShrink: 1 }}>
                {meta}
              </T>
            </View>
          ) : null}
        </View>
      </Frame>
    </Pressable>
  );
});

export type ShelfItem = Omit<SceneCardProps, "width" | "active"> & { key: string };

/**
 * A row of scene cards that builds only what is on screen (plus a little), and the rest as the student scrolls:
 * a long Explore or Check yourself page opens at once instead of drawing every card first.
 */
export function SceneShelf({ id, items, width = 168 }: { id: string; items: ShelfItem[]; width?: number }) {
  const { ref, active } = useShelfFocus(id);
  // the first card that is fully visible in the row is the one that plays
  const [first, setFirst] = useState<string | null>(items[0]?.key ?? null);
  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken<ShelfItem>[] }) => {
    const v = viewableItems.filter((x) => x.isViewable).sort((a, b) => (a.index ?? 0) - (b.index ?? 0))[0];
    if (v) setFirst(v.key);
  }).current;
  return (
    <View ref={ref} collapsable={false}>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(x) => x.key}
        extraData={active ? first : null}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: space.md, paddingRight: space.md }}
        initialNumToRender={Math.max(2, Math.ceil(360 / (width + space.md)))}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews
        viewabilityConfig={VIEWABILITY}
        onViewableItemsChanged={onViewable}
        renderItem={({ item }) => <SceneCard {...item} width={width} active={active && item.key === first} />}
      />
    </View>
  );
}

const VIEWABILITY = { itemVisiblePercentThreshold: 95, minimumViewTime: 250 };
