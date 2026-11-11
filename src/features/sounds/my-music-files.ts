import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { getState, tombstone, update, type MyTrack } from "@/lib/store";
import { newTrackId, oembedUrl, titleFromFileName, detectPlatform } from "@/lib/my-music";

// Songs a student adds from the phone are COPIED into MAX's private storage, so they keep playing offline
// and the student can delete the original. "Delete everything" removes this folder too (wipeLocalFiles).
export const MUSIC_DIR = () => `${FileSystem.documentDirectory}music/`;
const MAX_BYTES = 60 * 1024 * 1024;

export type AddResult = { ok: true; track: MyTrack } | { ok: false; reason: "cancelled" | "too-big" | "failed" };

export async function addTrackFromPhone(): Promise<AddResult> {
  let doc: DocumentPicker.DocumentPickerResult;
  try {
    doc = await DocumentPicker.getDocumentAsync({ type: "audio/*", copyToCacheDirectory: true, multiple: false });
  } catch {
    return { ok: false, reason: "failed" };
  }
  if (doc.canceled || !doc.assets?.[0]) return { ok: false, reason: "cancelled" };
  const asset = doc.assets[0];
  if (asset.size && asset.size > MAX_BYTES) {
    await FileSystem.deleteAsync(asset.uri, { idempotent: true }).catch(() => {});
    return { ok: false, reason: "too-big" };
  }
  const id = newTrackId();
  const ext = (asset.name.match(/\.([a-z0-9]{2,5})$/i)?.[1] ?? "m4a").toLowerCase();
  const dest = `${MUSIC_DIR()}${id}.${ext}`;
  try {
    await FileSystem.makeDirectoryAsync(MUSIC_DIR(), { intermediates: true }).catch(() => {});
    await FileSystem.moveAsync({ from: asset.uri, to: dest });
  } catch {
    return { ok: false, reason: "failed" };
  }
  const track: MyTrack = { id, kind: "file", title: titleFromFileName(asset.name), uri: dest, addedAt: Date.now() };
  update((s) => ({ myMusic: [track, ...s.myMusic].slice(0, 200) }));
  return { ok: true, track };
}

export function addLink(url: string, title: string, need?: MyTrack["need"]): MyTrack {
  const track: MyTrack = {
    id: newTrackId(),
    kind: "link",
    title: title.trim().slice(0, 120) || "My playlist",
    url,
    platform: detectPlatform(url),
    ...(need ? { need } : {}),
    addedAt: Date.now(),
  };
  update((s) => ({ myMusic: [track, ...s.myMusic].slice(0, 200) }));
  return track;
}

/** Title for a Spotify / YouTube link, looked up only when the student pastes it. */
export async function lookUpTitle(url: string): Promise<string | null> {
  const endpoint = oembedUrl(url);
  if (!endpoint) return null;
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 6000);
    const res = await fetch(endpoint, { signal: ctl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.title === "string" ? data.title.slice(0, 120) : null;
  } catch {
    return null;
  }
}

export function editTrack(id: string, patch: Pick<MyTrack, "title"> & { need?: MyTrack["need"] }) {
  update((s) => ({
    myMusic: s.myMusic.map((t) => {
      if (t.id !== id) return t;
      const { need: _old, ...rest } = t;
      return { ...rest, title: patch.title.trim().slice(0, 120) || t.title, ...(patch.need ? { need: patch.need } : {}) };
    }),
  }));
}

export async function removeTrack(id: string) {
  const t = getState().myMusic.find((x) => x.id === id);
  if (t?.kind === "file" && t.uri) await FileSystem.deleteAsync(t.uri, { idempotent: true }).catch(() => {});
  update((s) => ({
    myMusic: s.myMusic.filter((x) => x.id !== id),
    musicRecent: s.musicRecent.filter((r) => r.id !== id),
    tombstones: tombstone(s, id),
  }));
}

/** After restoring a backup on another phone the copied files are not there; keep only what exists. */
export async function dropMissingTracks<T extends { myMusic: MyTrack[] }>(s: T): Promise<T> {
  const kept: MyTrack[] = [];
  for (const t of s.myMusic) {
    if (t.kind !== "file") kept.push(t);
    else if (t.uri && (await FileSystem.getInfoAsync(t.uri).catch(() => null))?.exists) kept.push(t);
  }
  return { ...s, myMusic: kept };
}
