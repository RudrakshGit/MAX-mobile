import React, { useRef, useSyncExternalStore } from "react";
import { ThemeSwitchBulbAnimation } from "@/components/max/ThemeSwitchBulbAnimation";
import { update } from "@/lib/store";

// The "pull the light switch" animation is mounted once at the app root so it covers the native header too.
type Target = "light" | "dark";
let request: { target: Target } | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function requestThemeSwitch(target: Target) {
  if (request) return;
  request = { target };
  emit();
}

export function ThemeSwitchHost() {
  const req = useSyncExternalStore(subscribe, () => request);
  const last = useRef<Target>("light");
  if (req) last.current = req.target;
  return (
    <ThemeSwitchBulbAnimation
      visible={!!req}
      targetTheme={req?.target ?? last.current}
      onApplyTheme={() => update(() => ({ themePreference: last.current }))}
      onFinished={() => {
        request = null;
        emit();
      }}
    />
  );
}
