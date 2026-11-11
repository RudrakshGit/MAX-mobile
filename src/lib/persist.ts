import AsyncStorage from "@react-native-async-storage/async-storage";
import { parse, SCHEMA_VERSION } from "./schema";
import { readChunked, removeChunked, writeChunked } from "./chunkStore";
import type { State } from "./store";

// Before chunking, the whole state lived under one key. Still read once to migrate.
const KEY = "max.state";
const LEGACY_KEY = "max.v1"; // v1 stored the state object bare, with no envelope
const CORRUPT_KEY = "max.corrupt";

// Set when storage could not be read. Saves then never delete anything older, so the student's
// earlier data stays on the phone and can be recovered instead of being overwritten by an empty state.
let readFailed = false;

export async function loadState(fresh: () => State): Promise<State> {
  try {
    const chunked = await readChunked(AsyncStorage);
    if (chunked !== null) {
      const s = parse(chunked, fresh);
      if (s) return s;
      await AsyncStorage.setItem(CORRUPT_KEY, chunked.slice(0, 1_000_000)).catch(() => {});
      readFailed = true;
      return fresh();
    }

    const [current, legacy] = await Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(LEGACY_KEY)]);
    const blob = current ?? legacy;
    if (!blob) return fresh();
    const s = parse(blob, fresh);
    if (!s) {
      // Keep what we couldn't read instead of silently overwriting it on the next save.
      await AsyncStorage.setItem(CORRUPT_KEY, blob).catch(() => {});
      readFailed = true;
      return fresh();
    }
    // Migrate once to chunked storage, then drop the single-key copies.
    await writeChunked(AsyncStorage, JSON.stringify({ version: SCHEMA_VERSION, state: s }));
    await AsyncStorage.multiRemove([KEY, LEGACY_KEY]).catch(() => {});
    return s;
  } catch (e) {
    console.warn("MAX: could not read saved data; earlier data is kept on the phone", e);
    readFailed = true;
    return fresh();
  }
}

// Writes go through one chain so a slow earlier write can never land after a later one.
let chain: Promise<unknown> = Promise.resolve();
export function saveState(s: State) {
  const blob = JSON.stringify({ version: SCHEMA_VERSION, state: s });
  chain = chain
    .then(() => writeChunked(AsyncStorage, blob, readFailed))
    .catch((e) => console.warn("MAX: saving failed", e));
}

export async function wipeStorage() {
  await chain;
  await removeChunked(AsyncStorage).catch(() => {});
  await AsyncStorage.multiRemove([KEY, LEGACY_KEY, CORRUPT_KEY]).catch(() => {});
  readFailed = false;
}
