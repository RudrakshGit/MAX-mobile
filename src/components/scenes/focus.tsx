import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, type View } from "react-native";
import { useFocusEffect } from "expo-router";

// Which shelf of cards is "in view", like a video feed that plays the one you stop on (owner, 11 Nov 2026):
// after the page stops scrolling, the shelf most on screen becomes active, and inside it only the first card that
// is fully visible plays its little move. Measured only when scrolling settles, never per frame.

type Ctx = { active: string | null; register: (id: string, ref: React.RefObject<View | null>) => () => void };
const FocusCtx = createContext<Ctx | null>(null);

const TOP = 90; // under the header
const BOTTOM = 100; // above the tab bar

export function FocusScope({ children }: { children: (settle: () => void) => React.ReactNode }) {
  const shelves = useRef(new Map<string, React.RefObject<View | null>>());
  const [active, setActive] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const live = useRef(true);

  const measure = useCallback(() => {
    if (!live.current) return;
    const h = Dimensions.get("window").height;
    const entries = [...shelves.current.entries()];
    let best: { id: string; seen: number; y: number } | null = null;
    let left = entries.length;
    if (!left) return setActive(null);
    for (const [id, ref] of entries) {
      ref.current?.measureInWindow((_x, y, _w, height) => {
        const seen = height > 0 ? (Math.min(y + height, h - BOTTOM) - Math.max(y, TOP)) / height : 0;
        if (seen >= 0.6 && (!best || seen > best.seen + 0.05 || (Math.abs(seen - best.seen) <= 0.05 && y < best.y))) best = { id, seen, y };
        if (--left === 0 && live.current) setActive((best as { id: string } | null)?.id ?? null);
      });
      if (!ref.current) left--;
    }
  }, []);

  const settle = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(measure, 150);
  }, [measure]);

  // leaving the tab stops every card; coming back plays the one in view again
  useFocusEffect(
    useCallback(() => {
      live.current = true;
      settle();
      return () => {
        live.current = false;
        if (timer.current) clearTimeout(timer.current);
        setActive(null);
      };
    }, [settle]),
  );

  const register = useCallback(
    (id: string, ref: React.RefObject<View | null>) => {
      shelves.current.set(id, ref);
      settle(); // shelves that mount later (staged pages) are counted too
      return () => {
        shelves.current.delete(id);
      };
    },
    [settle],
  );

  const value = useMemo(() => ({ active, register }), [active, register]);
  return <FocusCtx.Provider value={value}>{children(settle)}</FocusCtx.Provider>;
}

/** For a shelf: a ref for its outer view, and whether it is the shelf in view. Outside a FocusScope it's never active. */
export function useShelfFocus(id: string) {
  const ctx = useContext(FocusCtx);
  const ref = useRef<View>(null);
  useEffect(() => ctx?.register(id, ref), [ctx?.register, id]);
  return { ref, active: !!ctx && ctx.active === id };
}
