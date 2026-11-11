import { preflight, withCors } from "@/server/cors";
import { ensureSchema, sqlClient } from "@/server/db";
import { isAdmin, newJoinCode } from "@/server/college";
import { limited } from "@/server/rateLimit";
import { requireUser } from "@/server/session";

// MAX admin (emails in ADMIN_EMAILS): review college registrations. Approving creates the join code.
async function admin(req: Request) {
  const sql = sqlClient();
  if (!sql) return { error: Response.json({ error: "not-configured" }, { status: 503 }) };
  await ensureSchema(sql);
  const userId = await requireUser(req, sql);
  if (!userId) return { error: Response.json({ error: "unauthorised" }, { status: 401 }) };
  const rows = await sql`select email from users where id = ${userId}`;
  if (!isAdmin(rows[0]?.email)) return { error: Response.json({ error: "forbidden" }, { status: 403 }) };
  return { sql };
}

async function handleGET(req: Request) {
  if (limited(req, "college-admin", 30)) return Response.json({ error: "rate" }, { status: 429 });
  const a = await admin(req);
  if (!a.sql) return a.error!;
  const rows = await a.sql`select id, name, city, state, aishe, website, applicant_role as role, applicant_phone as phone,
      applicant_email as email, status, review_note as note, created_at::text as "createdAt"
    from colleges order by (status = 'pending') desc, created_at desc limit 50`;
  return Response.json({ colleges: rows });
}

async function handlePOST(req: Request) {
  if (limited(req, "college-admin", 30)) return Response.json({ error: "rate" }, { status: 429 });
  const a = await admin(req);
  if (!a.sql) return a.error!;
  const b = await req.json().catch(() => null);
  const id = typeof b?.id === "string" ? b.id : "";
  const note = typeof b?.note === "string" ? b.note.trim().slice(0, 300) || null : null;
  if (b?.action === "approve") {
    const rows = await a.sql`update colleges set status = 'approved', join_code = coalesce(join_code, ${newJoinCode()}),
      reviewed_at = now(), review_note = ${note} where id = ${id} returning join_code`;
    if (!rows[0]) return Response.json({ error: "not-found" }, { status: 404 });
    return Response.json({ ok: true, code: rows[0].join_code });
  }
  if (b?.action === "reject") {
    const rows = await a.sql`update colleges set status = 'rejected', reviewed_at = now(), review_note = ${note} where id = ${id} returning id`;
    if (!rows[0]) return Response.json({ error: "not-found" }, { status: 404 });
    return Response.json({ ok: true });
  }
  return Response.json({ error: "invalid" }, { status: 400 });
}

// the website's college dashboard calls these from the browser (src/server/cors.ts)
export const GET = withCors(handleGET);
export const POST = withCors(handlePOST);
export const OPTIONS = preflight;
