import { showAlert } from "@/lib/dialog";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { getState, initialState, replaceState } from "./store";
import { parse, SCHEMA_VERSION } from "./schema";
import { dropMissingTracks } from "@/features/sounds/my-music-files";

const EXPORT_PATTERN = /^max-backup-.*\.json$/;

async function cleanOldBackups(dir: string | null) {
  if (!dir) return;
  try {
    const files = await FileSystem.readDirectoryAsync(dir);
    for (const f of files) {
      if (EXPORT_PATTERN.test(f)) {
        await FileSystem.deleteAsync(`${dir}${f}`, { idempotent: true }).catch(() => {});
      }
    }
  } catch {
    // Best-effort cleanup
  }
}

export async function exportBackup(): Promise<void> {
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) return;
  await cleanOldBackups(cacheDir);

  const date = new Date().toISOString().slice(0, 10);
  const filename = `max-backup-${date}.json`;
  const uri = `${cacheDir}${filename}`;

  const current = getState();
  const stateToExport = { ...current, lock: false };
  const blob = JSON.stringify({ version: SCHEMA_VERSION, state: stateToExport }, null, 2);

  await FileSystem.writeAsStringAsync(uri, blob);

  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/json",
        dialogTitle: "Export MAX Backup",
        UTI: "public.json",
      });
    }
  } finally {
    // The backup is the whole journal in plain text; it must not stay behind in the app's cache.
    await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
  }
}

/**
 * Removes every file MAX itself wrote outside AsyncStorage: voice recordings, songs the student added, leftover recordings in the
 * cache, exported backups and copies made by the file picker. Used by "Delete everything".
 */
export async function wipeLocalFiles(): Promise<void> {
  const doc = FileSystem.documentDirectory;
  if (doc) {
    await FileSystem.deleteAsync(`${doc}voice/`, { idempotent: true }).catch(() => {});
    await FileSystem.deleteAsync(`${doc}music/`, { idempotent: true }).catch(() => {});
  }
  const cache = FileSystem.cacheDirectory;
  if (!cache) return;
  await FileSystem.deleteAsync(`${cache}DocumentPicker/`, { idempotent: true }).catch(() => {});
  await walkAndDelete(cache, 0);
}

const SENSITIVE_FILE = /(\.m4a|\.aac|\.3gp|\.wav|\.mp3|\.ogg|\.flac|\.opus)$|^max-backup-.*\.json$/i;

async function walkAndDelete(dir: string, depth: number): Promise<void> {
  if (depth > 3) return;
  let names: string[] = [];
  try {
    names = await FileSystem.readDirectoryAsync(dir);
  } catch {
    return;
  }
  for (const name of names) {
    const path = `${dir}${name}`;
    const info = await FileSystem.getInfoAsync(path).catch(() => null);
    if (!info?.exists) continue;
    if (info.isDirectory) await walkAndDelete(`${path}/`, depth + 1);
    else if (SENSITIVE_FILE.test(name)) await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {});
  }
}

export async function importBackup(): Promise<"imported" | "cancelled" | "invalid"> {
  let doc: DocumentPicker.DocumentPickerResult;
  try {
    doc = await DocumentPicker.getDocumentAsync({
      // Some Android file managers label .json files as text or octet-stream; the contents are validated below.
      type: ["application/json", "text/plain", "application/octet-stream"],
      copyToCacheDirectory: true,
    });
  } catch {
    return "invalid";
  }

  if (doc.canceled || !doc.assets?.[0]?.uri) {
    return "cancelled";
  }

  let text: string;
  try {
    text = await FileSystem.readAsStringAsync(doc.assets[0].uri);
  } catch {
    showAlert("Cannot read file", "Could not read the selected backup file.");
    return "invalid";
  }

  const picked = doc.assets[0].uri;
  const parsed = parse(text, initialState);
  // The picker's private copy holds the whole journal in plain text; remove it once read.
  FileSystem.deleteAsync(picked, { idempotent: true }).catch(() => {});
  if (!parsed) {
    showAlert(
      "Cannot import backup",
      "This backup file is corrupted, not valid JSON, or was created with a newer version of MAX."
    );
    return "invalid";
  }

  return new Promise<"imported" | "cancelled">((resolve) => {
    showAlert(
      "Replace everything on this phone?",
      "Importing this backup will replace all check-ins, conversations, journal entries, and test results.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => resolve("cancelled"),
        },
        {
          text: "Replace data",
          style: "destructive",
          onPress: async () => {
            replaceState(await dropMissingTracks(await dropMissingAudio(parsed)));
            resolve("imported");
          },
        },
      ]
    );
  });
}

/** Voice files are not inside the backup. Entries whose recording is not on this phone keep their text only. */
async function dropMissingAudio<T extends { entries: { audio?: { uri: string } }[] }>(s: T): Promise<T> {
  const entries = await Promise.all(
    s.entries.map(async (e) => {
      if (!e.audio?.uri) return e;
      const info = await FileSystem.getInfoAsync(e.audio.uri).catch(() => null);
      if (info?.exists) return e;
      const { audio: _gone, ...rest } = e;
      return rest as typeof e;
    }),
  );
  return { ...s, entries };
}
