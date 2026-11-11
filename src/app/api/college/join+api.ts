import { ensureSchema, sqlClient } from "@/server/db";
import { cleanCode } from "@/server/college";
import { limited } from "@/server/rateLimit";

// Public: what a student sees before agreeing to share. Approved colleges only. The id returned here is what
// the phone sends check-ins to, so a college can change a leaked join code without losing its students.
export async function GET(req: Request) {
  if (limited(req, "college-join", 20)) return Response.json({ error: "rate" }, { status: 429 });
  const sql = sqlClient();
  if (!sql) return Response.json({ error: "not-configured" }, { status: 503 });
  const url = new URL(req.url);
  const code = cleanCode(url.searchParams.get("code"));
  const id = url.searchParams.get("id");
  if (!code && !(id && id.length <= 60)) return Response.json({ error: "invalid" }, { status: 400 });
  await ensureSchema(sql);
  const rows = await sql`select c.id, c.name, c.city, c.state,
      case when c.counsellor_name is not null then json_build_object('name', c.counsellor_name, 'phone', c.counsellor_phone, 'hours', c.counsellor_hours) end as counsellor,
      coalesce((select json_agg(json_build_object('name', e.name, 'date', e.date::text) order by e.date) from college_exams e
        where e.college_id = c.id and e.date >= current_date), '[]') as exams
    from colleges c where c.status = 'approved' and (c.join_code = ${code} or c.id = ${code ? null : id})`;
  if (!rows[0]) return Response.json({ error: "unknown-college" }, { status: 404 });
  return Response.json(rows[0]);
}
