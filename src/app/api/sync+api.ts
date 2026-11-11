import { ensureSchema, sqlClient } from "@/server/db";
import { limited } from "@/server/rateLimit";
import { requireUser } from "@/server/session";

// The student's backup is one opaque JSON text with a revision number. The server never parses it (CPU limit,
// and it has no reason to read the content); the phone merges. A write must name the revision it was based on,
// so two phones can't overwrite each other: a stale write gets 409 and the phone pulls, merges and retries.
const MAX_BYTES = 3 * 1024 * 1024;

export async function GET(req: Request) {
  if (limited(req, "sync", 60)) return Response.json({ error: "rate" }, { status: 429 });
  const sql = sqlClient();
  if (!sql) return Response.json({ error: "not-configured" }, { status: 503 });
  await ensureSchema(sql);
  const userId = await requireUser(req, sql);
  if (!userId) return Response.json({ error: "unauthorised" }, { status: 401 });

  const known = Number(new URL(req.url).searchParams.get("rev") ?? "-1");
  const meta = await sql`select rev from user_state where user_id = ${userId}`;
  if (!meta.length) return Response.json({ rev: 0, envelope: null });
  if (meta[0].rev === known) return Response.json({ rev: known, unchanged: true });
  const rows = await sql`select rev, envelope from user_state where user_id = ${userId}`;
  return Response.json({ rev: rows[0].rev, envelope: rows[0].envelope });
}

export async function PUT(req: Request) {
  if (limited(req, "sync", 60)) return Response.json({ error: "rate" }, { status: 429 });
  const sql = sqlClient();
  if (!sql) return Response.json({ error: "not-configured" }, { status: 503 });
  await ensureSchema(sql);
  const userId = await requireUser(req, sql);
  if (!userId) return Response.json({ error: "unauthorised" }, { status: 401 });

  const base = Number(new URL(req.url).searchParams.get("base"));
  if (!Number.isInteger(base) || base < 0) return Response.json({ error: "bad-base" }, { status: 400 });
  const declared = Number(req.headers.get("content-length"));
  if (declared && declared > MAX_BYTES) return Response.json({ error: "too-large" }, { status: 413 });
  const envelope = await req.text();
  if (envelope.length > MAX_BYTES) return Response.json({ error: "too-large" }, { status: 413 });
  if (!envelope.startsWith('{"version":')) return Response.json({ error: "bad-envelope" }, { status: 400 });

  const rows =
    base === 0
      ? await sql`insert into user_state (user_id, rev, envelope) values (${userId}, 1, ${envelope})
          on conflict (user_id) do nothing returning rev`
      : await sql`update user_state set rev = rev + 1, envelope = ${envelope}, updated_at = now()
          where user_id = ${userId} and rev = ${base} returning rev`;
  if (rows.length) return Response.json({ rev: rows[0].rev });

  const current = await sql`select rev from user_state where user_id = ${userId}`;
  return Response.json({ error: "conflict", rev: current[0]?.rev ?? 0 }, { status: 409 });
}
