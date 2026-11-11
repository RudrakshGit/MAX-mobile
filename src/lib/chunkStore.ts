// Crash-safe, chunked storage for the one big state blob.
//
// Why: Android's AsyncStorage keeps values in SQLite and cannot read a single value larger than the 2 MB
// CursorWindow. A student who journals daily for a year can get there, and a read that throws used to start
// the app from a fresh state, which the next save then wrote over the student's data.
//
// How: the blob is split into chunks and written under a new "generation" of keys. Only after every chunk is
// written does the head key switch to the new generation; the old generation is deleted afterwards. A crash
// mid-write leaves the previous head (and its chunks) intact. If a read ever fails, nothing old is deleted.

export interface KV {
  multiGet(keys: readonly string[]): Promise<readonly (readonly [string, string | null])[]>;
  multiSet(pairs: [string, string][]): Promise<void>;
  multiRemove(keys: readonly string[]): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
}

export const HEAD = "max.state.head";
const PREFIX = "max.state.g";
export const CHUNK = 400_000; // characters; far below the 2 MB row limit even for multi-byte text

const chunkKey = (gen: number, i: number) => `${PREFIX}${gen}.c${i}`;

type Head = { gen: number; n: number };

function readHead(raw: string | null): Head | null {
  if (!raw) return null;
  try {
    const h = JSON.parse(raw);
    return Number.isInteger(h?.gen) && Number.isInteger(h?.n) && h.n > 0 ? { gen: h.gen, n: h.n } : null;
  } catch {
    return null;
  }
}

export function split(blob: string, size = CHUNK): string[] {
  const out: string[] = [];
  for (let i = 0; i < blob.length; i += size) out.push(blob.slice(i, i + size));
  return out.length ? out : [""];
}

/** The stored blob, or null when nothing has been saved in chunked form yet. Throws if storage can't be read. */
export async function readChunked(kv: KV): Promise<string | null> {
  const [[, rawHead]] = await kv.multiGet([HEAD]);
  const head = readHead(rawHead);
  if (!head) return null;
  const keys = Array.from({ length: head.n }, (_, i) => chunkKey(head.gen, i));
  const rows = await kv.multiGet(keys);
  if (rows.some(([, v]) => v === null)) throw new Error("chunk missing");
  return rows.map(([, v]) => v as string).join("");
}

/**
 * Writes the blob as a new generation and switches the head to it. When `keepOld` is set (the last read
 * failed), earlier generations are left in place so the student's previous data can still be recovered.
 */
export async function writeChunked(kv: KV, blob: string, keepOld = false): Promise<void> {
  const [[, rawHead]] = await kv.multiGet([HEAD]);
  const prev = readHead(rawHead);
  const gen = (prev?.gen ?? 0) + 1;
  const parts = split(blob);
  await kv.multiSet(parts.map((p, i) => [chunkKey(gen, i), p] as [string, string]));
  await kv.multiSet([[HEAD, JSON.stringify({ gen, n: parts.length })]]);
  if (keepOld) return;
  const stale = (await kv.getAllKeys()).filter((k) => k.startsWith(PREFIX) && !k.startsWith(`${PREFIX}${gen}.`));
  if (stale.length) await kv.multiRemove(stale);
}

export async function removeChunked(kv: KV): Promise<void> {
  const keys = (await kv.getAllKeys()).filter((k) => k === HEAD || k.startsWith(PREFIX));
  if (keys.length) await kv.multiRemove(keys);
}
