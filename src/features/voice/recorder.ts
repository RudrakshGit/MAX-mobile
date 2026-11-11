import {
  AudioQuality,
  IOSOutputFormat,
  RecordingPresets,
  type RecordingOptions,
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { downsample, isUsableClip } from "./transcript";

export const VOICE_RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 32000,
  isMeteringEnabled: true,
  extension: ".m4a",
  android: {
    outputFormat: "mpeg4",
    audioEncoder: "aac",
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MAX,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

export const MAX_RECORDING_MS = 120_000; // 2 minutes

/**
 * Normalises metering dBFS (−60…0) to 0…1.
 */
export function normalizeDb(dbfs: number | undefined): number {
  if (dbfs === undefined || !Number.isFinite(dbfs) || dbfs <= -60) return 0;
  if (dbfs >= 0) return 1;
  return (dbfs + 60) / 60;
}

import { PermissionsAndroid, Platform } from "react-native";

export async function ensureMicPermission(): Promise<boolean> {
  if (Platform.OS === "android") {
    try {
      const has = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      if (has) return true;
      const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
        title: "Microphone Access",
        message: "MAX needs microphone access to record voice journal entries.",
        buttonPositive: "Allow",
      });
      // a "no" is the answer: falling through to expo-audio's request showed Android's prompt a second time
      return res === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      // fallback to expo-audio permission check
    }
  }
  const current = await getRecordingPermissionsAsync().catch(() => null);
  if (current?.granted) return true;
  const req = await requestRecordingPermissionsAsync().catch(() => null);
  return Boolean(req?.granted);
}

export async function saveAudioToPermanentStorage(
  tempUri: string,
  entryId: string,
  rawLevels: number[],
  ms: number
): Promise<{ uri: string; ms: number; levels: number[] } | null> {
  const finalLevels = downsample(rawLevels, 60);
  if (!isUsableClip(ms, finalLevels)) {
    await FileSystem.deleteAsync(tempUri, { idempotent: true }).catch(() => {});
    return null;
  }

  const voiceDir = `${FileSystem.documentDirectory}voice/`;
  const dirInfo = await FileSystem.getInfoAsync(voiceDir).catch(() => ({ exists: false }));
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(voiceDir, { intermediates: true }).catch(() => {});
  }

  const destUri = `${voiceDir}${entryId}.m4a`;
  await FileSystem.moveAsync({ from: tempUri, to: destUri });
  return {
    uri: destUri,
    ms,
    levels: finalLevels,
  };
}

export async function deleteAudioFile(uri: string): Promise<void> {
  if (!uri) return;
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
}
