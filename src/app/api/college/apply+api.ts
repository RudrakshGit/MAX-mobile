import { preflight, withCors } from "@/server/cors";
import { ensureSchema, sqlClient } from "@/server/db";
import { cleanEmail, cleanRegistration } from "@/server/college";
import { limited } from "@/server/rateLimit";

// Register a college from the website without signing in first (owner, 11 Nov 2026). The application waits as
// "pending" until the MAX admin has verified it by phone (/admin). Staff are matched by email, so once approved the
// applicant signs in with the Google account for that email and sees the dashboard; Google proves the email then,
// so typing someone else's address gets nobody in.

async function handlePOST(req: Request) {
  if (limited(req, "college-apply", 3)) return Response.json({ error: "rate" }, { status: 429 });
  const sql = sqlClient();
  if (!sql) return Response.json({ error: "not-configured" }, { status: 503 });
  const body = await req.json().catch(() => null);
  const f = cleanRegistration(body);
  const email = cleanEmail(body?.email);
  if (!f || !email) return Response.json({ error: "invalid" }, { status: 400 });
  await ensureSchema(sql);
  // The per-IP limit above is per server instance, so it can't stop a flood on its own; this one is shared: at most
  // 20 new applications an hour across the whole service keeps the admin's review list usable.
  const recent = await sql`select count(*)::int as n from colleges where status = 'pending' and created_at > now() - interval '1 hour'`;
  if ((recent[0]?.n ?? 0) >= 20) return Response.json({ error: "busy" }, { status: 429 });
  const id = crypto.randomUUID();
  // one statement: the college and its owner, unless this email already has an application waiting
  const rows = await sql`with ins as (insert into colleges (id, name, city, state, aishe, website, applicant_role, applicant_phone, applicant_email)
      select ${id}, ${f.name}, ${f.city}, ${f.state}, ${f.aishe}, ${f.website}, ${f.role}, ${f.phone}, ${email}
      where not exists (select 1 from colleges where applicant_email = ${email} and status = 'pending')
      returning id, applicant_email),
    st as (insert into college_staff (college_id, email, role) select id, applicant_email, 'owner' from ins returning college_id)
    select (select college_id from st) as id`;
  if (!rows[0]?.id) return Response.json({ error: "already-pending" }, { status: 409 });
  return Response.json({ id, status: "pending" }, { status: 201 });
}

export const POST = withCors(handlePOST);
export const OPTIONS = preflight;
