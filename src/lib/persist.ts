import AsyncStorage from "@react-native-async-storage/async-storage";
import { parse, SCHEMA_VERSION } from "./schema";
import type { State } from "./store";

const KEY = "max.state";
const LEGACY_KEY = "max.v1"; // v1 stored the state object bare, with no envelope
const CORRUPT_KEY = "max.corrupt";

export async function loadState(fresh: () => State): Promise<State> {
  try {
    const [current, legacy] = await Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(LEGACY_KEY)]);
    const blob = current ?? legacy;
    if (!blob) return fresh();
    const s = parse(blob, fresh);
    if (!s) {
      // Keep what we couldn't read instead of silently overwriting it on the next save.
      await AsyncStorage.setItem(CORRUPT_KEY, blob).catch(() => {});
      return fresh();
    }
    if (current === null) {
      await AsyncStorage.setItem(KEY, JSON.stringify({ version: SCHEMA_VERSION, state: s })); // migrate once
      await AsyncStorage.removeItem(LEGACY_KEY);
    }
    return s;
  } catch {
    return fresh();
  }
}

// Writes go through one chain so a slow earlier write can never land after a later one.
let chain: Promise<unknown> = Promise.resolve();
export function saveState(s: State) {
  const blob = JSON.stringify({ version: SCHEMA_VERSION, state: s });
  chain = chain.then(() => AsyncStorage.setItem(KEY, blob)).catch(() => {});
}

export async function wipeStorage() {
  await chain;
  await AsyncStorage.multiRemove([KEY, LEGACY_KEY, CORRUPT_KEY]).catch(() => {});
}
