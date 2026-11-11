import { test } from "node:test";
import assert from "node:assert/strict";
import { CHUNK, HEAD, readChunked, removeChunked, split, writeChunked, type KV } from "./chunkStore.ts";

function memory(opts: { failSetAfter?: number } = {}) {
  const m = new Map<string, string>();
  let sets = 0;
  const kv: KV = {
    async multiGet(keys) {
      return keys.map((k) => [k, m.has(k) ? (m.get(k) as string) : null] as const);
    },
    async multiSet(pairs) {
      sets++;
      if (opts.failSetAfter !== undefined && sets > opts.failSetAfter) throw new Error("disk full");
      for (const [k, v] of pairs) m.set(k, v);
    },
    async multiRemove(keys) {
      for (const k of keys) m.delete(k);
    },
    async getAllKeys() {
      return [...m.keys()];
    },
  };
  return { kv, m };
}

test("chunked storage round-trips a blob bigger than one chunk", async () => {
  const { kv } = memory();
  const blob = "ä".repeat(CHUNK * 2 + 123);
  await writeChunked(kv, blob);
  assert.equal(await readChunked(kv), blob);
});

test("nothing saved yet reads as null, so the caller can fall back to the old single key", async () => {
  const { kv } = memory();
  assert.equal(await readChunked(kv), null);
});

test("a new save replaces the old generation and cleans it up", async () => {
  const { kv, m } = memory();
  await writeChunked(kv, "x".repeat(CHUNK * 3));
  await writeChunked(kv, "short");
  assert.equal(await readChunked(kv), "short");
  assert.equal([...m.keys()].filter((k) => k.startsWith("max.state.g")).length, 1);
});

test("a crash while writing chunks keeps the previous data readable", async () => {
  const { kv, m } = memory();
  await writeChunked(kv, "old data");
  const head = m.get(HEAD);
  // next save: the chunk write succeeds but switching the head fails
  const failing: KV = { ...kv, multiSet: async (pairs) => { if (pairs.some(([k]) => k === HEAD)) throw new Error("killed"); return kv.multiSet(pairs); } };
  await assert.rejects(writeChunked(failing, "new data"));
  assert.equal(m.get(HEAD), head);
  assert.equal(await readChunked(kv), "old data");
});

test("after a failed read, saving keeps every earlier generation for recovery", async () => {
  const { kv, m } = memory();
  await writeChunked(kv, "precious journal");
  await writeChunked(kv, "fresh state", true);
  assert.ok([...m.values()].includes("precious journal"));
});

test("a missing chunk is an error, never a silently truncated journal", async () => {
  const { kv, m } = memory();
  await writeChunked(kv, "y".repeat(CHUNK + 5));
  m.delete([...m.keys()].find((k) => k.endsWith(".c1"))!);
  await assert.rejects(readChunked(kv));
});

test("split never returns zero chunks and removeChunked clears everything", async () => {
  assert.deepEqual(split(""), [""]);
  const { kv, m } = memory();
  await writeChunked(kv, "abc");
  await removeChunked(kv);
  assert.equal(m.size, 0);
});
