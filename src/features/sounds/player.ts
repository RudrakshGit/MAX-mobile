import { useSyncExternalStore } from "react";
import {
  createAudioPlayer,
  setAudioModeAsync,
  requestNotificationPermissionsAsync,
  type AudioPlayer,
} from "expo-audio";
import { AppState, type AppStateStatus, Platform } from "react-native";
import { sounds, type Sound } from "@/content/sounds";

export type PlayerState = {
  /** a focus session: ends at this time with a soft bell */
  focusEndAt: number | null;
  focusRemaining: number | null;
  /** set when a session just finished (cleared when a new one starts or the student dismisses it) */
  focusDone: boolean;
  activeSoundId: string | null;
  /** title of what is loaded (built-in sound or the student's own track) */
  activeTitle: string | null;
  /** more tracks are queued after this one */
  canNext: boolean;
  isPlaying: boolean;
  timerMinutes: number | null;
  timerEndAt: number | null;
  remainingSeconds: number | null;
};

let currentPlayer: AudioPlayer | null = null;
let activeSoundId: string | null = null;
let isPlaying = false;
let timerMinutes: number | null = null;
let timerEndAt: number | null = null;

/** Something MAX can play: a bundled sound (require'd) or a file the student added. */
export type Track = { id: string; title: string; source: number | { uri: string }; loop: boolean };
let queue: Track[] = [];
let queueIndex = 0;
let pausedAt: number | null = null;

let focusEndAt: number | null = null;
let focusDone = false;
let bellPlayer: AudioPlayer | null = null;
let focusNotificationId: string | null = null;

let currentSnapshot: PlayerState = {
  focusEndAt: null,
  focusRemaining: null,
  focusDone: false,
  activeSoundId: null,
  activeTitle: null,
  canNext: false,
  isPlaying: false,
  timerMinutes: null,
  timerEndAt: null,
  remainingSeconds: null,
};

function computeRemainingSeconds(): number | null {
  if (timerEndAt && isPlaying) {
    return Math.max(0, Math.round((timerEndAt - Date.now()) / 1000));
  }
  return null;
}

function updateSnapshot() {
  const remainingSeconds = computeRemainingSeconds();
  const activeTitle = activeSoundId ? queue[queueIndex]?.title ?? null : null;
  const canNext = !!activeSoundId && queue.length > 1;
  const focusRemaining = focusEndAt ? Math.max(0, Math.round((focusEndAt - Date.now()) / 1000)) : null;
  if (
    currentSnapshot.focusEndAt !== focusEndAt ||
    currentSnapshot.focusRemaining !== focusRemaining ||
    currentSnapshot.focusDone !== focusDone ||
    currentSnapshot.activeSoundId !== activeSoundId ||
    currentSnapshot.activeTitle !== activeTitle ||
    currentSnapshot.canNext !== canNext ||
    currentSnapshot.isPlaying !== isPlaying ||
    currentSnapshot.timerMinutes !== timerMinutes ||
    currentSnapshot.timerEndAt !== timerEndAt ||
    currentSnapshot.remainingSeconds !== remainingSeconds
  ) {
    currentSnapshot = {
      focusEndAt,
      focusRemaining,
      focusDone,
      activeSoundId,
      activeTitle,
      canNext,
      isPlaying,
      timerMinutes,
      timerEndAt,
      remainingSeconds,
    };
  }
}

let tickTimer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function notify() {
  updateSnapshot();
  listeners.forEach((fn) => fn());
}

async function configureAudioMode() {
  try {
    await setAudioModeAsync({
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
      playsInSilentMode: true,
    });
  } catch (err) {
    console.warn("Could not configure audio mode:", err);
  }
}

async function ensureNotificationPermission() {
  if (Platform.OS === "android") {
    try {
      await requestNotificationPermissionsAsync();
    } catch {
      // ignore
    }
  }
}

function startTicker() {
  stopTicker();
  tickTimer = setInterval(() => {
    if (focusEndAt) {
      if (Date.now() >= focusEndAt) return void finishFocus();
      notify();
    }
    if (!isPlaying || !timerEndAt || !currentPlayer) {
      return;
    }
    const msLeft = timerEndAt - Date.now();
    if (msLeft <= 0) {
      stopSound();
      return;
    }

    // 30s smooth fade out
    if (msLeft <= 30_000) {
      const vol = Math.max(0, msLeft / 30_000);
      try {
        currentPlayer.volume = vol;
      } catch {
        // ignore
      }
    } else if (currentPlayer.volume < 1) {
      try {
        currentPlayer.volume = 1.0;
      } catch {
        // ignore
      }
    }

    notify();
  }, 1000);
}

function stopTicker() {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

// Re-check timer when app returns from background
AppState.addEventListener("change", (state: AppStateStatus) => {
  if (state === "active" && focusEndAt && Date.now() >= focusEndAt) void finishFocus(false);
  if (state === "active" && isPlaying && timerEndAt) {
    if (Date.now() >= timerEndAt) {
      stopSound();
    } else {
      notify();
    }
  }
});

export async function playSound(soundId: string, durationMinutes?: number | null) {
  const target = sounds.find((s) => s.id === soundId);
  if (!target) return;
  await playTracks([{ id: target.id, title: target.title, source: target.file, loop: true }], 0, durationMinutes);
}

/**
 * Plays `list[start]`; when a non-looping track ends, the next one in the list plays (and the list wraps).
 * One thing plays at a time; the sleep timer keeps running across tracks.
 */
export async function playTracks(list: Track[], start = 0, durationMinutes?: number | null) {
  const target = list[start];
  if (!target) return;

  await configureAudioMode();
  await ensureNotificationPermission();

  // Same track already playing: only update the timer.
  if (activeSoundId === target.id && currentPlayer && isPlaying) {
    if (durationMinutes !== undefined) setTimer(durationMinutes);
    return;
  }

  releasePlayer();
  queue = list;
  queueIndex = start;
  activeSoundId = target.id;
  isPlaying = true;

  try {
    const player = createAudioPlayer(target.source);
    player.loop = target.loop && list.length === 1;
    player.volume = 1.0;
    // Lock screen controls keep Android from stopping background audio after a few minutes.
    try {
      player.setActiveForLockScreen(true, { title: target.title, artist: "MAX" });
    } catch {
      // not available in some dev builds
    }
    player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish && currentPlayer === player) void next();
    });
    player.play();
    currentPlayer = player;
  } catch (err) {
    console.warn("Failed to play:", err);
    activeSoundId = null;
    isPlaying = false;
    notify();
    return;
  }

  if (durationMinutes !== undefined) setTimer(durationMinutes);
  startTicker();
  notify();
}

/** Next track in the queue (wraps). Does nothing for a single track. */
export async function next() {
  if (queue.length < 2) {
    // a single non-looping track finished
    if (!currentPlayer?.loop) stopSound();
    return;
  }
  const list = queue;
  const i = (queueIndex + 1) % list.length;
  activeSoundId = null; // force a fresh player
  await playTracks(list, i);
}

/** Pause or resume what is loaded. */
export function togglePause() {
  if (!currentPlayer || !activeSoundId) return;
  try {
    if (isPlaying) {
      currentPlayer.pause();
      pausedAt = Date.now();
    } else {
      // the sleep timer does not run while paused
      if (timerEndAt && pausedAt) timerEndAt += Date.now() - pausedAt;
      pausedAt = null;
      currentPlayer.play();
    }
    isPlaying = !isPlaying;
  } catch {
    // ignore
  }
  notify();
}

function releasePlayer() {
  if (currentPlayer) {
    try {
      currentPlayer.pause();
      currentPlayer.clearLockScreenControls();
      currentPlayer.remove();
    } catch {
      // ignore
    }
    currentPlayer = null;
  }
}

/**
 * A study focus session: a calm sound for `minutes`, then a soft bell. A notification is scheduled for the end
 * too, because Android may pause the app's timers while the screen is off.
 */
export async function startFocus(minutes: number, soundId = "brown-noise") {
  focusDone = false;
  focusEndAt = Date.now() + minutes * 60_000;
  await playSound(soundId, null);
  startTicker();
  try {
    const Notifications = await import("expo-notifications");
    const { ensureChannels, TIMER_CHANNEL } = await import("@/lib/reminders");
    await ensureChannels();
    if (focusNotificationId) await Notifications.cancelScheduledNotificationAsync(focusNotificationId).catch(() => {});
    focusNotificationId = await Notifications.scheduleNotificationAsync({
      content: { title: "Focus session done", body: "Nice work. Take a 5-minute break: stand up, stretch, drink some water.", data: { url: "/sounds" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(focusEndAt), channelId: TIMER_CHANNEL },
    });
  } catch {
    // notifications off: the bell in the app still works
  }
  notify();
}

async function finishFocus(bell = true) {
  focusEndAt = null;
  focusDone = true;
  stopSound(false);
  if (focusNotificationId) {
    const id = focusNotificationId;
    focusNotificationId = null;
    if (bell) {
      // the app was open at the end: the bell is enough, drop the notification
      import("expo-notifications").then((N) => N.cancelScheduledNotificationAsync(id)).catch(() => {});
    }
  }
  if (bell) {
    try {
      bellPlayer?.remove();
      bellPlayer = createAudioPlayer(require("../../../assets/sounds/bell.m4a"));
      bellPlayer.volume = 0.8;
      bellPlayer.play();
    } catch {
      // ignore
    }
  }
  notify();
}

export function endFocus() {
  if (focusNotificationId) {
    const id = focusNotificationId;
    focusNotificationId = null;
    import("expo-notifications").then((N) => N.cancelScheduledNotificationAsync(id)).catch(() => {});
  }
  focusEndAt = null;
  focusDone = false;
  stopSound();
}

export function dismissFocusDone() {
  focusDone = false;
  notify();
}

export function stopSound(endsFocus = true) {
  if (endsFocus && focusEndAt) {
    focusEndAt = null;
    if (focusNotificationId) {
      const id = focusNotificationId;
      focusNotificationId = null;
      import("expo-notifications").then((N) => N.cancelScheduledNotificationAsync(id)).catch(() => {});
    }
  }
  releasePlayer();
  queue = [];
  queueIndex = 0;
  pausedAt = null;
  activeSoundId = null;
  isPlaying = false;
  timerMinutes = null;
  timerEndAt = null;
  stopTicker();
  notify();
}

export function setTimer(minutes: number | null) {
  timerMinutes = minutes;
  if (minutes && minutes > 0) {
    timerEndAt = Date.now() + minutes * 60 * 1000;
  } else {
    timerEndAt = null;
    if (currentPlayer) {
      try {
        currentPlayer.volume = 1.0;
      } catch {
        // ignore
      }
    }
  }
  notify();
}

export function getPlayerState(): PlayerState {
  return currentSnapshot;
}

export function useSoundPlayer(): PlayerState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getPlayerState,
    getPlayerState
  );
}
