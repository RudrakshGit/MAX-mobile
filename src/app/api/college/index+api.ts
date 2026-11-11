import { preflight, withCors } from "@/server/cors";
import { ensureSchema, sqlClient } from "@/server/db";
import { cleanContact, cleanEmail, cleanExams, cleanRegistration, isAdmin, MAX_STAFF, newJoinCode, staffOf } from "@/server/college";
import { limited } from "@/server/rateLimit";
import { requireUser } from "@/server/session";

// College staff: the colleges you belong to (GET), register a college (POST), change its settings (PATCH).
// Only a signed-in Google account; nothing here ever returns a student's data.

async function setup(req: Request) {
  const sql = sqlClient();
  if (!sql) return { error: Response.json({ error: "not-configured" }, { status: 503 }) };
  await ensureSchema(sql);
  const userId = await requireUser(req, sql);
  if (!userId) return { error: Response.json({ error: "unauthorised" }, { status: 401 }) };
  return { sql, userId };
}

async function handleGET(req: Request) {
  if (limited(req, "college", 30)) return Response.json({ error: "rate" }, { status: 429 });
  const s = await setup(req);
  if (s.error) return s.error;
  const rows = await s.sql`select lower(u.email) as email, coalesce((
      select json_agg(json_build_object(
        'id', c.id, 'name', c.name, 'city', c.city, 'state', c.state, 'status', c.status, 'role', st.role,
        'code', case when c.status = 'approved' then c.join_code end, 'reviewNote', c.review_note,
        'counsellor', case when c.counsellor_name is not null then json_build_object('name', c.counsellor_name, 'phone', c.counsellor_phone, 'hours', c.counsellor_hours) end,
        'exams', coalesce((select json_agg(json_build_object('name', e.name, 'date', e.date::text) order by e.date) from college_exams e where e.college_id = c.id), '[]'),
        'staff', case when st.role = 'owner' then (select json_agg(json_build_object('email', x.email, 'role', x.role) order by x.added_at) from college_staff x where x.college_id = c.id) end
      ) order by c.created_at)
      from college_staff st join colleges c on c.id = st.college_id where st.email = lower(u.email)), '[]') as colleges
    from users u where u.id = ${s.userId}`;
  const r = rows[0];
  if (!r) return Response.json({ error: "unauthorised" }, { status: 401 });
  return Response.json({ email: r.email, admin: isAdmin(r.email), colleges: r.colleges });
}

async function handlePOST(req: Request) {
  if (limited(req, "college-register", 5)) return Response.json({ error: "rate" }, { status: 429 });
  const s = await setup(req);
  if (s.error) return s.error;
  const f = cleanRegistration(await req.json().catch(() => null));
  if (!f) return Response.json({ error: "invalid" }, { status: 400 });
  const id = crypto.randomUUID();
  // one statement: the college and its owner, unless this account already has one waiting for review
  const rows = await s.sql`with u as (select id, lower(email) as email from users where id = ${s.userId}),
    ins as (insert into colleges (id, name, city, state, aishe, website, applicant_role, applicant_phone, applicant_email, created_by)
      select ${id}, ${f.name}, ${f.city}, ${f.state}, ${f.aishe}, ${f.website}, ${f.role}, ${f.phone}, u.email, u.id from u
      where not exists (select 1 from colleges where created_by = ${s.userId} and status = 'pending')
      returning id, applicant_email),
    st as (insert into college_staff (college_id, email, role) select id, applicant_email, 'owner' from ins returning college_id)
    select (select college_id from st) as id`;
  if (!rows[0]?.id) return Response.json({ error: "already-pending" }, { status: 409 });
  return Response.json({ id, status: "pending" }, { status: 201 });
}

/** One change per call: contact | exams | addStaff | removeStaff | newCode. */
async function handlePATCH(req: Request) {
  if (limited(req, "college-edit", 30)) return Response.json({ error: "rate" }, { status: 429 });
  const s = await setup(req);
  if (s.error) return s.error;
  const b = await req.json().catch(() => null);
  const collegeId = typeof b?.id === "string" && b.id.length <= 60 ? b.id : null;
  if (!collegeId) return Response.json({ error: "invalid" }, { status: 400 });
  const me = await staffOf(s.sql, s.userId, collegeId);
  if (!me?.role) return Response.json({ error: "forbidden" }, { status: 403 });
  const owner = me.role === "owner";
  const sql = s.sql;

  switch (b?.set) {
    case "contact": {
      const c = cleanContact(b.counsellor);
      if (!c) return Response.json({ error: "invalid" }, { status: 400 });
      await sql`update colleges set counsellor_name = ${c.name}, counsellor_phone = ${c.phone}, counsellor_hours = ${c.hours} where id = ${collegeId}`;
      break;
    }
    case "exams": {
      const exams = cleanExams(b.exams);
      if (!exams) return Response.json({ error: "invalid" }, { status: 400 });
      const list = JSON.stringify(exams.map((e) => ({ id: crypto.randomUUID(), ...e })));
      await sql`with d as (delete from college_exams where college_id = ${collegeId})
        insert into college_exams (id, college_id, name, date)
        select x.id, ${collegeId}, x.name, x.date::date from json_to_recordset(${list}::json) as x(id text, name text, date text)`;
      break;
    }
    case "addStaff": {
      const email = cleanEmail(b.email);
      if (!owner) return Response.json({ error: "forbidden" }, { status: 403 });
      if (!email) return Response.json({ error: "invalid" }, { status: 400 });
      const rows = await sql`insert into college_staff (college_id, email, role)
        select ${collegeId}, ${email}, 'staff' where (select count(*) from college_staff where college_id = ${collegeId}) < ${MAX_STAFF}
        on conflict do nothing returning email`;
      if (!rows.length) return Response.json({ error: "staff-limit-or-exists" }, { status: 409 });
      break;
    }
    case "removeStaff": {
      const email = cleanEmail(b.email);
      if (!owner) return Response.json({ error: "forbidden" }, { status: 403 });
      if (!email || email === me.email) return Response.json({ error: "invalid" }, { status: 400 });
      await sql`delete from college_staff where college_id = ${collegeId} and email = ${email} and role <> 'owner'`;
      break;
    }
    case "newCode": {
      if (!owner) return Response.json({ error: "forbidden" }, { status: 403 });
      if (me.status !== "approved") return Response.json({ error: "not-approved" }, { status: 409 });
      await sql`update colleges set join_code = ${newJoinCode()} where id = ${collegeId}`;
      break;
    }
    default:
      return Response.json({ error: "invalid" }, { status: 400 });
  }
  return Response.json({ ok: true });
}

// the website's college dashboard calls these from the browser (src/server/cors.ts)
export const GET = withCors(handleGET);
export const POST = withCors(handlePOST);
export const PATCH = withCors(handlePATCH);
export const OPTIONS = preflight;
