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
  activeSoundId: string | null;
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

let currentSnapshot: PlayerState = {
  activeSoundId: null,
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
  if (
    currentSnapshot.activeSoundId !== activeSoundId ||
    currentSnapshot.isPlaying !== isPlaying ||
    currentSnapshot.timerMinutes !== timerMinutes ||
    currentSnapshot.timerEndAt !== timerEndAt ||
    currentSnapshot.remainingSeconds !== remainingSeconds
  ) {
    currentSnapshot = {
      activeSoundId,
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

  await configureAudioMode();
  await ensureNotificationPermission();

  // If already playing this sound, just update timer if given
  if (activeSoundId === soundId && currentPlayer && isPlaying) {
    if (durationMinutes !== undefined) {
      setTimer(durationMinutes);
    }
    return;
  }

  // Stop previous sound
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

  activeSoundId = soundId;
  isPlaying = true;

  try {
    const player = createAudioPlayer(target.file);
    player.loop = true;
    player.volume = 1.0;

    // Lock screen controls prevent Android OS from killing audio after 3 min
    try {
      player.setActiveForLockScreen(true, {
        title: target.title,
        artist: "MAX Calm",
      });
    } catch {
      // ignore in dev if background service is not yet bound
    }

    player.play();
    currentPlayer = player;
  } catch (err) {
    console.error("Failed to play sound:", err);
    activeSoundId = null;
    isPlaying = false;
    notify();
    return;
  }

  if (durationMinutes !== undefined) {
    setTimer(durationMinutes);
  } else if (!timerEndAt) {
    // default no timer
    setTimer(null);
  }

  startTicker();
  notify();
}

export function stopSound() {
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
