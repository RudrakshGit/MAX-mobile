import { ensureSchema, sqlClient } from "@/server/db";
import { limited } from "@/server/rateLimit";
import { requireUser } from "@/server/session";

export async function GET(req: Request) {
  const sql = sqlClient();
  if (!sql) return Response.json({ error: "not-configured" }, { status: 503 });
  await ensureSchema(sql);
  const userId = await requireUser(req, sql);
  if (!userId) return Response.json({ error: "unauthorised" }, { status: 401 });
  const rows = await sql`select u.email, u.name, s.rev, s.updated_at from users u
    left join user_state s on s.user_id = u.id where u.id = ${userId}`;
  const r = rows[0];
  return Response.json({ email: r.email, name: r.name, rev: r.rev ?? 0, updatedAt: r.updated_at ?? null });
}

/** Deletes the account, every session and the backup (cascade). The phone wipes itself after this. */
export async function DELETE(req: Request) {
  if (limited(req, "account", 10)) return Response.json({ error: "rate" }, { status: 429 });
  const sql = sqlClient();
  if (!sql) return Response.json({ error: "not-configured" }, { status: 503 });
  await ensureSchema(sql);
  const userId = await requireUser(req, sql);
  if (!userId) return Response.json({ error: "unauthorised" }, { status: 401 });
  await sql`delete from users where id = ${userId}`;
  return new Response(null, { status: 204 });
}
