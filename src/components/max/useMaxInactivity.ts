import { useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";

const IDLE_MS = 6_000;
const SLEEP_MS = 60_000; // and only at night (useMaxBehavior)
const NUDGE_CHANCE = 0.3;

export interface InactivityCallbacks {
  /** Fired after IDLE_MS — caller decides whether to nudge (30% chance). */
  onIdle: () => void;
  /** Fired after SLEEP_MS of zero interaction. */
  onSleep: () => void;
}

/**
 * Tracks user inactivity and fires idle/sleep callbacks.
 *
 * Call `poke()` on any user interaction to reset the timers.
 * Automatically pauses when the app goes to background.
 */
export function useMaxInactivity({ onIdle, onSleep }: InactivityCallbacks) {
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appActive = useRef(true);

  const clear = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    if (sleepTimer.current) {
      clearTimeout(sleepTimer.current);
      sleepTimer.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    if (!appActive.current) return;

    idleTimer.current = setTimeout(() => {
      if (Math.random() < NUDGE_CHANCE) {
        onIdle();
      }
    }, IDLE_MS);

    sleepTimer.current = setTimeout(() => {
      onSleep();
    }, SLEEP_MS);
  }, [clear, onIdle, onSleep]);

  /** Reset all timers — call on every user interaction. */
  const poke = useCallback(() => {
    start();
  }, [start]);

  // Pause/resume on app state changes
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        appActive.current = true;
        start();
      } else {
        appActive.current = false;
        clear();
      }
    });
    // Initial start
    start();
    return () => {
      sub.remove();
      clear();
    };
  }, [start, clear]);

  return { poke };
}
