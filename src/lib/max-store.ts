import { useSyncExternalStore } from "react";
import { Dimensions } from "react-native";
import type { MaxBehavior } from "@/components/max/MaxBehaviorEngine";

export interface FloatingMaxState {
  enabled: boolean;
  quickMenuOpen: boolean;
  /** Persisted resting position (null = default to bottom right) */
  pos: { x: number; y: number } | null;
  /** Context-driven emotion override (e.g. 'thinking' while AI is generating) */
  contextEmotion: MaxBehavior | null;
  /** Screen touch position tracked for MAX gaze */
  touchPos: { x: number; y: number } | null;
  /** Active digging exit animation when widget is turned off */
  isDiggingExit: boolean;
  /** Timestamp of any user touch anywhere on the screen */
  lastGlobalTouch: number;
}

const DEFAULT_STATE: FloatingMaxState = {
  enabled: true,
  quickMenuOpen: false,
  pos: null,
  contextEmotion: null,
  touchPos: null,
  isDiggingExit: false,
  lastGlobalTouch: 0,
};

let storeState: FloatingMaxState = { ...DEFAULT_STATE };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function getFloatingMaxState(): FloatingMaxState {
  return storeState;
}

export function updateFloatingMax(updater: (prev: FloatingMaxState) => FloatingMaxState) {
  storeState = updater(storeState);
  notify();
}

export function setFloatingMaxPos(x: number, y: number) {
  updateFloatingMax((s) => ({ ...s, pos: { x, y } }));
}

export function setQuickMenuOpen(open: boolean) {
  updateFloatingMax((s) => ({ ...s, quickMenuOpen: open }));
}

export function setFloatingMaxEnabled(enabled: boolean) {
  updateFloatingMax((s) => ({ ...s, enabled, isDiggingExit: false, quickMenuOpen: false }));
}

export function triggerFloatingMaxDigExit() {
  updateFloatingMax((s) => ({ ...s, isDiggingExit: true, quickMenuOpen: false }));
}

export function finishFloatingMaxDigExit() {
  updateFloatingMax((s) => ({ ...s, enabled: false, isDiggingExit: false }));
}

export function setContextEmotion(behavior: MaxBehavior | null) {
  updateFloatingMax((s) => ({ ...s, contextEmotion: behavior }));
}

let touchTimeout: any = null;
export function setTouchPos(x: number, y: number) {
  recordGlobalTouch(x, y);
  if (touchTimeout) clearTimeout(touchTimeout);
  touchTimeout = setTimeout(() => {
    updateFloatingMax((s) => ({ ...s, touchPos: null }));
  }, 2200);
}

export function recordGlobalTouch(x?: number, y?: number) {
  updateFloatingMax((s) => ({
    ...s,
    lastGlobalTouch: Date.now(),
    ...(x !== undefined && y !== undefined ? { touchPos: { x, y } } : {}),
  }));
}

export function resetTouchPos() {
  if (touchTimeout) clearTimeout(touchTimeout);
  updateFloatingMax((s) => ({ ...s, touchPos: null }));
}

export function useFloatingMax<T>(selector: (state: FloatingMaxState) => T): T {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    },
    () => selector(storeState)
  );
}

/** Default screen position for floating MAX (bottom-right edge above tab bar) */
export function getDefaultFloatingPos(size: number = 52): { x: number; y: number } {
  const { width, height } = Dimensions.get("window");
  return {
    x: width - size - 16,
    y: height - 160,
  };
}
