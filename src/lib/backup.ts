import { showAlert } from "@/lib/dialog";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { getState, initialState, replaceState } from "./store";
import { parse, SCHEMA_VERSION } from "./schema";

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

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/json",
      dialogTitle: "Export MAX Backup",
      UTI: "public.json",
    });
  }
}

export async function importBackup(): Promise<"imported" | "cancelled" | "invalid"> {
  let doc: DocumentPicker.DocumentPickerResult;
  try {
    doc = await DocumentPicker.getDocumentAsync({
      type: "application/json",
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

  const parsed = parse(text, initialState);
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
          onPress: () => {
            replaceState(parsed);
            resolve("imported");
          },
        },
      ]
    );
  });
}
