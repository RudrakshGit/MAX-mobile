import type { Sql } from "./db";

const SESSION_DAYS = 180;

function toHex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(s: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}

/** 32 random bytes, base64url. Only its SHA-256 is stored, so a database leak can't be replayed. */
export function newToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(32));
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function bearer(req: Request): string | null {
  const m = /^Bearer ([A-Za-z0-9_-]{20,100})$/.exec(req.headers.get("authorization") ?? "");
  return m ? m[1] : null;
}

export async function createSession(sql: Sql, userId: string): Promise<string> {
  const token = newToken();
  const hash = await sha256Hex(token);
  await sql`insert into sessions (token_hash, user_id, expires_at)
    values (${hash}, ${userId}, now() + make_interval(days => ${SESSION_DAYS}))`;
  // occasional tidy-up of expired sessions
  if (Math.random() < 0.05) await sql`delete from sessions where expires_at < now()`;
  return token;
}

/** The signed-in user's id, or null for a missing, unknown or expired token. */
export async function requireUser(req: Request, sql: Sql): Promise<string | null> {
  const token = bearer(req);
  if (!token) return null;
  const hash = await sha256Hex(token);
  const rows = await sql`select user_id from sessions where token_hash = ${hash} and expires_at > now()`;
  return rows[0]?.user_id ?? null;
}

export async function endSession(req: Request, sql: Sql): Promise<void> {
  const token = bearer(req);
  if (!token) return;
  await sql`delete from sessions where token_hash = ${await sha256Hex(token)}`;
}
